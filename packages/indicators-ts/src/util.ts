import type { Bar, Source } from './types'

const VALID_SOURCES: ReadonlySet<Source> = new Set<Source>(['open', 'high', 'low', 'close'])

/** Type guard for `Source`. */
export function isSource(value: string): value is Source {
  return VALID_SOURCES.has(value as Source)
}

/** Coerce a param value into a positive integer or throw. */
export function coerceIntParam(
  params: Record<string, string | number>,
  key: string,
  fallback: number,
): number {
  const raw = params[key]
  if (raw === undefined) return fallback
  const n = typeof raw === 'number' ? raw : Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new Error(`param "${key}" must be a positive integer, got ${String(raw)}`)
  }
  return n
}

/** Coerce a param value into a finite number or throw. */
export function coerceNumberParam(
  params: Record<string, string | number>,
  key: string,
  fallback: number,
): number {
  const raw = params[key]
  if (raw === undefined) return fallback
  const n = typeof raw === 'number' ? raw : Number.parseFloat(raw)
  if (!Number.isFinite(n)) {
    throw new Error(`param "${key}" must be a finite number, got ${String(raw)}`)
  }
  return n
}

/** Coerce a param value into a known `Source` or throw. */
export function coerceSourceParam(
  params: Record<string, string | number>,
  key: string,
  fallback: Source,
): Source {
  const raw = params[key]
  if (raw === undefined) return fallback
  const s = typeof raw === 'string' ? raw : String(raw)
  if (!isSource(s)) {
    throw new Error(`param "${key}" must be one of open|high|low|close, got ${s}`)
  }
  return s
}

/** Extract a price series from `bars` using the given OHLC field. */
export function pickSource(bars: ReadonlyArray<Bar>, source: Source): number[] {
  const out = new Array<number>(bars.length)
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    if (bar === undefined) {
      throw new Error(`bars[${i}] is undefined`)
    }
    out[i] = bar[source]
  }
  return out
}

/**
 * Wrap a number[] as (number|null)[] of the same length with the first
 * `leadingNulls` entries replaced by null. Useful to align rolling output.
 */
export function withNulls(values: ReadonlyArray<number>, leadingNulls: number): (number | null)[] {
  const out = new Array<number | null>(values.length)
  for (let i = 0; i < values.length; i++) {
    if (i < leadingNulls) {
      out[i] = null
    } else {
      const v = values[i]
      out[i] = v === undefined ? null : v
    }
  }
  return out
}

/** Strict finite-number check (rejects NaN, Infinity, null, undefined, strings). */
export function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x)
}
