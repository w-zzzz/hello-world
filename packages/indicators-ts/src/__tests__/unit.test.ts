import { describe, expect, it } from 'vitest'
import { compute as bollinger } from '../bollinger'
import { compute as ema } from '../ema'
import { compute as macd } from '../macd'
import { compute as rsi } from '../rsi'
import { compute as sma } from '../sma'
import type { Bar } from '../types'

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({
    t: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: c,
    high: c,
    low: c,
    close: c,
    volume: 1,
  }))
}

describe('SMA', () => {
  it('constant series → constant after window', () => {
    const bars = makeBars(Array(30).fill(100))
    const { sma: out } = sma({ bars, params: { period: 5 } })
    expect(out).toBeDefined()
    for (let i = 0; i < 4; i++) expect(out?.[i]).toBeNull()
    for (let i = 4; i < 30; i++) expect(out?.[i]).toBeCloseTo(100, 12)
  })

  it('throws when period < 2', () => {
    const bars = makeBars([1, 2, 3])
    expect(() => sma({ bars, params: { period: 1 } })).toThrow()
  })

  it('matches manual rolling mean on a simple ramp', () => {
    const bars = makeBars([1, 2, 3, 4, 5, 6])
    const { sma: out } = sma({ bars, params: { period: 3 } })
    expect(out).toEqual([null, null, 2, 3, 4, 5])
  })
})

describe('EMA', () => {
  it('constant series → constant after warmup', () => {
    const bars = makeBars(Array(20).fill(50))
    const { ema: out } = ema({ bars, params: { period: 5 } })
    for (let i = 0; i < 4; i++) expect(out?.[i]).toBeNull()
    for (let i = 4; i < 20; i++) expect(out?.[i]).toBeCloseTo(50, 12)
  })

  it('seed equals SMA of first `period` bars', () => {
    const bars = makeBars([1, 2, 3, 4, 5])
    const { ema: out } = ema({ bars, params: { period: 5 } })
    expect(out?.[4]).toBeCloseTo(3, 12)
  })
})

describe('RSI', () => {
  it('monotonically increasing closes → 100', () => {
    const bars = makeBars(Array.from({ length: 30 }, (_, i) => 10 + i))
    const { rsi: out } = rsi({ bars, params: { period: 14 } })
    for (let i = 0; i < 14; i++) expect(out?.[i]).toBeNull()
    for (let i = 14; i < 30; i++) expect(out?.[i]).toBe(100)
  })

  it('monotonically decreasing closes → 0', () => {
    const bars = makeBars(Array.from({ length: 30 }, (_, i) => 100 - i))
    const { rsi: out } = rsi({ bars, params: { period: 14 } })
    for (let i = 14; i < 30; i++) expect(out?.[i]).toBeCloseTo(0, 12)
  })

  it('leaves period entries null then emits a number at index period', () => {
    const closes = [
      44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61,
      46.28,
    ]
    const bars = makeBars(closes)
    const { rsi: out } = rsi({ bars, params: { period: 14 } })
    expect(out?.length).toBe(15)
    for (let i = 0; i < 14; i++) expect(out?.[i]).toBeNull()
    expect(out?.[14]).not.toBeNull()
  })
})

describe('MACD', () => {
  it('constant series → macd/signal/histogram all 0 after warmup', () => {
    const bars = makeBars(Array(80).fill(25))
    const {
      macd: m,
      signal: s,
      histogram: h,
    } = macd({
      bars,
      params: { fast: 12, slow: 26, signal: 9 },
    })
    // After the slow EMA warms up (index 25), macd should be 0.
    for (let i = 25; i < 80; i++) expect(m?.[i]).toBeCloseTo(0, 12)
    // Signal seeds at index 25 + 9 - 1 = 33.
    for (let i = 33; i < 80; i++) expect(s?.[i]).toBeCloseTo(0, 12)
    for (let i = 33; i < 80; i++) expect(h?.[i]).toBeCloseTo(0, 12)
  })

  it('throws when fast >= slow', () => {
    const bars = makeBars(Array(40).fill(10))
    expect(() => macd({ bars, params: { fast: 26, slow: 12, signal: 9 } })).toThrow()
  })
})

describe('Bollinger', () => {
  it('upper ≥ middle ≥ lower after warmup', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.1)
    const bars = makeBars(closes)
    const { middle, upper, lower } = bollinger({ bars, params: { period: 20, k: 2 } })
    for (let i = 19; i < 60; i++) {
      const m = middle?.[i]
      const u = upper?.[i]
      const l = lower?.[i]
      if (
        m === null ||
        m === undefined ||
        u === null ||
        u === undefined ||
        l === null ||
        l === undefined
      ) {
        throw new Error(`unexpected null at ${i}`)
      }
      expect(u).toBeGreaterThanOrEqual(m)
      expect(m).toBeGreaterThanOrEqual(l)
    }
  })

  it('σ=0 on a constant series → upper == middle == lower', () => {
    const bars = makeBars(Array(30).fill(42))
    const { middle, upper, lower } = bollinger({ bars, params: { period: 10, k: 2 } })
    for (let i = 9; i < 30; i++) {
      expect(middle?.[i]).toBeCloseTo(42, 12)
      expect(upper?.[i]).toBeCloseTo(42, 12)
      expect(lower?.[i]).toBeCloseTo(42, 12)
    }
  })

  it('first period - 1 entries are null', () => {
    const bars = makeBars(Array.from({ length: 25 }, (_, i) => i + 1))
    const { middle, upper, lower } = bollinger({ bars, params: { period: 5, k: 2 } })
    for (let i = 0; i < 4; i++) {
      expect(middle?.[i]).toBeNull()
      expect(upper?.[i]).toBeNull()
      expect(lower?.[i]).toBeNull()
    }
    expect(middle?.[4]).not.toBeNull()
  })
})
