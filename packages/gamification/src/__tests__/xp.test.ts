import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  computeXpAward,
  firstTryBonus,
  quizScoreMultiplier,
  streakBonus,
  xpForLessonComplete,
} from '../xp'

describe('xpForLessonComplete', () => {
  it('returns the base XP for beginner lessons', () => {
    expect(xpForLessonComplete({ xp: 50, difficulty: 'beginner' })).toBe(50)
  })

  it('scales by 1.5x for intermediate lessons', () => {
    expect(xpForLessonComplete({ xp: 50, difficulty: 'intermediate' })).toBe(75)
  })

  it('scales by 2x for advanced lessons', () => {
    expect(xpForLessonComplete({ xp: 50, difficulty: 'advanced' })).toBe(100)
  })

  it('rounds to integers', () => {
    expect(xpForLessonComplete({ xp: 33, difficulty: 'intermediate' })).toBe(Math.round(33 * 1.5))
  })
})

describe('quizScoreMultiplier', () => {
  it('returns 0.5 for a perfect zero', () => {
    expect(quizScoreMultiplier({ correct: 0, total: 4 })).toBe(0.5)
  })

  it('returns 1.0 for a perfect score', () => {
    expect(quizScoreMultiplier({ correct: 4, total: 4 })).toBe(1.0)
  })

  it('linearly interpolates between 0.5 and 1.0', () => {
    expect(quizScoreMultiplier({ correct: 2, total: 4 })).toBe(0.75)
  })

  it('defaults to 1.0 when quiz is absent', () => {
    expect(quizScoreMultiplier(undefined)).toBe(1.0)
    expect(quizScoreMultiplier(null)).toBe(1.0)
  })

  it('defaults to 1.0 when total is zero or negative', () => {
    expect(quizScoreMultiplier({ correct: 0, total: 0 })).toBe(1.0)
    expect(quizScoreMultiplier({ correct: 1, total: -3 })).toBe(1.0)
  })

  it('clamps over-scoring to 1.0 and under-scoring to 0.5', () => {
    expect(quizScoreMultiplier({ correct: 10, total: 4 })).toBe(1.0)
    expect(quizScoreMultiplier({ correct: -5, total: 4 })).toBe(0.5)
  })
})

describe('firstTryBonus', () => {
  it('grants 1.25x for first attempt', () => {
    expect(firstTryBonus(1)).toBe(1.25)
  })

  it('grants no bonus for a retry', () => {
    expect(firstTryBonus(2)).toBe(1.0)
  })

  it('treats 0 attempts as first-try-eligible', () => {
    expect(firstTryBonus(0)).toBe(1.25)
  })
})

describe('streakBonus', () => {
  it('returns 0 for no streak', () => {
    expect(streakBonus(0)).toBe(0)
  })

  it('returns 5 XP per streak day', () => {
    expect(streakBonus(5)).toBe(25)
  })

  it('caps at 30 days', () => {
    expect(streakBonus(30)).toBe(150)
    expect(streakBonus(31)).toBe(150)
    expect(streakBonus(9999)).toBe(150)
  })

  it('treats negative streak as zero', () => {
    expect(streakBonus(-3)).toBe(0)
  })
})

describe('computeXpAward', () => {
  it('breaks down the components', () => {
    const award = computeXpAward({
      lesson: { xp: 50, difficulty: 'intermediate' },
      quiz: { correct: 4, total: 4 },
      attempts: 1,
      currentStreak: 3,
    })
    expect(award.base).toBe(75)
    expect(award.quizMultiplier).toBe(1.0)
    expect(award.firstTry).toBe(1.25)
    expect(award.streakBonus).toBe(15)
    expect(award.total).toBe(Math.round(75 * 1.0 * 1.25) + 15)
  })

  it('property: total >= base when quiz/attempts are favorable', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.constantFrom('beginner', 'intermediate', 'advanced'),
        fc.integer({ min: 0, max: 100 }),
        (xp, difficulty, currentStreak) => {
          const award = computeXpAward({
            lesson: { xp, difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced' },
            attempts: 1,
            currentStreak,
          })
          // first-try (1.25x) + no quiz penalty (1.0x) + non-negative streak bonus
          // ⇒ total is always at least base.
          expect(award.total).toBeGreaterThanOrEqual(award.base)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('property: total is always a non-negative integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.constantFrom('beginner', 'intermediate', 'advanced'),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 200 }),
        (xp, difficulty, correct, total, attempts, currentStreak) => {
          const award = computeXpAward({
            lesson: { xp, difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced' },
            quiz: { correct, total },
            attempts,
            currentStreak,
          })
          expect(Number.isInteger(award.total)).toBe(true)
          expect(award.total).toBeGreaterThanOrEqual(0)
        },
      ),
      { numRuns: 200 },
    )
  })
})
