import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const tutorMessages = pgTable(
  'tutor_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id'),
    conversationId: uuid('conversation_id').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    cacheReadInputTokens: integer('cache_read_input_tokens'),
    cacheCreationInputTokens: integer('cache_creation_input_tokens'),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    convIdx: index('tutor_messages_conversation_created').on(t.conversationId, t.createdAt),
    roleCheck: check('tutor_messages_role_check', sql`${t.role} in ('user', 'assistant')`),
  }),
)

export type TutorMessage = typeof tutorMessages.$inferSelect
export type NewTutorMessage = typeof tutorMessages.$inferInsert
