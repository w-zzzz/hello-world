from __future__ import annotations

import math

import pandas as pd
from fastapi import APIRouter, HTTPException

from qa_core.schemas import (
    ComputeIndicatorRequest,
    ComputeIndicatorResponse,
    IndicatorMeta,
)
from qa_indicators.registry import REGISTRY, get_compute

router = APIRouter()


@router.get("/", response_model=list[IndicatorMeta])
async def list_indicators() -> list[IndicatorMeta]:
    return list(REGISTRY.values())


@router.get("/{indicator_id}", response_model=IndicatorMeta)
async def get_indicator(indicator_id: str) -> IndicatorMeta:
    meta = REGISTRY.get(indicator_id)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Unknown indicator: {indicator_id}")
    return meta


@router.post("/{indicator_id}/compute", response_model=ComputeIndicatorResponse)
async def compute_indicator(
    indicator_id: str,
    body: ComputeIndicatorRequest,
) -> ComputeIndicatorResponse:
    meta = REGISTRY.get(indicator_id)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Unknown indicator: {indicator_id}")

    # Param validation against metadata
    params = dict(body.params)
    for name, spec in meta.params.items():
        if name not in params:
            params[name] = spec.default
        value = params[name]
        if spec.kind.value == "int":
            try:
                params[name] = int(value)
            except (TypeError, ValueError) as err:
                raise HTTPException(status_code=422, detail=f"Param '{name}' must be int") from err
            if spec.min is not None and params[name] < spec.min:
                raise HTTPException(status_code=422, detail=f"Param '{name}' below min {spec.min}")
            if spec.max is not None and params[name] > spec.max:
                raise HTTPException(status_code=422, detail=f"Param '{name}' above max {spec.max}")
        elif spec.kind.value == "float":
            try:
                params[name] = float(value)
            except (TypeError, ValueError) as err:
                raise HTTPException(
                    status_code=422, detail=f"Param '{name}' must be float"
                ) from err
            if spec.min is not None and params[name] < spec.min:
                raise HTTPException(status_code=422, detail=f"Param '{name}' below min {spec.min}")
            if spec.max is not None and params[name] > spec.max:
                raise HTTPException(status_code=422, detail=f"Param '{name}' above max {spec.max}")
        elif spec.kind.value == "enum":
            if spec.options is not None and str(value) not in spec.options:
                raise HTTPException(
                    status_code=422,
                    detail=f"Param '{name}' must be one of {spec.options}",
                )
            params[name] = str(value)

    # Reject unknown params (strict — protects against typos that would be silently ignored)
    extra = set(params) - set(meta.params)
    if extra:
        raise HTTPException(status_code=422, detail=f"Unknown params: {sorted(extra)}")

    if not body.bars:
        raise HTTPException(status_code=422, detail="bars must be non-empty")

    df = pd.DataFrame([bar.model_dump() for bar in body.bars])
    df["t"] = pd.to_datetime(df["t"], utc=True)
    df = df.set_index("t").sort_index()

    compute = get_compute(indicator_id)
    try:
        result = compute(df, **params)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    outputs: dict[str, list[float | None]] = {}
    for col in result.columns:
        values = result[col].to_list()
        outputs[col] = [
            None if isinstance(v, float) and math.isnan(v) else float(v) for v in values
        ]

    return ComputeIndicatorResponse(
        indicator=indicator_id,
        params=params,  # type: ignore[arg-type]
        outputs=outputs,
    )
