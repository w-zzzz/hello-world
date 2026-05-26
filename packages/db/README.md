# @quant-academy/db

Drizzle ORM schema + Postgres client for Quant Academy.

## Tables

- `users` — identity (clerk / dev session) + profile + JSONB prefs
- `lesson_completions` — composite PK `(user_id, lesson_id)`, score, attempts, time spent
- `xp_events` — append-only XP log with `xp_event_kind` enum + `(user_id, created_at DESC)` index
- `streaks` — per-user current / longest / last-active

All FKs cascade on user delete.

## Setup

```bash
# 1. Start Postgres (from repo root)
docker compose -f infra/docker/docker-compose.yml up -d postgres

# 2. Apply migrations
pnpm --filter @quant-academy/db run db:migrate

# 3. Seed dev user (idempotent)
pnpm --filter @quant-academy/db run db:seed
```

Connection string defaults to `postgres://qa:qa@localhost:5432/qa`; override via `QA_DATABASE_URL`.

## Usage

```ts
import { db, users } from '@quant-academy/db'

const all = await db.select().from(users)
```

The client module declares `'server-only'` — importing it from client components fails at build time.

## Migrations

`migrations/0000_initial.sql` is hand-authored to match `src/schema/**`. After the first real Postgres-backed sync, regenerate the snapshot:

```bash
pnpm --filter @quant-academy/db run db:generate
```

This refreshes `migrations/meta/0000_snapshot.json`, which `drizzle-kit` uses to diff future schema changes. The runtime migrator only needs the SQL file + journal.

## Scripts

| Script | Purpose |
| --- | --- |
| `db:generate` | drizzle-kit generate (diff schema -> SQL) |
| `db:migrate` | Apply pending migrations (via `tsx src/migrate.ts`) |
| `db:studio` | Launch drizzle-kit Studio |
| `db:seed` | Insert deterministic dev user |
| `lint` / `typecheck` / `test` | Standard checks |
