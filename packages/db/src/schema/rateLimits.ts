import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const rateLimits = pgTable(
  'rate_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    hitAt: timestamp('hit_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userActionHitIdx: index('rate_limits_user_action_hit').on(t.userId, t.action, t.hitAt.desc()),
  }),
)

export type RateLimitHit = typeof rateLimits.$inferSelect
export type NewRateLimitHit = typeof rateLimits.$inferInsert
