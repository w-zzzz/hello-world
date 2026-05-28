"""High-level entry: execute a job spec in a hardened subprocess.

A "job spec" for M5 is always a named preset (no raw user code yet — M6).
Even so, the runner enforces the import hook + resource limits so any
preset that misbehaves is caught.

Layer-1 isolation (this file + :mod:`qa_sandbox.runner`) is the source of
truth tested in CI. Layer-2 (Docker / gVisor) is documented in
``apps/sandbox-runner/README.md``.
"""

from __future__ import annotations

import contextlib
import json
import os
import signal
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

    Security notes:
        * ``PYTHONPATH`` is deliberately NOT propagated. Inheriting it would
          let an attacker who controls the parent env drop a
          ``sitecustomize.py`` on disk that runs before :func:`runner.main`
          (C-SANDBOX-5). We also set ``PYTHONSAFEPATH=1`` so the runner
          ignores ``PYTHONPATH`` even if it leaks through another channel.
        * The runner is launched with ``start_new_session=True`` so it gets
          its own process group. On timeout we ``killpg`` the whole group so
          any grandchild the runner spawned is reaped too (H-SANDBOX-1).
    """
    payload = json.dumps(job).encode("utf-8")
    env = {
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        # PYTHONPATH intentionally omitted — see C-SANDBOX-5 in the docstring.
        "PYTHONSAFEPATH": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
        "QA_SANDBOX": "1",
    }
    proc = subprocess.Popen(  # noqa: S603 — sandbox isolation is the whole point
        [sys.executable, "-m", _RUNNER_MODULE],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        start_new_session=True,
    )
    try:
        stdout, stderr = proc.communicate(input=payload, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        # Kill the entire process group so any grandchild the runner
        # spawned is reaped with us, not orphaned to PID 1.
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        try:
            proc.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.communicate()
        raise SandboxError(f"sandbox: process timeout ({timeout}s)") from e

    if proc.returncode != 0:
        stderr_text = stderr.decode("utf-8", errors="replace")[-2000:]
        raise SandboxError(f"sandbox: exited with {proc.returncode}: {stderr_text}")

    try:
        parsed: dict[str, Any] = json.loads(stdout.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise SandboxError(f"sandbox: invalid JSON output: {e}") from e
    return parsed
