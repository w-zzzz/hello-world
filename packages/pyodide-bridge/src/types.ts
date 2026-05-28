export const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs'
export const MAX_CODE_BYTES = 65_536
export const WALL_CLOCK_MS = 15_000

export interface Bar {
  t: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface RunRequest {
  /** Python source. Must define `def run(close): -> dict`. */
  code: string
  /** OHLCV bars; we pass close prices to the user's run(). */
  bars: Bar[]
}

export interface RunSuccess {
  ok: true
  /** Whatever the user's run() returned, JSON-converted. */
  result: { signal: (number | null)[]; [k: string]: unknown }
  stdout: string
  stderr: string
  durationMs: number
}

export type RunErrorCode =
  | 'oversized_code'
  | 'missing_run_fn'
  | 'pyodide_init_failed'
  | 'user_exception'
  | 'timeout'
  | 'denied_import'
  | 'bad_return_shape'

export interface RunError {
  ok: false
  code: RunErrorCode
  message: string
  stdout?: string
  stderr?: string
}

export type RunResult = RunSuccess | RunError

// --- internal worker protocol ---

export interface WorkerRequestRun {
  kind: 'run'
  id: string
  code: string
  closes: number[]
}

export interface WorkerResponseRun {
  kind: 'run.result'
  id: string
  result: RunResult
}

export type WorkerMessage = WorkerRequestRun | WorkerResponseRun
