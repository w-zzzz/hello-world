"""M6 untrusted-mode tests: code path runs through restrict_builtins +
import hook + limits, returning either a BacktestResult or a clean failure.

Tests are subprocess-based to avoid polluting the test runner's globals.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = (
    REPO_ROOT / "python" / "qa_indicators" / "qa_indicators" / "fixtures" / "parity_input.json"
)


def _run_runner(job: dict, timeout: int = 60) -> subprocess.CompletedProcess[bytes]:
    payload = json.dumps(job).encode()
    return subprocess.run(
        [sys.executable, "-m", "qa_sandbox.runner"],
        input=payload,
        capture_output=True,
        timeout=timeout,
        check=False,
        cwd=str(REPO_ROOT),
    )


def _load_bars() -> list[dict]:
    return json.loads(FIXTURE.read_text())["bars"]


def test_happy_path_user_code_executes() -> None:
    code = "def run(close):\n    return {'signal': [0] * len(close), 'note': 'flat'}\n"
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode == 0, proc.stderr.decode("utf-8", errors="replace")
    body = json.loads(proc.stdout)
    assert "equity_curve" in body
    assert body["universe"] == ["SPY"]


def test_user_code_denied_import_socket() -> None:
    code = "import socket\ndef run(close):\n    return {'signal': [0] * len(close)}\n"
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0
    assert b"sandbox" in proc.stderr or b"socket" in proc.stderr


def test_user_code_cannot_eval() -> None:
    """restrict_builtins removes eval from the user's globals."""
    code = "def run(close):\n    result = eval('1 + 1')\n    return {'signal': [0] * len(close)}\n"
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0


def test_user_code_cannot_exec() -> None:
    code = "def run(close):\n    exec('x = 1')\n    return {'signal': [0] * len(close)}\n"
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0


def test_user_code_cannot_open_files() -> None:
    code = (
        "def run(close):\n    open('/etc/shadow').read()\n    return {'signal': [0] * len(close)}\n"
    )
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0


def test_user_code_missing_run_function() -> None:
    code = "x = 1\n"
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0
    assert b"missing" in proc.stderr.lower() or b"run" in proc.stderr.lower()


def test_user_code_bad_signal_length() -> None:
    code = (
        "def run(close):\n"
        "    return {'signal': [0, 0, 0]}\n"  # wrong length
    )
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0


def test_user_code_bad_signal_values() -> None:
    code = (
        "def run(close):\n"
        "    return {'signal': [2] * len(close)}\n"  # 2 is not in {-1, 0, 1}
    )
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0


def test_user_code_syntax_error() -> None:
    code = "def run(close:\n    return {}\n"  # broken
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0
    assert b"SyntaxError" in proc.stderr or b"syntax" in proc.stderr.lower()


def test_user_code_oversized_rejected() -> None:
    code = (
        "def run(close):\n    " + "x = 1\n    " * 12_000 + "return {'signal': [0] * len(close)}\n"
    )
    # That's well over 64KB
    assert len(code.encode()) > 65_536
    proc = _run_runner({"code": code, "data": _load_bars()})
    assert proc.returncode != 0
    assert b"cap" in proc.stderr or b"64" in proc.stderr or b"size" in proc.stderr.lower()


def test_both_code_and_preset_rejected() -> None:
    code = "def run(close):\n    return {'signal': [0] * len(close)}\n"
    proc = _run_runner({"code": code, "preset": "sma_crossover", "data": _load_bars()})
    assert proc.returncode != 0


def test_neither_code_nor_preset_rejected() -> None:
    proc = _run_runner({"data": _load_bars()})
    assert proc.returncode != 0
