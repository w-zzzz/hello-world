import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Build a mock Worker before importing the module under test.
class MockWorker {
  static instances: MockWorker[] = []
  onmessage: ((ev: MessageEvent) => void) | null = null
  postedMessages: unknown[] = []
  terminated = false
  listeners: Map<string, Array<(ev: MessageEvent) => void>> = new Map()
  constructor(_url: URL, _opts: { type: string; name?: string }) {
    MockWorker.instances.push(this)
  }
  addEventListener(type: string, fn: (ev: MessageEvent) => void) {
    const arr = this.listeners.get(type) ?? []
    arr.push(fn)
    this.listeners.set(type, arr)
  }
  postMessage(data: unknown) {
    this.postedMessages.push(data)
  }
  terminate() {
    this.terminated = true
  }
  fakeReply(data: unknown) {
    const arr = this.listeners.get('message') ?? []
    for (const fn of arr) fn({ data } as MessageEvent)
  }
}

vi.stubGlobal('Worker', MockWorker)

import { MAX_CODE_BYTES, resetBridge, runUserCode, WALL_CLOCK_MS } from '../index'
import type { Bar, RunResult } from '../types'

const sampleBars: Bar[] = Array.from({ length: 5 }, (_, i) => ({
  t: `2024-01-0${i + 1}`,
  open: 100,
  high: 110,
  low: 90,
  close: 100 + i,
  volume: 1000,
}))

const validCode = 'def run(close):\n    return {"signal": [0] * len(close)}\n'

beforeEach(() => {
  MockWorker.instances.length = 0
  resetBridge()
})
afterEach(() => {
  resetBridge()
})

describe('runUserCode validation', () => {
  it('rejects oversized code without touching the worker', async () => {
    const big = 'x'.repeat(MAX_CODE_BYTES + 1)
    const r = await runUserCode({ code: big, bars: sampleBars })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('oversized_code')
    expect(MockWorker.instances.length).toBe(0)
  })

  it('rejects code without def run(', async () => {
    const r = await runUserCode({ code: 'print(1)', bars: sampleBars })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('missing_run_fn')
  })

  it('posts to worker and resolves on reply', async () => {
    const p = runUserCode({ code: validCode, bars: sampleBars })
    // Worker has been constructed
    expect(MockWorker.instances.length).toBe(1)
    const w = MockWorker.instances[0]
    expect(w).toBeDefined()
    if (!w) return
    const sent = w.postedMessages[0] as { kind: string; id: string; closes: number[] }
    expect(sent.kind).toBe('run')
    expect(sent.closes).toEqual([100, 101, 102, 103, 104])
    // Fake a successful reply
    w.fakeReply({
      kind: 'run.result',
      id: sent.id,
      result: {
        ok: true,
        result: { signal: [0, 0, 0, 0, 0] },
        stdout: '',
        stderr: '',
        durationMs: 1,
      },
    })
    const r = (await p) as RunResult
    expect(r.ok).toBe(true)
  })

  it('times out and resolves with timeout error', async () => {
    vi.useFakeTimers()
    const p = runUserCode({ code: validCode, bars: sampleBars })
    vi.advanceTimersByTime(WALL_CLOCK_MS + 100)
    const r = await p
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('timeout')
    vi.useRealTimers()
  })
})
