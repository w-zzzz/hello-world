/**
 * Canonical, system-defined achievement catalog.
 *
 * This list is the source of truth on the application side: it MUST mirror
 * the seed INSERTs in `packages/db/migrations/0004_gamification.sql`. The
 * evaluator (`./evaluator.ts`) uses `slug` to identify which achievements
 * a user just unlocked; the migration assigns the canonical UUID/row, and
 * the server action joins them back to insert into `user_achievements`.
 *
 * The shape mirrors the `achievements` Drizzle table 1:1 (minus the
 * server-assigned `id` and `createdAt`).
 */
export interface AchievementMeta {
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  /** A Lucide icon name; the UI looks this up in the icon registry. */
  icon: string
  /** Bonus XP awarded the moment this achievement unlocks. */
  xpBonus: number
  /** Criteria kind — drives how the evaluator decides "is unlocked". */
  criteria:
    | { kind: 'lessons_completed'; count: number }
    | { kind: 'track_complete'; trackId: 'A' | 'B' | 'C' }
    | { kind: 'streak_current'; days: number }
}

export const ACHIEVEMENTS: readonly AchievementMeta[] = [
  {
    slug: 'first-lesson',
    nameEn: 'First Steps',
    nameZh: '迈出第一步',
    descriptionEn: 'Complete your first lesson.',
    descriptionZh: '完成你的第一节课。',
    icon: 'sparkles',
    xpBonus: 25,
    criteria: { kind: 'lessons_completed', count: 1 },
  },
  {
    slug: 'five-lessons',
    nameEn: 'Getting Started',
    nameZh: '渐入佳境',
    descriptionEn: 'Complete 5 distinct lessons.',
    descriptionZh: '完成 5 节不同的课程。',
    icon: 'award',
    xpBonus: 50,
    criteria: { kind: 'lessons_completed', count: 5 },
  },
  {
    slug: 'ten-lessons',
    nameEn: 'In the Groove',
    nameZh: '登堂入室',
    descriptionEn: 'Complete 10 distinct lessons.',
    descriptionZh: '完成 10 节不同的课程。',
    icon: 'award',
    xpBonus: 75,
    criteria: { kind: 'lessons_completed', count: 10 },
  },
  {
    slug: 'track-a-complete',
    nameEn: 'Market Fundamentals',
    nameZh: '市场基础大师',
    descriptionEn: 'Complete every lesson in Track A.',
    descriptionZh: '完成 A 轨道所有课程。',
    icon: 'trophy',
    xpBonus: 200,
    criteria: { kind: 'track_complete', trackId: 'A' },
  },
  {
    slug: 'track-b-complete',
    nameEn: 'Indicator Master',
    nameZh: '指标大师',
    descriptionEn: 'Complete every lesson in Track B.',
    descriptionZh: '完成 B 轨道所有课程。',
    icon: 'trophy',
    xpBonus: 500,
    criteria: { kind: 'track_complete', trackId: 'B' },
  },
  {
    slug: 'track-c-complete',
    nameEn: 'Signal Architect',
    nameZh: '信号构造师',
    descriptionEn: 'Complete every lesson in Track C.',
    descriptionZh: '完成 C 轨道所有课程。',
    icon: 'trophy',
    xpBonus: 200,
    criteria: { kind: 'track_complete', trackId: 'C' },
  },
  {
    slug: 'streak-7',
    nameEn: 'One Week Streak',
    nameZh: '七日连击',
    descriptionEn: 'Maintain a 7-day learning streak.',
    descriptionZh: '保持 7 天连续学习。',
    icon: 'flame',
    xpBonus: 100,
    criteria: { kind: 'streak_current', days: 7 },
  },
  {
    slug: 'streak-30',
    nameEn: 'One Month Streak',
    nameZh: '月度连击',
    descriptionEn: 'Maintain a 30-day learning streak.',
    descriptionZh: '保持 30 天连续学习。',
    icon: 'flame',
    xpBonus: 500,
    criteria: { kind: 'streak_current', days: 30 },
  },
  // -------------------------------------------------------------------------
  // TODO(M8.1): the canonical M8 set also calls for two quiz-perfection
  // achievements. Deferred because the M3 schema only records an aggregate
  // 0-100 `score` per lesson_completion, not a structured
  // (correct_quizzes, quiz_count_total) pair. Adding that pair is a schema
  // change with its own follow-up migration; we ship 8/10 here per the M8
  // prompt and revisit when the quiz data model gains per-question fidelity.
  //
  //  - 'first-quiz-perfect': first time `completed_quiz_count == quiz_count_total
  //                          && correct_quizzes == quiz_count_total` on a lesson
  //                          → xpBonus 50, icon 'medal'
  //  - 'ten-perfect-quizzes': cumulative 10 such lessons
  //                          → xpBonus 200, icon 'medal'
  // -------------------------------------------------------------------------
] as const

export function getAchievementBySlug(slug: string): AchievementMeta | undefined {
  return ACHIEVEMENTS.find((a) => a.slug === slug)
}
