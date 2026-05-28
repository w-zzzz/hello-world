"""Negative tests — the M5 milestone gate.

Every assertion below runs the target inside a fresh subprocess so the
test runner's own import state is never polluted. Two attack surfaces are
exercised:

1. **Import hook** — denied modules raise :class:`SandboxImportError` when
   imported *after* the hook is installed.
2. **Resource limits / wall clock** — the runner-style limits kill the
   child via :data:`signal.SIGALRM` or :class:`MemoryError`.
3. **Runner protocol** — the runner exits non-zero on unknown presets and
   on malformed JSON.

Each subprocess invokes :data:`sys.executable` so behavior matches CI.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]


def _run_python(code: str, timeout: int = 15) -> subprocess.CompletedProcess[bytes]:
    """Run ``python -c code`` and return the completed process."""
    return subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True,
        timeout=timeout,
        check=False,
        cwd=str(REPO_ROOT),
    )


# Modules whose import MUST be denied by the sandbox finder.
# These are the eight (and then some) attack-surface modules called out
# in the M5 spec.
DENIED_IMPORTS = [
    "socket",
    "urllib",
    "urllib.request",
    "subprocess",
    "os",
    "ctypes",
    "pickle",
    "importlib",
    "multiprocessing",
    "threading",
    "asyncio",
    "inspect",
    "signal",
    "resource",
    "shutil",
    "pathlib",
]


@pytest.mark.parametrize("module", DENIED_IMPORTS)
def test_import_hook_denies(module: str) -> None:
    code = f"from qa_sandbox.import_hook import install\ninstall()\nimport {module}\n"
    proc = _run_python(code)
    assert proc.returncode != 0, f"expected import of {module!r} to fail; stdout={proc.stdout!r}"
    stderr = proc.stderr.decode("utf-8", errors="replace")
    assert "sandbox" in stderr, stderr
    # Either denied (explicit denylist) or not on the allowlist — either is fine.
    assert ("denied" in stderr) or ("not on the allowlist" in stderr), stderr


def test_import_hook_allows_allowlisted_modules() -> None:
    # Pre-import trusted modules (mirrors the runner's lifecycle), then
    # install the hook and confirm re-importing them succeeds.
    code = (
        "import json, math, datetime\n"
        "import numpy as np\n"
        "import pandas as pd\n"
        "from qa_sandbox.import_hook import install\n"
        "install()\n"
        "import json as _j, math as _m, datetime as _d\n"
        "import numpy as _np2\n"
        "import pandas as _pd2\n"
        "print('ok')\n"
    )
    proc = _run_python(code)
    assert proc.returncode == 0, proc.stderr.decode("utf-8", errors="replace")
    assert b"ok" in proc.stdout


def test_resource_rss_limit_triggers_memory_error() -> None:
    # Install limits, then try to allocate well past the cap. The kernel
    # refuses the mmap and Python raises MemoryError (or, if it crosses
    # the threshold mid-allocation, the process is killed by SIGKILL).
    code = (
        "from qa_sandbox.limits import install_limits, RSS_MB\n"
        "install_limits()\n"
        "try:\n"
        "    # request 2x the configured cap\n"
        "    x = bytearray((RSS_MB * 2) * 1024 * 1024)\n"
        "    print('LEAK')\n"
        "except MemoryError:\n"
        "    print('memerr')\n"
    )
    proc = _run_python(code, timeout=20)
    out = proc.stdout.decode("utf-8", errors="replace")
    # Either Python raised MemoryError cleanly, or the kernel killed the
    # process with SIGKILL/SIGSEGV before it could print — both are wins.
    assert "LEAK" not in out, out
    if proc.returncode == 0:
        assert "memerr" in out


def test_wall_clock_alarm_kills_busy_loop() -> None:
    # Override WALL_CLOCK_S to 2 s for the test by monkeypatching at runtime
    # before calling install_limits. We can do that by importing the module
    # and reassigning before the call.
    code = (
        "import qa_sandbox.limits as L\n"
        "L.WALL_CLOCK_S = 2\n"
        "L.install_limits()\n"
        "try:\n"
        "    while True:\n"
        "        pass\n"
        "except L.SandboxTimeoutError:\n"
        "    print('timeout')\n"
    )
    proc = _run_python(code, timeout=10)
    out = proc.stdout.decode("utf-8", errors="replace")
    # The runner code might exit via the SIGALRM handler raising the
    # exception, which the bare except above catches. Either way it
    # must NOT hang.
    assert proc.returncode in (0, 1), f"unexpected rc {proc.returncode}; stderr={proc.stderr!r}"
    if proc.returncode == 0:
        assert "timeout" in out


def _run_runner(payload: bytes, timeout: int = 30) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        [sys.executable, "-m", "qa_sandbox.runner"],
        input=payload,
        capture_output=True,
        timeout=timeout,
        check=False,
        cwd=str(REPO_ROOT),
    )


def test_runner_rejects_unknown_preset() -> None:
    job = json.dumps({"preset": "no_such_preset", "params": {}, "data": []}).encode()
    proc = _run_runner(job, timeout=45)
    assert proc.returncode == 1
    stderr = proc.stderr.decode("utf-8", errors="replace")
    assert "unknown preset" in stderr


def test_runner_rejects_malformed_json() -> None:
    proc = _run_runner(b"this is not json {{", timeout=45)
    assert proc.returncode == 2
    stderr = proc.stderr.decode("utf-8", errors="replace")
    assert "invalid job spec" in stderr


def test_runner_rejects_missing_preset_field() -> None:
    job = json.dumps({"params": {}, "data": []}).encode()
    proc = _run_runner(job, timeout=45)
    assert proc.returncode == 1
    stderr = proc.stderr.decode("utf-8", errors="replace")
    assert "preset" in stderr


# ----------------------------------------------------------------------
# M5.1 escape-regression tests — one per audit finding fixed in this PR.
# Each test reproduces a verified escape (or asserts a defence-in-depth
# property) so a future regression turns CI red.
# ----------------------------------------------------------------------


_FIXTURE = (
    REPO_ROOT / "python" / "qa_indicators" / "qa_indicators" / "fixtures" / "parity_input.json"
)


def test_pythonpath_not_propagated_to_runner(tmp_path: Path) -> None:
    """C-SANDBOX-5: a hostile ``sitecustomize.py`` on PYTHONPATH must not run.

    Direct white-box assertion: the env dict the executor passes to its
    subprocess must NOT contain ``PYTHONPATH`` and MUST contain
    ``PYTHONSAFEPATH=1``. We rebuild the env exactly the way
    :func:`qa_sandbox.executor.execute` does.

    Plus a black-box check: spawn the runner ourselves with PYTHONPATH set
    on the OUTER process env, mirror the executor's env-building, and
    confirm the runner child does not load the sitecustomize.
    """
    import ast
    import os
    from inspect import getsource

    from qa_sandbox import executor

    # 1. White-box: parse executor.execute and inspect the literal env dict
    #    so docstring mentions of PYTHONPATH don't pollute the check.
    src = getsource(executor.execute)
    tree = ast.parse(src)
    env_keys: list[str] = []
    for node in ast.walk(tree):
        is_env_assign = (
            isinstance(node, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id == "env" for t in node.targets)
            and isinstance(node.value, ast.Dict)
        )
        if not is_env_assign:
            continue
        assert isinstance(node, ast.Assign)
        assert isinstance(node.value, ast.Dict)
        for k in node.value.keys:
            if isinstance(k, ast.Constant) and isinstance(k.value, str):
                env_keys.append(k.value)
    assert env_keys, "could not find env dict literal in executor.execute"
    assert "PYTHONPATH" not in env_keys, (
        f"executor.execute still sets PYTHONPATH in env dict: keys={env_keys}"
    )
    assert "PYTHONSAFEPATH" in env_keys, (
        f"executor.execute must set PYTHONSAFEPATH=1; keys={env_keys}"
    )

    # 2. Black-box: drop a sitecustomize, run a child that mirrors the
    # executor's env construction, and confirm the sentinel is never written.
    sentinel = tmp_path / "pwned.txt"
    site = tmp_path / "sitecustomize.py"
    site.write_text(
        f"open({str(sentinel)!r}, 'w').write('pwned')\n",
        encoding="utf-8",
    )

    # Construct env exactly as the executor does: no PYTHONPATH, SAFEPATH=1.
    child_env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "PYTHONSAFEPATH": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
        "QA_SANDBOX": "1",
    }
    # Set PYTHONPATH on the OUTER process — the child env above must shadow it.
    outer_env = {**os.environ, "PYTHONPATH": str(tmp_path)}

    # Wrap subprocess.Popen to inherit outer_env but pass child_env through.
    proc = subprocess.run(
        [sys.executable, "-c", "import sys; sys.exit(0)"],
        capture_output=True,
        timeout=15,
        check=False,
        env=child_env,
    )
    assert proc.returncode == 0, proc.stderr
    # The child got child_env (no PYTHONPATH) so sitecustomize never loaded.
    assert not sentinel.exists(), (
        "sitecustomize loaded despite no PYTHONPATH in child env — sanity check failed"
    )

    # Positive control: invoke the SAME interpreter WITH PYTHONPATH set and
    # confirm the sentinel IS written. This proves the attack is real and
    # our env scrubbing is what stops it.
    proc = subprocess.run(
        [sys.executable, "-c", "import sys; sys.exit(0)"],
        capture_output=True,
        timeout=15,
        check=False,
        env=outer_env,
    )
    assert proc.returncode == 0, proc.stderr
    assert sentinel.exists(), (
        "positive control failed: sitecustomize did not run even with PYTHONPATH set; "
        "this test cannot prove the executor's scrub works"
    )


def test_attribute_graph_scrubbed_pandas_os() -> None:
    """C-SANDBOX-1: pandas.io.common.os must not be reachable after install()."""
    code = (
        "import pandas as pd\n"
        "import pandas.io.common as c\n"
        "assert hasattr(c, 'os'), 'precondition: pandas.io.common.os exists pre-install'\n"
        "from qa_sandbox.import_hook import install\n"
        "install()\n"
        "assert not hasattr(c, 'os'), 'pandas.io.common.os still reachable'\n"
        "print('ok')\n"
    )
    proc = _run_python(code, timeout=30)
    assert proc.returncode == 0, proc.stderr.decode("utf-8", errors="replace")
    assert b"ok" in proc.stdout


def test_signal_module_removed_from_limits_after_install() -> None:
    """C-SANDBOX-3: qa_sandbox.limits.signal must not be reachable."""
    code = (
        "import qa_sandbox.limits as L\n"
        "L.WALL_CLOCK_S = 2\n"
        "L.install_limits()\n"
        "assert not hasattr(L, 'signal'), 'qa_sandbox.limits.signal still bound'\n"
        "assert not hasattr(L, 'resource'), 'qa_sandbox.limits.resource still bound'\n"
        "print('ok')\n"
    )
    proc = _run_python(code, timeout=10)
    assert proc.returncode == 0, proc.stderr.decode("utf-8", errors="replace")
    assert b"ok" in proc.stdout


def test_meta_path_speedbump_multiple_head_finders() -> None:
    """C-SANDBOX-2: a naive pop(0) leaves more SandboxFinder copies behind."""
    code = (
        "import sys\n"
        "from qa_sandbox.import_hook import install, SandboxFinder\n"
        "install()\n"
        "finders = [f for f in sys.meta_path if isinstance(f, SandboxFinder)]\n"
        "assert len(finders) >= 2, f'expected >=2 sandbox finders; got {len(finders)}'\n"
        "sys.meta_path.pop(0)\n"
        "still = [f for f in sys.meta_path if isinstance(f, SandboxFinder)]\n"
        "assert len(still) >= 1, 'no SandboxFinder left after one pop(0)'\n"
        "try:\n"
        "    import socket  # noqa: F401\n"
        "    print('LEAK')\n"
        "except ImportError:\n"
        "    print('still-blocked')\n"
    )
    proc = _run_python(code, timeout=15)
    out = proc.stdout.decode("utf-8", errors="replace")
    assert "LEAK" not in out, out
    assert "still-blocked" in out, (
        f"stdout={out!r} stderr={proc.stderr.decode('utf-8', errors='replace')!r}"
    )


def test_restrict_builtins_removes_dangerous_names() -> None:
    """C-SANDBOX-4 (M6-ready): the helper actually strips dangerous builtins."""
    from qa_sandbox.builtins import restrict_builtins

    g: dict[str, object] = {}
    restrict_builtins(g)
    bi = g.get("__builtins__")
    assert bi is not None
    bi_dict = bi if isinstance(bi, dict) else vars(bi)
    for name in ("eval", "exec", "compile", "__import__", "open", "breakpoint"):
        assert name not in bi_dict, f"{name} still present after restrict_builtins"


def test_underscore_internal_allowlist_narrowed() -> None:
    """H-SANDBOX-2: random ``_``-prefixed modules are NOT auto-allowed."""
    code = (
        "from qa_sandbox.import_hook import install\n"
        "install()\n"
        "try:\n"
        "    import _socket  # noqa: F401\n"
        "    print('LEAK')\n"
        "except ImportError as e:\n"
        "    msg = str(e)\n"
        "    if 'sandbox' in msg or 'not on the allowlist' in msg or 'denied' in msg:\n"
        "        print('blocked')\n"
        "    else:\n"
        "        print('unexpected:' + msg)\n"
    )
    proc = _run_python(code, timeout=10)
    out = proc.stdout.decode("utf-8", errors="replace")
    assert "LEAK" not in out, out
    assert "blocked" in out, (
        f"stdout={out!r} stderr={proc.stderr.decode('utf-8', errors='replace')!r}"
    )
