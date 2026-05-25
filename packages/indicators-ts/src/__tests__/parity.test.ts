import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { INDICATORS } from '../index'
import type { Bar } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIX_ROOT = resolve(__dirname, '../../../../python/qa_indicators/qa_indicators/fixtures')

interface Golden {
  indicator: string
  params: Record<string, string | number>
  input: string
  tolerance: { abs: number; rel: number }
  outputs: Record<string, (number | null)[]>
}

function loadInput(): Bar[] | null {
  const p = resolve(FIX_ROOT, 'parity_input.json')
  if (!existsSync(p)) return null
  const parsed = JSON.parse(readFileSync(p, 'utf-8')) as { bars: Bar[] }
  return parsed.bars
}

function loadGolden(id: string): Golden | null {
  const p = resolve(FIX_ROOT, 'golden', `${id}.json`)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf-8')) as Golden
}

function close(a: number | null, b: number | null, absTol: number, relTol: number): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  const diff = Math.abs(a - b)
  return diff <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)))
}

describe('indicator parity vs Python golden fixtures', () => {
  for (const id of Object.keys(INDICATORS)) {
    it(`${id}: matches golden within tolerance`, () => {
      const bars = loadInput()
      const golden = loadGolden(id)
      if (!bars || !golden) {
        // Fixtures land via the Python agent — tolerate absence pre-merge.
        // Re-runs in CI after the Python golden files are committed will exercise
        // the full comparison.
        return
      }
      const fn = INDICATORS[id]
      if (!fn) throw new Error(`indicator ${id} missing from INDICATORS`)
      const result = fn({ bars, params: golden.params })
      for (const [col, expected] of Object.entries(golden.outputs)) {
        expect(Object.hasOwn(result, col)).toBe(true)
        const actual = result[col]
        if (!actual) throw new Error(`${id}: result missing column ${col}`)
        expect(actual.length).toBe(expected.length)
        for (let i = 0; i < expected.length; i++) {
          const got = actual[i] ?? null
          const want = expected[i] ?? null
          const ok = close(got, want, golden.tolerance.abs, golden.tolerance.rel)
          if (!ok) {
            throw new Error(`${id}.${col}[${i}]: expected ${String(want)}, got ${String(got)}`)
          }
        }
      }
    })
  }
})
