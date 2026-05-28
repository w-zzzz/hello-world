# Ultra Review (Simulated) — M5 + Codebase Audit

**Date:** 2026-05-27
**Scope:** Cross-cutting review of M0–M5 with deep focus on M5 sandbox security
**Method:** 5 parallel reviewer agents (different perspectives) + 1 synthesizer + main-thread cross-verification
**Total findings:** 12 CRITICAL · 23 HIGH · 26 MEDIUM · 20 LOW (deduplicated to 11 / 17 / 22 / 16 after synthesis)

This document substitutes for `/ultrareview` (cloud-only). Each finding cites file:line and — where possible — a verified reproducer.

---

## Executive summary

M5 ships a backtesting engine + sandbox that is **safe only by trust assumption**. Five reviewers independently surfaced three codebase-spanning CRITICALs that compose into one sentence:

> An unauthenticated visitor can mint a session, farm unlimited XP, run unbounded backtests, and — once M6 routes user code into the runner — read `/etc/shadow` of the API process.

The auth bypass and the sandbox escapes are independent today; they multiply when chained. Numerical work on the indicator parity contract is high-quality for SMA/EMA/RSI/MACD but one indicator (Bollinger) silently ignores the user's param. Frontend has one real XSS vector via the AI tutor pipeline. Architecture's biggest debt is the missing `packages/contracts/` — every cross-language schema change is a runtime trap.

**Bottom line:** M5 is fine for the team + the trusted preset list. Before M6 (user code → sandbox), 4 of the 11 CRITICALs MUST be addressed. The other 7 should follow within a week.

---

## Top 10 fix priorities (this week)

| # | Title | Fixes | Effort | If left |
|---|---|---|---|---|
| 1 | Fail-closed `QA_AUTH_MODE` in production | C-AUTH-1 | XS | Any prod env-var slip exposes `signInAsTestUser` as anonymous auth |
| 2 | Drop `PYTHONPATH` propagation + set `PYTHONSAFEPATH=1` | C-SANDBOX-5 | XS | Pre-runner-`main()` arbitrary code execution via `sitecustomize.py` |
| 3 | `disableParsingRawHTML: true` on tutor markdown + render KaTeX via component overrides | C-XSS-1 | S | Prompt injection → `<img onerror>` → session cookie exfil |
| 4 | XP idempotency: unique partial index `xp_events(user_id, ref_id) WHERE kind='lesson_complete'` | C-XP-1 | S | Unlimited XP farming via server-action replay |
| 5 | Rate-limit `runBacktest` + `markLessonComplete` server actions | H-SERVER-1, H-FRONTEND-1 | S | Sandbox flooding; XP farming |
| 6 | Wire `restrict_builtins` + scrub module-attribute graph | C-SANDBOX-1, C-SANDBOX-4 | M | `pd.io.common.os.system(...)` / `open('/etc/shadow')` |
| 7 | Fix Bollinger TS param: `k` → `stddev` | C-PARITY-1 | XS | Parity passes by coincidence; TS callers silently get wrong output |
| 8 | Schema: `Metrics.profit_factor`/`sharpe`/`sortino` → `Optional[float]` (emit `None` for inf/NaN) | C-METRICS-1 | S | Perfect strategy indistinguishable from all-losses |
| 9 | CJK-aware token estimator in `ai-tutor/budget.ts` | H-AI-2 | XS | Daily token cap missed by ~6× for default zh locale |
| 10 | Stand up `packages/contracts/` with Python→TS codegen | H-ARCH-1 | M | Silent runtime drift on next schema change |

---

## CRITICAL (11, deduplicated)

### C-AUTH-1 — `QA_AUTH_MODE` defaults to `dev` in production
**Verified by 2 reviewers (UR3, UR5) + main-thread re-read.**
`packages/auth/src/config.ts:4-7`:
```ts
const v = process.env.QA_AUTH_MODE
if (v === 'clerk') return 'clerk'
return 'dev'
```
Combined with `signInAsTestUser` (`packages/auth/src/server.ts:71`) which only checks `mode !== 'dev'`: a production deploy with the env var missing/typo'd silently exposes the sign-in-as-anyone server action. `infra/vercel/vercel.json` and `infra/fly/api.fly.toml` do not set `QA_AUTH_MODE`.
**Fix:** In `getAuthMode()`, throw when `NODE_ENV==='production'` and `v!=='clerk'`. Belt-and-braces: also assert at `apps/web/next.config.ts` build-time.

