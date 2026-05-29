import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { achievements } from './achievements'
import { users } from './users'

/**
 * Join table: which user has unlocked which achievement, and when.
 *
 * Primary key (user_id, achievement_id) gives free idempotency — the
 * server action uses `ON CONFLICT DO NOTHING` so re-evaluation never
 * double-awards.
 */
export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  }),
)

export type UserAchievement = typeof userAchievements.$inferSelect
export type NewUserAchievement = typeof userAchievements.$inferInsert
