import { sql } from 'drizzle-orm'
import { date, integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const streaks = pgTable('streaks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  current: integer('current').notNull().default(0),
  longest: integer('longest').notNull().default(0),
  lastActiveDate: date('last_active_date').notNull().default(sql`CURRENT_DATE`),
})

export type Streak = typeof streaks.$inferSelect
export type NewStreak = typeof streaks.$inferInsert