### C-XSS-1 — Tutor message renders untrusted Claude HTML
**UR4. Verified.**
`apps/web/components/tutor-message.tsx`. The `<Markdown>` config has only `options.overrides`, no `disableParsingRawHTML`. `markdown-to-jsx` v7.5 default `disableParsingRawHTML: false` → `<img onerror=...>` in Claude output renders as live DOM. Plus, the file pre-injects `katex.renderToString(...)` HTML *as a string* into the markdown input — even after fixing the raw-HTML flag, the KaTeX HTML still gets through as raw HTML inside markdown.
**Fix:** Set `disableParsingRawHTML: true`. Move KaTeX to component overrides (one for `$$..$$` block, one for `$..$` inline) instead of string-concatenation.

### C-XP-1 — Unlimited XP farming via server-action replay
**Verified UR3, UR4.**
`apps/web/app/actions/progress.ts`. `xp_events` insert is unconditional. The PK collision on `lesson_completions(user_id, lesson_id)` rolls back the *transaction*, but a retry sees `priorRow` exists, takes the `update` branch, and **re-inserts** an `xp_events` row. No idempotency key. No rate limit. Server actions are POST endpoints discoverable via the network tab.
**Fix:** Unique partial index `xp_events (user_id, ref_id) WHERE kind='lesson_complete'`; short-circuit when `priorRow[0]` exists.

### C-SANDBOX-1 — `os.system` reachable via allow-listed modules' attribute graph
**UR1. Reproducer verified.**
`python/qa_sandbox/qa_sandbox/import_hook.py`. `_evict_denied_from_sys_modules()` clears `sys.modules` but leaves live module references **inside** allow-listed modules:
- `pandas.io.common.os` → `os.system('id; cat /etc/shadow')` ✓
- `numpy.ctypeslib.ctypes` → ctypes API
- `numpy.testing.extbuild.subprocess` → subprocess
- `vectorbt.utils.config.pickle` → arbitrary unpickle
- `vectorbt.utils.module_.importlib` → bypass entirely

**Fix:** Walk allow-listed modules' attributes, `delattr` any `ModuleType` whose `__name__` is denied. Realistically Layer-1 cannot win this alone — enforce Layer-2 Docker for non-trusted invocations. Update ADR §8 (currently lies).

### C-SANDBOX-2 — `sys.meta_path.pop(0)` removes the finder
**UR1. Reproducer verified.**
`sys` is allow-listed; finder is index 0. Equivalent: `from qa_sandbox.import_hook import uninstall; uninstall()`.
**Fix:** Immutable `meta_path` shim; narrow `sys` exposure; delete `uninstall` from production code.

### C-SANDBOX-3 — `qa_sandbox.limits.signal.alarm(0)` cancels wall clock
**UR1. Reproducer verified.** Child survived past 2s wall clock.
`python/qa_sandbox/qa_sandbox/limits.py:11-12`. After `sys.modules` eviction, `qa_sandbox.limits.signal` still points to the live module.
**Fix:** `del qa_sandbox.limits.signal` after `install_limits()`; scope the import inside the function.

### C-SANDBOX-4 — `restrict_builtins` exists but is never called
**UR1. Reproducer verified.**
`python/qa_sandbox/qa_sandbox/runner.py:99-110` — `open('/etc/shadow').read()`, `eval(...)`, `compile(...)`, `exec(...)`, `__import__(...)` all live. ADR §8 claims these are blocked — **the ADR is wrong, not the code (for M5 trusted-preset mode)**, but for M6 the runner must wire `restrict_builtins`.

### C-SANDBOX-5 — `PYTHONPATH` propagation + `sitecustomize.py` injection
**UR1. Reproducer verified.**
`python/qa_sandbox/qa_sandbox/executor.py:53-54`: `"PYTHONPATH": os.environ.get("PYTHONPATH", "")`. Any attacker who can set `PYTHONPATH` (env injection upstream, misconfigured deployment) gets full code execution before runner `main()`.
**Fix:** Drop `PYTHONPATH`, set `PYTHONSAFEPATH=1`.

### C-PARITY-1 — Bollinger TS reads `k`; Python/golden use `stddev`
**UR2. Reproducer verified.**
`packages/indicators-ts/src/bollinger.ts:17` calls `coerceNumberParam(input.params, 'k', 2)`. Golden JSON emits `"params": {"period": 20, "stddev": 2.0, ...}`. TS silently falls back to default `2`. Parity test passes only because both defaults are `2.0`. Custom `stddev=4` → TS returns identical to default; Python returns `131.03` vs `142.57`.
**Fix:** Canonicalize on `stddev`. Update both implementations + regenerate goldens.

