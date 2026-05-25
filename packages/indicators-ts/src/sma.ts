import type { IndicatorInput, IndicatorOutput } from './types'
import { coerceIntParam, coerceSourceParam, pickSource } from './util'

/**
 * Simple Moving Average. Mirrors Python `qa_indicators.sma.compute` exactly:
 * rolling mean over `period` bars on the selected source column.
 *
 * Output length equals input length; first `period - 1` entries are `null`
 * to match pandas' `min_periods=period` behaviour.
 */
export function compute(input: IndicatorInput): IndicatorOutput {
  const period = coerceIntParam(input.params, 'period', 20)
  if (period < 2) throw new Error('period must be >= 2')
  const source = coerceSourceParam(input.params, 'source', 'close')
  const series = pickSource(input.bars, source)
  const n = series.length
  const out = new Array<number | null>(n)

  if (n < period) {
    for (let i = 0; i < n; i++) out[i] = null
    return { sma: out }
  }

  // Seed the rolling window sum.
  let windowSum = 0
  for (let i = 0; i < period; i++) {
    const v = series[i]
    if (v === undefined) throw new Error(`series[${i}] undefined`)
    windowSum += v
    out[i] = null
  }
  out[period - 1] = windowSum / period

  for (let i = period; i < n; i++) {
    const incoming = series[i]
    const outgoing = series[i - period]
    if (incoming === undefined || outgoing === undefined) {
      throw new Error(`series index ${i} out of range`)
    }
    windowSum += incoming - outgoing
    out[i] = windowSum / period
  }

  return { sma: out }
}
