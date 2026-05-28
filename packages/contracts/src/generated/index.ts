// biome-ignore-all lint: generated file — see scripts/generate-contracts.ts
// biome-ignore-all format: generated file
/**
 * AUTO-GENERATED from python/qa_core/qa_core/schemas.py.
 * Do not edit by hand. To regenerate run:
 *   pnpm --filter @quant-academy/contracts run build:contracts
 */

export type Kind = 'plotly_json' | 'tearsheet_pdf' | 'csv'
export type Url = string
export type Artifacts = Artifact[]
export type ConfigHash = string
export type Depth = number
export type Recovery = string | null
export type Start = string
export type Trough = string
export type DrawdownPeriods = DrawdownPeriod[]
export type Cash = number
export type Equity = number
export type PositionValue = number
export type T = string
export type EquityCurve = EquityPoint[]
export type Calmar = number
export type Expectancy = number
export type Exposure = number
export type MaxDrawdown = number
export type ProfitFactor = number
export type Sharpe = number
export type Sortino = number
export type TradeCount = number
export type Turnover = number
export type WinRate = number
export type End = string
export type Start1 = string
export type Drawdown = number[]
export type Sharpe1 = number[]
export type Volatility = number[]
export type Window = number
export type RunId = string
export type BarsHeld = number
export type Entry = number
export type EntryT = string
export type Exit = number
export type ExitT = string
export type Mae = number
export type Mfe = number
export type Pnl = number
export type Qty = number
export type Side = 'long' | 'short'
export type Trades = Trade[]
export type Universe = string[]
export type Code = string
export type Message = string
export type Warnings = BacktestWarning[]
export type Close = number
export type High = number
export type Low = number
export type Open = number
export type T1 = string
export type Volume = number
export type Bars = Bar[]
export type Interval = '1m' | '5m' | '15m' | '1h' | '1d' | '1w'
export type Symbol = string
export type Bars1 = Bar[]
export type Indicator = string
export type Category = 'overlay' | 'oscillator' | 'trend' | 'volatility' | 'volume'
export type FormulaTex = string
export type Id = string
export type NameEn = string
export type NameZh = string
export type Kind1 = 'overlay' | 'panel'
export type Name = string
export type Range = [unknown, unknown] | null
export type Outputs1 = IndicatorOutput[]
export type Default = number | string
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "ParamKind".
 */
export type ParamKind = 'int' | 'float' | 'enum'
export type Max = number | null
export type Min = number | null
export type Options = string[] | null
export type Step = number | null
export type PitfallsKeys = string[]
export type Cite = string
export type Type = 'paper' | 'book' | 'url'
export type References = IndicatorReference[]
export type UseCasesKeys = string[]

export interface QuantAcademyContracts {
  Artifact?: Artifact
  BacktestResult?: BacktestResult
  BacktestWarning?: BacktestWarning
  Bar?: Bar
  BarsResponse?: BarsResponse
  ComputeIndicatorRequest?: ComputeIndicatorRequest
  ComputeIndicatorResponse?: ComputeIndicatorResponse
  DateRange?: DateRange
  DrawdownPeriod?: DrawdownPeriod
  EquityPoint?: EquityPoint
  IndicatorMeta?: IndicatorMeta
  IndicatorOutput?: IndicatorOutput
  IndicatorReference?: IndicatorReference
  Metrics?: Metrics
  ParamKind?: ParamKind
  ParamSpec?: ParamSpec
  RollingStats?: RollingStats
  Trade?: Trade
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "Artifact".
 */
export interface Artifact {
  kind: Kind
  url: Url
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "BacktestResult".
 */
export interface BacktestResult {
  artifacts?: Artifacts
  benchmark?: BacktestResult | null
  config_hash: ConfigHash
  drawdown_periods: DrawdownPeriods
  equity_curve: EquityCurve
  metrics: Metrics
  period: DateRange
  rolling?: RollingStats | null
  run_id?: RunId
  trades: Trades
  universe: Universe
  warnings?: Warnings
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "DrawdownPeriod".
 */
export interface DrawdownPeriod {
  depth: Depth
  recovery: Recovery
  start: Start
  trough: Trough
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "EquityPoint".
 */
export interface EquityPoint {
  cash: Cash
  equity: Equity
  position_value: PositionValue
  t: T
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "Metrics".
 */
export interface Metrics {
  calmar: Calmar
  expectancy: Expectancy
  exposure: Exposure
  max_drawdown: MaxDrawdown
  profit_factor: ProfitFactor
  sharpe: Sharpe
  sortino: Sortino
  trade_count: TradeCount
  turnover: Turnover
  win_rate: WinRate
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "DateRange".
 */
export interface DateRange {
  end: End
  start: Start1
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "RollingStats".
 */
export interface RollingStats {
  drawdown: Drawdown
  sharpe: Sharpe1
  volatility: Volatility
  window: Window
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "Trade".
 */
export interface Trade {
  bars_held: BarsHeld
  entry: Entry
  entry_t: EntryT
  exit: Exit
  exit_t: ExitT
  mae: Mae
  mfe: Mfe
  pnl: Pnl
  qty: Qty
  side: Side
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "BacktestWarning".
 */
export interface BacktestWarning {
  code: Code
  message: Message
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "Bar".
 */
export interface Bar {
  close: Close
  high: High
  low: Low
  open: Open
  t: T1
  volume: Volume
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "BarsResponse".
 */
export interface BarsResponse {
  bars: Bars
  interval: Interval
  symbol: Symbol
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "ComputeIndicatorRequest".
 */
export interface ComputeIndicatorRequest {
  bars: Bars1
  params: Params
}
export interface Params {
  [k: string]: string | number
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "ComputeIndicatorResponse".
 */
export interface ComputeIndicatorResponse {
  indicator: Indicator
  outputs: Outputs
  params: Params1
}
export interface Outputs {
  [k: string]: (number | null)[]
}
export interface Params1 {
  [k: string]: string | number
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "IndicatorMeta".
 */
export interface IndicatorMeta {
  category: Category
  formula_tex: FormulaTex
  id: Id
  name_en: NameEn
  name_zh: NameZh
  outputs: Outputs1
  params: Params2
  pitfalls_keys?: PitfallsKeys
  references?: References
  use_cases_keys?: UseCasesKeys
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "IndicatorOutput".
 */
export interface IndicatorOutput {
  kind: Kind1
  name: Name
  range?: Range
}
export interface Params2 {
  [k: string]: ParamSpec
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "ParamSpec".
 */
export interface ParamSpec {
  default: Default
  kind: ParamKind
  max?: Max
  min?: Min
  options?: Options
  step?: Step
}
/**
 * This interface was referenced by `QuantAcademyContracts`'s JSON-Schema
 * via the `definition` "IndicatorReference".
 */
export interface IndicatorReference {
  cite: Cite
  type: Type
}
