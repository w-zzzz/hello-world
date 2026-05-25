import type { IndicatorInput, IndicatorOutput, Source } from './types'
import { coerceIntParam, coerceSourceParam, pickSource } from './util'

/**
 * Wilder's RSI.
 *
 * - First `period` output values are null.
 * - At index `period`: avg_gain / avg_loss are simple means of the first
 *   `period` up/down moves (which span indices 1..period).
 * - Subsequent indices use Wilder smoothing: `avg = ((period-1)*prev + curr) / period`,
 *   equivalent to EMA with `alpha = 1 / period`.
 * - When avg_loss == 0 → rsi = 100; otherwise rsi = 100 - 100/(1 + rs).
 */
export function compute(input: IndicatorInput): IndicatorOutput {
  const period = coerceIntParam(input.params, 'period', 14)
  if (period < 2) throw new Error('period must be >= 2')
  const source: Source = coerceSourceParam(input.params, 'source', 'close')
  const series = pickSource(input.bars, source)
  const n = series.length
  const rsi = new Array<number | null>(n)
  for (let i = 0; i < n; i++) rsi[i] = null

  if (n <= period) return { rsi }

  let gainSum = 0
  let lossSum = 0
  for (let i = 1; i <= period; i++) {
    const curr = series[i]
    const prev = series[i - 1]
    if (curr === undefined || prev === undefined) {
      throw new Error(`series index ${i} out of range`)
    }
    const diff = curr - prev
    if (diff > 0) gainSum += diff
    else lossSum += -diff
  }
  let avgGain = gainSum / period
  let avgLoss = lossSum / period
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < n; i++) {
    const curr = series[i]
    const prev = series[i - 1]
    if (curr === undefined || prev === undefined) {
      throw new Error(`series index ${i} out of range`)
    }
    const diff = curr - prev
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }

  return { rsi }
}