### C-METRICS-1 — Inf/NaN coerced to `0.0` loses semantic distinction
**UR2. Reproducer verified.**
`python/qa_backtest/qa_backtest/engine.py::_safe_float`. SMA(20,50) with 2 wins / 0 losses: vbt produces `profit_factor=inf`; engine returns `0.0`. Indistinguishable from all-losses (`0.0`) and no-trades (`nan→0.0`).
**Fix:** Schema-level `Optional[float]` for `profit_factor`, `sharpe`, `sortino`. Emit `None` for inf/NaN.

### C-ARCH-1 — `packages/contracts/` does not exist
**UR5 (synthesizer downgrade-able but kept CRITICAL given M6 cascade risk).**
ADR M0 declares `python/qa_core` the **"single wire schema source"** and references `packages/contracts/` as the codegen target. **Neither codegen step nor the contracts package exists.** Hand-mirrored types in `apps/web/app/actions/backtests-types.ts`, `packages/content/src/components/indicator-meta.ts` (self-documented as "Keep in sync until M7"). One Python rename = silent runtime bug in the web client.
**Fix:** `datamodel-codegen` from `qa_core/schemas.py` → `packages/contracts/src/generated/*.ts`; CI gate `pnpm check:contracts` fails on diff.

---

## HIGH (17)

