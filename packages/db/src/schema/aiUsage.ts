import { date, integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const aiUsage = pgTable(
  'ai_usage',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    sonnetIn: integer('sonnet_in').notNull().default(0),
    sonnetOut: integer('sonnet_out').notNull().default(0),
    opusIn: integer('opus_in').notNull().default(0),
    opusOut: integer('opus_out').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.day] }),
  }),
)

export type AiUsage = typeof aiUsage.$inferSelect
export type NewAiUsage = typeof aiUsage.$inferInsert
