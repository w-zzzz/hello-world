"""Vectorbt adapter that emits the canonical :class:`BacktestResult` shape.

The engine is intentionally thin: it converts ``list[Bar]`` to a sorted
DataFrame, feeds entries/exits into :func:`vectorbt.Portfolio.from_signals`,
and then normalises vectorbt's many output shapes into the strict pydantic
schema defined in :mod:`qa_core.schemas`.

NaN/Inf handling is split by field semantics:

- Quantities that are always well-defined for a non-empty backtest (cash,
  equity, max drawdown, exposure, trade pnl/price/qty) flow through
  :func:`_finite_float` and become ``0.0`` on NaN/Inf.
- Ratio metrics that are mathematically undefined under degenerate inputs
  (``sharpe``/``sortino``/``calmar`` with zero downside or zero variance;
  ``profit_factor`` with zero gross loss) flow through
  :func:`_finite_or_none` and become ``None`` on NaN/Inf, so the result
  JSON can distinguish "no losses" (``profit_factor=None``) from "only
  losses" (``profit_factor=0.0``).
"""

from __future__ import annotations

import hashlib
import json
import math
import warnings as warnings_mod
from datetime import date, datetime
from typing import Any, Literal
from uuid import uuid4

import pandas as pd

# vectorbt imports a swath of legacy numpy/pandas patterns; silence them here
# so test output is not littered with deprecation noise.
warnings_mod.filterwarnings("ignore", category=DeprecationWarning, module="vectorbt")
warnings_mod.filterwarnings("ignore", category=FutureWarning, module="vectorbt")

import vectorbt as vbt  # noqa: E402

from qa_core.schemas import (  # noqa: E402
    BacktestResult,
    Bar,
    DateRange,
    DrawdownPeriod,
    EquityPoint,
    Metrics,
    Trade,
)


def _finite_float(x: object) -> float:
    """Coerce to float, mapping NaN and inf to 0.0.

    Use for fields that are semantically a number for any non-empty
    backtest (e.g. drawdown, exposure, cash, equity, trade pnl/price).
    """
    try:
        v = float(x)  # type: ignore[arg-type]
        if math.isnan(v) or math.isinf(v):
            return 0.0
        return v
    except (TypeError, ValueError):
        return 0.0


def _finite_or_none(x: object) -> float | None:
    """Coerce to float, mapping NaN and inf to None.

    Use for ratio metrics that are undefined under degenerate conditions
    (sharpe, sortino, calmar, profit_factor).
    """
    try:
        v = float(x)  # type: ignore[arg-type]
        if math.isnan(v) or math.isinf(v):
            return None
        return v
    except (TypeError, ValueError):
        return None


def _to_utc_datetime(ts: Any) -> datetime:
    """Convert any timestamp-like to a tz-aware (UTC) python datetime."""
    pts = pd.Timestamp(ts)
    pts = pts.tz_localize("UTC") if pts.tzinfo is None else pts.tz_convert("UTC")
    result: datetime = pts.to_pydatetime()
    return result


