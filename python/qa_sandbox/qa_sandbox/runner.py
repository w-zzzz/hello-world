"""Sandbox runner — runs as a fresh subprocess and emits one JSON result.

Invocation::

    python -m qa_sandbox.runner < job.json > result.json

Lifecycle (order matters):

1. **Pre-import** all trusted modules (qa_core, qa_backtest, vectorbt, …)
   so the import hook does not see them — vectorbt's transitive graph
   touches many otherwise-denied stdlib modules (``socket``, ``pickle``, …)
   that we cannot reasonably allowlist for user code.
2. Install the import hook (:func:`qa_sandbox.import_hook.install`).
3. Install resource limits + SIGALRM (:func:`qa_sandbox.limits.install_limits`).
4. Read the JSON job spec from stdin.
5. Dispatch to the named preset runner.
6. Write the BacktestResult JSON to stdout.

Exit codes:
    0  — success
    1  — preset error or unknown preset
    2  — malformed job spec
"""

from __future__ import annotations

import json
import sys
import traceback

# ---- step 1: pre-import the trusted graph before any hook is installed ----
# Touching the registry pulls in vectorbt + numba. We then run a tiny
# warm-up backtest so vectorbt's lazy compile/entry-point imports happen
# *before* the import hook is installed.
import pandas as _pd

from qa_backtest.engine import run_backtest as _warmup_run
from qa_backtest.presets.registry import get_runner
from qa_core.schemas import Bar
from qa_sandbox.import_hook import install as install_import_hook
from qa_sandbox.limits import install_limits


def _prewarm_vectorbt() -> None:
    """Force vectorbt to perform its lazy initialisations now.

    vectorbt + numba defer some imports (notably ``importlib_metadata``
    entry points and numba's compilation chain) until the first call.
    Triggering them here means the sandbox hook never sees them.
    """
    idx = _pd.date_range("2024-01-01", periods=10, freq="D")
    closes = [100.0, 101.0, 102.0, 101.5, 100.5, 99.5, 100.0, 101.0, 102.0, 103.0]
    bars = [
        Bar(t=ts.to_pydatetime(), open=c, high=c, low=c, close=c, volume=1.0)
        for ts, c in zip(idx, closes, strict=True)
    ]
    signal = _pd.Series(0, index=idx, dtype=int)
    signal.iloc[1] = 1
    signal.iloc[5] = -1
    _warmup_run(bars=bars, signal=signal)


def _parse_job(raw: bytes) -> dict[str, object]:
    parsed: dict[str, object] = json.loads(raw)
    return parsed


def main() -> int:
    # ---- step 1b: warm vectorbt so all lazy imports happen pre-hook -----
    _prewarm_vectorbt()

    # ---- step 2/3: install hook + limits (order: hook then limits) -------
    install_import_hook()
    install_limits()

    # ---- step 4: read job spec --------------------------------------------
    try:
        raw = sys.stdin.buffer.read()
        job = _parse_job(raw)
    except (json.JSONDecodeError, OSError) as e:
        sys.stderr.write(f"sandbox: invalid job spec: {e}\n")
        return 2

    # ---- step 5: dispatch -------------------------------------------------
    try:
        preset = job.get("preset")
        params = job.get("params", {}) or {}
        bars_raw = job.get("data", []) or []
        if not isinstance(preset, str) or not preset:
            raise ValueError("missing or non-string 'preset' field")
        if not isinstance(params, dict):
            raise TypeError("'params' must be an object")
        if not isinstance(bars_raw, list):
            raise TypeError("'data' must be an array")

        runner = get_runner(preset)
        if runner is None:
            raise ValueError(f"unknown preset: {preset}")

        bars = [Bar(**b) for b in bars_raw]
        result = runner(bars=bars, **params)

        # ---- step 6: emit -------------------------------------------------
        sys.stdout.write(result.model_dump_json())
        sys.stdout.flush()
        return 0
    except Exception as e:
        sys.stderr.write(f"sandbox: error: {e}\n")
        sys.stderr.write(traceback.format_exc())
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
