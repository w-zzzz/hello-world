import { describe, expect, expectTypeOf, it } from 'vitest'
import * as schema from '../schema'
import {
  lessonCompletions,
  type NewUser,
  streaks,
  users,
  XP_EVENT_KINDS,
  xpEventKind,
  xpEvents,
} from '../schema'

describe('schema', () => {
  it('imports without crashing', () => {
    expect(schema).toBeDefined()
    expect(users).toBeDefined()
    expect(lessonCompletions).toBeDefined()
    expect(xpEvents).toBeDefined()
    expect(streaks).toBeDefined()
    expect(xpEventKind).toBeDefined()
  })

  it('exposes the expected xp event kinds', () => {
    expect(XP_EVENT_KINDS).toEqual([
      'lesson_complete',
      'quiz_perfect',
      'streak_bonus',
      'daily_challenge',
      'achievement',
    ])
    expect(XP_EVENT_KINDS).toHaveLength(5)
  })

  it('marks users.handle as required at the type level', () => {
    // NewUser.handle must be string (required), not optional.
    expectTypeOf<NewUser>().toHaveProperty('handle').toEqualTypeOf<string>()
    // displayName likewise required.
    expectTypeOf<NewUser>().toHaveProperty('displayName').toEqualTypeOf<string>()
  })
})
