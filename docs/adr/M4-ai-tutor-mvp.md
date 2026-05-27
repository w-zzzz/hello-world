# ADR M4 — AI Tutor MVP (streaming + prompt caching + budget, no tools)

**Status:** Accepted
**Date:** 2026-05-26
**Milestone:** M4

## Context

M3 shipped accounts and progress persistence; users can be identified and have a per-user data scope. M4 introduces the **AI tutor MVP**: a streaming Claude-powered chat embedded in the lesson viewer that answers questions grounded in the current lesson's context, with **three-layer prompt caching** to keep cost manageable and a **per-user daily token budget** to prevent runaway spend.

This milestone deliberately ships *without* tool-use, extended thinking, or model routing — those are M10. The MVP demonstrates:
- Streaming UX (first token < 2s).
- Cache hit rate > 50% on the second message of a session (verified via Anthropic usage reporting).
- Hard budget cap with a graceful "tomorrow" message.
- Full message persistence for future training-data audit / replay.
- Anthropic key never reaches the browser.

This is also the first milestone to use the **`claude-api`** skill as the canonical reference for SDK calls; the AI-client implementer agent invokes that skill.

## Decisions

### 1. Model & SDK

- **Model:** `claude-sonnet-4-6` for all tutor turns. Opus / extended thinking reserved for M10's "deep review" CTA.
- **SDK:** `@anthropic-ai/sdk` ^0.40 (Node.js). Used only in Next.js server-side code; never bundled to the client.
- **Auth:** `ANTHROPIC_API_KEY` env. In CI the key is absent and tests use a mocked client.

### 2. System prompt: 3 cache breakpoints

Every request assembles a `system` array of three text blocks; each carries `cache_control: { type: 'ephemeral' }`:

