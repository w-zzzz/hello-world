"""Meta-path import hook that enforces the sandbox allowlist.

Install via :func:`install` *after* all trusted modules have been imported.
Any subsequent ``import`` statement (typically from user-supplied code in
M6+) is checked against :mod:`qa_sandbox.allowlist`:

* Denied names — and any of their submodules — always raise.
* Top-level names not on the allowlist raise.
* Allowed names delegate to the remaining finders (regular import path).

Already-imported modules are reachable via ``sys.modules`` regardless of
the hook; that is acceptable because user code is run *after* installation
in its own subprocess and the modules pre-imported by the runner are the
trusted graph we deliberately seeded.
"""

from __future__ import annotations

import sys
from importlib.abc import MetaPathFinder
from importlib.machinery import ModuleSpec
from typing import Any

from qa_sandbox.allowlist import ALLOWED_TOP_LEVEL, DENIED_NAMES


class SandboxImportError(ImportError):
    """Raised when a sandboxed import attempt is rejected."""


def _is_denied(fullname: str) -> bool:
    if fullname in DENIED_NAMES:
        return True
    return any(fullname.startswith(d + ".") for d in DENIED_NAMES)


def _is_cpython_internal(fullname: str) -> bool:
    """Underscore-prefixed implementation modules used by stdlib allowlistees.

    e.g. ``_datetime``, ``_pydatetime``, ``_decimal``. These are unavoidable
    when a public stdlib module (e.g. :mod:`datetime`) is allowed.
    """
    top = fullname.split(".", 1)[0]
    return top.startswith("_")


class SandboxFinder(MetaPathFinder):
    """Veto imports not on the allowlist; raise on denied modules."""

    def find_spec(
        self,
        fullname: str,
        path: Any = None,
        target: Any = None,
    ) -> ModuleSpec | None:
        # Denials always win, even for ``_``-prefixed shadows.
        if _is_denied(fullname):
            raise SandboxImportError(f"sandbox: module '{fullname}' is denied")
        top = fullname.split(".", 1)[0]
        if top in ALLOWED_TOP_LEVEL:
            return None  # delegate to remaining finders
        if _is_cpython_internal(fullname):
            # CPython implementation detail backing an allowed stdlib module.
            return None
        raise SandboxImportError(f"sandbox: module '{fullname}' is not on the allowlist")


def _evict_denied_from_sys_modules() -> None:
    """Forget cached denied modules so user code cannot re-bind them.

    Python's import machinery skips ``sys.meta_path`` for modules already in
    ``sys.modules``. Even after the hook installs, ``import os`` would still
    succeed via cache. Evicting denied entries ensures the very next import
    consults the finder and raises.
    """
    for name in list(sys.modules):
        top = name.split(".", 1)[0]
        if top in DENIED_NAMES or name in DENIED_NAMES:
            del sys.modules[name]


def install() -> None:
    """Install the sandbox finder at the head of ``sys.meta_path``.

    Also evicts any denied module already in :data:`sys.modules` so user
    code cannot reach them by re-import. Idempotent: a second call is a no-op.
    """
    if any(isinstance(f, SandboxFinder) for f in sys.meta_path):
        return
    sys.meta_path.insert(0, SandboxFinder())
    _evict_denied_from_sys_modules()


def uninstall() -> None:
    """Remove the sandbox finder. Provided for tests; not used in production."""
    sys.meta_path[:] = [f for f in sys.meta_path if not isinstance(f, SandboxFinder)]
