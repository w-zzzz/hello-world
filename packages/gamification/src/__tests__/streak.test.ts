import { describe, expect, it } from 'vitest'
import { initialStreak, nextStreakState } from '../streak'

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