def run_backtest(
    bars: list[Bar],
    signal: pd.Series,
    initial_cash: float = 10_000.0,
    commission: float = 0.0005,
    universe: list[str] | None = None,
    config_hash: str = "",
) -> BacktestResult:
    """Run a vectorbt backtest against ``bars`` driven by ``signal``.

    Args:
        bars: OHLCV bars in any order; sorted ascending internally.
        signal: Series of integers in ``{-1, 0, 1}`` aligned (via reindex) to
            the bar timestamps. ``1`` enters long, ``-1`` exits.
        initial_cash: Starting cash.
        commission: Per-trade fee fraction (e.g. ``0.0005`` = 5 bps).
        universe: Symbols traded (informational only for single-asset runs).
        config_hash: Optional stable hash filled by the caller for cache keys.

    Returns:
        A populated :class:`BacktestResult`.
    """
    if not bars:
        raise ValueError("bars must be non-empty")

    df = pd.DataFrame([b.model_dump() for b in bars])
    df["t"] = pd.to_datetime(df["t"], utc=True)
    df = df.set_index("t").sort_index()
    close = df["close"].astype(float)

    aligned = signal.reindex(close.index).fillna(0).astype(int)
    entries = aligned == 1
    exits = aligned == -1

    pf = vbt.Portfolio.from_signals(
        close,
        entries=entries,
        exits=exits,
        init_cash=initial_cash,
        fees=commission,
        freq="D",
    )

    equity_series = pf.value()
    cash_series = pf.cash()
    equity_curve: list[EquityPoint] = []
    for idx in equity_series.index:
        equity = _finite_float(equity_series.loc[idx])
        cash = _finite_float(cash_series.loc[idx])
        equity_curve.append(
            EquityPoint(
                t=_to_utc_datetime(idx),
                equity=equity,
                cash=cash,
                position_value=equity - cash,
            )
        )

    trades_df = pf.trades.records_readable
    trades: list[Trade] = []
    for _, row in trades_df.iterrows():
        entry_ts = pd.Timestamp(row["Entry Timestamp"])
        exit_ts = pd.Timestamp(row["Exit Timestamp"])
        bars_held = max(int((exit_ts - entry_ts).total_seconds() // 86_400), 0)
        side: Literal["long", "short"] = (
            "long" if str(row.get("Direction", "Long")).lower() == "long" else "short"
        )
        trades.append(
            Trade(
                entry_t=_to_utc_datetime(entry_ts),
                exit_t=_to_utc_datetime(exit_ts),
                side=side,
                qty=_finite_float(row.get("Size")),
                entry=_finite_float(row.get("Avg Entry Price")),
                exit=_finite_float(row.get("Avg Exit Price")),
                pnl=_finite_float(row.get("PnL")),
                mae=0.0,
                mfe=0.0,
                bars_held=bars_held,
            )
        )

    stats = pf.stats()

    def _stat(key: str) -> float:
        try:
            return _finite_float(stats.get(key))
        except Exception:
            return 0.0

    def _ratio_stat(key: str) -> float | None:
        """Stat lookup for ratio metrics — NaN/inf/missing -> None."""
        try:
            return _finite_or_none(stats.get(key))
        except Exception:
            return None

    exposure = (
        _stat("Position Coverage [%]") / 100.0
        if "Position Coverage [%]" in stats
        else _stat("Max Gross Exposure [%]") / 100.0
    )

    metrics = Metrics(
        sharpe=_ratio_stat("Sharpe Ratio"),
        sortino=_ratio_stat("Sortino Ratio"),
        calmar=_ratio_stat("Calmar Ratio"),
        max_drawdown=_stat("Max Drawdown [%]") / 100.0,
        profit_factor=_ratio_stat("Profit Factor"),
        win_rate=_stat("Win Rate [%]") / 100.0,
        expectancy=_stat("Expectancy"),
        turnover=0.0,
        exposure=exposure,
        trade_count=len(trades),
    )

    dd_df = pf.drawdowns.records_readable
    drawdown_periods: list[DrawdownPeriod] = []
    for _, row in dd_df.iterrows():
        start = _to_utc_datetime(row["Start Timestamp"])
        trough_ts = row.get("Valley Timestamp", row["Start Timestamp"])
        trough = _to_utc_datetime(trough_ts)
        recovery_ts = row.get("End Timestamp")
        status = str(row.get("Status", ""))
        recovery: datetime | None = None
        if recovery_ts is not None and pd.notna(recovery_ts) and status.lower() == "recovered":
            recovery = _to_utc_datetime(recovery_ts)
        peak_val = _finite_float(row.get("Peak Value"))
        valley_val = _finite_float(row.get("Valley Value"))
        depth = (valley_val - peak_val) / peak_val if peak_val else 0.0
        drawdown_periods.append(
            DrawdownPeriod(
                start=start,
                trough=trough,
                recovery=recovery,
                depth=_finite_float(depth),
            )
        )

    if universe is None:
        universe = ["SPY"]

    return BacktestResult(
        run_id=uuid4(),
        config_hash=config_hash,
        universe=universe,
        period=DateRange(
            start=close.index.min().date(),
            end=close.index.max().date(),
        ),
        equity_curve=equity_curve,
        trades=trades,
        metrics=metrics,
        drawdown_periods=drawdown_periods,
        benchmark=None,
        rolling=None,
        artifacts=[],
        warnings=[],
    )


def canonical_config_hash(payload: dict[str, Any]) -> str:
    """Stable SHA-256 over a JSON-canonicalised config dict.

    Used as the cache key for ``(preset, params, universe, period)`` tuples.
    Dates and datetimes are ISO-encoded so the hash is platform-independent.
    """

    def default(o: Any) -> Any:
        if isinstance(o, datetime | date):
            return o.isoformat()
        raise TypeError(type(o))

    body = json.dumps(payload, sort_keys=True, default=default).encode("utf-8")
    return hashlib.sha256(body).hexdigest()
