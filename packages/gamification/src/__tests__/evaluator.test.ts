import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, getAchievementBySlug } from '../achievements'
import { evaluateAchievements, type TrackLessonIndex } from '../evaluator'

// Synthetic but realistic-shaped track lesson lists. We don't import from
// @quant-academy/content here because the evaluator is decoupled by design
// (callers inject the index), and we want the tests to be deterministic
// against any future curriculum tweaks.
const TRACK_INDEX: TrackLessonIndex = {
  A: Array.from({ length: 10 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}-x`),
  B: Array.from({ length: 30 }, (_, i) => `B-${String(i + 1).padStart(2, '0')}-x`),
  C: Array.from({ length: 10 }, (_, i) => `C-${String(i + 1).padStart(2, '0')}-x`),
}

describe('ACHIEVEMENTS catalog', () => {
  it('ships exactly 8 achievements in M8 (2 quiz ones deferred)', () => {
    expect(ACHIEVEMENTS).toHaveLength(8)
  })

  it('has the canonical slug set', () => {
    expect(ACHIEVEMENTS.map((a) => a.slug).sort()).toEqual(
      [
        'first-lesson',
        'five-lessons',
        'ten-lessons',
        'track-a-complete',
        'track-b-complete',
        'track-c-complete',
        'streak-7',
        'streak-30',
      ].sort(),
    )
  })

  it('xp bonuses match the M8 spec', () => {
    expect(getAchievementBySlug('first-lesson')?.xpBonus).toBe(25)
    expect(getAchievementBySlug('five-lessons')?.xpBonus).toBe(50)
    expect(getAchievementBySlug('ten-lessons')?.xpBonus).toBe(75)
    expect(getAchievementBySlug('track-a-complete')?.xpBonus).toBe(200)
    expect(getAchievementBySlug('track-b-complete')?.xpBonus).toBe(500)
    expect(getAchievementBySlug('track-c-complete')?.xpBonus).toBe(200)
    expect(getAchievementBySlug('streak-7')?.xpBonus).toBe(100)
    expect(getAchievementBySlug('streak-30')?.xpBonus).toBe(500)
  })

  it('uses the expected Lucide icon names', () => {
    expect(getAchievementBySlug('first-lesson')?.icon).toBe('sparkles')
    expect(getAchievementBySlug('five-lessons')?.icon).toBe('award')
    expect(getAchievementBySlug('track-a-complete')?.icon).toBe('trophy')
    expect(getAchievementBySlug('streak-7')?.icon).toBe('flame')
  })

  it('provides bilingual copy for every achievement', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.nameEn.length).toBeGreaterThan(0)
      expect(a.nameZh.length).toBeGreaterThan(0)
      expect(a.descriptionEn.length).toBeGreaterThan(0)
      expect(a.descriptionZh.length).toBeGreaterThan(0)
    }
  })
})

describe('evaluateAchievements — lesson-count criteria', () => {
  it('unlocks first-lesson when the first completion lands', () => {
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: ['A-01-what-is-market'],
        streakCurrent: 1,
        alreadyUnlockedSlugs: [],
      },
      TRACK_INDEX,
    )
    const slugs = unlocked.map((a) => a.slug)
    expect(slugs).toContain('first-lesson')
    expect(slugs).not.toContain('five-lessons')
    expect(slugs).not.toContain('ten-lessons')
  })

  it('unlocks first-lesson + five-lessons together at the 5th completion', () => {
    const completed = ['l-1', 'l-2', 'l-3', 'l-4', 'l-5']
    const unlocked = evaluateAchievements(
      { completedLessonIds: completed, streakCurrent: 1, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    const slugs = unlocked.map((a) => a.slug)
    expect(slugs).toContain('first-lesson')
    expect(slugs).toContain('five-lessons')
    expect(slugs).not.toContain('ten-lessons')
  })

  it('unlocks ten-lessons at exactly 10 distinct completions', () => {
    const completed = Array.from({ length: 10 }, (_, i) => `l-${i}`)
    const unlocked = evaluateAchievements(
      { completedLessonIds: completed, streakCurrent: 1, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    expect(unlocked.map((a) => a.slug)).toContain('ten-lessons')
  })

  it('deduplicates the lesson list when counting (passing duplicates is harmless)', () => {
    const completed = ['l-1', 'l-1', 'l-2', 'l-2', 'l-3']
    const unlocked = evaluateAchievements(
      { completedLessonIds: completed, streakCurrent: 1, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    // Only 3 distinct → just first-lesson, not five-lessons.
    const slugs = unlocked.map((a) => a.slug)
    expect(slugs).toContain('first-lesson')
    expect(slugs).not.toContain('five-lessons')
  })
})

describe('evaluateAchievements — track completion', () => {
  it('unlocks track-a-complete only when all 10 Track-A lessons are done', () => {
    const justNine = TRACK_INDEX.A.slice(0, 9)
    const partial = evaluateAchievements(
      { completedLessonIds: justNine, streakCurrent: 1, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    expect(partial.map((a) => a.slug)).not.toContain('track-a-complete')

    const full = evaluateAchievements(
      { completedLessonIds: TRACK_INDEX.A, streakCurrent: 1, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    expect(full.map((a) => a.slug)).toContain('track-a-complete')
  })

  it('unlocks track-b-complete only at all 30 Track-B lessons', () => {
    expect(TRACK_INDEX.B).toHaveLength(30)
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: TRACK_INDEX.B,
        streakCurrent: 1,
        alreadyUnlockedSlugs: [],
      },
      TRACK_INDEX,
    )
    expect(unlocked.map((a) => a.slug)).toContain('track-b-complete')
  })

  it('does not unlock a track achievement when its track index is empty', () => {
    const emptyIndex: TrackLessonIndex = { A: [], B: [], C: [] }
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: ['x', 'y', 'z'],
        streakCurrent: 1,
        alreadyUnlockedSlugs: [],
      },
      emptyIndex,
    )
    // A completed but empty required-set must NOT be treated as "complete";
    // otherwise a misconfigured curriculum would prematurely award everyone.
    const slugs = unlocked.map((a) => a.slug)
    expect(slugs).not.toContain('track-a-complete')
    expect(slugs).not.toContain('track-b-complete')
    expect(slugs).not.toContain('track-c-complete')
  })
})

describe('evaluateAchievements — streak criteria', () => {
  it('does not unlock streak-7 at streakCurrent=6', () => {
    const unlocked = evaluateAchievements(
      { completedLessonIds: ['l-1'], streakCurrent: 6, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    expect(unlocked.map((a) => a.slug)).not.toContain('streak-7')
  })

  it('unlocks streak-7 at streakCurrent=7', () => {
    const unlocked = evaluateAchievements(
      { completedLessonIds: ['l-1'], streakCurrent: 7, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    expect(unlocked.map((a) => a.slug)).toContain('streak-7')
  })

  it('unlocks both streak-7 and streak-30 at streakCurrent=30', () => {
    const unlocked = evaluateAchievements(
      { completedLessonIds: ['l-1'], streakCurrent: 30, alreadyUnlockedSlugs: [] },
      TRACK_INDEX,
    )
    const slugs = unlocked.map((a) => a.slug)
    expect(slugs).toContain('streak-7')
    expect(slugs).toContain('streak-30')
  })
})

describe('evaluateAchievements — idempotency', () => {
  it('returns [] when every satisfied achievement is already unlocked', () => {
    const completed = ['l-1', 'l-2', 'l-3', 'l-4', 'l-5']
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: completed,
        streakCurrent: 7,
        alreadyUnlockedSlugs: ['first-lesson', 'five-lessons', 'streak-7'],
      },
      TRACK_INDEX,
    )
    expect(unlocked).toEqual([])
  })

  it('only returns the delta on partial overlap', () => {
    const completed = Array.from({ length: 10 }, (_, i) => `l-${i}`)
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: completed,
        streakCurrent: 1,
        alreadyUnlockedSlugs: ['first-lesson', 'five-lessons'],
      },
      TRACK_INDEX,
    )
    expect(unlocked.map((a) => a.slug)).toEqual(['ten-lessons'])
  })

  it('does not award a track achievement that was already unlocked', () => {
    const unlocked = evaluateAchievements(
      {
        completedLessonIds: TRACK_INDEX.A,
        streakCurrent: 1,
        alreadyUnlockedSlugs: ['first-lesson', 'five-lessons', 'ten-lessons', 'track-a-complete'],
      },
      TRACK_INDEX,
    )
    expect(unlocked).toEqual([])
  })
})
