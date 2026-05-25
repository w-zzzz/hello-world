import type { Bar } from './types'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rng: () => number): number {
  // Box-Muller transform.
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function* walkBackTradingDays(end: Date, count: number): Generator<string> {
  const dates: string[] = []
  const d = new Date(end)
  while (dates.length < count) {
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) {
      dates.unshift(d.toISOString().slice(0, 10))
    }
    d.setUTCDate(d.getUTCDate() - 1)
  }
  for (const s of dates) yield s
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

export function generateSpyDaily(seed = 42, count = 504, endIso = '2024-12-31'): Bar[] {
  const rng = mulberry32(seed)
  const dates = Array.from(walkBackTradingDays(new Date(`${endIso}T00:00:00Z`), count))
  const bars: Bar[] = []
  let close = 400
  const drift = 0.0003
  const vol = 0.012
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    if (date === undefined) continue
    const ret = drift + vol * gauss(rng)
    const prev = bars[i - 1]
    const open = i === 0 || prev === undefined ? close : prev.close * (1 + 0.001 * gauss(rng))
    const newClose = open * Math.exp(ret)
    const high = Math.max(open, newClose) * (1 + Math.abs(gauss(rng)) * 0.005)
    const low = Math.min(open, newClose) * (1 - Math.abs(gauss(rng)) * 0.005)
    const volume = 80_000_000 * Math.exp(gauss(rng) * 0.3)
    bars.push({
      t: date,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(newClose),
      volume: Math.round(volume),
    })
    close = newClose
  }
  return bars
}

export const sampleSpyDaily: Bar[] = generateSpyDaily()
