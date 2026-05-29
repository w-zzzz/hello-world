import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

/**
 * Canonical, system-defined achievement catalog. Rows are seeded by
 * migration 0004_gamification and treated as immutable from app code —
 * `slug` is the stable identifier the evaluator + UI key on.
 */
export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    nameEn: text('name_en').notNull(),
    nameZh: text('name_zh').notNull(),
    descriptionEn: text('description_en').notNull(),
    descriptionZh: text('description_zh').notNull(),
    icon: text('icon').notNull(),
    xpBonus: integer('xp_bonus').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex('achievements_slug_unique').on(t.slug),
  }),
)

export type Achievement = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert
