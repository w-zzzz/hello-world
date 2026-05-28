import { describe, expect, expectTypeOf, it } from 'vitest'
import * as schema from '../schema'
import {
  aiUsage,
  backtestResults,
  backtestRuns,
  lessonCompletions,
  type NewAiUsage,
  type NewBacktestResult,
  type NewRateLimitHit,
  type NewTutorMessage,
  type NewUser,
  rateLimits,
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
    expect(backtestRuns).toBeDefined()
    expect(backtestResults).toBeDefined()
    expect(rateLimits).toBeDefined()
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
    // Idempotency (C-XP-1) hinges on the lesson_complete kind continuing
    // to exist alongside its partial-unique index xp_events_lesson_complete_unique.
    expect(XP_EVENT_KINDS).toContain('lesson_complete')
  })

  it('exposes the rate_limits table with the expected columns', () => {
    expect(rateLimits.userId).toBeDefined()
    expect(rateLimits.userId.name).toBe('user_id')
    expect(rateLimits.action).toBeDefined()
    expect(rateLimits.action.name).toBe('action')
    expect(rateLimits.hitAt).toBeDefined()
    expect(rateLimits.hitAt.name).toBe('hit_at')
    expectTypeOf<NewRateLimitHit>().toHaveProperty('userId').toEqualTypeOf<string>()
    expectTypeOf<NewRateLimitHit>().toHaveProperty('action').toEqualTypeOf<string>()
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

  it('exposes the backtest_runs status column', () => {
    expect(backtestRuns.status).toBeDefined()
    expect(backtestRuns.status.name).toBe('status')
    // status on insert is a string narrowed by the DB-level CHECK constraint.
    expectTypeOf<NewBacktestResult>().toHaveProperty('runId').toEqualTypeOf<string>()
  })

  it('marks backtest_results.runId as required at the type level', () => {
    expect(backtestResults.runId).toBeDefined()
    expect(backtestResults.runId.name).toBe('run_id')
    expectTypeOf<NewBacktestResult>().toHaveProperty('runId').toEqualTypeOf<string>()
  })
})
