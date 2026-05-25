from __future__ import annotations

import pandas as pd

from qa_core.schemas import IndicatorMeta, IndicatorOutput, ParamKind, ParamSpec

BOLLINGER_META = IndicatorMeta(
    id="bollinger",
    name_zh="布林带",
    name_en="Bollinger Bands",
    category="overlay",
    formula_tex=(
        r"\mathrm{Upper}_t = \mathrm{SMA}_n(P_t) + k\sigma_n,"
        r"\quad \mathrm{Lower}_t = \mathrm{SMA}_n(P_t) - k\sigma_n"
    ),
    params={
        "period": ParamSpec(kind=ParamKind.INT, default=20, min=2, max=400, step=1),
        "stddev": ParamSpec(kind=ParamKind.FLOAT, default=2.0, min=0.5, max=5.0, step=0.1),
        "source": ParamSpec(
            kind=ParamKind.ENUM,
            default="close",
            options=["open", "high", "low", "close"],
        ),
    },
    outputs=[
        IndicatorOutput(name="middle", kind="overlay"),
        IndicatorOutput(name="upper", kind="overlay"),
        IndicatorOutput(name="lower", kind="overlay"),
    ],
    use_cases_keys=["indicators.bollinger.use.volatility", "indicators.bollinger.use.meanrev"],
    pitfalls_keys=["indicators.bollinger.pit.trending"],
    references=[],
)


def compute(
    df: pd.DataFrame,
    period: int = 20,
    stddev: float = 2.0,
    source: str = "close",
) -> pd.DataFrame:
    """Compute Bollinger Bands (middle/upper/lower) of ``df[source]``.

    ``middle`` is the SMA; ``upper`` and ``lower`` are ``middle +/- stddev * sigma``
    where ``sigma`` is the population rolling standard deviation (``ddof=0``),
    matching ``pandas-ta`` defaults.
    """

    if period < 2:
        raise ValueError("period must be >= 2")
    if stddev <= 0:
        raise ValueError("stddev must be > 0")
    if source not in {"open", "high", "low", "close"}:
        raise ValueError(f"unsupported source: {source}")

    series = df[source].astype(float)
    middle = series.rolling(window=period, min_periods=period).mean()
    sigma = series.rolling(window=period, min_periods=period).std(ddof=0)
    upper = middle + stddev * sigma
    lower = middle - stddev * sigma

    return pd.DataFrame(
        {
            "middle": middle.to_numpy(),
            "upper": upper.to_numpy(),
            "lower": lower.to_numpy(),
        },
        index=df.index,
    )
