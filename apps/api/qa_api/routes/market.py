from __future__ import annotations

from datetime import datetime, timezone
from typing import get_args

from fastapi import APIRouter, HTTPException, Query

from qa_core.schemas import BarsResponse, Interval

router = APIRouter()


@router.get("/bars", response_model=BarsResponse)
async def get_bars(
    symbol: str = Query(..., min_length=1, max_length=16),
    start: datetime = Query(...),
    end: datetime = Query(...),
    interval: str = Query("1d"),
) -> BarsResponse:
    """Return OHLCV bars for ``symbol`` between ``start`` and ``end``.

    M0 stub: returns an empty series. TODO(M5): wire to parquet + yfinance
    fallback (Polygon/AlphaVantage when keys configured).
    """

    allowed = get_args(Interval)
    if interval not in allowed:
        raise HTTPException(status_code=422, detail=f"interval must be one of {allowed}")
    if end < start:
        raise HTTPException(status_code=422, detail="end must be >= start")

    # Reference values to avoid unused-arg lints; replaced in M5.
    _ = (start.astimezone(timezone.utc), end.astimezone(timezone.utc))

    return BarsResponse(symbol=symbol.upper(), interval=interval, bars=[])  # type: ignore[arg-type]
