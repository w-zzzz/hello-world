# ADR M6 — Strategy editor + Pyodide browser sandbox

**Status:** Accepted
**Date:** 2026-05-28
**Milestone:** M6 (L complexity)
**Builds on:** M5.1 sandbox hardening (restrict_builtins wired, multi-copy meta_path, killpg reaper, attribute-graph scrub)

## Context

M5 shipped the trusted-preset backtest path. M6 opens the user-code path: the learner writes Python in a Monaco editor in the browser, sees instant feedback via Pyodide running in a Web Worker, and can "promote to server" for a full server-side backtest run.

Per plan §5.4, this is the **two-tier sandbox** moment: Pyodide is Tier 1 (safe by design — runs in browser sandbox), the M5.1-hardened qa_sandbox is Tier 2 (now invoked with `mode='untrusted'`, which finally wires `restrict_builtins` and the Docker `--runtime=runsc` wrapper).

### Non-goals for M6
- Vectorbt in browser — wheel size (~30MB) + numba unsupported under Pyodide. Server-side backtesting only for the full tearsheet path.
- Multi-file strategies — single file only.
- Strategy sharing / forking — out of scope until post-M11 social tier.
- Pyodide package installation by user (`micropip.install`) — locked allowlist for M6.
- Backtrader in either tier — deferred to M7+.
- Persistent strategy storage / versioning — basic save-to-DB lands in M8.

## Decisions

### 1. The contract: a strategy is a `run(close) → dict` function

User code must define exactly one function:

```python
def run(close: list[float]) -> dict:
    # Compute entry/exit signals based on `close`. Optionally return
    # diagnostics. The returned dict must include 'signal' as a list of
    # ints in {-1, 0, +1} aligned with `close`.
    return {'signal': signals, 'note': 'optional commentary'}
```

This contract is **identical between browser and server**. Pyodide invokes `run(close_list)` with the bundled SPY sample data; the server-side untrusted runner does the same with the parity_input fixture (M7 will route real-data ingest). Both check the return shape and emit a `RunResult`.

### 2. Pyodide architecture (Tier 1)

- **Pyodide ^0.26**: ships with numpy + pandas + scipy wheels. We **do not** install vectorbt (no wheel + numba unsupported).
- **Web Worker isolation**: Pyodide runs in a dedicated worker (`packages/pyodide-bridge/src/worker.ts`). Main thread holds RPC channel only — no Pyodide globals leak to React state.
- **CSP**: no `connect-src` to user-controlled origins; `worker-src 'self' blob:`.
- **Stdin / network**: Pyodide configured with `stdin: () => null` and no network shim (`urllib`/`requests` either absent or raise at import).
- **Resource limits**:
  - Hard timeout: 15s wall clock enforced by main thread terminating the worker on `setTimeout`.
  - Memory: Pyodide's V8 wasm heap cap (default 2GB on Chrome); the worker process can be terminated if main-thread heartbeat detects unresponsiveness.
  - Code size cap: 64KB. Reject before sending.
- **Allowlisted imports inside Pyodide**:
  - Always available: `numpy`, `pandas`, `math`, `statistics`, `datetime`, `json`, `typing`, `dataclasses`.
  - On-demand: `scipy` (loaded only on first import to keep cold-start fast).
  - **Denied** (a Pyodide-side import hook mirrors qa_sandbox/allowlist.py): `subprocess`, `os` (read-only `os.path` facade), `socket`, `urllib`, `ctypes`, `pickle`, `pty`, `importlib`.

### 3. Tier 2: qa_sandbox with `mode='untrusted'`

The job spec gets a new field:

```python
class SandboxJob(StrictModel):
    preset: str | None = None
    code: str | None = None
    mode: Literal['trusted', 'untrusted']  # always inferred — see below
    params: dict[str, str | int | float] = {}
    universe: list[str] | None = None
    data: list[Bar]
```

Inference: `mode='trusted'` iff `preset` is set and `code` is None. `mode='untrusted'` iff `code` is set. Both set → 422.

When `mode='untrusted'`:
1. `restrict_builtins(globals_dict)` is wired into the runner before user code is `exec()`'d (recall: this strips `eval`, `exec` from globals; `compile`, `__import__`, `open`, `breakpoint`, `help`).
2. The user's source is compiled with `compile(code, '<user>', 'exec', dont_inherit=True)`.
3. `exec(compiled, restricted_globals)` runs in the import-hook-protected, rlimit-bounded child process.
4. After exec, the runner looks up `restricted_globals['run']` and invokes it with the `close` array from `data`.
5. The returned dict is validated against the contract and turned into the canonical `BacktestResult`.

Layer-2 docker wrapping (`--runtime=runsc` when available): the executor checks for a `QA_SANDBOX_RUNTIME` env var. If set to `runsc`, the subprocess is invoked via `docker run --runtime=runsc --network=none --read-only --cap-drop=ALL --user nobody --memory=512m --pids-limit=16 quant-academy/sandbox`. Otherwise (dev, CI without runsc), falls back to the existing in-process subprocess approach.

### 4. API extension

`POST /backtests/` body schema (extended):

