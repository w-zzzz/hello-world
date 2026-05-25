import { describe, expect, it } from 'vitest'
import { generateSpyDaily, sampleSpyDaily } from '../sample-data'

describe('sampleSpyDaily', () => {
  it('contains exactly 504 bars', () => {
    expect(sampleSpyDaily).toHaveLength(504)
  })

  it('satisfies OHLC invariants on every bar', () => {
    for (const bar of sampleSpyDaily) {
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close))
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close))
      expect(bar.high).toBeGreaterThanOrEqual(bar.low)
    }
  })

  it('emits positive integer volumes', () => {
    for (const bar of sampleSpyDaily) {
      expect(bar.volume).toBeGreaterThan(0)
      expect(Number.isInteger(bar.volume)).toBe(true)
    }
  })

  it('excludes weekends', () => {
    for (const bar of sampleSpyDaily) {
      const d = new Date(`${bar.t}T00:00:00Z`)
      const day = d.getUTCDay()
      expect(day).not.toBe(0)
      expect(day).not.toBe(6)
    }
  })

  it('ends on 2024-12-31 and is chronologically ordered', () => {
    const last = sampleSpyDaily[sampleSpyDaily.length - 1]
    expect(last?.t).toBe('2024-12-31')
    for (let i = 1; i < sampleSpyDaily.length; i++) {
      const prev = sampleSpyDaily[i - 1]
      const curr = sampleSpyDaily[i]
      expect(prev).toBeDefined()
      expect(curr).toBeDefined()
      if (prev && curr) {
        expect(curr.t > prev.t).toBe(true)
      }
    }
  })
})

describe('generateSpyDaily', () => {
  it('is deterministic for seed=42', () => {
    const a = generateSpyDaily(42)
    const b = generateSpyDaily(42)
    expect(a).toEqual(b)
    expect(a[0]).toEqual({
      t: '2023-01-26',
      open: 400,
      high: 400.55,
      low: 391.91,
      close: 395.56,
      volume: 56_812_821,
    })
  })

  it('produces different output for a different seed', () => {
    const a = generateSpyDaily(42)
    const c = generateSpyDaily(7)
    expect(a[0]).not.toEqual(c[0])
  })

  it('honors the count argument', () => {
    expect(generateSpyDaily(1, 10)).toHaveLength(10)
  })
})
