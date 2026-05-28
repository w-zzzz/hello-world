"""Sandbox runner — runs as a fresh subprocess and emits one JSON result.

Invocation::

    python -m qa_sandbox.runner < job.json > result.json

Lifecycle (order matters):

1. Read + parse JSON job spec. Fail fast on malformed input (exit 2) or
   missing/unknown preset (exit 1) — these paths never need vectorbt.
2. Branch on the new ``code`` field (M6 untrusted-code path) vs ``preset``
   (trusted M5 preset path). Exactly one must be set.
3. **Trusted preset path**: pre-warm vectorbt + numba so their lazy imports
   happen before the sandbox hook is installed (deferred until step 1
   succeeded so failed jobs never pay the JIT cost). Then install hook,
   install limits, dispatch to the named preset runner.
4. **Untrusted code path (M6)**: install the import hook + resource limits
   (NO vectorbt prewarm — user code doesn't need it), then hand source +
   bars to :func:`qa_sandbox.code_runner.run_user_code` which compiles and
   exec'es the source in a globals dict scrubbed by ``restrict_builtins``.
5. Emit BacktestResult JSON.

Exit codes:
    0  — success
    1  — preset error / unknown preset / user-code validation error
    2  — malformed job spec
"""

from __future__ import annotations

import json
import sys
import traceback


def _parse_job(raw: bytes) -> dict[str, object]:
    parsed: dict[str, object] = json.loads(raw)
    return parsed


def _prewarm_vectorbt() -> None:
    """Force vectorbt + numba to perform lazy initialisations now, before
    the import hook is installed."""
    import pandas as pd

    from qa_backtest.engine import run_backtest
    from qa_core.schemas import Bar

    idx = pd.date_range("2024-01-01", periods=10, freq="D")
    closes = [100.0, 101.0, 102.0, 101.5, 100.5, 99.5, 100.0, 101.0, 102.0, 103.0]
    bars = [
        Bar(t=ts.to_pydatetime(), open=c, high=c, low=c, close=c, volume=1.0)
        for ts, c in zip(idx, closes, strict=True)
    ]
    signal = pd.Series(0, index=idx, dtype=int)
    signal.iloc[1] = 1
    signal.iloc[5] = -1
    run_backtest(bars=bars, signal=signal)


def main() -> int:
    # ---- step 1: read + parse job spec (fail-fast, no vectorbt yet) -----
    try:
        raw = sys.stdin.buffer.read()
        job = _parse_job(raw)
    except (json.JSONDecodeError, OSError) as e:
        sys.stderr.write(f"sandbox: invalid job spec: {e}\n")
        return 2

    code = job.get("code")
    preset = job.get("preset")

    # Sanity: exactly one of code/preset
    if (code is None) == (preset is None):
        sys.stderr.write("sandbox: error: exactly one of 'code' or 'preset' must be set\n")
        return 1

    # ---- M6 untrusted-code branch ---------------------------------------
    if isinstance(code, str):
        bars_raw = job.get("data", []) or []
        if not isinstance(bars_raw, list):
            sys.stderr.write("sandbox: error: 'data' must be an array\n")
            return 1

        # Pre-import qa_core.schemas + qa_sandbox.code_runner BEFORE installing
        # the import hook. They transitively pull in modules (e.g. ``uuid``,
        # ``traceback``) that aren't on the user-facing allowlist. The runner's
        # own imports must complete with full stdlib access; once the hook is
        # in place only allow-listed modules can be imported by *user* code.
        from qa_core.schemas import Bar
        from qa_sandbox.code_runner import CodeRunnerError, run_user_code

        try:
            bars = [Bar(**b) for b in bars_raw]
        except Exception as e:
            sys.stderr.write(f"sandbox: error: invalid bar in 'data': {e}\n")
            return 1

        # No vectorbt prewarm — user code path doesn't use vectorbt. The
        # hook + limits still apply as defence-in-depth on top of Layer-2
        # Docker isolation.
        from qa_sandbox.import_hook import install as install_import_hook
        from qa_sandbox.limits import install_limits

        install_import_hook()
        install_limits()

        try:
            result = run_user_code(code, bars)
        except CodeRunnerError as e:
            sys.stderr.write(f"sandbox: error: {e}\n")
            return 1
        except Exception as e:
            sys.stderr.write(f"sandbox: error: {e}\n")
            sys.stderr.write(traceback.format_exc())
            return 1

        sys.stdout.write(result.model_dump_json())
        sys.stdout.flush()
        return 0

    # ---- M5 trusted-preset branch (unchanged) ---------------------------
    if not isinstance(preset, str) or not preset:
        sys.stderr.write("sandbox: error: missing or non-string 'preset' field\n")
        return 1

    # Lookup preset before warmup — unknown presets fail in milliseconds
    # instead of paying the 20-40s vectorbt JIT cost.
    from qa_backtest.presets.registry import get_runner

    runner = get_runner(preset)
    if runner is None:
        sys.stderr.write(f"sandbox: error: unknown preset: {preset}\n")
        return 1

    params = job.get("params", {}) or {}
    bars_raw = job.get("data", []) or []
    if not isinstance(params, dict):
        sys.stderr.write("sandbox: error: 'params' must be an object\n")
        return 1
    if not isinstance(bars_raw, list):
        sys.stderr.write("sandbox: error: 'data' must be an array\n")
        return 1

    # ---- step 2/3/4: warm vectorbt then install hook + limits -----------
    _prewarm_vectorbt()

    from qa_sandbox.import_hook import install as install_import_hook
    from qa_sandbox.limits import install_limits

    install_import_hook()
    install_limits()

    # ---- step 5/6: dispatch + emit --------------------------------------
    try:
        from qa_core.schemas import Bar

        bars = [Bar(**b) for b in bars_raw]
        result = runner(bars=bars, **params)
        sys.stdout.write(result.model_dump_json())
        sys.stdout.flush()
        return 0
    except Exception as e:
        sys.stderr.write(f"sandbox: error: {e}\n")
        sys.stderr.write(traceback.format_exc())
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
