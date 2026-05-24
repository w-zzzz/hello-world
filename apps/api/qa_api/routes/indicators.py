from __future__ import annotations

from fastapi import APIRouter

from qa_core.schemas import IndicatorMeta
from qa_indicators.registry import REGISTRY

router = APIRouter()


@router.get("/", response_model=list[IndicatorMeta])
async def list_indicators() -> list[IndicatorMeta]:
    return list(REGISTRY.values())
