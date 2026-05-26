'use server'

import { getLessonRecord } from '@quant-academy/content'
import {
  computeXpAward,
  initialStreak,
  levelForXp,
  nextStreakState,
  type StreakState,
} from '@quant-academy/gamification'
import { and, count, desc, eq, sum } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { db, lessonCompletions, streaks, xpEvents } from '@/lib/db'

const VALID_KINDS = [
  'lesson_complete',
  'quiz_perfect',
  'streak_bonus',
  'daily_challenge',
  'achievement',
] as const
type XpKind = (typeof VALID_KINDS)[number]

export interface MarkLessonCompleteInput {
  lessonId: string
  /** 0..100 if a quiz was attached; omit if no quiz. */
  score?: number
  timeSpentS?: number
}

export interface MarkLessonCompleteResult {
  xpAwarded: number
  xpTotal: number
  newLevel: number
  leveledUp: boolean
}

export async function markLessonComplete(
  input: MarkLessonCompleteInput,
): Promise<MarkLessonCompleteResult | { error: 'unauthenticated' | 'unknown_lesson' }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'unauthenticated' }

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
    const award = computeXpAward({
      lesson: { xp: lesson.xp, difficulty: lesson.difficulty },
      quiz:
        input.score !== undefined ? { correct: Math.round(input.score), total: 100 } : undefined,
      attempts: newAttempts,
      currentStreak: nextStreak.current,
    })

    // 5. Upsert lesson_completions.
    if (priorRow[0]) {
      await tx
        .update(lessonCompletions)
        .set({
          attempts: newAttempts,
          score: input.score ?? null,
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
        score: input.score ?? null,
        timeSpentS: input.timeSpentS ?? 0,
      })
    }

    // 6. Record xp event.
    const xpKind: XpKind = 'lesson_complete'
    await tx.insert(xpEvents).values({
      userId: user.id,
      kind: xpKind,
      amount: award.total,
      refId: input.lessonId,
    })

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

    // 8. Recompute XP total + level.
    const totalRow = await tx
      .select({ total: sum(xpEvents.amount).mapWith(Number) })
      .from(xpEvents)
      .where(eq(xpEvents.userId, user.id))
    const xpTotal = totalRow[0]?.total ?? 0
    const priorXpTotal = xpTotal - award.total
    const newLevel = levelForXp(xpTotal).level
    const priorLevel = levelForXp(priorXpTotal).level

    revalidatePath('/[locale]/profile', 'page')
    revalidatePath('/[locale]/lessons/[id]', 'page')

    return {
      xpAwarded: award.total,
      xpTotal,
      newLevel,
      leveledUp: newLevel > priorLevel,
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
