import { describe, expect, it } from 'vitest'
import { buildSystem } from '../client'

describe('buildSystem', () => {
  it('returns exactly 2 blocks when no lessonId is given', async () => {
    const blocks = await buildSystem({ lessonId: null, locale: 'zh' })
    expect(blocks).toHaveLength(2)
  })

  it('returns 3 blocks when a known mdxReady lessonId is given', async () => {
    const blocks = await buildSystem({ lessonId: 'A-01-what-is-market', locale: 'zh' })
    expect(blocks).toHaveLength(3)
  })

  it('marks every block with ephemeral cache_control', async () => {
    const blocks = await buildSystem({ lessonId: 'A-01-what-is-market', locale: 'zh' })
    for (const b of blocks) {
      expect(b.cache_control).toBeDefined()
      expect(b.cache_control?.type).toBe('ephemeral')
    }
  })

  it('places blocks in canonical order: GLOBAL_RULES, CURRICULUM_INDEX, LESSON_CONTEXT', async () => {
    const blocks = await buildSystem({ lessonId: 'A-01-what-is-market', locale: 'zh' })
    // First block is GLOBAL_RULES — starts with "You are Quant Academy Tutor"
    expect(blocks[0]?.text).toMatch(/^You are Quant Academy Tutor/)
    // Second block is the curriculum index — starts with the curriculum header
    expect(blocks[1]?.text).toMatch(/^# Quant Academy Curriculum/)
    // Third block is the lesson context — starts with "# Current lesson:"
    expect(blocks[2]?.text).toMatch(/^# Current lesson:/)
  })
})
