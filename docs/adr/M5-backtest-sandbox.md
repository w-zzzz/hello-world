# ADR M5 — Backtest backend + sandbox-runner + tearsheet

**Status:** Accepted
**Date:** 2026-05-27
**Milestone:** M5 (XL — security-sensitive)

## Context

M0–M4 shipped the read-heavy half of Quant Academy (lessons, indicators, auth, AI tutor). M5 introduces the **compute-heavy half**: a real Python backtesting engine with a result tearsheet, served behind a **hardened sandbox** so future user-submitted strategies (M6/H-12 capstone) can run safely on the server.

For the MVP, the only entry point is **named presets** (no arbitrary user code yet — that's M6). But the sandbox layer is built in M5 so its security is reviewed before any untrusted code path opens.

### Non-goals for M5
- User-submitted arbitrary code execution from the UI — M6 (Pyodide first, then routes back through this sandbox).
- ARQ queue / background workers — M5 ships synchronous execution; queueing added when M6 + capstone go live.
- Multi-strategy parameter grids — comes with vectorbt's native support but UI exposure is M9.
- Polygon / live market data — bundled sample data only.

## Decisions

### 1. Two-layer security model

| Layer | Always on | Purpose |
|---|---|---|
| **Layer 1 — Python sandbox** (`python/qa_sandbox`) | yes (dev + CI + prod) | Restricted globals, import allowlist, `resource.setrlimit` (CPU 10s / RSS 512MB / fds 64 / processes 1), `signal.SIGALRM` wall-clock 30s, stdout capture, no `eval`/`exec`/`compile`/`__import__` exposure, no network (socket module not allowlisted) |
| **Layer 2 — Container** (`apps/sandbox-runner`) | prod only (optional in dev) | Docker `--network=none --read-only --cap-drop=ALL --user nobody --memory=512m --cpus=1 --pids-limit=100`, optional `--runtime=runsc` (gVisor) for kernel-level isolation, ephemeral one-shot containers |

Layer 1 is the source of truth for tests. Layer 2 is deployment hardening; documented in `apps/sandbox-runner/README.md`. CI's `sandbox-negative-tests` job exercises **Layer 1 only** — Layer 2 is verified by a manual prod runbook + occasional red-team drills (post-launch).

### 2. Import allowlist (Layer 1)

Hard allowlist, enforced via a custom `__import__` that raises `ImportError` for anything outside:

```
numpy, pandas, polars (optional), scipy, math, statistics, datetime, json,
qa_core, qa_indicators, qa_backtest, vectorbt, pandas_ta, matplotlib.figure,
io, typing, dataclasses, enum, functools, itertools, decimal, fractions
```

Denied (raise on import): `socket`, `urllib`, `requests`, `httpx`, `subprocess`, `os` (most of it; provide a sanitized facade with only `os.path` reads under the bound data dir), `pathlib` (sanitized — read-only Paths under `/data`), `ctypes`, `multiprocessing`, `threading.Thread` start, `signal`, `pickle.load` (unpickling), `pty`, `pdb`, `inspect.signature` is fine but `inspect` module itself denied, `gc.set_debug`, `sys.setrecursionlimit > 5000`, `importlib`, `builtins.__import__` reassignment.

### 3. Backtest engine

- **Primary:** `vectorbt` ≥ 0.26 (vectorized, fast, sufficient for M5 presets).
- **Secondary:** `backtrader` ≥ 1.9 (deferred — M5 ships vectorbt only).
- **Preset library:** `python/qa_backtest/presets/`. M5 ships exactly **one** preset: `sma_crossover(fast=20, slow=50)`. Future presets land in M7+.

### 4. Standard `BacktestResult` schema

Already defined in `python/qa_core/qa_core/schemas.py` (created in M0). M5 *uses* it as the contract between sandbox-runner and API/UI. Any field not yet populated (e.g. `rolling`, `benchmark`) defaults to `None` and the UI renders accordingly.

The runner serializes the result to JSON; the API stores it in `backtest_results.metrics jsonb / equity jsonb / trades jsonb` (M5 migration).

### 5. DB tables (new in M5)

```sql
backtest_runs(
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  preset text,                              -- nullable when M6 submits raw code
  config_hash text not null,                -- sha256 of canonical(config); enables dedup cache
  status text not null check (status in ('queued','running','succeeded','failed')),
  error text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
)
create index backtest_runs_user_queued on backtest_runs(user_id, queued_at desc);
create unique index backtest_runs_config_hash on backtest_runs(config_hash) where status = 'succeeded';

backtest_results(
  run_id uuid pk references backtest_runs(id) on delete cascade,
  metrics jsonb not null,
  equity jsonb not null,
  trades jsonb not null,
  drawdown_periods jsonb not null default '[]',
  rolling jsonb,
  benchmark_metrics jsonb,
  warnings jsonb not null default '[]'
)
```

Tables added via migration `0002_backtest_tables.sql`.

The `config_hash` unique-on-success index lets us short-circuit re-runs of the exact same preset+params combo, returning the cached result instantly. Cache key includes: preset id, params, universe, period, sandbox version.

### 6. API

FastAPI routes in `apps/api/qa_api/routes/backtests.py`:

```
GET  /backtests/presets                       → list of {id, name, description, params: ParamSpec[]}
POST /backtests                               → {preset, params, universe, period} → {run_id, status}
GET  /backtests/{run_id}                      → BacktestRun + Result (if available)
```

For M5 MVP the POST runs **synchronously** (returns when done; 15–30s typical). If/when it gets slow we add a queue.

`POST /backtests` flow:
1. Auth: `current_user` (Clerk JWT in prod; dev cookie in CI/dev — reuses M3 flow via FastAPI dependency).
2. Validate `preset` against registry, params against preset's ParamSpec.
3. Compute `config_hash`.
4. Look up cached succeeded run by `config_hash`; if found and user owns it, return cached.
5. Insert `backtest_runs` row with status='running'.
6. Invoke sandbox-runner subprocess → JSON result.
7. Update `backtest_runs.status` + insert `backtest_results`.
8. Return run + result.

### 7. Sandbox-runner microservice (Layer 2)

`apps/sandbox-runner/`:
- `runner.py` — entry point. Reads job spec from stdin (JSON), imports `qa_sandbox.execute`, writes JSON result to stdout.
- `Dockerfile` — python:3.12-slim, installs qa_core, qa_indicators, qa_backtest, qa_sandbox, vectorbt, pandas, numpy. Sets `USER nobody`.
- `compose.yml` — local-dev convenience.
- `README.md` — prod deployment notes: `docker run --rm -i --network=none --read-only --cap-drop=ALL --user nobody --memory=512m --cpus=1 --pids-limit=100 --tmpfs /tmp:rw,size=64m,noexec --runtime=runsc quant-academy/sandbox < job.json > result.json`. Doc states runsc is optional but recommended.

For M5 the API does NOT shell out to Docker (would complicate dev/CI). It directly invokes `qa_sandbox.execute()` in a subprocess of the FastAPI process. The Docker layer is documented for prod operators; the boundary tests target `qa_sandbox` directly.

### 8. Negative tests (the milestone gate)

> **M5 ships the sandbox in trusted-preset mode**: the import hook + rlimits + SIGALRM are the M5 protections. `eval` / `exec` / `compile` / `open` are **NOT** restricted in M5; that hardening lands in M6 when user-supplied code is admitted. Until then, only first-party presets reach the runner. The negative tests below cover only the M5-shipped protections.

`python/qa_sandbox/tests/test_negative.py` — pytest suite asserting that each attack vector fails with the expected exception or non-zero exit code.

#### M5-enforced protections (covered by CI)

| Attack | Expected |
|---|---|
| `import socket` | `ImportError` |
| `import os; os.system('ls')` | `ImportError` on os (the sandbox import-hook blocks bare `os`) |
| `while True: pass` | killed by `SIGALRM` within wall-clock 30s |
| Memory bomb (`x = [0] * 10**9`) | `MemoryError` (rlimit RSS) |
| Fork bomb (`os.fork()`) | `OSError` (rlimit nproc=1) — note os is blocked anyway, double defense |
| Network access (`urllib.request.urlopen(...)`) | `ImportError` on `urllib` |
| Subprocess (`subprocess.run('ls')`) | `ImportError` |
| Pickle unpickle hostile payload | blocked: `pickle` not allowlisted |
| `ctypes` to dlopen libc | `ImportError` |
| `import threading` / `multiprocessing` / `asyncio` / `inspect` / `signal` / `resource` | `ImportError` (denied by import allowlist) |

All assertions in CI. The job is wired to run on **any** PR that touches `python/qa_sandbox/**` or `apps/sandbox-runner/**` — already declared as `Sandbox Negative Tests` in M0 CI; M5 flips it from placeholder to real.

#### Deferred to M6 (NOT enforced in M5)

The following were aspirationally listed in earlier drafts of this ADR but are **not** actually blocked by the M5 runner. They are acceptable risk for M5 because only trusted first-party presets execute; they become hard requirements when M6 opens the runner to user-supplied code.

| Attack | Current M5 reality | M6 plan |
|---|---|---|
| ~~`open('/etc/passwd')` → `PermissionError`~~ | `open` is unrestricted | `restrict_builtins` removes/wraps `open` to deny FS reads outside data dir |
| ~~`eval('__import__("socket")')` → `NameError`~~ | `eval` is unrestricted | `eval` removed from restricted globals |
| ~~`compile('print(1)', '<x>', 'exec')` → blocked~~ | `compile` is unrestricted | `compile` removed from restricted globals |
| ~~`sys.setrecursionlimit(10**9)` → clamped~~ | succeeds; deep recurse falls back on stack-size rlimit | wrap `sys` facade to clamp `setrecursionlimit` ≤ 5000 |

M6 entry criteria — including the full builtin-restriction wiring tracked above — are captured in `docs/reviews/ultra-review-m5.md`.

### 9. Determinism contract

Two runs of the same `(preset, params, universe, period, sandbox_version)` must produce **bit-identical** `metrics + equity + trades`. CI gate: `pytest python/qa_backtest/tests/test_determinism.py` runs the SMA crossover 5× and asserts identical SHA-256 of the result JSON. Numpy/pandas seeds are not needed because vectorbt is deterministic given the input bars, but we set `numpy.random.seed(0)` defensively in case any future preset uses RNG.

### 10. UI

- `apps/web/app/[locale]/workshop/page.tsx` — preset picker + run button. Pre-selects SMA crossover; param sliders auto-rendered from `ParamSpec`. Submits to `/backtests` via server action.
- `apps/web/app/[locale]/workshop/[run_id]/page.tsx` — tearsheet view.
- `apps/web/components/tearsheet.tsx` — composed of:
  - `<EquityChart>` (re-uses `@quant-academy/charts` line series)
  - `<DrawdownChart>` (red filled area below zero)
  - `<MetricsGrid>` (Sharpe, Sortino, MDD, total return, profit factor, win rate, trade count, exposure)
  - `<TradesTable>` (last 50 trades; paginated)
  - `<RunHeader>` (preset id, params, universe, period, status badge, "Re-run" button)

i18n keys for all of the above.

### 11. Wave plan (5 parallel agents)

| Agent | Exclusive write paths |
|---|---|
| **db-extension** | `packages/db/src/schema/{backtestRuns,backtestResults}.ts`, additive to `packages/db/src/schema/index.ts`, `packages/db/migrations/0002_backtest_tables.sql`, `packages/db/migrations/meta/{0002_snapshot.json,_journal.json}` |
| **backend-py** | `python/qa_backtest/**` (vectorbt adapter + SMA preset + tests), `python/qa_sandbox/**` (hardened subprocess + import hook + tests including negative suite), `apps/sandbox-runner/**` (Dockerfile + runner.py + README) |
| **api** | `apps/api/qa_api/routes/backtests.py` (replace stub), `apps/api/tests/test_backtests.py`, additive deps in api `pyproject.toml` if needed |
| **frontend** | `apps/web/app/[locale]/workshop/**`, `apps/web/components/tearsheet.tsx` + sub-components, `apps/web/app/actions/backtests.ts`, additive i18n keys, additive `apps/web/package.json` deps |
| **ci** | additive to `.github/workflows/ci.yml` — flip `sandbox-negative` from placeholder to real test invocation, add `backtest-determinism` step inside `test-py` job |

### 12. Round 3 (per plan §7.2)

After integration of the 5 agents, run `/ultrareview` on the merged result before declaring M5 complete. Out of scope for me to invoke automatically — flag it to the user post-merge.

## Exit criteria

1. `pnpm install && uv sync --all-packages && pnpm --filter @quant-academy/db run db:migrate` succeed.
2. POST `/backtests` with `{preset: 'sma_crossover', params: {fast: 20, slow: 50}}` returns a complete `BacktestResult` in < 30s.
3. Visit `/zh/workshop` → pick SMA crossover → click Run → tearsheet renders with equity curve, drawdown, metrics grid, trades.
4. Negative tests pass: every attack in §8's **M5-enforced protections** table fails closed. (Deferred-to-M6 rows are explicitly not gated in M5.)
5. Determinism test: same config 5× produces identical JSON hash.
6. CI green: lint + typecheck + tests + build + parity + **sandbox-negative** (newly real) + **backtest-determinism**.
7. `apps/sandbox-runner/README.md` documents the prod Docker run + optional gVisor.

## References
- Plan §5.3 (backtesting), §5.4 (sandbox security), §6 (M5 row)
- M0/M3/M4 ADRs
- vectorbt docs
- gVisor docs (for prod hardening reference)
