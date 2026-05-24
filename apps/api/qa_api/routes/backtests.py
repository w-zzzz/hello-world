from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def create_backtest() -> dict[str, str]:
    """Enqueue a backtest run.

    M0 stub. TODO(M5): accept a strategy config, validate it against
    ``qa_core`` schemas, enqueue to the worker queue, and return a real
    run id.
    """

    return {"run_id": "stub", "status": "queued"}
