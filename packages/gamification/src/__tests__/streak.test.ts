import { describe, expect, it } from 'vitest'
import { effectiveCurrentStreak, initialStreak, nextStreakState, utcDayOf } from '../streak'

describe('initialStreak', () => {
  it('starts at current=1, longest=1', () => {
    expect(initialStreak('2026-05-25')).toEqual({
      current: 1,
      longest: 1,
      lastActiveDate: '2026-05-25',
    })
  })
})

describe('nextStreakState', () => {
  it('same-day event leaves state unchanged (referentially)', () => {
    const prev = { current: 4, longest: 7, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-25')
    expect(next).toBe(prev)
  })

  it('consecutive day increments current and updates longest when surpassed', () => {
    const prev = { current: 3, longest: 3, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-26')
    expect(next).toEqual({ current: 4, longest: 4, lastActiveDate: '2026-05-26' })
  })

  it('consecutive day keeps longest when it is already higher', () => {
    const prev = { current: 3, longest: 10, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-26')
    expect(next).toEqual({ current: 4, longest: 10, lastActiveDate: '2026-05-26' })
  })

  it('two-day gap resets current to 1 and preserves longest', () => {
    const prev = { current: 9, longest: 9, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-27')
    expect(next).toEqual({ current: 1, longest: 9, lastActiveDate: '2026-05-27' })
  })

  it('week-long gap resets current to 1', () => {
    const prev = { current: 9, longest: 12, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-06-01')
    expect(next).toEqual({ current: 1, longest: 12, lastActiveDate: '2026-06-01' })
  })

  it('out-of-order (past date) event is ignored', () => {
    const prev = { current: 5, longest: 5, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-20')
    expect(next).toBe(prev)
  })

  it('cold-start (current=0) initializes to 1 regardless of date math', () => {
    const prev = { current: 0, longest: 0, lastActiveDate: '2026-05-25' }
    const next = nextStreakState(prev, '2026-05-27')
    expect(next).toEqual({ current: 1, longest: 1, lastActiveDate: '2026-05-27' })
  })

  it('cross-month boundary still treated as consecutive', () => {
    const prev = { current: 2, longest: 2, lastActiveDate: '2026-05-31' }
    const next = nextStreakState(prev, '2026-06-01')
    expect(next).toEqual({ current: 3, longest: 3, lastActiveDate: '2026-06-01' })
  })
})

describe('utcDayOf', () => {
  it('extracts the UTC calendar day from a Date', () => {
    expect(utcDayOf(new Date('2026-05-29T10:34:00Z'))).toBe('2026-05-29')
  })

  it('crosses the midnight boundary in UTC, not local time', () => {
    // 2026-05-29 23:30 UTC stays on the 29th regardless of process TZ.
    expect(utcDayOf(new Date('2026-05-29T23:30:00Z'))).toBe('2026-05-29')
    // One hour later flips to the 30th.
    expect(utcDayOf(new Date('2026-05-30T00:30:00Z'))).toBe('2026-05-30')
  })
})

describe('effectiveCurrentStreak', () => {
  it('returns 0 when stored.current is already 0', () => {
    expect(effectiveCurrentStreak({ current: 0, lastActiveDate: '2026-05-25' }, '2026-05-29')).toBe(
      0,
    )
  })

  it('returns the stored value when today is the same day', () => {
    expect(effectiveCurrentStreak({ current: 5, lastActiveDate: '2026-05-29' }, '2026-05-29')).toBe(
      5,
    )
  })

  it('returns the stored value when today is exactly one day after lastActive', () => {
    // The user has a live grace day — next completion will extend the streak.
    expect(effectiveCurrentStreak({ current: 5, lastActiveDate: '2026-05-28' }, '2026-05-29')).toBe(
      5,
    )
  })

  it('returns 0 once the gap exceeds one day (streak lapsed)', () => {
    expect(effectiveCurrentStreak({ current: 5, lastActiveDate: '2026-05-27' }, '2026-05-29')).toBe(
      0,
    )
  })

  it('tolerates clock skew where today < lastActiveDate', () => {
    expect(effectiveCurrentStreak({ current: 5, lastActiveDate: '2026-05-30' }, '2026-05-29')).toBe(
      5,
    )
  })
})
