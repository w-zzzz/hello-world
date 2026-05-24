from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.post("/tutor")
async def tutor() -> dict[str, str]:
    """AI tutor endpoint.

    M0 stub. TODO(M4): proxy to Anthropic via ``settings.anthropic_api_key``
    with streaming, citations, and tool calls for indicator/backtest
    lookups.
    """

    return {"reply": "AI tutor coming in M4"}
