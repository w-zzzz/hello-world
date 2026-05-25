export type { Bar, ComputeFn, IndicatorInput, IndicatorOutput, Source } from './types'

import { compute as bollinger } from './bollinger'
import { compute as ema } from './ema'
import { compute as macd } from './macd'
import { compute as rsi } from './rsi'
import { compute as sma } from './sma'
import type { ComputeFn } from './types'

export const INDICATORS: Record<string, ComputeFn> = {
  sma,
  ema,
  rsi,
  macd,
  bollinger,
}
