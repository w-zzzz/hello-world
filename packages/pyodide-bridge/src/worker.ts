/// <reference lib="WebWorker" />

import { PYODIDE_CDN_URL, type RunErrorCode, type RunResult, type WorkerMessage } from './types'

declare const self: DedicatedWorkerGlobalScope

interface PyodideAPI {
  loadPackage: (names: string | string[]) => Promise<void>
  runPython: (code: string, options?: { globals?: unknown }) => unknown
  toPy: (x: unknown) => unknown
  globals: { get: (k: string) => unknown; set: (k: string, v: unknown) => void }
  setStdout: (opts: { batched: (s: string) => void }) => void
  setStderr: (opts: { batched: (s: string) => void }) => void
}

let pyodide: PyodideAPI | null = null

async function loadPyodide(): Promise<PyodideAPI> {
  if (pyodide) return pyodide
  const mod = await import(/* @vite-ignore */ PYODIDE_CDN_URL)
  // pyodide.mjs exports `loadPyodide` factory
  const py = (await mod.loadPyodide({
    indexURL: PYODIDE_CDN_URL.replace(/pyodide\.mjs$/, ''),
  })) as PyodideAPI
  await py.loadPackage(['numpy', 'pandas'])

  // Install a Pyodide-side import block for the same modules the server denies.
  py.runPython(`
import importlib.abc, importlib.machinery, sys

_DENIED = {
    'subprocess', 'socket', 'urllib', 'ctypes', 'pickle', 'importlib',
    'threading', 'multiprocessing', 'asyncio', 'os.system',
}

class _SandboxBlock(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        top = fullname.split('.', 1)[0]
        if top in _DENIED or fullname in _DENIED:
            raise ImportError(f"sandbox: '{fullname}' is denied in the browser sandbox")
        return None

sys.meta_path.insert(0, _SandboxBlock())
`)
  pyodide = py
  return py
}

self.addEventListener('message', async (ev: MessageEvent<WorkerMessage>) => {
  const msg = ev.data
  if (msg.kind !== 'run') return
  const t0 = performance.now()
  let stdout = ''
  let stderr = ''
  let result: RunResult
  try {
    const py = await loadPyodide()
    py.setStdout({
      batched: (s) => {
        stdout += `${s}\n`
      },
    })
    py.setStderr({
      batched: (s) => {
        stderr += `${s}\n`
      },
    })
    // Set the closes list as a global so user code can ignore it if it wants
    py.globals.set('__bars_close', py.toPy(msg.closes))
    py.runPython(msg.code)
    // Look up `run` from globals and invoke it
    const userRun = py.globals.get('run') as ((c: unknown) => unknown) | undefined
    if (typeof userRun !== 'function') {
      result = {
        ok: false,
        code: 'missing_run_fn',
        message: 'top-level run() not defined',
        stdout,
        stderr,
      }
    } else {
      const rv = userRun(py.toPy(msg.closes))
      const rvWithToJs = rv as {
        toJs?: (opts: { dict_converter: typeof Object.fromEntries }) => unknown
      }
      const jsRv = rvWithToJs.toJs ? rvWithToJs.toJs({ dict_converter: Object.fromEntries }) : rv
      // Validate shape
      const dict = jsRv as { signal?: unknown }
      if (!dict || typeof dict !== 'object' || !Array.isArray(dict.signal)) {
        result = {
          ok: false,
          code: 'bad_return_shape',
          message: 'run() must return { signal: list[int in {-1,0,1}], ... }',
          stdout,
          stderr,
        }
      } else {
        result = {
          ok: true,
          result: dict as { signal: (number | null)[]; [k: string]: unknown },
          stdout,
          stderr,
          durationMs: performance.now() - t0,
        }
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const code: RunErrorCode =
      message.includes('sandbox:') && message.includes('denied')
        ? 'denied_import'
        : 'user_exception'
    result = { ok: false, code, message, stdout, stderr }
  }
  self.postMessage({ kind: 'run.result', id: msg.id, result } satisfies WorkerMessage)
})
