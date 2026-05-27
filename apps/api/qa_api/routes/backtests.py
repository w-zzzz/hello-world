"""M5: backtest preset list + synchronous run endpoint.

POST /backtests
  body: { preset: str, params: dict, universe: list[str] | None,
          start: ISO date | None, end: ISO date | None }
  flow:  validate preset + params -> load bundled bars for universe ->
         compute config_hash -> invoke qa_sandbox.execute({preset, params, data, universe})
         -> return BacktestResult JSON.
GET  /backtests/presets
  returns: list[{ id, name_zh, name_en, description_zh, description_en, params }]
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import Field

from qa_backtest import canonical_config_hash
from qa_backtest.presets.registry import PRESETS, get_preset
from qa_core.schemas import BacktestResult, StrictModel
from qa_sandbox import SandboxError, execute

router = APIRouter()


PARITY_FIXTURE = (
    Path(__file__).resolve().parents[4]
    / "python"
    / "qa_indicators"
    / "qa_indicators"
    / "fixtures"
    / "parity_input.json"
)


class PresetParamSpecOut(StrictModel):
    kind: str
    default: float | int | str
    min: float | int | None = None
    max: float | int | None = None
    step: float | int | None = None
    options: list[str] | None = None


class PresetOut(StrictModel):
    id: str
    name_zh: str
    name_en: str
    description_zh: str
    description_en: str
    params: dict[str, PresetParamSpecOut]


class RunBacktestRequest(StrictModel):
    preset: str
    params: dict[str, str | int | float] = Field(default_factory=dict)
    universe: list[str] | None = None
    start: date | None = None
    end: date | None = None


class RunBacktestResponse(StrictModel):
    run_id: str
    config_hash: str
    result: BacktestResult


def _load_bundled_bars() -> list[dict[str, Any]]:
    if not PARITY_FIXTURE.exists():
        return []
    payload = json.loads(PARITY_FIXTURE.read_text())
    bars: list[dict[str, Any]] = payload["bars"]
    return bars


def _serialize_preset(p: Any) -> PresetOut:
    return PresetOut(
        id=p.id,
        name_zh=p.name_zh,
        name_en=p.name_en,
        description_zh=p.description_zh,
        description_en=p.description_en,
        params={
            k: PresetParamSpecOut(
                kind=spec.kind.value,
                default=spec.default,
                min=spec.min,
                max=spec.max,
                step=spec.step,
                options=spec.options,
            )
            for k, spec in p.params.items()
        },
    )


@router.get("/presets", response_model=list[PresetOut])
async def list_presets() -> list[PresetOut]:
    return [_serialize_preset(p) for p in PRESETS.values()]


def _validate_params(preset_meta: Any, params: dict[str, str | int | float]) -> dict[str, Any]:
    extra = set(params) - set(preset_meta.params)
    if extra:
        raise HTTPException(status_code=422, detail=f"Unknown params: {sorted(extra)}")
    coerced: dict[str, Any] = {}
    for name, spec in preset_meta.params.items():
        raw = params.get(name, spec.default)
        kind = spec.kind.value
        if kind == "int":
            try:
                v = int(raw)
            except (TypeError, ValueError) as err:
                raise HTTPException(status_code=422, detail=f"Param '{name}' must be int") from err
            if spec.min is not None and v < spec.min:
                raise HTTPException(status_code=422, detail=f"Param '{name}' below min {spec.min}")
            if spec.max is not None and v > spec.max:
                raise HTTPException(status_code=422, detail=f"Param '{name}' above max {spec.max}")
            coerced[name] = v
        elif kind == "float":
            try:
                vf = float(raw)
            except (TypeError, ValueError) as err:
                raise HTTPException(
                    status_code=422, detail=f"Param '{name}' must be float"
                ) from err
            coerced[name] = vf
        else:  # enum
            s = str(raw)
            if spec.options is not None and s not in spec.options:
                raise HTTPException(
                    status_code=422,
                    detail=f"Param '{name}' must be one of {spec.options}",
                )
            coerced[name] = s
    return coerced


@router.post("/", response_model=RunBacktestResponse)
async def run_backtest(body: RunBacktestRequest) -> RunBacktestResponse:
    meta = get_preset(body.preset)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Unknown preset: {body.preset}")
    params = _validate_params(meta, body.params)

    bars = _load_bundled_bars()
    if not bars:
        raise HTTPException(status_code=500, detail="bundled bars not available")

    universe = body.universe or ["SPY"]
    config_payload = {
        "preset": body.preset,
        "params": params,
        "universe": universe,
        "start": body.start.isoformat() if body.start else None,
        "end": body.end.isoformat() if body.end else None,
    }
    config_hash = canonical_config_hash(config_payload)

    job = {
        "preset": body.preset,
        "params": params,
        "universe": universe,
        "data": bars,
    }
    try:
        result_dict = execute(job)
    except SandboxError as e:
        raise HTTPException(status_code=500, detail=f"sandbox failure: {e}") from e

    result_dict["config_hash"] = config_hash
    result = BacktestResult.model_validate(result_dict)
    return RunBacktestResponse(run_id=str(result.run_id), config_hash=config_hash, result=result)
