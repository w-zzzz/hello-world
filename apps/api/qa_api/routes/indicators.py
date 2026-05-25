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

    # Reject unknown params before validation (strict — protects against typos).
    extra = set(body.params) - set(meta.params)
    if extra:
        raise HTTPException(status_code=422, detail=f"Unknown params: {sorted(extra)}")

    # Param validation against metadata. Build a fully-coerced dict.
    params: dict[str, str | int | float] = {}
    for name, spec in meta.params.items():
        raw: str | int | float = body.params.get(name, spec.default)
        if spec.kind.value == "int":
            try:
                coerced_int = int(raw)
            except (TypeError, ValueError) as err:
                raise HTTPException(status_code=422, detail=f"Param '{name}' must be int") from err
            if spec.min is not None and coerced_int < spec.min:
                raise HTTPException(status_code=422, detail=f"Param '{name}' below min {spec.min}")
            if spec.max is not None and coerced_int > spec.max:
                raise HTTPException(status_code=422, detail=f"Param '{name}' above max {spec.max}")
            params[name] = coerced_int
        elif spec.kind.value == "float":
            try:
                coerced_float = float(raw)
            except (TypeError, ValueError) as err:
                raise HTTPException(
                    status_code=422, detail=f"Param '{name}' must be float"
                ) from err
            if spec.min is not None and coerced_float < spec.min:
                raise HTTPException(status_code=422, detail=f"Param '{name}' below min {spec.min}")
            if spec.max is not None and coerced_float > spec.max:
                raise HTTPException(status_code=422, detail=f"Param '{name}' above max {spec.max}")
            params[name] = coerced_float
        else:  # enum
            coerced_str = str(raw)
            if spec.options is not None and coerced_str not in spec.options:
                raise HTTPException(
                    status_code=422,
                    detail=f"Param '{name}' must be one of {spec.options}",
                )
            params[name] = coerced_str

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
        params=params,
        outputs=outputs,
    )
