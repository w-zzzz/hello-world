from __future__ import annotations

from qa_core.schemas import IndicatorMeta

from qa_indicators.sma import SMA_META

REGISTRY: dict[str, IndicatorMeta] = {
    SMA_META.id: SMA_META,
}
