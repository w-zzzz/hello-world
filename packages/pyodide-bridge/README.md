# @quant-academy/pyodide-bridge

Browser-side user-code execution for Quant Academy. Wraps Pyodide ^0.26.4 in a
dedicated Web Worker and exposes a typed RPC for running learner-submitted
Python strategies against in-browser OHLCV data.

## Usage

```ts
import { runUserCode } from '@quant-academy/pyodide-bridge'

const result = await runUserCode({
  code: `
def run(close):
    # naive baseline: flat signal
    return {"signal": [0] * len(close)}
`,
  bars, // Bar[]: { t, open, high, low, close, volume }
})

if (result.ok) {
  console.log(result.result.signal) // (number | null)[]
} else {
  console.error(result.code, result.message)
}
```

## Contract

User code MUST define a top-level function:

```py
def run(close: list[float]) -> dict:
    return {"signal": [...]}  # values in {-1, 0, 1}
```

## Limits

- **Code size cap:** 65,536 bytes (rejected before dispatch).
- **Wall clock:** 15s. On timeout the worker is `terminate()`d and a fresh
  one is lazily created on the next call.
- **Denied imports:** the worker installs a Pyodide-side meta-path finder
  that mirrors the server sandbox denied list — `subprocess`, `socket`,
  `urllib`, `ctypes`, `pickle`, `importlib`, `threading`,
  `multiprocessing`, `asyncio`.

## Result shape

`runUserCode()` returns a `RunResult` discriminated union:

- `{ ok: true, result, stdout, stderr, durationMs }` on success
- `{ ok: false, code, message, stdout?, stderr? }` on failure, where `code`
  is one of: `oversized_code`, `missing_run_fn`, `pyodide_init_failed`,
  `user_exception`, `timeout`, `denied_import`, `bad_return_shape`.

## Loading

Pyodide is loaded lazily from the jsDelivr CDN
(`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs`) the first time
the worker handles a `run` message. There is no `pyodide` npm dependency.

## Consumers

This package targets browser runtimes only (it constructs `new Worker(...)`).
In Next.js, import from a client component (`'use client'`). Tests in this
package use a `MockWorker` stub — the real Pyodide path is covered by e2e
browser tests upstream.
