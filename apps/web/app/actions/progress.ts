'use server'

import { getLessonRecord, getLessonsByTrack } from '@quant-academy/content'
import { checkRateLimit } from '@quant-academy/db'
import {
  type AchievementMeta,
  computeXpAward,
  evaluateAchievements,
  initialStreak,
  levelForXp,
  nextStreakState,
  type StreakState,
  type TrackLessonIndex,
} from '@quant-academy/gamification'
import { and, count, desc, eq, inArray, sql, sum } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { achievements, db, lessonCompletions, streaks, userAchievements, xpEvents } from '@/lib/db'

/**
 * Build the (track → lesson-id list) index the achievement evaluator
 * needs. Cached at module load — the curriculum is static at build time.
 */
const TRACK_LESSON_INDEX: TrackLessonIndex = {
  A: getLessonsByTrack('A').map((r) => r.meta.id),
  B: getLessonsByTrack('B').map((r) => r.meta.id),
  C: getLessonsByTrack('C').map((r) => r.meta.id),
}

const VALID_KINDS = [
  'lesson_complete',
  'quiz_perfect',
  'streak_bonus',
  'daily_challenge',
  'achievement',
] as const
type XpKind = (typeof VALID_KINDS)[number]

const RATE_LIMIT_LESSON_COMPLETE = {
  action: 'markLessonComplete',
  max: 30,
  windowSeconds: 60,
} as const

export interface MarkLessonCompleteInput {
  lessonId: string
  /** 0..100 if a quiz was attached; omit if no quiz. */
  score?: number
  timeSpentS?: number
}

/**
 * Compact view of a newly unlocked achievement, surfaced to the UI so it
 * can render a toast. Shape is the M8 cross-agent contract — see the
 * milestone prompt; the M8-Frontend agent reads exactly these fields.
 */
export interface UnlockedAchievement {
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  /** Lucide icon name. */
  icon: string
}

export interface MarkLessonCompleteResult {
  xpAwarded: number
  xpTotal: number
  /** Alias of `xpTotal` — the M8 frontend contract uses this name. */
  totalXp: number
  newLevel: number
  /** Alias of `newLevel` — the M8 frontend contract uses this name. */
  level: number
  leveledUp: boolean
  /** Current streak length after this completion. */
  streakCurrent: number
  /** All-time longest streak. */
  streakLongest: number
  /** Achievements unlocked by this completion (idempotent across replays). */
  unlocked: UnlockedAchievement[]
  /** True when the lesson had already been XP-credited; xpAwarded will be 0. */
  alreadyCompleted?: boolean
}

export async function markLessonComplete(
  input: MarkLessonCompleteInput,
): Promise<
  MarkLessonCompleteResult | { error: 'unauthenticated' | 'unknown_lesson' | 'rate_limited' }
