import { describe, expect, expectTypeOf, it } from 'vitest'
import * as schema from '../schema'
import {
  aiUsage,
  lessonCompletions,
  type NewAiUsage,
  type NewTutorMessage,
  type NewUser,
  streaks,
  tutorMessages,
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
    expect(tutorMessages).toBeDefined()
    expect(aiUsage).toBeDefined()
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

  it('exposes the tutor_messages role column', () => {
    expect(tutorMessages.role).toBeDefined()
    expect(tutorMessages.role.name).toBe('role')
    // role on insert must be a string (the CHECK constraint narrows values at the DB level).
    expectTypeOf<NewTutorMessage>().toHaveProperty('role').toEqualTypeOf<string>()
    // content + model are required NOT NULL columns.
    expectTypeOf<NewTutorMessage>().toHaveProperty('content').toEqualTypeOf<string>()
    expectTypeOf<NewTutorMessage>().toHaveProperty('model').toEqualTypeOf<string>()
  })

  it('marks ai_usage.userId and ai_usage.day as required at the type level', () => {
    expect(aiUsage.userId).toBeDefined()
    expect(aiUsage.day).toBeDefined()
    expectTypeOf<NewAiUsage>().toHaveProperty('userId').toEqualTypeOf<string>()
    // date columns in Drizzle pg-core surface as string in TS.
    expectTypeOf<NewAiUsage>().toHaveProperty('day').toEqualTypeOf<string>()
  })
})
