export interface Bar {
  t: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Source = 'open' | 'high' | 'low' | 'close'

export interface IndicatorInput {
  bars: Bar[]
  params: Record<string, string | number>
}

export type IndicatorOutput = Record<string, (number | null)[]>

export type ComputeFn = (input: IndicatorInput) => IndicatorOutput
