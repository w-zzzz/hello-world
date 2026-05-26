# ADR M3 — Auth + Progress + XP MVP

**Status:** Accepted
**Date:** 2026-05-25
**Milestone:** M3

## Context

M0/M1/M2 are stateless: lessons render, indicators compute, but nothing persists across reloads except localStorage. M3 introduces the first stateful tier — **users, lesson completions, XP events, and streaks** persisted to PostgreSQL, with an authentication layer.

The plan §5.7 commits to **Clerk** for hosted auth + **Drizzle ORM + Neon Postgres** for app data. M3 scaffolds the full Clerk integration but ships with a **bypass mode** (`QA_AUTH_MODE=dev`) so dev + CI can run end-to-end without Clerk credentials. Prod (`QA_AUTH_MODE=clerk`) uses real Clerk session cookies.

This milestone is the foundation for M8 (full gamification) and M10 (AI tutor with per-user context).

## Decisions

### 1. Auth strategy: Clerk + dev bypass

Two modes selected via `process.env.QA_AUTH_MODE`:

| Mode | When | UI | Server |
|---|---|---|---|
| `dev` (default) | local + CI | "Sign in as test user" button → sets `qa-session` cookie with a deterministic test UUID | reads `qa-session` cookie, upserts user with display_name `Test User` |
| `clerk` | prod | Clerk `<SignIn />` / `<SignUp />` widgets | reads Clerk session, upserts user keyed by `clerk_id` |

A single `getCurrentUser()` adapter in `packages/auth/src/server.ts` switches on the env var. Both modes return the same `{ id, handle, displayName, locale, createdAt }` shape. **No business code branches on auth mode**.

Clerk middleware is wired but no-op when `QA_AUTH_MODE !== 'clerk'`. Clerk env vars (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) are optional — absent in dev/CI.

### 2. Database: Postgres + Drizzle ORM + `packages/db`

A new package `packages/db` owns:
- Drizzle schema (`schema/*.ts`)
- Drizzle config (`drizzle.config.ts`)
- A typed `getDb()` client returning the Drizzle instance
- Migration files (`migrations/`)
- A `seed.ts` helper for dev fixtures

Schema (M3 subset of plan §5.7 table list):

```ts
// schema/users.ts
users(
  id uuid pk default gen_random_uuid(),
  clerk_id text unique,                          -- null in dev mode; set in clerk mode
  dev_session_id text unique,                    -- null in clerk mode; set in dev mode
  handle text not null unique,                   -- @auto-generated until user changes
  display_name text not null,
  locale text not null default 'zh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  prefs jsonb not null default '{}'
)

// schema/lessonCompletions.ts
lesson_completions(
  user_id uuid not null references users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  score numeric(5,2),                            -- 0..100 percent (quiz score)
  attempts int not null default 1,
  time_spent_s int not null default 0,
  primary key (user_id, lesson_id)
)

// schema/xpEvents.ts
xp_events(
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('lesson_complete','quiz_perfect','streak_bonus','daily_challenge','achievement')),
  amount int not null,
  ref_id text,                                   -- e.g. lesson_id for lesson_complete events
  created_at timestamptz not null default now()
)
create index xp_events_user_created on xp_events(user_id, created_at desc);

// schema/streaks.ts
streaks(
  user_id uuid pk references users(id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_active_date date not null default current_date
)
```

Achievements, user_achievements, strategies, backtest_runs, etc. are **deferred to M8/M5**. Only the 4 tables above are required for M3.

### 3. Connection management

`packages/db/src/client.ts`:
```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.QA_DATABASE_URL ?? 'postgres://qa:qa@localhost:5432/qa';
const queryClient = postgres(url, { max: 10 });
export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
```

For Next.js, `db` is imported in server components / server actions only (not in client). The `'server-only'` package is used to enforce this.

### 4. Migrations + dev DB

- `pnpm --filter @quant-academy/db run db:generate` — uses drizzle-kit to generate SQL from schema
- `pnpm --filter @quant-academy/db run db:migrate` — applies migrations to `QA_DATABASE_URL`
- `pnpm --filter @quant-academy/db run db:seed` — inserts the dev test user + 0 lesson completions
- `pnpm --filter @quant-academy/db run db:studio` — drizzle-kit studio for inspection
- `docker compose -f infra/docker/docker-compose.yml up postgres` brings up local Postgres (already configured in M0)

