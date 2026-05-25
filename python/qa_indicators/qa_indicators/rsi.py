from __future__ import annotations

import numpy as np
import pandas as pd

from qa_core.schemas import IndicatorMeta, IndicatorOutput, ParamKind, ParamSpec

RSI_META = IndicatorMeta(
    id="rsi",
    name_zh="相对强弱指数",
    name_en="Relative Strength Index",
    category="oscillator",
    formula_tex=(
        r"\mathrm{RSI}_t = 100 - \frac{100}{1 + \mathrm{RS}_t},"
        r"\quad \mathrm{RS}_t = \frac{\overline{\mathrm{gain}}_t}{\overline{\mathrm{loss}}_t}"
    ),
    params={
        "period": ParamSpec(kind=ParamKind.INT, default=14, min=2, max=400, step=1),
        "source": ParamSpec(
            kind=ParamKind.ENUM,
            default="close",
            options=["open", "high", "low", "close"],
        ),
    },
    outputs=[IndicatorOutput(name="rsi", range=(0.0, 100.0), kind="panel")],
    use_cases_keys=["indicators.rsi.use.momentum", "indicators.rsi.use.divergence"],
    pitfalls_keys=["indicators.rsi.pit.trending"],
    references=[],
)


def compute(df: pd.DataFrame, period: int = 14, source: str = "close") -> pd.DataFrame:
    """Compute Wilder's RSI of ``df[source]``.

    Implementation details:
    * ``gain`` = max(delta, 0), ``loss`` = max(-delta, 0) on first differences.
    * Wilder smoothing: SMA of the first ``period`` gains/losses is used as
      the seed at index ``period``; subsequent values use the recursive
      ``avg = (prev * (period - 1) + new) / period`` (equivalent to an EMA
      with ``alpha = 1 / period``).
    * When ``avg_loss == 0`` the RSI is defined as ``100``.
    * The first ``period`` output values are NaN.
    """

    if period < 2:
        raise ValueError("period must be >= 2")
    if source not in {"open", "high", "low", "close"}:
        raise ValueError(f"unsupported source: {source}")

    series = df[source].astype(float)
    values = series.to_numpy()
    n = len(values)
    out = np.full(n, np.nan, dtype=float)

    if n <= period:
        return pd.DataFrame({"rsi": out}, index=df.index)

    delta = np.diff(values)
    gains = np.where(delta > 0, delta, 0.0)
    losses = np.where(delta < 0, -delta, 0.0)

    # Seed at index `period` (i.e. after `period` deltas).
    avg_gain = float(np.mean(gains[:period]))
    avg_loss = float(np.mean(losses[:period]))
    out[period] = 100.0 if avg_loss == 0 else 100.0 - 100.0 / (1.0 + avg_gain / avg_loss)

    for i in range(period + 1, n):
        # delta[i - 1] corresponds to (values[i] - values[i - 1]).
        avg_gain = (avg_gain * (period - 1) + gains[i - 1]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i - 1]) / period
        if avg_loss == 0:
            out[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            out[i] = 100.0 - 100.0 / (1.0 + rs)

    return pd.DataFrame({"rsi": out}, index=df.index)
