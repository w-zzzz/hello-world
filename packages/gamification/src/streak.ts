import type { StreakState } from './types'

const MS_PER_DAY = 86_400_000

function isoDay(d: string): number {
  // Returns days-since-epoch in UTC for an ISO 'YYYY-MM-DD' string.
  return Math.floor(Date.parse(`${d}T00:00:00Z`) / MS_PER_DAY)
}

/**
 * Apply a "user was active today" event to a streak state.
 *
 *   same-day  -> unchanged
 *   next-day  -> current += 1, longest = max(longest, current)
 *   skipped >= 1 day -> current = 1
 */
export function nextStreakState(prev: StreakState, today: string): StreakState {
  const prevDay = isoDay(prev.lastActiveDate)
  const todayDay = isoDay(today)

  if (todayDay === prevDay) return prev

  let current: number
  if (todayDay === prevDay + 1) {
    current = prev.current + 1
  } else if (todayDay > prevDay + 1 || prev.current === 0) {
    current = 1
  } else {
    // todayDay is before prevDay — out-of-order event; ignore.
    return prev
  }
  const longest = Math.max(prev.longest, current)
  return { current, longest, lastActiveDate: today }
}

/**
 * Initial streak state for a newly-created user.
 */
export function initialStreak(today: string): StreakState {
  return { current: 1, longest: 1, lastActiveDate: today }
}

/**
 * Format a Date as a UTC `YYYY-MM-DD` calendar day. The streak engine
 * uses UTC midnight boundaries throughout to stay deterministic across
 * time zones; per-user TZ awareness is a v2 concern.
 */
export function utcDayOf(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Resolve a user's *current* streak value from a stored `streaks` row,
 * relative to "today" — i.e. account for the case where the last active
 * day was already two days ago and the persisted `current` is now stale.
 *
 * The persisted row is only mutated on lesson completion; if the user
 * never returns, `current` would otherwise stay positive forever. Render
 * and leaderboard code calls this helper before showing the number.
 *
 *   today === lastActive          → stored current
 *   today === lastActive + 1      → stored current (next completion will += 1)
 *   today > lastActive + 1        → 0 (streak has lapsed; needs a fresh start)
 *   today < lastActive (clock skew) → stored current
 */
export function effectiveCurrentStreak(
  stored: { current: number; lastActiveDate: string },
  today: string,
): number {
  if (stored.current === 0) return 0
  const lastDay = isoDay(stored.lastActiveDate)
  const todayDay = isoDay(today)
  if (todayDay <= lastDay + 1) return stored.current
  return 0
}
