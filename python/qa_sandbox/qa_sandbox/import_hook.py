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

Defence-in-depth notes:

* H-SANDBOX-2 — the underscore-prefixed allowance is an explicit
  :data:`ALLOWED_INTERNAL` set, not a wildcard ``name.startswith('_')``.
  Otherwise ``_socket``, ``_ssl``, ``_posixsubprocess`` etc. would pass.
* C-SANDBOX-1 — :func:`install` removes module-attribute references to
  denied modules from a curated list of known-vulnerable paths (e.g.
  ``pandas.io.common.os``, ``vectorbt.utils.config.pickle``). A blanket
  walk of every allow-listed module would also break pandas's own
  internal use of ``inspect`` etc., so we explicitly target the paths
  UR1's audit demonstrated. This is best-effort; the real boundary for
  untrusted code is Layer-2 Docker.
* C-SANDBOX-2 — :func:`install` registers the finder multiple times at
  the head of ``sys.meta_path``. A naive ``sys.meta_path.pop(0)`` by
  attacker code only removes one copy; the next one over still vetoes
  denied imports. This is a speed-bump, not a real fix — Layer-2 Docker
  is the real boundary. ``sys`` cannot be denied because every allow-listed
  module depends on it. We do not also append at the tail because Python's
  meta-path is first-match-wins and a trailing SandboxFinder is shadowed
  by the default :class:`importlib.machinery.PathFinder` (which would find
  denied modules first).
"""

from __future__ import annotations

import contextlib
import sys
from importlib.abc import MetaPathFinder
from importlib.machinery import ModuleSpec
from types import ModuleType
from typing import Any

from qa_sandbox.allowlist import ALLOWED_TOP_LEVEL, DENIED_NAMES


class SandboxImportError(ImportError):
    """Raised when a sandboxed import attempt is rejected."""


# Underscore-prefixed CPython implementation modules that back public stdlib
# modules on the allowlist. Anything not on this list is rejected — the
# previous wildcard would have allowed ``_socket``, ``_ssl`` etc.
ALLOWED_INTERNAL: frozenset[str] = frozenset(
    {
        "_datetime",
        "_decimal",
        "_collections",
        "_collections_abc",
        "_functools",
        "_operator",
        "_struct",
        "_weakref",
        "_pyio",
        "_io",
        "_codecs",
        "_typing",
        "_warnings",
        "_pydatetime",
        "_pydecimal",
    }
)


def _is_denied(fullname: str) -> bool:
    if fullname in DENIED_NAMES:
        return True
    return any(fullname.startswith(d + ".") for d in DENIED_NAMES)


def _is_cpython_internal(fullname: str) -> bool:
    """Whether ``fullname`` is on the explicit underscore-internal allowlist.

    Narrowed from "any underscore-prefixed name" (H-SANDBOX-2) so attacker
    code cannot smuggle in ``_socket`` or ``_ssl`` simply by their leading
    underscore.
    """
    top = fullname.split(".", 1)[0]
    return top in ALLOWED_INTERNAL


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


# Curated list of (parent_module, attribute_name) pairs that UR1's audit
# proved reachable from user code as denied-module backdoors. A blanket
# walk would also strip pandas's internal use of `inspect` etc.; this
# narrow list closes the demonstrated attack surface without breaking
# the allow-listed packages' own internals. Layer-2 Docker remains the
# real boundary; this is one more speed-bump for in-process attackers.
_KNOWN_REACHABLE_BACKDOORS: tuple[tuple[str, str], ...] = (
    ("pandas.io.common", "os"),
    ("pandas.io.common", "shutil"),
    ("numpy.ctypeslib", "ctypes"),
    ("numpy.testing._private.extbuild", "subprocess"),
    ("numpy.testing.extbuild", "subprocess"),
    ("vectorbt.utils.config", "pickle"),
    ("vectorbt.utils.module_", "importlib"),
    ("vectorbt.utils.pickling", "pickle"),
)


def _scrub_module_attribute_graph() -> None:
    """Delete known-bad ModuleType attributes that point to denied modules.

    Pre-imported allow-listed modules can hold direct references to denied
    modules as attributes — ``pandas.io.common.os``,
    ``numpy.ctypeslib.ctypes``, ``vectorbt.utils.config.pickle`` etc. The
    import hook alone does not close this hole because the attribute access
    never goes through ``sys.meta_path``.

    We target the curated :data:`_KNOWN_REACHABLE_BACKDOORS` list rather
    than walking the full attribute graph: a blanket sweep would also
    remove internal references that pandas/numpy/vectorbt depend on for
    their own correctness (e.g. ``pandas.core.dtypes.astype.inspect`` is
    used by ``astype_array_safe``). The narrow list closes the paths UR1
    actually demonstrated; Layer-2 Docker remains the real boundary.

    Best-effort: missing modules and read-only attributes are silently
    skipped.
    """
    for parent_name, attr_name in _KNOWN_REACHABLE_BACKDOORS:
        parent = sys.modules.get(parent_name)
        if not isinstance(parent, ModuleType):
            continue
        val = getattr(parent, attr_name, None)
        if not isinstance(val, ModuleType):
            continue
        val_top = val.__name__.split(".", 1)[0]
        if val_top not in DENIED_NAMES and val.__name__ not in DENIED_NAMES:
            continue
        with contextlib.suppress(AttributeError, TypeError):
            delattr(parent, attr_name)


# How many copies of the SandboxFinder to install at the head of
# sys.meta_path. ``pop(0)`` only removes one; the next copy keeps blocking.
# Three is enough to defeat the obvious attempts without bloating meta_path.
_HEAD_FINDER_COPIES = 3


def install() -> None:
    """Install the sandbox finder at the head of ``sys.meta_path``.

    Also evicts any denied module already in :data:`sys.modules` and scrubs
    pre-imported allow-listed modules of attributes pointing to denied
    modules. Idempotent: a second call is a no-op.

    Registering :data:`_HEAD_FINDER_COPIES` copies (C-SANDBOX-2) means a
    naive ``sys.meta_path.pop(0)`` leaves the next copy in place. It is a
    speed-bump, not a real fix — Layer-2 Docker remains the real boundary.
    """
    if any(isinstance(f, SandboxFinder) for f in sys.meta_path):
        return
    for _ in range(_HEAD_FINDER_COPIES):
        sys.meta_path.insert(0, SandboxFinder())
    _evict_denied_from_sys_modules()
    _scrub_module_attribute_graph()


def _uninstall_for_test_only() -> None:
    """Remove all sandbox finders from ``sys.meta_path``.

    Test-only — production code MUST NOT call this. Exposing a public
    ``uninstall`` invited an attacker to import it (``sys`` is allow-listed
    and ``qa_sandbox`` is reachable). The leading underscore + private name
    keeps it out of the obvious API surface.
    """
    sys.meta_path[:] = [f for f in sys.meta_path if not isinstance(f, SandboxFinder)]