> {
  const user = await getCurrentUser()
  if (!user) return { error: 'unauthenticated' }

  const gate = await checkRateLimit(user.id, RATE_LIMIT_LESSON_COMPLETE)
  if (!gate.ok) return { error: 'rate_limited' }

  const record = getLessonRecord(input.lessonId)
  if (!record) return { error: 'unknown_lesson' }

  const lesson = record.meta
  const today = new Date().toISOString().slice(0, 10)

  return db.transaction(async (tx) => {
    // 1. Determine prior attempts (to compute first-try bonus).
    const priorRow = await tx
      .select({ attempts: lessonCompletions.attempts })
      .from(lessonCompletions)
      .where(
        and(eq(lessonCompletions.userId, user.id), eq(lessonCompletions.lessonId, input.lessonId)),
      )
      .limit(1)
    const priorAttempts = priorRow[0]?.attempts ?? 0
    const newAttempts = priorAttempts + 1

    // 2. Read current streak.
    const streakRow = await tx.select().from(streaks).where(eq(streaks.userId, user.id)).limit(1)
    const currentStreakState: StreakState = streakRow[0]
      ? {
          current: streakRow[0].current,
          longest: streakRow[0].longest,
          lastActiveDate:
            typeof streakRow[0].lastActiveDate === 'string'
              ? streakRow[0].lastActiveDate
              : new Date(streakRow[0].lastActiveDate as unknown as number)
                  .toISOString()
                  .slice(0, 10),
        }
      : initialStreak(today)

    // 3. Compute new streak based on today's activity.
    const nextStreak = streakRow[0]
      ? nextStreakState(currentStreakState, today)
      : initialStreak(today)

    // 4. Compute XP.
    const award = computeXpAward(
      input.score !== undefined
        ? {
            lesson: { xp: lesson.xp, difficulty: lesson.difficulty },
            quiz: { correct: Math.round(input.score), total: 100 },
            attempts: newAttempts,
            currentStreak: nextStreak.current,
          }
        : {
            lesson: { xp: lesson.xp, difficulty: lesson.difficulty },
            attempts: newAttempts,
            currentStreak: nextStreak.current,
          },
    )

    // 5. Upsert lesson_completions.
    if (priorRow[0]) {
      await tx
        .update(lessonCompletions)
        .set({
          attempts: newAttempts,
          score: input.score !== undefined ? String(input.score) : null,
          timeSpentS: input.timeSpentS ?? 0,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(lessonCompletions.userId, user.id),
            eq(lessonCompletions.lessonId, input.lessonId),
          ),
        )
    } else {
      await tx.insert(lessonCompletions).values({
        userId: user.id,
        lessonId: input.lessonId,
        attempts: 1,
        score: input.score !== undefined ? String(input.score) : null,
        timeSpentS: input.timeSpentS ?? 0,
      })
    }

    // 6. Record xp event — idempotent per (user_id, ref_id) via partial
    //    unique index xp_events_lesson_complete_unique (C-XP-1). Replays of
    //    the same lesson by the same user collide at the DB level and no
    //    new XP is awarded.
    const xpKind: XpKind = 'lesson_complete'
    const inserted = await tx
      .insert(xpEvents)
      .values({
        userId: user.id,
        kind: xpKind,
        amount: award.total,
        refId: input.lessonId,
      })
      .onConflictDoNothing({
        target: [xpEvents.userId, xpEvents.refId],
        where: sql`${xpEvents.kind} = 'lesson_complete'`,
      })
      .returning({ id: xpEvents.id })
    const xpWasAwarded = inserted.length > 0

    // 7. Upsert streak.
    if (streakRow[0]) {
      await tx
        .update(streaks)
        .set({
          current: nextStreak.current,
          longest: nextStreak.longest,
          lastActiveDate: nextStreak.lastActiveDate,
        })
        .where(eq(streaks.userId, user.id))
    } else {
      await tx.insert(streaks).values({
        userId: user.id,
        current: nextStreak.current,
        longest: nextStreak.longest,
        lastActiveDate: nextStreak.lastActiveDate,
      })
    }

    // 8. Evaluate achievements against the post-completion snapshot, then
    //    persist any new unlocks. Idempotent: the user_achievements PK
    //    (user_id, achievement_id) plus ON CONFLICT DO NOTHING guarantees
    //    replays don't double-award. We only insert achievement xp_events
    //    for slugs whose INSERT actually produced a row.
    const completedRows = await tx
      .select({ lessonId: lessonCompletions.lessonId })
      .from(lessonCompletions)
      .where(eq(lessonCompletions.userId, user.id))
    const completedLessonIds = completedRows.map((r) => r.lessonId)

    const alreadyRows = await tx
      .select({ slug: achievements.slug })
      .from(userAchievements)
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
      .where(eq(userAchievements.userId, user.id))
    const alreadyUnlockedSlugs = alreadyRows.map((r) => r.slug)

    const newlyUnlocked = evaluateAchievements(
      {
        completedLessonIds,
        streakCurrent: nextStreak.current,
        alreadyUnlockedSlugs,
      },
      TRACK_LESSON_INDEX,
    )

    let achievementXpAwarded = 0
    const actuallyUnlocked: AchievementMeta[] = []

    if (newlyUnlocked.length > 0) {
      // Resolve slug → uuid by reading from the canonical seed table. If a
      // slug is missing (e.g. migration skipped), we skip it rather than crash.
      const slugList = newlyUnlocked.map((a) => a.slug)
      const rows = await tx
        .select({ id: achievements.id, slug: achievements.slug })
        .from(achievements)
        .where(inArray(achievements.slug, slugList))
      const idBySlug = new Map(rows.map((r) => [r.slug, r.id]))

      for (const meta of newlyUnlocked) {
        const achievementId = idBySlug.get(meta.slug)
        if (!achievementId) continue
        const inserted = await tx
          .insert(userAchievements)
          .values({ userId: user.id, achievementId })
          .onConflictDoNothing({
            target: [userAchievements.userId, userAchievements.achievementId],
          })
          .returning({ userId: userAchievements.userId })
        if (inserted.length === 0) continue
        actuallyUnlocked.push(meta)

        if (meta.xpBonus > 0) {
          // Record an `achievement`-kind XP event. ref_id = slug. Idempotency
          // is guarded by `user_achievements` above — we only get here when
          // the achievement row was freshly inserted.
          await tx.insert(xpEvents).values({
            userId: user.id,
            kind: 'achievement',
            amount: meta.xpBonus,
            refId: meta.slug,
          })
          achievementXpAwarded += meta.xpBonus
        }
      }
    }

    // 9. Recompute XP total + level. When the xp_events insert collided on
    //    the partial unique index, no XP was added this call, so priorXpTotal
    //    matches xpTotal and leveledUp is false.
    const totalRow = await tx
      .select({ total: sum(xpEvents.amount).mapWith(Number) })
      .from(xpEvents)
      .where(eq(xpEvents.userId, user.id))
    const xpTotal = totalRow[0]?.total ?? 0
    const xpAwarded = (xpWasAwarded ? award.total : 0) + achievementXpAwarded
    const priorXpTotal = xpTotal - xpAwarded
    const newLevel = levelForXp(xpTotal).level
    const priorLevel = levelForXp(priorXpTotal).level

    revalidatePath('/[locale]/profile', 'page')
    revalidatePath('/[locale]/lessons/[id]', 'page')

    return {
      xpAwarded,
      xpTotal,
      totalXp: xpTotal,
      newLevel,
      level: newLevel,
      leveledUp: newLevel > priorLevel,
      streakCurrent: nextStreak.current,
      streakLongest: nextStreak.longest,
      unlocked: actuallyUnlocked.map((a) => ({
        slug: a.slug,
        nameEn: a.nameEn,
        nameZh: a.nameZh,
        descriptionEn: a.descriptionEn,
        descriptionZh: a.descriptionZh,
        icon: a.icon,
      })),
      alreadyCompleted: !xpWasAwarded,
    }
  })
}

