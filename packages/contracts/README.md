# @quant-academy/contracts

Auto-generated TypeScript types mirroring the canonical Pydantic wire models in
`python/qa_core/qa_core/schemas.py`.

This package is the **single source-of-truth bridge** between the Python
`qa_core` schemas and any TypeScript consumer (apps/web, indicators-ts, etc.).
Manual edits to files under `src/generated/` will be overwritten.

## Regenerate

```bash
pnpm --filter @quant-academy/contracts run build:contracts
```

CI runs `pnpm run check:contracts` in the `parity-check` job; it re-runs the
generator and fails if the working tree diff is non-empty. This catches schema
drift between Python and TypeScript at PR time (ADR M0: H-ARCH-1).

## How it works

1. `scripts/export-schemas.py` invokes `model_json_schema()` on every wire
   model and combines them into one JSON Schema document.
2. `scripts/generate-contracts.ts` pipes that through
   [`json-schema-to-typescript`](https://github.com/bcherny/json-schema-to-typescript)
   and writes `src/generated/index.ts`.
