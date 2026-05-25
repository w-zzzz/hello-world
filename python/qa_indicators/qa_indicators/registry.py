from __future__ import annotations

from collections.abc import Callable

import pandas as pd

from qa_core.schemas import IndicatorMeta
from qa_indicators.bollinger import BOLLINGER_META
from qa_indicators.ema import EMA_META
from qa_indicators.macd import MACD_META
from qa_indicators.rsi import RSI_META
from qa_indicators.sma import SMA_META

REGISTRY: dict[str, IndicatorMeta] = {
    SMA_META.id: SMA_META,
    EMA_META.id: EMA_META,
    RSI_META.id: RSI_META,
    MACD_META.id: MACD_META,
    BOLLINGER_META.id: BOLLINGER_META,
}


def get_compute(indicator_id: str) -> Callable[..., pd.DataFrame]:
    """Return the ``compute`` function for ``indicator_id``.

    Imported lazily inside the function to avoid an import cycle if any
    indicator module ever needs to import the registry.
    """

    from qa_indicators import bollinger, ema, macd, rsi, sma

    mapping: dict[str, Callable[..., pd.DataFrame]] = {
        "sma": sma.compute,
        "ema": ema.compute,
        "rsi": rsi.compute,
        "macd": macd.compute,
        "bollinger": bollinger.compute,
    }
    return mapping[indicator_id]
