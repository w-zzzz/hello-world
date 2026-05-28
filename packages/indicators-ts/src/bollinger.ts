import type { IndicatorInput, IndicatorOutput, Source } from './types'
import { coerceIntParam, coerceNumberParam, coerceSourceParam, pickSource } from './util'

/**
 * Bollinger Bands.
 *
 * - `middle` = SMA(period) of the source series.
 * - For every index where `middle` is defined, σ is the population (ddof=0)
 *   standard deviation of the same window. `upper = middle + stddev · σ`,
 *   `lower = middle - stddev · σ`.
 * - Population stddev is what pandas' `Series.rolling(window).std(ddof=0)`
 *   returns and matches numpy's default for ddof=0.
 * - The width-multiplier param is named `stddev` to match the Python
 *   canonical (`qa_indicators.bollinger.compute(..., stddev=2.0)`) and the
 *   golden parity JSON. The legacy name `k` is not honored.
 */
export function compute(input: IndicatorInput): IndicatorOutput {
  const period = coerceIntParam(input.params, 'period', 20)
  if (period < 2) throw new Error('period must be >= 2')
  const stddev = coerceNumberParam(input.params, 'stddev', 2)
  const source: Source = coerceSourceParam(input.params, 'source', 'close')
  const series = pickSource(input.bars, source)
  const n = series.length

  const middle = new Array<number | null>(n)
  const upper = new Array<number | null>(n)
  const lower = new Array<number | null>(n)
  for (let i = 0; i < n; i++) {
    middle[i] = null
    upper[i] = null
    lower[i] = null
  }
  if (n < period) return { middle, upper, lower }

  // Initial window sum + sum of squares.
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < period; i++) {
    const v = series[i]
    if (v === undefined) throw new Error(`series[${i}] undefined`)
    sum += v
    sumSq += v * v
  }
  const seedMean = sum / period
  // Population variance: E[x^2] - (E[x])^2, clamp tiny negative drift to 0.
  const seedVar = Math.max(0, sumSq / period - seedMean * seedMean)
  const seedSigma = Math.sqrt(seedVar)
  middle[period - 1] = seedMean
  upper[period - 1] = seedMean + stddev * seedSigma
  lower[period - 1] = seedMean - stddev * seedSigma

  for (let i = period; i < n; i++) {
    const incoming = series[i]
    const outgoing = series[i - period]
    if (incoming === undefined || outgoing === undefined) {
      throw new Error(`series index ${i} out of range`)
    }
    sum += incoming - outgoing
    sumSq += incoming * incoming - outgoing * outgoing
    const mean = sum / period
    const variance = Math.max(0, sumSq / period - mean * mean)
    const sigma = Math.sqrt(variance)
    middle[i] = mean
    upper[i] = mean + stddev * sigma
    lower[i] = mean - stddev * sigma
  }

  return { middle, upper, lower }
}
