"""Reserved for M6: builtin restrictions when raw user code is accepted.

For M5 the sandbox only runs registered presets (trusted code), so we leave
``eval``/``exec``/``compile`` accessible to vectorbt internals. M6 will wire
:func:`restrict_builtins` into the runner just before evaluating user code.
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
    """Return a copy of ``globals_dict`` with dangerous builtins stripped.

    The returned mapping is suitable for ``exec(user_src, restricted_globals)``
    once M6 lands. ``__builtins__`` is replaced with a minimal dict; this is
    a best-effort defence and must be combined with the import hook and the
    subprocess isolation layer to be meaningful.
    """
    safe: dict[str, Any] = dict(globals_dict)
    bi_obj = safe.get("__builtins__", {})
    if isinstance(bi_obj, dict):
        bi: dict[str, Any] = dict(bi_obj)
    else:
        bi = {k: getattr(bi_obj, k) for k in dir(bi_obj) if not k.startswith("_")}
    for name in DANGEROUS_BUILTINS:
        bi.pop(name, None)
    safe["__builtins__"] = bi
    return safe
