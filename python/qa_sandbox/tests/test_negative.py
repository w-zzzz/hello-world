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