```python
class RunBacktestRequest(StrictModel):
    preset: str | None = None
    code: str | None = None              # NEW — Python source for untrusted mode
    params: dict[str, str | int | float] = {}
    universe: list[str] | None = None
    start: date | None = None
    end: date | None = None
```

Validation:
- Exactly one of `preset` / `code` must be set (422 otherwise).
- When `code`: max 65,536 bytes (422 if exceeded).
- The `code` field is hashed into `config_hash` so user-code runs participate in the same cache-on-success behavior as presets.

### 5. Editor UX

New route `apps/web/app/[locale]/editor/page.tsx`:
- **Layout** (desktop, 12-col grid):
  - Left 7 cols: Monaco editor + samples dropdown + "Run" / "Promote to server" buttons.
  - Right 5 cols: result panel (signal chart overlaid on SPY close, stdout/stderr, return-value JSON).
- **Mobile**: stacked single column.
- **Samples** (hardcoded into `packages/pyodide-bridge/src/examples/`):
  1. `sma_crossover.py` — direct port of M5's preset.
  2. `mean_reversion.py` — RSI-based bounce.
  3. `momentum.py` — N-day return rank.
- **Run flow**:
  1. Browser-side validation: code size ≤ 64KB, contains `def run(`.
  2. Lazy-load Pyodide on first run (~5s cold, ~50ms warm).
  3. Send `{code, bars}` to worker; worker returns `{result, stdout, stderr, durationMs}` or `{error}`.
  4. Show signal overlay + return-value JSON + console.
- **Promote-to-server flow**:
  1. Hit `POST /backtests/` with `{code, params: {}}`.
  2. Existing M5 plumbing handles enqueue / run / tearsheet redirect.
  3. URL: `/workshop/<run-id>`.

### 6. Lesson H-03 unlock

The plan's Track H lesson `H-03-notebook-workflow` becomes the natural intro to the editor. M6 marks it `mdxReady` and ships a minimal MDX file (zh + en) that:
- Explains the `run(close)` contract.
- Walks through editing the SMA crossover sample.
- Includes one `<Quiz>` (what should `run` return?).
- Includes a "Try it" callout linking to `/editor`.

Full curriculum content for H-01..H-12 still lands in M9; M6 ships only H-03.

### 7. Path conventions for parallel agents

| Agent | Exclusive write paths |
|---|---|
| **pyodide-bridge** | `packages/pyodide-bridge/**` (new pkg) |
| **editor-frontend** | `apps/web/app/[locale]/editor/**`, `apps/web/components/strategy-editor/**`, additive deps in `apps/web/package.json`, additive i18n keys |
| **sandbox-untrusted** | `python/qa_sandbox/qa_sandbox/code_runner.py` (new), additive edits to `python/qa_sandbox/qa_sandbox/runner.py`, new tests in `python/qa_sandbox/tests/test_untrusted.py` |
| **api+schemas** | `python/qa_core/qa_core/schemas.py` (add `code` to RunBacktestRequest — keep additive), `apps/api/qa_api/routes/backtests.py` (extend), `apps/api/tests/test_backtests.py` (additive tests) |
| **content+lesson** | `packages/content/lessons/H/idea/H-03-notebook-workflow/**` (zh + en + meta), `packages/content/src/curriculum.ts` (flip mdxReady for H-03), `packages/pyodide-bridge/src/examples/*.py` (sample Python — yes this is shared with the bridge agent, see below) |

**Cross-agent contract**: The `RunBacktestRequest.code` field + the `run(close) → dict` shape are frozen by this ADR. All agents work against that.

**Shared examples**: The Python sample strategies live under `packages/pyodide-bridge/src/examples/*.py`. The bridge agent creates the directory + an empty `.gitkeep`; the content agent ships the actual `.py` files. To avoid a directory-create race, the bridge agent's prompt explicitly creates the dir first.

### 8. CI extension

Add to `.github/workflows/ci.yml`:
- The existing `Sandbox Negative Tests` job picks up `test_untrusted.py` automatically (it runs the whole `python/qa_sandbox/tests/` dir).
- A new lightweight job is NOT needed for Pyodide — its behavior is unit-tested via the bridge package's vitest suite with a stub Worker.

## Exit criteria

1. Visit `/zh/editor` as a signed-in user → see Monaco + sample dropdown defaulting to `sma_crossover.py`.
2. Click Run → first call loads Pyodide (~5s), runs `run(close)`, shows the signal overlay on the SPY chart + the return-value JSON. Subsequent runs are <100ms warm.
3. Type `import socket` in the editor → Run → see a sandbox-import error in stderr, no crash.
4. Type `while True: pass` → Run → worker terminated at 15s wall-clock; UI shows timeout message.
5. Click "Promote to server" → POST /backtests/ → redirect to `/workshop/<run-id>` with the full tearsheet.
6. Server-side: `uv run pytest python/qa_sandbox/tests/test_untrusted.py -v` covers: happy path, denied import, eval/exec stripped, oversized code rejected, missing `run` function caught.
7. Lesson `H-03-notebook-workflow` renders in both locales and links to `/editor`.
8. CI green: all existing gates + new tests.

## References
- Plan §5.4 (sandbox), §6 (M6 row)
- Ultra Review report `docs/reviews/ultra-review-m5.md`
- M5 ADR
- Pyodide 0.26 docs
