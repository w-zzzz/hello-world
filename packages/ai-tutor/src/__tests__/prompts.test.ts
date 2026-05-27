import { describe, expect, it } from 'vitest'
import { estimateInputTokens } from '../budget'
import { getCurriculumIndex } from '../prompts/curriculum'
import { GLOBAL_RULES } from '../prompts/global'

describe('GLOBAL_RULES', () => {
  it('mentions KaTeX, the financial-advice disclaimer, and personalized advice refusal', () => {
    expect(GLOBAL_RULES).toContain('KaTeX')
    expect(GLOBAL_RULES).toContain('Not financial advice')
    expect(GLOBAL_RULES.toLowerCase()).toContain('personalized financial advice')
  })
})

describe('getCurriculumIndex', () => {
  it('returns a non-trivial string that references Track A', () => {
    const s = getCurriculumIndex()
    expect(typeof s).toBe('string')
    expect(s.length).toBeGreaterThan(1000)
    expect(s).toContain('Track A')
  })

  it('returns the identical string on a cached call', () => {
    const a = getCurriculumIndex()
    const b = getCurriculumIndex()
    expect(b).toBe(a)
  })
})

describe('estimateInputTokens', () => {
  it('returns a positive integer for non-empty input', () => {
    const n = estimateInputTokens('hello world')
    expect(Number.isInteger(n)).toBe(true)
    expect(n).toBeGreaterThan(0)
  })

  it('is monotone in input length', () => {
    const short = estimateInputTokens('x')
    const long = estimateInputTokens('x'.repeat(1000))
    expect(long).toBeGreaterThan(short)
  })
})
