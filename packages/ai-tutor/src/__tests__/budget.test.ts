import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks must be defined inside vi.hoisted so vi.mock can reference them —
// vi.mock factories are hoisted above plain const declarations.
const { limit, where, from, select } = vi.hoisted(() => {
  const limit = vi.fn()
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  return { limit, where, from, select }
})

vi.mock('@quant-academy/db', () => ({
  db: { select, insert: vi.fn() },
  aiUsage: { userId: 'user_id', day: 'day', sonnetIn: 'sonnet_in', sonnetOut: 'sonnet_out' },
}))

import { checkSonnetBudget } from '../budget'
import { MAX_SONNET_INPUT_PER_DAY, MAX_SONNET_OUTPUT_PER_DAY } from '../types'

describe('checkSonnetBudget', () => {
  beforeEach(() => {
    limit.mockReset()
    where.mockClear()
    from.mockClear()
    select.mockClear()
  })

  it('returns ok when usage is 0 and the estimate is well under the cap', async () => {
    limit.mockResolvedValueOnce([])
    const result = await checkSonnetBudget('u1', 100)
    expect(result).toEqual({ ok: true })
  })

  it('returns sonnet_input quota_exceeded when the estimate would breach the cap', async () => {
    limit.mockResolvedValueOnce([{ sonnetIn: MAX_SONNET_INPUT_PER_DAY - 50, sonnetOut: 0 }])
    const result = await checkSonnetBudget('u1', 100)
    expect(result).toEqual({
      ok: false,
      reason: 'sonnet_input',
      usedToday: MAX_SONNET_INPUT_PER_DAY - 50,
      cap: MAX_SONNET_INPUT_PER_DAY,
    })
  })

  it('returns sonnet_output quota_exceeded when sonnetOut is already at the cap', async () => {
    limit.mockResolvedValueOnce([{ sonnetIn: 0, sonnetOut: MAX_SONNET_OUTPUT_PER_DAY }])
    const result = await checkSonnetBudget('u1', 1)
    expect(result).toEqual({
      ok: false,
      reason: 'sonnet_output',
      usedToday: MAX_SONNET_OUTPUT_PER_DAY,
      cap: MAX_SONNET_OUTPUT_PER_DAY,
    })
  })
})
