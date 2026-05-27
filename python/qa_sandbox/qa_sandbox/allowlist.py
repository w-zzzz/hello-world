"""Module allowlist + denylist consulted by the sandbox import hook.

The allowlist is intentionally small: only modules required by qa_core,
qa_indicators, and qa_backtest. Anything that touches the network, the
filesystem outside of an explicit data directory, the process table, or
introspection facilities is denied.

Denials are checked *before* allowances so a future allowed module cannot
accidentally re-enable something dangerous via re-export.
"""

from __future__ import annotations

ALLOWED_TOP_LEVEL: frozenset[str] = frozenset(
    {
        # numerics
        "numpy",
        "pandas",
        "scipy",
        "math",
        "statistics",
        "decimal",
        "fractions",
        # stdlib data plumbing
        "datetime",
        "json",
        "io",
        "typing",
        "dataclasses",
        "enum",
        "functools",
        "itertools",
        "collections",
        "operator",
        "re",
        "abc",
        "copy",
        "warnings",
        "sys",  # restricted: only attribute reads we care about; import allowed
        "builtins",
        # quant-academy first-party
        "qa_core",
        "qa_indicators",
        "qa_backtest",
        # backtest engines
        "vectorbt",
        "pandas_ta",
        # pydantic + its deps used transitively by qa_core
        "pydantic",
        "pydantic_core",
        "annotated_types",
        "typing_extensions",
    }
)

# Modules that are explicitly denied even if a parent is allowed.
# Listed with their top-level form; the hook also denies any submodule.
DENIED_NAMES: frozenset[str] = frozenset(
    {
        # network
        "socket",
        "urllib",
        "urllib3",
        "http",
        "ftplib",
        "telnetlib",
        "smtplib",
        "poplib",
        "imaplib",
        "requests",
        "httpx",
        "aiohttp",
        # filesystem / process control
        "os",
        "subprocess",
        "shutil",
        "pathlib",
        "tempfile",
        "glob",
        "fcntl",
        "pty",
        "pwd",
        "grp",
        # native code / FFI
        "ctypes",
        "cffi",
        # concurrency
        "multiprocessing",
        "threading",
        "asyncio",
        "concurrent",
        "queue",
        # introspection / dynamic imports
        "importlib",
        "imp",
        "inspect",
        "pdb",
        "bdb",
        # serialisation that can execute code
        "pickle",
        "marshal",
        "shelve",
        "dill",
        "cloudpickle",
        # signals / resources
        "signal",
        "resource",
    }
)
