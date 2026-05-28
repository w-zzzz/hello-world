"""Emit a combined JSON Schema for the qa_core wire models.

The output is a single JSON document with every wire model registered under
`$defs`. `scripts/generate-contracts.ts` feeds this to
`json-schema-to-typescript` to produce `packages/contracts/src/generated/index.ts`.
"""

from __future__ import annotations

import json
import sys

from qa_core.schemas import (
    Artifact,
    BacktestResult,
    BacktestWarning,
    Bar,
    BarsResponse,
    ComputeIndicatorRequest,
    ComputeIndicatorResponse,
    DateRange,
    DrawdownPeriod,
    EquityPoint,
    IndicatorMeta,
    IndicatorOutput,
    IndicatorReference,
    Metrics,
    ParamKind,
    ParamSpec,
    RollingStats,
    Trade,
)

MODELS = [
    Bar,
    BarsResponse,
    ParamSpec,
    IndicatorOutput,
    IndicatorReference,
    IndicatorMeta,
    ComputeIndicatorRequest,
    ComputeIndicatorResponse,
    DateRange,
    EquityPoint,
    Trade,
    Metrics,
    DrawdownPeriod,
    Artifact,
    BacktestWarning,
    RollingStats,
    BacktestResult,
]


def main() -> None:
    defs: dict[str, dict] = {}
    for model in MODELS:
        schema = model.model_json_schema(mode="serialization")
        # Pydantic emits referenced models nested under "$defs" and, for
        # self-referential models, exposes the top-level schema as a $ref
        # into $defs. Hoist all $defs to our combined namespace and only
        # write the top-level entry when it's a real object (not a $ref
        # forwarder).
        nested = schema.pop("$defs", {})
        for k, v in nested.items():
            defs.setdefault(k, v)
        if "$ref" not in schema:
            defs.setdefault(model.__name__, schema)

    # ParamKind is an enum (not a BaseModel). Emit it explicitly so consumers
    # can import the literal union; Pydantic normally inlines it into the
    # referencing model rather than registering it under $defs.
    defs.setdefault(
        "ParamKind",
        {
            "type": "string",
            "enum": [member.value for member in ParamKind],
            "title": "ParamKind",
        },
    )

    combined = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "QuantAcademyContracts",
        "type": "object",
        "properties": {name: {"$ref": f"#/$defs/{name}"} for name in defs},
        "$defs": defs,
        "additionalProperties": False,
    }

    json.dump(combined, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