### 5. XP / gamification: `packages/gamification`

New package with pure functions (no DB / no React):

```ts
// xp.ts
export function xpForLessonComplete(lesson: { xp: number; difficulty: 'beginner'|'intermediate'|'advanced' }): number;
export function quizScoreMultiplier(correct: number, total: number): number;   // 0.5 + 0.5 * (correct/total)
export function firstTryBonus(attempts: number): number;                       // 1.25 if attempts === 1 else 1
export function streakBonus(currentStreak: number): number;                    // min(currentStreak, 30) * 5

// levels.ts
export function levelForXp(totalXp: number): { level: number; xpIntoLevel: number; xpForNext: number };
export function xpForLevel(n: number): number;                                  // floor(100 * n^1.5)

// streak.ts
export function nextStreakState(
  current: { current: number; longest: number; last_active_date: string },
  today: string,
): { current: number; longest: number; last_active_date: string };
```

Property tests via vitest:
- Level curve monotonic non-decreasing
- `streakBonus(0) === 0`
- `nextStreakState`: same-day = no change; consecutive day = +1; gap > 1 day = reset to 1

### 6. Server actions (Next.js side)

`apps/web/app/actions/progress.ts`:

```ts
'use server';
export async function markLessonComplete(input: { lessonId: string; score?: number; timeSpentS?: number }): Promise<{ xpAwarded: number; newLevel: number | null }>;
export async function getProfile(): Promise<{ user: User; xpTotal: number; level: number; lessonsCompleted: number; streak: { current: number; longest: number } }>;
```

Implementation flow for `markLessonComplete`:
1. `getCurrentUser()` → upsert user if missing.
2. Lookup lesson meta from `@quant-academy/content`.
3. Compute XP = `xpForLessonComplete(lesson) * quizScoreMultiplier(score) * firstTryBonus(attempts)`.
4. Inside a single Drizzle transaction:
   - `INSERT ... ON CONFLICT (user_id, lesson_id) DO UPDATE SET attempts = attempts + 1, score = greatest(score, $score)` into `lesson_completions`.
   - `INSERT INTO xp_events (...)`.
   - Upsert `streaks` (compute via `nextStreakState`).
5. Return new XP total + level.

No business logic in HTTP layer — all in `packages/gamification` + server action. API/REST endpoints for these are deferred (Next.js server actions are sufficient for M3; an external REST API can wrap them in M4 if AI tutor needs them).

### 7. UI changes

