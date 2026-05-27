/**
 * JSON shapes returned by the FastAPI backtest service. Co-located alongside
 * the server actions but kept in a non-`'use server'` module so they can be
 * imported from client components without violating server-actions export
 * rules.
 */

export interface BacktestEquityPoint {
  t: string
  equity: number
  cash: number
  position_value: number
}

export interface BacktestTrade {
  entry_t: string
  exit_t: string
  side: 'long' | 'short'
  qty: number
  entry: number
  exit: number
  pnl: number
  mae: number
  mfe: number
  bars_held: number
}

export interface BacktestDrawdownPeriod {
  start: string
  trough: string
  recovery: string | null
  depth: number
}

export interface BacktestWarning {
  code: string
  message: string
}

export interface BacktestResultJson {
  run_id: string
  universe: string[]
  period: { start: string; end: string }
  equity_curve: BacktestEquityPoint[]
  trades: BacktestTrade[]
  metrics: Record<string, number>
  drawdown_periods: BacktestDrawdownPeriod[]
  benchmark: BacktestResultJson | null
  rolling: unknown | null
  artifacts: unknown[]
  warnings: BacktestWarning[]
}
