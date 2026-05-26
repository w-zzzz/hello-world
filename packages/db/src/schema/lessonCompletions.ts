import { integer, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const lessonCompletions = pgTable(
  'lesson_completions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
    score: numeric('score', { precision: 5, scale: 2 }),
    attempts: integer('attempts').notNull().default(1),
    timeSpentS: integer('time_spent_s').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.lessonId] }),
  }),
)

export type LessonCompletion = typeof lessonCompletions.$inferSelect
export type NewLessonCompletion = typeof lessonCompletions.$inferInsert
