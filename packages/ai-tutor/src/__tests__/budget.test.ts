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

import { checkSonnetBudget, estimateInputTokens } from '../budget'
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

describe('estimateInputTokens', () => {
  it('approximates English at ~1 token per 3.5 chars', () => {
    const t = estimateInputTokens('hello world hello world hello world hello')
    // 41 chars / 3.5 = 11.7 -> 12
    expect(t).toBe(12)
  })

  it('charges CJK at 1.5 tokens per char (Chinese)', () => {
    const t = estimateInputTokens('你好世界') // 4 CJK chars
    expect(t).toBe(6) // 4 * 1.5 = 6
  })

  it('charges hiragana / katakana like CJK', () => {
    const t = estimateInputTokens('こんにちは')
    expect(t).toBe(8) // 5 * 1.5 = 7.5 -> 8
  })

  it('mixes English and Chinese additively', () => {
    const t = estimateInputTokens('hello 你好')
    // 6 english (incl. space) /3.5 = 1.71 ; 2 cjk * 1.5 = 3 ; total 4.71 -> 5
    expect(t).toBe(5)
  })

  it('is monotone in length within a script', () => {
    expect(estimateInputTokens('你')).toBeLessThan(estimateInputTokens('你好'))
    // Non-CJK uses ceil(n/3.5), so we need a length jump large enough to cross
    // a token boundary — 'a' (1 char → 1 token) vs 'aaaaaaa' (7 chars → 2).
    expect(estimateInputTokens('a')).toBeLessThan(estimateInputTokens('aaaaaaa'))
  })

  it('long Chinese passages do not silently fit budgets meant for English', () => {
    const text = '你好世界'.repeat(1000) // 4000 cjk chars
    const t = estimateInputTokens(text)
    expect(t).toBeGreaterThanOrEqual(5000) // should be ~6000
  })
})
