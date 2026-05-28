#!/usr/bin/env tsx
/**
 * Re-runs the contracts generator and asserts no diff.
 *
 * Used in CI's `parity-check` job to catch python/qa_core schema changes
 * that haven't been propagated to `packages/contracts/src/generated/`.
 * H-ARCH-1 (ADR M0).
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')
const OUT_FILE = resolve(REPO_ROOT, 'packages/contracts/src/generated/index.ts')

const before = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf-8') : ''

execSync('pnpm --filter @quant-academy/contracts run build:contracts', {
  cwd: REPO_ROOT,
  stdio: 'inherit',
})

const after = readFileSync(OUT_FILE, 'utf-8')

if (before !== after) {
  console.error('FAIL: contracts are stale.')
  console.error(
    'Run `pnpm --filter @quant-academy/contracts run build:contracts` and commit the result.',
  )
  process.exit(1)
}

console.log('OK: contracts in sync with python/qa_core schemas.')
