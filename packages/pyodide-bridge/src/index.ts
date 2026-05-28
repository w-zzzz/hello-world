import {
  MAX_CODE_BYTES,
  type RunError,
  type RunRequest,
  type RunResult,
  WALL_CLOCK_MS,
  type WorkerMessage,
} from './types'

let worker: Worker | null = null
const pending = new Map<string, (r: RunResult) => void>()

function createWorker(): Worker {
  // The worker URL is resolved at build time by Next/Vite using `new URL(...)`
  // with import.meta. Consumers should import this module from a client component.
  const url = new URL('./worker.ts', import.meta.url)
  const w = new Worker(url, { type: 'module', name: 'qa-pyodide-bridge' })
  w.addEventListener('message', (ev: MessageEvent<WorkerMessage>) => {
    const msg = ev.data
    if (msg.kind === 'run.result') {
      const resolve = pending.get(msg.id)
      if (resolve) {
        pending.delete(msg.id)
        resolve(msg.result)
      }
    }
  })
  return w
}

export function resetBridge(): void {
  if (worker) {
    worker.terminate()
    worker = null
  }
  for (const resolve of pending.values()) {
    resolve({ ok: false, code: 'pyodide_init_failed', message: 'bridge reset' })
  }
  pending.clear()
}

export async function runUserCode(req: RunRequest): Promise<RunResult> {
  if (typeof req.code !== 'string') {
    return { ok: false, code: 'oversized_code', message: 'code must be a string' }
  }
  const bytes = new TextEncoder().encode(req.code).byteLength
  if (bytes > MAX_CODE_BYTES) {
    return {
      ok: false,
      code: 'oversized_code',
      message: `code size ${bytes}B exceeds cap ${MAX_CODE_BYTES}B`,
    }
  }
  if (!req.code.includes('def run(')) {
    return {
      ok: false,
      code: 'missing_run_fn',
      message: 'code must define a top-level `def run(...)` function',
    }
  }
  if (!worker) worker = createWorker()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const closes = req.bars.map((b) => b.close)
  return new Promise<RunResult>((resolve) => {
    const cleanup = (r: RunResult) => {
      clearTimeout(timer)
      pending.delete(id)
      resolve(r)
    }
    const timer = setTimeout(() => {
      // Hard timeout: resolve this request first, then kill the worker so
      // resetBridge() doesn't clobber the timeout result via its
      // pyodide_init_failed sweep over the pending map.
      const err: RunError = {
        ok: false,
        code: 'timeout',
        message: `exceeded ${WALL_CLOCK_MS}ms wall clock`,
      }
      cleanup(err)
      resetBridge()
    }, WALL_CLOCK_MS)
    pending.set(id, cleanup)
    worker?.postMessage({ kind: 'run', id, code: req.code, closes } satisfies WorkerMessage)
  })
}

export type { Bar, RunError, RunErrorCode, RunRequest, RunResult, RunSuccess } from './types'
export { MAX_CODE_BYTES, WALL_CLOCK_MS } from './types'
