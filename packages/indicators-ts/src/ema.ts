import type { IndicatorInput, IndicatorOutput, Source } from './types'
import { coerceIntParam, coerceSourceParam, pickSource } from './util'

/**
 * Compute the EMA of a raw number series with SMA seeding.
 *
 * Returns a (number|null)[] of the same length: the first `period - 1` entries
 * are null; index `period - 1` is the SMA of the first `period` values; each
 * subsequent index is `alpha * value + (1 - alpha) * prev` with
 * `alpha = 2 / (period + 1)`.
 *
 * Exported so MACD can reuse the same kernel without re-resolving params.
 */
export function emaSeries(series: ReadonlyArray<number>, period: number): (number | null)[] {
  if (period < 2) throw new Error('period must be >= 2')
  const n = series.length
  const out = new Array<number | null>(n)
  for (let i = 0; i < n; i++) out[i] = null
  if (n < period) return out

  let seed = 0
  for (let i = 0; i < period; i++) {
    const v = series[i]
    if (v === undefined) throw new Error(`series[${i}] undefined`)
    seed += v
  }
  seed /= period
  out[period - 1] = seed

  const alpha = 2 / (period + 1)
  let prev = seed
  for (let i = period; i < n; i++) {
    const v = series[i]
    if (v === undefined) throw new Error(`series[${i}] undefined`)
    const curr = alpha * v + (1 - alpha) * prev
    out[i] = curr
    prev = curr
  }
  return out
}

export function compute(input: IndicatorInput): IndicatorOutput {
  const period = coerceIntParam(input.params, 'period', 20)
  const source: Source = coerceSourceParam(input.params, 'source', 'close')
  const series = pickSource(input.bars, source)
  return { ema: emaSeries(series, period) }
}
