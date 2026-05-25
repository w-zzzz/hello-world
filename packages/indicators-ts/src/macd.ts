import { emaSeries } from './ema'
import type { IndicatorInput, IndicatorOutput, Source } from './types'
import { coerceIntParam, coerceSourceParam, isFiniteNumber, pickSource } from './util'

/**
 * MACD with the conventional 12/26/9 default lengths.
 *
 * - `macd` = EMA(fast) - EMA(slow), null wherever either EMA is null.
 * - `signal` = EMA(macd, signalPeriod), seeded by SMA of the first
 *   `signalPeriod` defined macd values. Null until enough macd values exist.
 * - `histogram` = macd - signal, null wherever either is null.
 */
export function compute(input: IndicatorInput): IndicatorOutput {
  const fast = coerceIntParam(input.params, 'fast', 12)
  const slow = coerceIntParam(input.params, 'slow', 26)
  const signalPeriod = coerceIntParam(input.params, 'signal', 9)
  if (fast < 2 || slow < 2 || signalPeriod < 2) {
    throw new Error('fast/slow/signal periods must be >= 2')
  }
  if (fast >= slow) {
    throw new Error('fast period must be < slow period')
  }
  const source: Source = coerceSourceParam(input.params, 'source', 'close')
  const series = pickSource(input.bars, source)
  const n = series.length

  const emaFast = emaSeries(series, fast)
  const emaSlow = emaSeries(series, slow)

  const macd = new Array<number | null>(n)
  for (let i = 0; i < n; i++) {
    const a = emaFast[i]
    const b = emaSlow[i]
    macd[i] = isFiniteNumber(a) && isFiniteNumber(b) ? a - b : null
  }

  // Signal = EMA of macd, but macd has a leading run of nulls. Seed the EMA
  // at the first index where we have `signalPeriod` consecutive defined macd
  // values, then iterate forward.
  const signal = new Array<number | null>(n)
  for (let i = 0; i < n; i++) signal[i] = null

  // Find first defined macd index.
  let firstDef = -1
  for (let i = 0; i < n; i++) {
    if (macd[i] !== null) {
      firstDef = i
      break
    }
  }
  if (firstDef >= 0 && firstDef + signalPeriod - 1 < n) {
    let seedSum = 0
    for (let i = firstDef; i < firstDef + signalPeriod; i++) {
      const v = macd[i]
      if (!isFiniteNumber(v)) {
        // No contiguous run yet; bail out of signal computation safely.
        return { macd, signal, histogram: signal.slice() }
      }
      seedSum += v
    }
    const seed = seedSum / signalPeriod
    const seedIdx = firstDef + signalPeriod - 1
    signal[seedIdx] = seed

    const alpha = 2 / (signalPeriod + 1)
    let prev = seed
    for (let i = seedIdx + 1; i < n; i++) {
      const v = macd[i]
      if (!isFiniteNumber(v)) {
        signal[i] = null
        continue
      }
      const curr = alpha * v + (1 - alpha) * prev
      signal[i] = curr
      prev = curr
    }
  }

  const histogram = new Array<number | null>(n)
  for (let i = 0; i < n; i++) {
    const m = macd[i]
    const s = signal[i]
    histogram[i] = isFiniteNumber(m) && isFiniteNumber(s) ? m - s : null
  }

  return { macd, signal, histogram }
}
