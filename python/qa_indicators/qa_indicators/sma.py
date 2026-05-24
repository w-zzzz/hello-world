from __future__ import annotations

import pandas as pd

from qa_core.schemas import IndicatorMeta, IndicatorOutput, ParamKind, ParamSpec

SMA_META = IndicatorMeta(
    id="sma",
    name_zh="简单移动平均线",
    name_en="Simple Moving Average",
    category="overlay",
    formula_tex=r"\mathrm{SMA}_t = \frac{1}{n}\sum_{i=0}^{n-1} P_{t-i}",
    params={
        "period": ParamSpec(kind=ParamKind.INT, default=20, min=2, max=400, step=1),
        "source": ParamSpec(
            kind=ParamKind.ENUM,
            default="close",
            options=["open", "high", "low", "close"],
        ),
    },
    outputs=[IndicatorOutput(name="sma", kind="overlay")],
    use_cases_keys=["indicators.sma.use.trend", "indicators.sma.use.support"],
    pitfalls_keys=["indicators.sma.pit.lag"],
    references=[],
)


def compute(df: pd.DataFrame, period: int = 20, source: str = "close") -> pd.DataFrame:
    """Compute the Simple Moving Average over ``df[source]``.

    Returns a DataFrame indexed identically to ``df`` with a single ``sma``
    column. Values before the window are NaN.
    """

    if period < 2:
        raise ValueError("period must be >= 2")
    if source not in {"open", "high", "low", "close"}:
        raise ValueError(f"unsupported source: {source}")
    series = df[source].astype(float)
    out = series.rolling(window=period, min_periods=period).mean()
    return pd.DataFrame({"sma": out.values}, index=df.index)