| Layer | Source | Approx tokens | Cache scope |
|---|---|---|---|
| `GLOBAL_RULES` | `packages/ai-tutor/src/prompts/global.ts` — identity, refusals, KaTeX/Markdown formatting, "no personalized advice" disclaimer, language-mirror rule (reply in the user's locale) | ~1,500 | All users, near-100% hit |
| `CURRICULUM_INDEX` | Generated at build from `@quant-academy/content` curriculum — track table + 1-line summary per lesson + glossary stubs | ~3,000 | All users, ~100% hit after first request of the deploy |
| `LESSON_CONTEXT(lessonId)` | Per-lesson MDX-prose extraction (strip JSX components, keep narrative + math) | ~1,000–4,000 | Per-lesson per-user session, high hit rate after 1st message |

Cache breakpoints apply between layers; ordering matters and must be stable (caching is prefix-based). User+assistant turns are uncached and accumulate in the `messages` array.

### 3. Streaming + SSE

Next.js route handler `app/api/tutor/stream/route.ts` exposes a POST that returns a `text/event-stream` response. Each Anthropic SDK stream event is forwarded as an SSE frame:

```
event: text
data: "Hello"

event: usage
data: {"input_tokens":1234,"cache_read_input_tokens":4321,"output_tokens":42}

event: done
data: {}
```

Client uses `EventSource` (or a `fetch` + `ReadableStream` reader for POST — the latter, since EventSource doesn't support POST bodies). Implement via fetch + ReadableStream + TextDecoder.

### 4. Per-user daily budget

Caps per user per UTC day:
- `MAX_SONNET_INPUT = 200_000` tokens
- `MAX_SONNET_OUTPUT = 40_000` tokens

Tracked in `ai_usage(user_id, day, sonnet_in, sonnet_out, opus_in, opus_out)` (M3 declared the table but didn't create it; M4 adds it via new migration).

Flow:
1. Pre-flight: estimate input tokens from system + history + user message. If `current_sonnet_in + estimate > MAX_SONNET_INPUT`, return 429 with a translated "daily quota exceeded, try tomorrow" message; do NOT call Anthropic.
2. Streaming: collect actual usage from the `message_stop` event; upsert `ai_usage` row.
3. Post-flight: if response exceeded the soft warning threshold (80% of either cap), enqueue an in-app banner for the next request (M10 will surface; M4 just logs).

Estimation: tokens ≈ `Math.ceil(chars / 3.5)` (Anthropic's published guideline for English/Chinese mix). Good enough for budget gating; the actual count from the API is authoritative for accounting.

### 5. Persistence

New table `tutor_messages` (M3 declared, created in M4 migration):

```sql
tutor_messages(
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id text,                                -- null for /tutor freestyle chat
  conversation_id uuid not null,                 -- groups a chat session
  role text not null check (role in ('user','assistant')),
  content text not null,
  tokens_in int,
  tokens_out int,
  cache_read_input_tokens int,
  cache_creation_input_tokens int,
  model text not null,
  created_at timestamptz not null default now()
)
create index tutor_messages_conversation_created on tutor_messages(conversation_id, created_at);
```

`conversation_id` lets us group a back-and-forth into one logical chat and is the unit of cache continuity (we always send the full conversation in the messages array).

### 6. New packages & files

| Path | Purpose |
|---|---|
| `packages/ai-tutor/` | new — Anthropic SDK client wrapper, prompt-cache-aware system builder, budget checker, conversation persistence helpers |
| `packages/ai-tutor/src/client.ts` | Anthropic SDK instantiation, request shape, streaming generator |
| `packages/ai-tutor/src/prompts/global.ts` | GLOBAL_RULES constant |
| `packages/ai-tutor/src/prompts/curriculum.ts` | CURRICULUM_INDEX builder (calls `@quant-academy/content`) |
| `packages/ai-tutor/src/prompts/lesson.ts` | per-lesson context extractor (reads lesson MDX file, strips JSX, returns narrative text) |
| `packages/ai-tutor/src/budget.ts` | quota check + estimation + ai_usage upsert |
| `packages/ai-tutor/src/persistence.ts` | tutor_messages insert helpers |
| `packages/ai-tutor/src/__tests__/*` | unit tests w/ mocked SDK + property tests for cache invariants |
| `packages/db/src/schema/tutorMessages.ts` | new Drizzle table |
| `packages/db/src/schema/aiUsage.ts` | new Drizzle table |
| `packages/db/migrations/0001_ai_tables.sql` | new migration adding the two tables |
| `apps/web/app/api/tutor/stream/route.ts` | SSE proxy route handler |
| `apps/web/components/tutor-panel.tsx` | lesson-viewer right rail chat UI (client) |
| `apps/web/app/[locale]/tutor/page.tsx` | full-page tutor for `/tutor` |
| `apps/web/lib/ai.ts` | server-only barrel re-exporting from `@quant-academy/ai-tutor` |

### 7. UI

**TutorPanel** (right rail on lesson viewer, collapsible on mobile to a bottom sheet):
- Header: "AI Tutor · {model}".
- Messages list with markdown rendering (use existing MDX components for `<MathBox>`; do NOT trust assistant output to be safe MDX — render via a strict markdown renderer like `markdown-to-jsx` with allowlisted tags).
- Input box with Cmd+Enter to send.
- Below input: small badge showing daily usage % (e.g. `42% used of 200k`).
- States: disconnected (not signed in), idle, streaming, error, quota_exceeded.

**Lesson viewer integration:** TutorPanel mounts conditionally — only when `getCurrentUser()` returns non-null. For anonymous users, show the existing "sign in to ask the tutor" stub.

**`/tutor` page** (full-screen): Same component, no `lessonId` → ChatGPT-style freestyle. Adds a "Pick a lesson context" dropdown (top of the page) sourced from curriculum.

### 8. Security & cost controls

- API key only in Next.js server runtime; verified by `node-only` import guard.
- Rate limit: per-user 1 request in flight at a time (server enforces via Redis-less in-memory lock keyed by `userId`; OK for single-node MVP).
- Profanity / prompt-injection: M4 trusts users (no scanning) but the system prompt instructs the model to ignore meta-instructions. M10 adds Anthropic's `prompt-caching-2024-07-31` beta moderation if needed.
- Conversation length cap: 50 user+assistant turns. Beyond that, the client must start a new conversation (so cache stays effective).

### 9. CI

- `test-js` already runs vitest; ai-tutor tests use a mocked `@anthropic-ai/sdk` and don't hit the network.
- A `pnpm run check:ai-prompts` script verifies cache layer order is stable + total prompt fits within 100k tokens (sanity guard).
- `ANTHROPIC_API_KEY` is NOT set in CI; integration tests skip Anthropic calls.

### 10. Path conventions for parallel agents

| Agent | Exclusive write paths |
|---|---|
| **db-extension** | `packages/db/src/schema/{tutorMessages,aiUsage}.ts`, `packages/db/src/schema/index.ts` (additive re-exports), `packages/db/migrations/0001_ai_tables.sql`, `packages/db/migrations/meta/*` |
| **ai-client** (uses `claude-api` skill) | `packages/ai-tutor/**` (new package, full ownership) |
| **route-handler** | `apps/web/app/api/tutor/stream/route.ts`, `apps/web/lib/ai.ts`, additive deps in `apps/web/package.json` |
| **frontend-chat** | `apps/web/components/tutor-panel.tsx`, `apps/web/app/[locale]/tutor/page.tsx`, additive edit to `apps/web/app/[locale]/lessons/[id]/lesson-page.tsx` to mount TutorPanel, additive i18n keys |
| **lesson-extractor** | `packages/ai-tutor/src/prompts/{curriculum,lesson}.ts` (BUT this is owned by the ai-client agent — folded in) |

Five-way wave: db-extension, ai-client, route-handler, frontend-chat, (and a separate i18n/test agent if needed). For M4, fold the SSE route handler into the ai-client agent to reduce inter-agent contracts. Four agents total:

1. **db-extension** — tutorMessages + aiUsage tables + migration
2. **ai-client** (with claude-api skill) — `@quant-academy/ai-tutor` package including prompts, client, budget, SSE route handler
3. **frontend-chat** — TutorPanel + /tutor page + lesson viewer integration + i18n
4. **ci-config** — additive: scripts/check-ai-prompts.ts + root script + CI step (small enough to fold into ai-client; SKIPPED as separate agent)

Settling on **3 parallel agents**: db-extension, ai-client (incl. SSE route + prompt verification script), frontend-chat.

## Exit criteria

1. With `ANTHROPIC_API_KEY` set, visit `/zh/lessons/A-01-what-is-market` as signed-in user, open the tutor panel, type "what is a candlestick?", see streaming response with KaTeX rendering where applicable.
2. Anthropic console shows `cache_read_input_tokens` > 50% of `input_tokens` on the second message of a session (i.e. cache is being hit).
3. Without `ANTHROPIC_API_KEY`, the tutor panel renders an inline "Tutor unavailable in this environment" message; tests + build still pass.
4. Daily quota: simulate 200k input tokens via tests; verify 429 + UI quota banner.
5. `pnpm test` passes including ai-tutor unit tests.
6. CI green: lint + typecheck + tests + build + parity.
7. `pnpm run check:ai-prompts` passes.
8. tutor_messages rows persist after a chat; visible via `SELECT * FROM tutor_messages WHERE user_id = ...`.

## Open / deferred

- Tool use (`get_price_data`, `compute_indicator`, `run_backtest`, `lookup_lesson`) — M10.
- Extended thinking for deep strategy review — M10.
- Opus model routing — M10.
- Multi-conversation history sidebar — post-M11.
- File / image attachments — out of scope until M12+.
- Cost monitoring dashboard / Slack alerts — M12.

## References

- Plan §5.5 (AI tutor design), §6 (M4 row)
- `claude-api` skill — invoked by ai-client agent
- Anthropic prompt-caching docs
- M3 ADR (auth, db, server actions baseline)
