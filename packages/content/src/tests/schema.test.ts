import { describe, expect, it } from 'vitest'
import {
  CURRICULUM,
  getLessonRecord,
  getLessonsByTrack,
  getNextLesson,
  getPreviousLesson,
} from '../curriculum'
import { LessonMetaSchema } from '../schema'

describe('LessonMetaSchema', () => {
  it('accepts a well-formed lesson id', () => {
    const result = LessonMetaSchema.safeParse({
      id: 'A-01-what-is-market',
      trackId: 'A',
      module: 'fundamentals',
      order: 1,
      difficulty: 'beginner',
      durationMin: 12,
      xp: 50,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a malformed lesson id', () => {
    const result = LessonMetaSchema.safeParse({
      id: 'a01-bad',
      trackId: 'A',
      module: 'fundamentals',
      order: 1,
      difficulty: 'beginner',
      durationMin: 12,
      xp: 50,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a lesson with a non-positive order', () => {
    const result = LessonMetaSchema.safeParse({
      id: 'A-01-what-is-market',
      trackId: 'A',
      module: 'fundamentals',
      order: 0,
      difficulty: 'beginner',
      durationMin: 12,
      xp: 50,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown trackId', () => {
    const result = LessonMetaSchema.safeParse({
      id: 'Z-01-foo',
      trackId: 'Z',
      module: 'foo',
      order: 1,
      difficulty: 'beginner',
      durationMin: 12,
      xp: 50,
    })
    expect(result.success).toBe(false)
  })
})

describe('CURRICULUM', () => {
  it('contains 110 lessons', () => {
    expect(CURRICULUM.lessons).toHaveLength(110)
  })

  it('has the expected per-track counts', () => {
    expect(getLessonsByTrack('A')).toHaveLength(10)
    expect(getLessonsByTrack('B')).toHaveLength(30)
    expect(getLessonsByTrack('C')).toHaveLength(10)
    expect(getLessonsByTrack('D')).toHaveLength(15)
    expect(getLessonsByTrack('E')).toHaveLength(15)
    expect(getLessonsByTrack('F')).toHaveLength(8)
    expect(getLessonsByTrack('G')).toHaveLength(10)
    expect(getLessonsByTrack('H')).toHaveLength(12)
  })

  it('marks the expected lessons as mdxReady', () => {
    const ready = CURRICULUM.lessons.filter((l) => l.mdxReady).map((l) => l.meta.id)
    // After M9 every lesson is authored EXCEPT Track A's tail (A-04..A-10):
    // Track A first three + all of Tracks B/C/D/E/F/G/H.
    const ids = (t: 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H') =>
      getLessonsByTrack(t).map((l) => l.meta.id)
    const expected = [
      'A-01-what-is-market',
      'A-02-price-spread',
      'A-03-order-types',
      ...ids('B'),
      ...ids('C'),
      ...ids('D'),
      ...ids('E'),
      ...ids('F'),
      ...ids('G'),
      ...ids('H'),
    ]
    expect(ready).toEqual(expected)
    expect(ready).toHaveLength(103)
  })

  it('has unique lesson ids', () => {
    const ids = CURRICULUM.lessons.map((l) => l.meta.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('navigation helpers', () => {
  it('getLessonRecord finds a known lesson', () => {
    const rec = getLessonRecord('A-01-what-is-market')
    expect(rec).toBeDefined()
    expect(rec?.meta.trackId).toBe('A')
  })

  it('getLessonRecord returns undefined for unknown id', () => {
    expect(getLessonRecord('Z-99-nope')).toBeUndefined()
  })

  it('getNextLesson advances within a track', () => {
    const next = getNextLesson('A-01-what-is-market')
    expect(next?.meta.id).toBe('A-02-price-spread')
  })

  it('getNextLesson crosses track boundaries', () => {
    const next = getNextLesson('A-10-market-review')
    expect(next?.meta.trackId).toBe('B')
  })

  it('getPreviousLesson returns undefined for the very first lesson', () => {
    expect(getPreviousLesson('A-01-what-is-market')).toBeUndefined()
  })

  it('getPreviousLesson returns the previous entry', () => {
    const prev = getPreviousLesson('A-03-order-types')
    expect(prev?.meta.id).toBe('A-02-price-spread')
  })

  it('getNextLesson returns undefined for the very last lesson', () => {
    expect(getNextLesson('H-12-graduation-project')).toBeUndefined()
  })
})
