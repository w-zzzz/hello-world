"""Process resource limits + wall-clock timer for the sandbox.

Linux only — relies on :mod:`resource` and :mod:`signal`. All limits are
soft caps that the kernel enforces; the runner does not need to poll.

Security note (C-SANDBOX-3): the ``signal`` and ``resource`` modules are
imported at module load time (which happens BEFORE the import hook is
installed, since the runner imports this module first), captured into
function-local closure variables, then *deleted from this module's
``__dict__``* so ``qa_sandbox.limits.signal`` is unreachable post-install.
Without that scrub, attacker code could write ``L.signal.alarm(0)`` to
disable the wall-clock timer even after ``sys.modules['signal']`` has
been evicted by the import hook.
"""

from __future__ import annotations

import contextlib as _contextlib
import resource as _resource
import signal as _signal
import sys
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
    # Intentionally does NOT reference the ``signal`` module — it is a plain
    # function that only needs its arguments to raise.
    raise SandboxTimeoutError("sandbox: wall-clock timeout")


def _build_installer() -> Any:
    """Bind ``signal``/``resource``/``contextlib`` into a closure.

    After the surrounding scrubbing step (below) the underscore-prefixed
    module aliases are removed from this module's ``__dict__``; the closure
    returned here is the *only* place the references survive.
    """
    resource = _resource
    signal = _signal
    contextlib = _contextlib

    def install_limits() -> None:
        """Apply CPU/RSS/fd/nproc rlimits and arm a 30 s SIGALRM.

        Failures on the more exotic limits (NOFILE, NPROC) are non-fatal —
        some sandbox hosts already constrain those and lowering them further
        can raise ``ValueError`` or ``OSError`` we do not care about.
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

    return install_limits


install_limits = _build_installer()

# Scrub the underscore-prefixed module references AND the helper. After this
# point only the closure inside install_limits retains the bindings; nothing
# reachable via qa_sandbox.limits.<name> can disable the timer.
_mod_dict = sys.modules[__name__].__dict__
for _name in ("_resource", "_signal", "_contextlib", "_build_installer"):
    _mod_dict.pop(_name, None)
del _mod_dict, _name
