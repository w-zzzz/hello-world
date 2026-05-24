from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from qa_core.schemas import BarsResponse, Interval

router = APIRouter()


@router.get("/bars", response_model=BarsResponse)
async def get_bars(
    symbol: Annotated[str, Query(min_length=1, max_length=16)],
    start: Annotated[datetime, Query()],
    end: Annotated[datetime, Query()],
    interval: Annotated[Interval, Query()] = "1d",
) -> BarsResponse:
    """Return OHLCV bars for ``symbol`` between ``start`` and ``end``.

    M0 stub: returns an empty series. TODO(M5): wire to parquet + yfinance
    fallback (Polygon/AlphaVantage when keys configured).
    """
    if end < start:
        raise HTTPException(status_code=422, detail="end must be >= start")

    # Reference values to avoid unused-arg lints; replaced in M5.
    _ = (start.astimezone(UTC), end.astimezone(UTC))

    return BarsResponse(symbol=symbol.upper(), interval=interval, bars=[])
