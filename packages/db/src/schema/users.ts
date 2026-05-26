import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id'),
    devSessionId: text('dev_session_id'),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    locale: text('locale').notNull().default('zh'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    prefs: jsonb('prefs').$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => ({
    handleUnique: uniqueIndex('users_handle_unique').on(t.handle),
    clerkUnique: uniqueIndex('users_clerk_id_unique').on(t.clerkId),
    devSessionUnique: uniqueIndex('users_dev_session_id_unique').on(t.devSessionId),
  }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
