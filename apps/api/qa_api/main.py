from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from qa_api.config import settings
from qa_api.routes import ai, backtests, indicators, market

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    log.info("api.startup", env=settings.env)
    yield
    log.info("api.shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Quant Academy API",
        version="0.1.0",
        description="Indicators, backtests, market data, AI proxy.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    async def healthz() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/version")
    async def version() -> dict[str, str]:
        return {"version": "0.1.0", "env": settings.env}

    app.include_router(indicators.router, prefix="/indicators", tags=["indicators"])
    app.include_router(market.router, prefix="/market", tags=["market"])
    app.include_router(backtests.router, prefix="/backtests", tags=["backtests"])
    app.include_router(ai.router, prefix="/ai", tags=["ai"])
    return app


app = create_app()
