import { jsonb, pgTable, uuid } from 'drizzle-orm/pg-core'
import { backtestRuns } from './backtestRuns'

export const backtestResults = pgTable('backtest_results', {
  runId: uuid('run_id')
    .primaryKey()
    .references(() => backtestRuns.id, { onDelete: 'cascade' }),
  metrics: jsonb('metrics').$type<Record<string, number>>().notNull(),
  equity: jsonb('equity').$type<Array<{ t: string; equity: number }>>().notNull(),
  trades: jsonb('trades').$type<unknown[]>().notNull(),
  drawdownPeriods: jsonb('drawdown_periods').$type<unknown[]>().notNull().default([]),
  rolling: jsonb('rolling').$type<Record<string, unknown> | null>(),
  benchmarkMetrics: jsonb('benchmark_metrics').$type<Record<string, number> | null>(),
  warnings: jsonb('warnings').$type<unknown[]>().notNull().default([]),
})

export type BacktestResult = typeof backtestResults.$inferSelect
export type NewBacktestResult = typeof backtestResults.$inferInsert
