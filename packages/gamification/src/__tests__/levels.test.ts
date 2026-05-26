import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { levelForXp, xpForLevel } from '../levels'

describe('xpForLevel', () => {
  it('level 1 is 0 XP', () => {
    expect(xpForLevel(1)).toBe(0)
  })

  it('level 2 is 100 XP', () => {
    expect(xpForLevel(2)).toBe(100)
  })

  it('level 10 ≈ floor(100 * 9^1.5)', () => {
    expect(xpForLevel(10)).toBe(Math.floor(100 * 9 ** 1.5))
  })

  it('is monotone non-decreasing in level', () => {
    for (let n = 1; n < 50; n += 1) {
      expect(xpForLevel(n + 1)).toBeGreaterThanOrEqual(xpForLevel(n))
    }
  })

  it('treats non-positive levels as level 1 floor', () => {
    expect(xpForLevel(0)).toBe(0)
    expect(xpForLevel(-5)).toBe(0)
  })
})

describe('levelForXp', () => {
  it('0 XP -> level 1, 0 into level', () => {
    const info = levelForXp(0)
    expect(info.level).toBe(1)
    expect(info.xpIntoLevel).toBe(0)
    expect(info.xpForNext).toBe(100)
  })

  it('99 XP -> still level 1, 99 into level', () => {
    const info = levelForXp(99)
    expect(info.level).toBe(1)
    expect(info.xpIntoLevel).toBe(99)
  })

  it('100 XP -> level 2, 0 into level', () => {
    const info = levelForXp(100)
    expect(info.level).toBe(2)
    expect(info.xpIntoLevel).toBe(0)
  })

  it('level boundaries are exact across many levels', () => {
    for (let n = 1; n <= 20; n += 1) {
      const info = levelForXp(xpForLevel(n))
      expect(info.level).toBe(n)
      expect(info.xpIntoLevel).toBe(0)
    }
  })

  it('property: levelForXp(totalXp).level is monotone non-decreasing in totalXp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200_000 }),
        fc.integer({ min: 0, max: 200_000 }),
        (a, b) => {
          const [lo, hi] = a <= b ? [a, b] : [b, a]
          expect(levelForXp(lo).level).toBeLessThanOrEqual(levelForXp(hi).level)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('property: xpIntoLevel < xpForNext for any totalXp', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200_000 }), (totalXp) => {
        const info = levelForXp(totalXp)
        expect(info.xpIntoLevel).toBeGreaterThanOrEqual(0)
        expect(info.xpIntoLevel).toBeLessThan(info.xpForNext)
      }),
      { numRuns: 200 },
    )
  })
})
