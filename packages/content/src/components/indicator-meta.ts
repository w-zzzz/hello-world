// CLIENT-SIDE indicator metadata for M2.
// Source of truth is python/qa_indicators; this file mirrors it for UI rendering.
// Keep in sync until M7 introduces a build-time import from the API.

export type ParamKind = 'int' | 'float' | 'enum'

export interface ClientParamSpec {
  kind: ParamKind
  default: number | string
  min?: number
  max?: number
  step?: number
  options?: string[]
}

export interface ClientIndicatorOutput {
  name: string
  kind: 'overlay' | 'panel'
}

export interface ClientIndicatorMeta {
  id: string
  nameZh: string
  nameEn: string
  category: 'overlay' | 'oscillator' | 'trend' | 'volatility' | 'volume'
  formulaTeX: string
  params: Record<string, ClientParamSpec>
  outputs: ClientIndicatorOutput[]
}

const SOURCE_PARAM: ClientParamSpec = {
  kind: 'enum',
  default: 'close',
  options: ['open', 'high', 'low', 'close'],
}

export const INDICATOR_META: Record<string, ClientIndicatorMeta> = {
  sma: {
    id: 'sma',
    nameZh: '简单移动平均线',
    nameEn: 'Simple Moving Average',
    category: 'overlay',
    formulaTeX: String.raw`\mathrm{SMA}_t = \frac{1}{n}\sum_{i=0}^{n-1} P_{t-i}`,
    params: {
      period: { kind: 'int', default: 20, min: 2, max: 400, step: 1 },
      source: SOURCE_PARAM,
    },
    outputs: [{ name: 'sma', kind: 'overlay' }],
  },
  ema: {
    id: 'ema',
    nameZh: '指数移动平均线',
    nameEn: 'Exponential Moving Average',
    category: 'overlay',
    formulaTeX: String.raw`\mathrm{EMA}_t = \alpha P_t + (1-\alpha)\,\mathrm{EMA}_{t-1},\quad \alpha = \frac{2}{n+1}`,
    params: {
      period: { kind: 'int', default: 20, min: 2, max: 400, step: 1 },
      source: SOURCE_PARAM,
    },
    outputs: [{ name: 'ema', kind: 'overlay' }],
  },
  rsi: {
    id: 'rsi',
    nameZh: '相对强弱指数',
    nameEn: 'Relative Strength Index',
    category: 'oscillator',
    formulaTeX: String.raw`\mathrm{RSI}_t = 100 - \frac{100}{1 + \mathrm{RS}_t}`,
    params: {
      period: { kind: 'int', default: 14, min: 2, max: 200, step: 1 },
      source: SOURCE_PARAM,
    },
    outputs: [{ name: 'rsi', kind: 'panel' }],
  },
  macd: {
    id: 'macd',
    nameZh: 'MACD',
    nameEn: 'MACD',
    category: 'oscillator',
    formulaTeX: String.raw`\mathrm{MACD}_t = \mathrm{EMA}_{fast}(P_t) - \mathrm{EMA}_{slow}(P_t)`,
    params: {
      fast: { kind: 'int', default: 12, min: 2, max: 100, step: 1 },
      slow: { kind: 'int', default: 26, min: 5, max: 200, step: 1 },
      signal: { kind: 'int', default: 9, min: 2, max: 50, step: 1 },
      source: SOURCE_PARAM,
    },
    outputs: [
      { name: 'macd', kind: 'panel' },
      { name: 'signal', kind: 'panel' },
      { name: 'histogram', kind: 'panel' },
    ],
  },
  bollinger: {
    id: 'bollinger',
    nameZh: '布林带',
    nameEn: 'Bollinger Bands',
    category: 'volatility',
    formulaTeX: String.raw`\mathrm{Upper}_t = \mathrm{SMA}_n + k\sigma_n,\quad \mathrm{Lower}_t = \mathrm{SMA}_n - k\sigma_n`,
    params: {
      period: { kind: 'int', default: 20, min: 2, max: 400, step: 1 },
      stddev: { kind: 'float', default: 2.0, min: 0.5, max: 5.0, step: 0.1 },
      source: SOURCE_PARAM,
    },
    outputs: [
      { name: 'middle', kind: 'overlay' },
      { name: 'upper', kind: 'overlay' },
      { name: 'lower', kind: 'overlay' },
    ],
  },
}
