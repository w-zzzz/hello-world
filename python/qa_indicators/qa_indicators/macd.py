from __future__ import annotations

import numpy as np
import pandas as pd

from qa_core.schemas import IndicatorMeta, IndicatorOutput, ParamKind, ParamSpec

MACD_META = IndicatorMeta(
    id="macd",
    name_zh="平滑异同移动平均线",
    name_en="Moving Average Convergence Divergence",
    category="trend",
    formula_tex=r"\mathrm{MACD}_t = \mathrm{EMA}_{fast}(P_t) - \mathrm{EMA}_{slow}(P_t)",
    params={
        "fast": ParamSpec(kind=ParamKind.INT, default=12, min=2, max=200, step=1),
        "slow": ParamSpec(kind=ParamKind.INT, default=26, min=3, max=400, step=1),
        "signal": ParamSpec(kind=ParamKind.INT, default=9, min=2, max=200, step=1),
        "source": ParamSpec(
            kind=ParamKind.ENUM,
            default="close",
            options=["open", "high", "low", "close"],
        ),
    },
    outputs=[
        IndicatorOutput(name="macd", kind="panel"),
        IndicatorOutput(name="signal", kind="panel"),
        IndicatorOutput(name="histogram", kind="panel"),
    ],
    use_cases_keys=["indicators.macd.use.trend", "indicators.macd.use.cross"],
    pitfalls_keys=["indicators.macd.pit.whipsaw"],
    references=[],
)


def _ema_array(values: np.ndarray, period: int) -> np.ndarray:
    """EMA matching ``ema.compute`` but operating directly on a NumPy array.

    Leading ``period - 1`` values are NaN; the value at index ``period - 1``
    is the SMA of the first ``period`` observations; subsequent values use
    the recursive ``alpha = 2 / (period + 1)`` update.
    """

    n = len(values)
    out = np.full(n, np.nan, dtype=float)
    if n < period:
        return out
    alpha = 2.0 / (period + 1)
    seed = float(np.mean(values[:period]))
    out[period - 1] = seed
    prev = seed
    for i in range(period, n):
        prev = alpha * values[i] + (1 - alpha) * prev
        out[i] = prev
    return out


def _ema_array_skip_nan(values: np.ndarray, period: int) -> np.ndarray:
    """EMA of ``values`` ignoring leading NaNs.

    Seeds the EMA with the SMA of the first ``period`` consecutive defined
    values, then applies the standard recursive EMA from there. Indices
    before the seed are NaN.
    """

    n = len(values)
    out = np.full(n, np.nan, dtype=float)
    # Find first index with a defined value.
    defined_mask = ~np.isnan(values)
    if not defined_mask.any():
        return out
    first_defined = int(np.argmax(defined_mask))
    # Number of defined values available.
    defined_count = n - first_defined
    if defined_count < period:
        return out
    alpha = 2.0 / (period + 1)
    seed_end = first_defined + period
    seed = float(np.mean(values[first_defined:seed_end]))
    out[seed_end - 1] = seed
    prev = seed
    for i in range(seed_end, n):
        prev = alpha * values[i] + (1 - alpha) * prev
        out[i] = prev
    return out


def compute(
    df: pd.DataFrame,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
    source: str = "close",
) -> pd.DataFrame:
    """Compute MACD line, signal line and histogram of ``df[source]``."""

    if fast < 2:
        raise ValueError("fast must be >= 2")
    if slow < 3:
        raise ValueError("slow must be >= 3")
    if signal < 2:
        raise ValueError("signal must be >= 2")
    if fast >= slow:
        raise ValueError("fast must be < slow")
    if source not in {"open", "high", "low", "close"}:
        raise ValueError(f"unsupported source: {source}")

    series = df[source].astype(float)
    values = series.to_numpy()
    ema_fast = _ema_array(values, fast)
    ema_slow = _ema_array(values, slow)
    macd_line = ema_fast - ema_slow
    # MACD line first defined at index slow - 1 (since slow > fast).
    # Signal seeds when it has `signal` consecutive defined macd values.
    signal_line = _ema_array_skip_nan(macd_line, signal)
    histogram = macd_line - signal_line

    return pd.DataFrame(
        {"macd": macd_line, "signal": signal_line, "histogram": histogram},
        index=df.index,
    )
