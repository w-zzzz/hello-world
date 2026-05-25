from __future__ import annotations

import numpy as np
import pandas as pd

from qa_core.schemas import IndicatorMeta, IndicatorOutput, ParamKind, ParamSpec

EMA_META = IndicatorMeta(
    id="ema",
    name_zh="指数移动平均线",
    name_en="Exponential Moving Average",
    category="overlay",
    formula_tex=(
        r"\mathrm{EMA}_t = \alpha P_t + (1-\alpha)\,\mathrm{EMA}_{t-1},"
        r"\quad \alpha = \frac{2}{n+1}"
    ),
    params={
        "period": ParamSpec(kind=ParamKind.INT, default=20, min=2, max=400, step=1),
        "source": ParamSpec(
            kind=ParamKind.ENUM,
            default="close",
            options=["open", "high", "low", "close"],
        ),
    },
    outputs=[IndicatorOutput(name="ema", kind="overlay")],
    use_cases_keys=["indicators.ema.use.trend", "indicators.ema.use.recent"],
    pitfalls_keys=["indicators.ema.pit.warmup"],
    references=[],
)


def compute(df: pd.DataFrame, period: int = 20, source: str = "close") -> pd.DataFrame:
    """Compute Exponential Moving Average of ``df[source]``.

    Matches the TA-Lib / pandas-ta convention: the first ``period - 1`` values
    are NaN, the value at index ``period - 1`` is the SMA of the first
    ``period`` bars (the seed), and subsequent values are computed
    recursively as ``alpha * P + (1 - alpha) * prev`` with
    ``alpha = 2 / (period + 1)``.
    """

    if period < 2:
        raise ValueError("period must be >= 2")
    if source not in {"open", "high", "low", "close"}:
        raise ValueError(f"unsupported source: {source}")

    series = df[source].astype(float)
    values = series.to_numpy()
    alpha = 2.0 / (period + 1)
    out = np.full(len(values), np.nan, dtype=float)
    if len(values) >= period:
        seed = float(np.mean(values[:period]))
        out[period - 1] = seed
        prev = seed
        for i in range(period, len(values)):
            prev = alpha * values[i] + (1 - alpha) * prev
            out[i] = prev
    return pd.DataFrame({"ema": out}, index=df.index)
