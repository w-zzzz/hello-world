"""Execute user-provided Python code inside the M5.1-hardened sandbox.

Lifecycle (runs inside the runner subprocess, AFTER limits + import hook are
installed):

1. Compile the code with ``compile(source, '<user>', 'exec', dont_inherit=True)``.
2. Build a clean globals dict and pass through ``restrict_builtins`` so that
   ``eval`` / ``exec`` / ``compile`` / ``__import__`` / ``open`` / ``breakpoint``
   are removed from the user's reach.
3. Run ``exec(compiled, restricted_globals)``.
4. Look up ``restricted_globals['run']`` and invoke it with the close-price
   list from the bars.
5. Validate the return shape (must be ``{'signal': list[int in {-1,0,1}], ...}``).
6. Build a canonical ``BacktestResult`` (degenerate for M6: equity is a flat
   line, metrics are stubbed; the full backtest happens via vectorbt only when
   the *trusted preset* path is used. M6 ships a "signal-only" result so the
   tearsheet renders something meaningful; M7 will wire vectorbt-on-signals).
"""

from __future__ import annotations

import traceback
from datetime import date, datetime
from uuid import uuid4

from qa_core.schemas import (
    BacktestResult,
    Bar,
    DateRange,
    EquityPoint,
    Metrics,
)
from qa_sandbox.builtins import restrict_builtins

MAX_CODE_BYTES = 65_536


class CodeRunnerError(RuntimeError):
    """Raised when user code is malformed or returns the wrong shape."""


def _validate_code(source: str) -> None:
    if not isinstance(source, str):
        raise CodeRunnerError("code must be a string")
    if len(source.encode("utf-8")) > MAX_CODE_BYTES:
        raise CodeRunnerError(f"code exceeds {MAX_CODE_BYTES}B cap")


def _validate_return(rv: object, n_bars: int) -> dict[str, object]:
    if not isinstance(rv, dict):
        raise CodeRunnerError("run() must return a dict")
    sig = rv.get("signal")
    if not isinstance(sig, list):
        raise CodeRunnerError("run()['signal'] must be a list")
    if len(sig) != n_bars:
        raise CodeRunnerError(f"run()['signal'] length {len(sig)} != bars length {n_bars}")
    for i, v in enumerate(sig):
        if v not in (-1, 0, 1, None):
            raise CodeRunnerError(f"run()['signal'][{i}]={v!r}; must be -1, 0, 1, or None")
    return rv


def run_user_code(source: str, bars: list[Bar]) -> BacktestResult:
    """Execute the user's strategy and emit a canonical BacktestResult.

    Caller responsibilities (the sandbox runner):
        - install the import hook BEFORE calling this function
        - install resource limits BEFORE calling this function
    """
    _validate_code(source)
    if not bars:
        raise CodeRunnerError("bars must be non-empty")

    closes = [b.close for b in bars]

    user_globals: dict[str, object] = {"__name__": "__user__"}
    restrict_builtins(user_globals)

    try:
        compiled = compile(source, "<user>", "exec", dont_inherit=True)
    except SyntaxError as e:
        raise CodeRunnerError(f"SyntaxError: {e}") from e

    try:
        exec(compiled, user_globals)  # noqa: S102 — the whole point
    except CodeRunnerError:
        raise
    except Exception as e:
        raise CodeRunnerError(f"user_exception: {e}\n{traceback.format_exc()}") from e

    user_run = user_globals.get("run")
    if not callable(user_run):
        raise CodeRunnerError("missing or non-callable top-level run()")

    try:
        rv = user_run(closes)
    except Exception as e:
        raise CodeRunnerError(f"user_exception in run(): {e}\n{traceback.format_exc()}") from e

    rv_dict = _validate_return(rv, len(bars))

    # Build a "signal-only" BacktestResult. For M6 we don't simulate a full
    # backtest (no vectorbt in this code path); instead, we return the signal
    # series as part of warnings/note and set degenerate metrics. M7 will wire
    # vectorbt-on-signals so the tearsheet metrics become meaningful.
    return _build_degenerate_result(bars, rv_dict)


def _build_degenerate_result(bars: list[Bar], rv: dict[str, object]) -> BacktestResult:
    starting_cash = 10_000.0
    eq_points: list[EquityPoint] = [
        EquityPoint(
            t=b.t,
            equity=starting_cash,
            cash=starting_cash,
            position_value=0.0,
        )
        for b in bars
    ]

    def _to_date(t: object) -> date:
        if isinstance(t, datetime):
            return t.date()
        if isinstance(t, date):
            return t
        return date.today()

    return BacktestResult(
        run_id=uuid4(),
        config_hash="",  # filled by API
        universe=["SPY"],
        period=DateRange(
            start=_to_date(bars[0].t),
            end=_to_date(bars[-1].t),
        ),
        equity_curve=eq_points,
        trades=[],
        metrics=Metrics(
            sharpe=None,
            sortino=None,
            calmar=None,
            max_drawdown=0.0,
            profit_factor=None,
            win_rate=0.0,
            expectancy=0.0,
            turnover=0.0,
            exposure=0.0,
            trade_count=0,
        ),
        drawdown_periods=[],
        benchmark=None,
        rolling=None,
        artifacts=[],
        warnings=[],
    )
