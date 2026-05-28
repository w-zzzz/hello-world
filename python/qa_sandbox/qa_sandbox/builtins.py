"""Builtin restrictions for untrusted-code execution (wired in M6).

For M5 the sandbox only runs registered presets (trusted code) and the
runner does NOT call :func:`restrict_builtins` — vectorbt's internals use
``open`` for parquet/csv writes and ``compile`` via numba's lowering, so
stripping builtins would break the trusted preset path.

For M6, when the runner accepts a ``mode='untrusted'`` job, it will pass
the user-code globals through :func:`restrict_builtins` before
``exec(user_src, restricted_globals)``. This module is the source of
truth for which names are dangerous, and the implementation here actually
removes them — earlier revisions only documented the intent (C-SANDBOX-4).

A negative test in ``tests/test_negative.py`` asserts that
``eval``/``exec``/``compile``/``__import__``/``open``/``breakpoint`` are
gone from the returned mapping. Layer-2 Docker remains the real boundary
for untrusted code; this is defence-in-depth on top.
"""

from __future__ import annotations

from typing import Any

# Names that must be removed (or wrapped) before executing untrusted code.
DANGEROUS_BUILTINS: frozenset[str] = frozenset(
    {
        "eval",
        "exec",
        "compile",
        "__import__",
        "open",
        "input",
        "breakpoint",
        "help",
    }
)


def restrict_builtins(globals_dict: dict[str, Any]) -> dict[str, Any]:
    """Strip dangerous builtins from ``globals_dict`` in place and return it.

    The input dict is mutated so the same mapping is what the caller passes
    to ``exec``. ``__builtins__`` is replaced with a fresh dict that has the
    :data:`DANGEROUS_BUILTINS` names removed; the original builtins module
    is left untouched.

    Args:
        globals_dict: The globals mapping that will be handed to ``exec``.

    Returns:
        The same ``globals_dict`` instance, mutated so ``__builtins__`` is a
        controlled dict missing all :data:`DANGEROUS_BUILTINS` names.
    """
    import builtins as _builtins

    bi_obj = globals_dict.get("__builtins__")
    if bi_obj is None:
        # When called with an empty globals dict, exec normally seeds
        # __builtins__ on first run. Seed it ourselves now so we can scrub it.
        bi_source: dict[str, Any] = {
            name: getattr(_builtins, name) for name in dir(_builtins) if not name.startswith("__")
        }
    elif isinstance(bi_obj, dict):
        bi_source = dict(bi_obj)
    else:
        # Module-typed __builtins__ (the normal case at module top level).
        bi_source = {
            name: getattr(bi_obj, name) for name in dir(bi_obj) if not name.startswith("__")
        }

    for name in DANGEROUS_BUILTINS:
        bi_source.pop(name, None)

    globals_dict["__builtins__"] = bi_source
    return globals_dict
