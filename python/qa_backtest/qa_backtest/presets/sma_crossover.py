"""SMA Crossover preset.

Classic dual-moving-average strategy. The fast SMA crossing above the slow
SMA emits an entry signal; the inverse cross emits an exit. We use a
strict ``>`` / ``<`` comparison with a one-bar lookback so a single sample
never triggers both an entry and an exit.
"""

from __future__ import annotations

import pandas as pd

from qa_backtest.engine import run_backtest
from qa_backtest.presets.meta import PresetMeta
from qa_core.schemas import BacktestResult, Bar, ParamKind, ParamSpec
from qa_indicators.sma import compute as compute_sma

SMA_CROSSOVER_META = PresetMeta(
    id="sma_crossover",
    name_zh="双均线交叉",
    name_en="SMA Crossover",
    description_zh="经典双均线策略:快线上穿慢线买入,下穿卖出",
    description_en=(
        "Classic dual-MA strategy: enter when fast crosses above slow, exit when it crosses below"
    ),
    params={
        "fast": ParamSpec(kind=ParamKind.INT, default=20, min=2, max=200, step=1),
        "slow": ParamSpec(kind=ParamKind.INT, default=50, min=5, max=400, step=1),
    },
)


def run_sma_crossover(
    bars: list[Bar],
    fast: int = 20,
    slow: int = 50,
) -> BacktestResult:
    """Run the SMA crossover preset on ``bars`` and return a BacktestResult."""
    if fast >= slow:
        raise ValueError("fast must be < slow")

    df = pd.DataFrame([b.model_dump() for b in bars])
    df["t"] = pd.to_datetime(df["t"], utc=True)
    df = df.set_index("t").sort_index()

    fast_sma = compute_sma(df, period=fast)["sma"]
    slow_sma = compute_sma(df, period=slow)["sma"]

    fast_prev = fast_sma.shift(1)
    slow_prev = slow_sma.shift(1)
    cross_up = (fast_sma > slow_sma) & (fast_prev <= slow_prev)
    cross_down = (fast_sma < slow_sma) & (fast_prev >= slow_prev)

    signal = pd.Series(0, index=df.index, dtype=int)
    signal[cross_up] = 1
    signal[cross_down] = -1

    return run_backtest(bars=bars, signal=signal)