export interface ProfileSummary {
  user: { id: string; handle: string; displayName: string; locale: string }
  xpTotal: number
  level: number
  xpIntoLevel: number
  xpForNext: number
  lessonsCompleted: number
  streak: { current: number; longest: number }
  recentEvents: { kind: XpKind; amount: number; refId: string | null; createdAt: Date }[]
}

export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const [xpRow, completionsRow, streakRow, events] = await Promise.all([
    db
      .select({ total: sum(xpEvents.amount).mapWith(Number) })
      .from(xpEvents)
      .where(eq(xpEvents.userId, user.id)),
    db.select({ n: count() }).from(lessonCompletions).where(eq(lessonCompletions.userId, user.id)),
    db.select().from(streaks).where(eq(streaks.userId, user.id)).limit(1),
    db
      .select({
        kind: xpEvents.kind,
        amount: xpEvents.amount,
        refId: xpEvents.refId,
        createdAt: xpEvents.createdAt,
      })
      .from(xpEvents)
      .where(eq(xpEvents.userId, user.id))
      .orderBy(desc(xpEvents.createdAt))
      .limit(10),
  ])

  const xpTotal = xpRow[0]?.total ?? 0
  const level = levelForXp(xpTotal)

  return {
    user: {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      locale: user.locale,
    },
    xpTotal,
    level: level.level,
    xpIntoLevel: level.xpIntoLevel,
    xpForNext: level.xpForNext,
    lessonsCompleted: Number(completionsRow[0]?.n ?? 0),
    streak: streakRow[0]
      ? { current: streakRow[0].current, longest: streakRow[0].longest }
      : { current: 0, longest: 0 },
    recentEvents: events.map((e) => ({
      kind: e.kind as XpKind,
      amount: e.amount,
      refId: e.refId,
      createdAt: e.createdAt,
    })),
  }
}

export interface CompletedLessonsResult {
  lessons: { lessonId: string; completedAt: Date; score: number | null }[]
}

export async function getCompletedLessons(): Promise<CompletedLessonsResult | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const rows = await db
    .select({
      lessonId: lessonCompletions.lessonId,
      completedAt: lessonCompletions.completedAt,
      score: lessonCompletions.score,
    })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, user.id))
    .orderBy(desc(lessonCompletions.completedAt))
    .limit(200)
  return {
    lessons: rows.map((r) => ({
      lessonId: r.lessonId,
      completedAt: r.completedAt,
      score: r.score === null ? null : Number(r.score),
    })),
  }
}
