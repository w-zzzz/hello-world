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

/**
 * Mirrors :class:`qa_core.schemas.Metrics`. The four ratio fields
 * (``sharpe``/``sortino``/``calmar``/``profit_factor``) are
 * ``float | None`` on the Python side: ``null`` means the ratio is
 * undefined for this run (e.g. zero downside, zero losses) rather than
 * a literal zero. Renderers must distinguish ``null`` from ``0``.
 *
 * Used by the tearsheet for documentation + lookup-key typing. The wire
 * shape on :attr:`BacktestResultJson.metrics` is intentionally widened to
 * ``Record<string, number | null>`` so existing call sites that thread
 * the value through a ``Record<string, number>`` JSONB column continue
 * to typecheck until those surfaces are migrated.
 */
export interface Metrics {
  sharpe: number | null
  sortino: number | null
  calmar: number | null
  profit_factor: number | null
  max_drawdown: number
  win_rate: number
  expectancy: number
  turnover: number
  exposure: number
  trade_count: number
}

export interface BacktestResultJson {
  run_id: string
  universe: string[]
  period: { start: string; end: string }
  equity_curve: BacktestEquityPoint[]
  trades: BacktestTrade[]
  metrics: Record<string, number | null>
  drawdown_periods: BacktestDrawdownPeriod[]
  benchmark: BacktestResultJson | null
  rolling: unknown | null
  artifacts: unknown[]
  warnings: BacktestWarning[]
}
