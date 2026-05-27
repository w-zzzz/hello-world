"""Process resource limits + wall-clock timer for the sandbox.

Linux only — relies on :mod:`resource` and :mod:`signal`. All limits are
soft caps that the kernel enforces; the runner does not need to poll.
"""

from __future__ import annotations

import contextlib
import resource
import signal
from typing import Any

WALL_CLOCK_S = 30
CPU_S = 30
# Address-space cap. vectorbt + numba allocate ~450 MB before any user work,
# so 512 MB is too tight. 1.5 GB leaves enough headroom for a 252-bar SMA
# crossover backtest while still catching runaway allocations.
RSS_MB = 1536
MAX_FDS = 64
MAX_NPROC = 1


class SandboxTimeoutError(Exception):
    """Raised when the wall-clock SIGALRM fires inside the runner."""


def _on_alarm(_signum: int, _frame: Any) -> None:
    raise SandboxTimeoutError("sandbox: wall-clock timeout")


def install_limits() -> None:
    """Apply CPU/RSS/fd/nproc rlimits and arm a 30 s SIGALRM.

    Failures on the more exotic limits (NOFILE, NPROC) are non-fatal — some
    sandbox hosts already constrain those and lowering them further can
    raise ``ValueError`` or ``OSError`` we do not care about.
    """
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_S, CPU_S))
    resource.setrlimit(
        resource.RLIMIT_AS,
        (RSS_MB * 1024 * 1024, RSS_MB * 1024 * 1024),
    )
    with contextlib.suppress(ValueError, OSError):
        resource.setrlimit(resource.RLIMIT_NOFILE, (MAX_FDS, MAX_FDS))
    with contextlib.suppress(ValueError, OSError, AttributeError):
        resource.setrlimit(resource.RLIMIT_NPROC, (MAX_NPROC, MAX_NPROC))
    signal.signal(signal.SIGALRM, _on_alarm)
    signal.alarm(WALL_CLOCK_S)
