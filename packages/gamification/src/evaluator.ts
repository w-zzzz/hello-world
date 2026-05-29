import { ACHIEVEMENTS, type AchievementMeta } from './achievements'

/**
 * Snapshot of a user's gamification state, as observed *after* the action
 * (e.g. lesson completion) the evaluator is reacting to.
 *
 * The evaluator is intentionally pure — no DB, no I/O — so it can be
 * unit-tested in isolation and re-run cheaply.
 */
export interface UserStateSnapshot {
  /** Distinct lesson ids the user has completed. Order doesn't matter. */
  completedLessonIds: readonly string[]
  /** Current streak length in days, post-update. */
  streakCurrent: number
  /** Slugs of achievements the user has *already* unlocked. */
  alreadyUnlockedSlugs: readonly string[]
}

/**
 * Per-track completion criteria, injected by the caller. Keeps the
 * evaluator decoupled from `@quant-academy/content` (which the server
 * action depends on, not us). Pass `getLessonsByTrack(trackId).map(r => r.meta.id)`.
 */
export interface TrackLessonIndex {
  A: readonly string[]
  B: readonly string[]
  C: readonly string[]
}

/**
 * Decide which achievements have just been satisfied. Returns only the
 * delta — slugs that meet their criteria *and* aren't in
 * `alreadyUnlockedSlugs`.
 *
 * Pure + idempotent: invoking again on the same snapshot after the caller
 * persists the unlocks (and adds their slugs to `alreadyUnlockedSlugs`)
 * returns `[]`.
 */
export function evaluateAchievements(
  state: UserStateSnapshot,
  trackIndex: TrackLessonIndex,
): AchievementMeta[] {
  const completedSet = new Set(state.completedLessonIds)
  const completedCount = completedSet.size
  const alreadyUnlocked = new Set(state.alreadyUnlockedSlugs)
  const unlocked: AchievementMeta[] = []

  for (const a of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(a.slug)) continue
    if (matchesCriteria(a, state, completedCount, completedSet, trackIndex)) {
      unlocked.push(a)
    }
  }
  return unlocked
}

function matchesCriteria(
  a: AchievementMeta,
  state: UserStateSnapshot,
  completedCount: number,
  completedSet: ReadonlySet<string>,
  trackIndex: TrackLessonIndex,
): boolean {
  switch (a.criteria.kind) {
    case 'lessons_completed':
      return completedCount >= a.criteria.count
    case 'streak_current':
      return state.streakCurrent >= a.criteria.days
    case 'track_complete': {
      const required = trackIndex[a.criteria.trackId]
      if (required.length === 0) return false
      for (const lessonId of required) {
        if (!completedSet.has(lessonId)) return false
      }
      return true
    }
  }
}
