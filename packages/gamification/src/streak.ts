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