- `apps/web/app/[locale]/profile/page.tsx` — server component:
  - Shows display name, handle, level ring (cosmetic only — never gates content), total XP, current streak, list of completed lessons.
  - "Sign out" button (dev mode: clears cookie; clerk mode: Clerk's `SignOutButton`).

- `apps/web/app/[locale]/sign-in/page.tsx` — renders Clerk `<SignIn />` in clerk mode; renders dev sign-in button (POSTs to `signInAsTestUser` server action) in dev mode.

- `apps/web/app/[locale]/sign-up/page.tsx` — mirror.

- `apps/web/components/mark-complete-button.tsx` — client component on lesson viewer. POSTs to `markLessonComplete` server action. Shows confetti-free toast with XP awarded + new level (if any). Disabled / hidden when not authenticated; clicking shows a "Sign in to track progress" inline prompt instead.

- `apps/web/components/user-menu.tsx` — appears in landing/top-right when a user exists; otherwise shows "Sign in". Includes link to profile.

- i18n keys added: `auth.signIn`, `auth.signUp`, `auth.signOut`, `auth.signedInAs`, `auth.devTestUser`, `profile.title`, `profile.level`, `profile.totalXp`, `profile.streak`, `profile.lessonsCompleted`, `profile.empty`, `lesson.markComplete`, `lesson.completed`, `lesson.xpAwarded`, `lesson.levelUp`, `lesson.signInPrompt`.

### 8. Testing

- Unit tests for `packages/gamification` (≥ 12 tests).
- Integration tests for `packages/db`: schema parses, migrations apply against an in-process Postgres via `pg-mem` or testcontainers. If testcontainers feels heavy, use a `pg-mem` shim that supports our subset (UUIDs, jsonb, timestamptz, generated default).
  - Decision: **use a real Postgres in CI via GitHub Actions `services:` block** for true Drizzle compat. `pg-mem` doesn't support all Drizzle features.
- Server-action tests: tiny `vitest` suite that invokes the action with a faked `cookies()` returning a known session id, asserts DB rows + return value.

### 9. CI extension

Add a Postgres service to relevant jobs:
```yaml
jobs:
  test-js:
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: qa
          POSTGRES_PASSWORD: qa
          POSTGRES_DB: qa
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      QA_DATABASE_URL: postgres://qa:qa@localhost:5432/qa
      QA_AUTH_MODE: dev
    steps:
      - …
      - run: pnpm --filter @quant-academy/db run db:migrate
      - run: pnpm test
```

`build` job adds dummy `QA_AUTH_MODE=dev` to suppress Clerk env requirement at build time.

### 10. Path conventions for parallel agents

| Agent | Exclusive write paths |
|---|---|
| db | `packages/db/**`, additive to `infra/docker/docker-compose.yml` (env), additive to root `pnpm-workspace.yaml` |
| auth | `packages/auth/**`, `apps/web/middleware.ts` (rewrite), `apps/web/app/[locale]/sign-in/**`, `apps/web/app/[locale]/sign-up/**`, additive `apps/web/package.json` deps |
| gamification | `packages/gamification/**` |
| server-actions | `apps/web/app/actions/**`, `apps/web/lib/auth.ts` (re-export of getCurrentUser) |
| frontend | `apps/web/app/[locale]/profile/**`, `apps/web/components/mark-complete-button.tsx`, `apps/web/components/user-menu.tsx`, additive `apps/web/app/[locale]/lessons/[id]/lesson-page.tsx` (add MarkCompleteButton), additive i18n keys |
| ci | additive to `.github/workflows/ci.yml` (postgres service + migrate step on test-js + build job env vars) |

### 11. Wave plan

Wave 1 (parallel × 6 worktree-isolated agents):
1. **db** — Drizzle schema + migrations + client + drizzle-kit config + tests
2. **auth** — packages/auth with Clerk + dev bypass adapter + middleware + sign-in/sign-up pages
3. **gamification** — XP/level/streak pure functions + 15+ unit tests
4. **server-actions** — markLessonComplete + getProfile + cookie session helper
5. **frontend** — profile page + mark-complete button + user menu + i18n keys
6. **ci** — postgres service + migrate step + env wiring

Agents 4 and 5 declare contracts (signatures + DTOs) inline in their prompts; no inter-agent imports beyond `@quant-academy/db`, `@quant-academy/auth`, `@quant-academy/gamification`.

## Exit criteria

1. `docker compose up postgres` + `pnpm --filter @quant-academy/db run db:migrate` succeed.
2. Visit `/zh/sign-in` (dev mode) → click "Sign in as test user" → redirected, cookie set.
3. Visit `/zh/lessons/A-01-what-is-market`, click "Mark complete" → toast "+50 XP".
4. Visit `/zh/profile` → see level, XP total, lessons completed = 1, streak: current=1.
5. Repeat mark-complete on A-02 → XP rises, streak.current still 1 (same day).
6. CI green: lint + typecheck + tests (incl. new gamification + db migration runs) + build + parity.
7. `pnpm exec biome ci .` clean.
8. Clerk mode renders the Clerk widget when `QA_AUTH_MODE=clerk` and env keys present (verified by code review, not CI).

## Open / deferred

- Achievements (M8). Schema not added in M3.
- Leaderboards (M8).
- Strategy submissions (M5/M6).
- Tutor message persistence (M4).
- Right-to-delete cascade — deferred to M12.

## References

- Plan §5.6 (gamification), §5.7 (data layer), §6 (M3 row)
- M0/M1/M2 ADRs
- Drizzle ORM v0.36+ docs
- next-intl typed server-side calls
