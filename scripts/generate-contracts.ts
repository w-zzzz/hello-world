#!/usr/bin/env tsx
/**
 * Generate TypeScript contracts from python/qa_core/qa_core/schemas.py.
 *
 * Pipeline:
 *   1. Invoke `uv run python scripts/export-schemas.py` which prints a
 *      combined JSON Schema (one definition per model under `$defs`) to
 *      stdout.
 *   2. Pipe that through `json-schema-to-typescript`.
 *   3. Write to `packages/contracts/src/generated/index.ts`.
 *
 * H-ARCH-1 (ADR M0): keeps TS types in lockstep with the canonical
 * Pydantic wire models so they cannot silently drift.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'json-schema-to-typescript'

const SCRIPT_DIR =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')
const OUT_DIR = resolve(REPO_ROOT, 'packages/contracts/src/generated')
const OUT_FILE = resolve(OUT_DIR, 'index.ts')

const BIOME_DISABLE_BANNER = `// biome-ignore-all lint: generated file — see scripts/generate-contracts.ts
// biome-ignore-all format: generated file
`

const JSDOC_BANNER = `/**
 * AUTO-GENERATED from python/qa_core/qa_core/schemas.py.
 * Do not edit by hand. To regenerate run:
 *   pnpm --filter @quant-academy/contracts run build:contracts
 */`

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const schemaJson = execFileSync('uv', ['run', 'python', 'scripts/export-schemas.py'], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
  })

  const schema = JSON.parse(schemaJson) as Record<string, unknown>

  const compiled = await compile(schema as Parameters<typeof compile>[0], 'QuantAcademyContracts', {
    bannerComment: JSDOC_BANNER,
    style: { singleQuote: true, semi: false, printWidth: 100 },
    additionalProperties: false,
    unreachableDefinitions: true,
  })

  writeFileSync(OUT_FILE, `${BIOME_DISABLE_BANNER}${compiled}`, 'utf-8')
  console.log(`Wrote ${OUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
