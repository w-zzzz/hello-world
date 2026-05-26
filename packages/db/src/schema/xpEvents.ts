import { sql } from 'drizzle-orm'
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const XP_EVENT_KINDS = [
  'lesson_complete',
  'quiz_perfect',
  'streak_bonus',
  'daily_challenge',
  'achievement',
] as const

export type XpEventKind = (typeof XP_EVENT_KINDS)[number]

export const xpEventKind = pgEnum('xp_event_kind', XP_EVENT_KINDS)

export const xpEvents = pgTable(
  'xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: xpEventKind('kind').notNull(),
    amount: integer('amount').notNull(),
    refId: text('ref_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('xp_events_user_created').on(t.userId, sql`${t.createdAt} DESC`),
  }),
)

export type XpEvent = typeof xpEvents.$inferSelect
export type NewXpEvent = typeof xpEvents.$inferInsert
