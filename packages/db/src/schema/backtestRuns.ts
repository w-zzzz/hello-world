import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const backtestRuns = pgTable(
  'backtest_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    preset: text('preset'),
    configHash: text('config_hash').notNull(),
    status: text('status').notNull(),
    error: text('error'),
    queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => ({
    statusCheck: check(
      'backtest_runs_status_check',
      sql`${t.status} in ('queued', 'running', 'succeeded', 'failed')`,
    ),
    userQueuedIdx: index('backtest_runs_user_queued').on(t.userId, t.queuedAt.desc()),
    configHashSucceeded: uniqueIndex('backtest_runs_config_hash_succeeded')
      .on(t.configHash)
      .where(sql`${t.status} = 'succeeded'`),
  }),
)

export type BacktestRun = typeof backtestRuns.$inferSelect
export type NewBacktestRun = typeof backtestRuns.$inferInsert