| # | Title | File | Source |
|---|---|---|---|
| H-SANDBOX-1 | Outer subprocess timeout doesn't reap grandchildren | `executor.py` | UR1 |
| H-SANDBOX-2 | Underscore-prefixed module wildcard too broad (`_socket` etc would pass) | `import_hook.py:37-44` | UR1 |
| H-SERVER-1 | `runBacktest` leaks `status='running'` rows on SIGTERM | `actions/backtests.ts:64-100` | UR3 |
| H-AI-1 | AI tutor quota TOCTOU — two concurrent streams blow daily cap | `ai-tutor/budget.ts` | UR3 |
| H-AI-2 | Client-controlled `history` poisons model context (server forwards verbatim) | `tutor/stream/route.ts:42` | UR3 |
| H-AI-3 | Anthropic SDK pinned to `^0.40.0` — multiple majors behind, cache-control API may have shifted | `pnpm-lock.yaml` | UR5 |
| H-AI-4 | CJK token estimator off by ~6× (`chars/3.5`) | `ai-tutor/budget.ts:67` | UR2 |
| H-METRICS-1 | `metrics.exposure` is `Max Gross Exposure`, not time-in-market | `engine.py:151-155` | UR2 |
| H-METRICS-2 | `metrics.turnover` hardcoded `0.0` | `engine.py:165` | UR2 |
| H-GAMIFICATION-1 | `levelForXp` produces ">100% to next" beyond MAX_LEVEL=200 | `gamification/levels.ts` | UR2 |
| H-FRONTEND-1 | No `error.tsx`/`not-found.tsx`/`loading.tsx` anywhere | `apps/web/app/**` | UR4 |
| H-FRONTEND-2 | Chart claims keyboard nav but doesn't implement it | `packages/charts/.../Chart.tsx` | UR4 |
| H-FRONTEND-3 | Tutor input + cmd-K input have no accessible name | tutor-panel, command-palette | UR4 |
| H-SERVER-2 | `getCurrentUserClerk()` swallows transient Clerk outages silently | `auth/server.ts:37-44` | UR3 |
| H-CI-1 | Missing CI gates: axe-core, visual regression, release.yml, data-refresh cron | `.github/workflows/*` | UR5 |
| H-TEST-1 | 5/11 workspace packages have zero tests (incl. `packages/auth`) | various | UR5 |
| H-RATELIMIT-1 | No rate limit on any server action; `runBacktest`/`markLessonComplete` abuseable | actions/* | UR4 |

---

## Cross-cutting chains (the value-add)

### Chain A — "Anonymous visitor reads `/etc/shadow`" (the M6 nightmare)
`C-AUTH-1` (any visitor → any user) → `H-RATELIMIT-1` (unbounded `runBacktest`) → `M-VALIDATOR-1` (float params unbounded in backtest validator) → **[M6: user code reaches runner]** → `C-SANDBOX-4` (no `restrict_builtins` → `open('/etc/shadow')`) OR `C-SANDBOX-1` (`pd.io.common.os.system('id')`) → `H-SANDBOX-1` (grandchildren survive timeout) → exfil via stdout.
**Today this is blocked only by "presets-only" trust.** Every link goes live the instant M6 ships.

### Chain B — "Unlimited XP + farm anybody's account"
`C-AUTH-1` (sign in as anyone) → `C-XP-1` (no idempotency) → `H-RATELIMIT-1` (no rate limit) → adversary scripts thousands of completions against any user_id. Combined with `H-GAMIFICATION-1` the level display goes mathematically broken.

### Chain C — "Prompt-injection → cookie exfil"
Lesson content (which `M-FRONTEND-5` notes users can't distinguish from real) → `H-AI-2` (client-controlled history preloads malicious assistant turns) → Claude emits `<img onerror>` → `C-XSS-1` (markdown-to-jsx renders it) → non-httpOnly cookie exfil (next-intl locale cookie etc).

### Chain D — "Numerical drift goes undetected"
`H-ARCH-1` (no contracts pkg) + `C-METRICS-1` (inf→0.0) + `H-METRICS-1` (exposure wrong) + `H-METRICS-2` (turnover=0). A strategy comparison dashboard shows two strategies with `profit_factor=0.0` (one perfect, one terrible), `exposure=1.0` for both, and `turnover=0.0` for both. No one notices because all numbers look plausible.

### Chain E — "Sandbox tests don't catch sandbox bugs"
`M-SANDBOX-TESTS-1` (tautological tests) + ADR §8 wishlist + `C-SANDBOX-2`/`C-SANDBOX-3` (escapes) → CI stays **green** through every demonstrated escape. A future contributor regresses a fix, CI doesn't notice.

---

## Gaps caught by no individual reviewer (synthesizer + main-thread)

1. **`tutor_messages.conversation_id` has no FK and no `user_id` binding**. Verified in `packages/db/src/schema/tutorMessages.ts` — only `userId` FK; `conversation_id` is just a `uuid('not null')`. Any user who guesses/observes a UUID could `INSERT` into another user's conversation. UUIDv4 is guess-resistant but the schema doesn't *enforce* per-user isolation. **Fix:** add a unique `(user_id, conversation_id)` constraint OR include `user_id` in the conversation key OR enforce ownership check on every write.
2. **Locale switch mid-stream**. ⌘K palette lets user switch locale during an active SSE tutor stream → half-zh/half-en transcript persisted to `tutor_messages`. No reviewer noticed.
3. **`xp_events.amount` is unbounded**: no CHECK constraint. Combined with `M-XP-NEG` (`xpForLessonComplete` no negative guard), an admin tool could underflow the sum.
4. **Stdout corruption attack on sandbox-runner**: executor parses `subprocess.stdout` as JSON. If a preset writes to stdout before the result envelope, the JSON parse fails → infra error. Buggy preset = sandbox error.
5. **KaTeX HTML survives even with `disableParsingRawHTML: true`** (synthesizer): the C-XSS-1 fix needs the second step of rendering math via component overrides, not string-concatenated `<span>` HTML.

---

## What's done well (don't lose this in the noise)

- **No inter-package import cycles** — dep graph is a clean DAG.
- **i18n keys exactly match between zh/en** line-for-line. Rare discipline.
- **`stripMdx` is char-level deterministic** (not regex) — stable cache key for AI tutor; defeats CodeQL false positives.
- **Sandbox-runner README documents prod invocation correctly** (gVisor, `--network=none`, `--read-only`, `--cap-drop=ALL`).
- **`canonical_config_hash` is dict-order independent** + `run_id` correctly excluded from determinism hash.
- **All Drizzle FKs to `users.id` cascade**; partial unique index on `backtest_runs(config_hash) WHERE status='succeeded'` correctly implemented.
- **Server-only barriers** correctly placed: every `apps/web/lib/{auth,db,ai}.ts` declares `'server-only'`.
- **No client-bundle secret leak** — UR4 grepped the `.next/static` bundle for `ANTHROPIC_API_KEY` / `sk-ant-`.
- **Mulberry32 / Box-Muller JS↔Py byte-identical**; SMA crossover 5×-run SHA-256 identical.
- **Hard rlimits (CPU/RSS) cannot be raised by attacker code** — kernel-enforced (verified by UR1).
- **CodeQL JS+Python weekly + sandbox-negative `if: always()`** — security gate cannot be skipped.
- **CSRF protection on workshop form** via Next 16 encrypted-closure server actions.
- **CODEOWNERS scopes high-risk paths** (sandbox, auth dependencies).

---

## M5.1 (immediate patch — within this week)

Numbered to match Top-10 above:
1. `getAuthMode()` fail-closed in prod.
2. Drop `PYTHONPATH`, set `PYTHONSAFEPATH=1`.
3. `disableParsingRawHTML: true` + KaTeX component override.
4. `xp_events` unique partial index + idempotency check.
5. Per-user rate-limit table for server actions.
6. Wire `restrict_builtins` for M6 + attribute-graph scrub stub.
7. Bollinger `k`→`stddev`.
8. `Metrics.{profit_factor,sharpe,sortino}` → `Optional[float]`.
9. CJK token estimator.
10. **Update ADR §8** to match shipped reality (delete false claims about `open`/`eval`/`compile` blocked).
11. Add `apps/web/.env.example` with mandatory `QA_AUTH_MODE=clerk` for prod.

## M6 entry criteria (MUST be true before user-supplied code reaches sandbox)

- `restrict_builtins` wired and exhaustive (kills C-SANDBOX-4)
- Attribute-graph walk scrubs denied-module refs (kills C-SANDBOX-1)
- `sys.meta_path` immutable; `uninstall()` test-only (kills C-SANDBOX-2)
- `qa_sandbox.limits.signal` ref deleted post-install (kills C-SANDBOX-3)
- Executor invokes Docker for `mode='untrusted'` jobs (`--network=none --cap-drop=ALL --read-only --user nobody --pids-limit=16 --memory=512m`)
- `start_new_session=True` + `os.killpg` on timeout (kills H-SANDBOX-1)
- Negative tests cover ALL escapes verified by UR1 (currently tautological; see M-SANDBOX-TESTS-1)
- Runner job spec carries `mode: 'trusted'|'untrusted'`; refuses untrusted without above

## Pre-M11/M12 polish

- `packages/contracts/` codegen + CI gate (H-ARCH-1)
- Unify server-action error envelope to discriminated `{ ok: true, ... } | { ok: false, error, code? }`
- Sentry stubs in `instrumentation.ts` + `main.py`
- `docs/curriculum/`, `docs/security/`, `docs/runbooks/`, `docs/README.md` (ADR index), `CONTRIBUTING.md`
- Per-package READMEs for `auth`, `ai-tutor`, `content`, `i18n`, `ui`
- jest-axe + visual regression CI gates
- Migrate `lessonCompletions.score` from `numeric(5,2)` → `smallint(0..10000)`
- i18nize 8+ hardcoded English strings in cmd-K palette, workshop, tearsheet
- `error.tsx` / `not-found.tsx` / `loading.tsx` per locale
- Chart keyboard navigation (or update ADR to defer)
- `@anthropic-ai/sdk` bump + verify cache-hit-rate metric still holds

---

## Open questions for the team

1. Should `getAuthMode()` hard-fail in prod when `QA_AUTH_MODE != 'clerk'`? **(Strongly recommend yes.)**
2. XP idempotency: unique partial index, or per-request idempotency key on the action input?
3. M9 janitor scope: stuck `running` rows → `failed` with synthesized error, or kept for forensics?
4. M4 client-controlled `history` — keep for MVP, or server-reconstruct from `tutor_messages` now?
5. `SandboxError` discriminator (`kind: 'user'|'resource'|'infra'`) → 422 / 429 / 503?
6. Canonical Bollinger param name: `k` or `stddev`?
7. `markdown-to-jsx` vs `react-markdown` + `rehype-sanitize` for tutor output?
8. Chart keyboard-nav ADR claim — ship the feature or defer the doc?
9. `@anthropic-ai/sdk` bump-and-revalidate, or pin to exact 0.40.x?
10. `lessonCompletions.score`: migrate to `smallint(0..10000)`?

---

## Verification methodology

- **Round 1 (parallel × 5)**: 5 agents in worktree isolation with read + execute permission; ran tests, probed via `subprocess`/`uv run python -c '...'`, read source.
- **Round 2 (synthesis × 1)**: read all 5 reports + cross-referenced via direct code reading. Deduplicated, recalibrated severity, identified gaps.
- **Round 3 (main-thread cross-verification)**: 7 critical claims re-verified by direct code reading from the trunk branch HEAD.

All sandbox escape reproducers in C-SANDBOX-1..C-SANDBOX-5 are **verified executable** under the current `claude/quant-trading-platform-3RrRH` HEAD (commit `34136c0` at audit time).
