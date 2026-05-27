"""High-level entry: execute a job spec in a hardened subprocess.

A "job spec" for M5 is always a named preset (no raw user code yet — M6).
Even so, the runner enforces the import hook + resource limits so any
preset that misbehaves is caught.

Layer-1 isolation (this file + :mod:`qa_sandbox.runner`) is the source of
truth tested in CI. Layer-2 (Docker / gVisor) is documented in
``apps/sandbox-runner/README.md``.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Any


class SandboxError(Exception):
    """Raised when the sandbox subprocess fails or returns invalid output."""


_RUNNER_MODULE = "qa_sandbox.runner"


def execute(job: dict[str, Any], timeout: int = 35) -> dict[str, Any]:
    """Invoke the sandbox runner in a fresh subprocess and parse its result.

    Args:
        job: A dict shaped like::

            {
                "preset": "sma_crossover",
                "params": {"fast": 20, "slow": 50},
                "universe": ["SPY"],
                "data": [<Bar>, ...],
            }

        timeout: Outer subprocess wall-clock cap (s). Should be larger than
            :data:`qa_sandbox.limits.WALL_CLOCK_S` so the runner's own SIGALRM
            wins the race and produces a clean error message.

    Returns:
        The parsed JSON BacktestResult dict written by the runner to stdout.

    Raises:
        SandboxError: on non-zero exit, timeout, or invalid JSON output.
    """
    payload = json.dumps(job).encode("utf-8")
    env = {
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "PYTHONPATH": os.environ.get("PYTHONPATH", ""),
        "PYTHONDONTWRITEBYTECODE": "1",
        "QA_SANDBOX": "1",
    }
    try:
        proc = subprocess.run(  # noqa: S603 — sandbox isolation is the whole point
            [sys.executable, "-m", _RUNNER_MODULE],
            input=payload,
            capture_output=True,
            timeout=timeout,
            env=env,
            check=False,
        )
    except subprocess.TimeoutExpired as e:
        raise SandboxError(f"sandbox: process timeout ({timeout}s)") from e

    if proc.returncode != 0:
        stderr = proc.stderr.decode("utf-8", errors="replace")[-2000:]
        raise SandboxError(f"sandbox: exited with {proc.returncode}: {stderr}")

    try:
        parsed: dict[str, Any] = json.loads(proc.stdout.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise SandboxError(f"sandbox: invalid JSON output: {e}") from e
    return parsed
