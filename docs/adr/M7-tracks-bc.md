# ADR M7 — Tracks B + C content build-out (~40 lessons)

**Status:** Accepted
**Date:** 2026-05-28
**Milestone:** M7 (XL complexity)
**Builds on:** M1 (content infra), M2 (5-indicator playground), M4 (AI tutor lesson context)

## Context

M1 shipped the content runtime (MDX loader, `<Chart>`, `<Quiz>`, `<Pitfall>`, `<KeyPoint>`, KaTeX, `lesson.<locale>.mdx` convention) and authored 3 lessons in Track A. M2 shipped the `<IndicatorPlayground>` for 5 indicators (sma / ema / rsi / macd / bollinger) under a tight Python↔TS parity gate.

M7 fills the body of the curriculum: **30 lessons in Track B (single indicators) + 10 lessons in Track C (signal construction)**, all bilingual zh/en. After M7 the platform has 44 fully authored lessons (A×3 + B×30 + C×10 + H×1) covering the conceptual core of "what is an indicator, what is a signal, how do you not lie to yourself".

Per plan §6 row M7 the entry criteria are: **all B/C lessons bilingual, quiz, AI tutor context接入**. Per plan §7 the execution model is **multi-agent parallel content authors per cluster, one agent per indicator-family in worktree isolation**.

### Non-goals for M7
- **No new indicator implementations.** The 5 M2 indicators stay the canonical TS↔Python parity set. Lessons about non-implemented indicators (WMA, ATR, ADX, Stochastic, OBV, VWAP, Ichimoku, etc.) teach conceptually with KaTeX + worked examples + base `<Chart>` references. Future milestones can promote individual indicators to playground status by adding python golden + TS impl + parity test; this is additive and does not change M7 content.
- **No new chart primitives.** `<Chart symbol="SPY" />` and `<IndicatorPlayground indicator="…" />` are the only data-aware components used.
- **No deeper AI tutor surface.** M7 wires the existing `lessonId → context` cache layer — the tutor already pulls lesson metadata from the curriculum index, which is sufficient. AI tool use (M10) is out of scope.
- **No backtest workshop integration.** Lessons reference vectorbt conceptually; the "run a real backtest" CTA stays on `/workshop` (M5) and `/editor` (M6).
- **No content for Tracks D-H.** Those land in M9 (Track D-H, ~50 lessons).

## Decisions

### 1. Scope freeze — exact lesson list

Tracks B + C entries already exist in `packages/content/src/curriculum.ts` with `mdxReady: false`. M7 ships MDX bodies + meta for every one of them, and flips `mdxReady: true` once content lands.

**Track B — 30 lessons across 11 modules:**

| Module | IDs | Count |
|---|---|---|
| moving-averages | B-01 SMA, B-02 EMA, B-03 WMA | 3 |
| bollinger | B-04 bands, B-05 strategies | 2 |
| rsi | B-06 intro, B-07 math, B-08 divergence | 3 |
| macd | B-09 intro, B-10 histogram | 2 |
| oscillators | B-11 stochastic, B-12 CCI, B-13 Williams %R | 3 |
| momentum | B-14 ADX/DMI, B-15 Parabolic SAR, B-16 SuperTrend | 3 |
| volatility | B-17 ATR, B-18 Keltner, B-19 Donchian | 3 |
| volume-flow | B-20 OBV, B-21 VWAP, B-22 MFI, B-23 Volume Profile | 4 |
| ichimoku | B-24 intro, B-25 signals | 2 |
| pivots | B-26 pivot points, B-27 Fibonacci pivots | 2 |
| composite | B-28 indicator quality, B-29 lookahead traps, B-30 review | 3 |

**Track C — 10 lessons across 4 modules:**

| Module | IDs | Count |
|---|---|---|
| confluence | C-01 intro, C-02 multi-timeframe | 2 |
| divergence | C-03 detection, C-04 divergence game | 2 |
| regime | C-05 regime detection | 1 |
| composite | C-06 aggregation, C-07 smoothing-vs-lag, C-08 false-signal filter, C-09 workshop, C-10 review | 5 |

### 2. Lesson anatomy (every lesson)

Mirroring A-01 / A-02 / A-03 conventions:

```
lessons/<TrackId>/<module>/<lesson-id>/
├── meta.ts                          # exports defineLesson({...})
├── lesson.zh.mdx                    # 800–1200 字
└── lesson.en.mdx                    # 600–900 words
```

Each MDX file must contain:

1. **Title** (`# …`) matching the lesson's English/Chinese name.
2. **Intro paragraph** stating what the learner will know after the lesson.
3. **3–6 body sections** — definition, math, intuition, example, limitations.
4. **At least one KaTeX block** (`$$…$$`) — formula or canonical identity. Inline math allowed with `$…$`.
5. **At least one `<Chart>` OR `<IndicatorPlayground>`** reference. Playground only for indicators in the M2 set (sma/ema/rsi/macd/bollinger). Otherwise plain `<Chart symbol="SPY" />`.
6. **One `<Pitfall>` block** — common mistake learners make about this concept.
7. **One `<KeyPoint>` block** — the takeaway the learner should remember.
8. **Two `<Quiz>` blocks** at the end with ids `<lesson-id>-q1` and `<lesson-id>-q2`. Quiz IDs are shared across locales — answer index must match between zh and en.

### 3. Cross-locale parity contract

- Same number of sections in zh and en.
- Same quiz count + same answer indices keyed by `<lesson-id>-q<n>`.
- Same `<Chart>` / `<IndicatorPlayground>` invocations (so the visual surface matches).
- Translation is **technically faithful, not literal** — idioms localize, formulas don't.

### 4. AI tutor lesson-context wiring

The tutor already pulls `meta` + raw MDX into the `LESSON_CONTEXT` cache layer (M4). M7 adds no new code in `packages/ai-tutor`. The tutor will see every B/C lesson the moment its MDX lands, because the cache key is the lesson id and the loader pulls from disk on cache miss.

### 5. Curriculum integration step

Each content author writes only its own lesson directories — never touches `curriculum.ts`. After all author agents return, the main agent does **one** edit:

- For every lesson id that now has a `meta.ts` + both MDX files on disk, set `mdxReady: true` in `curriculum.ts`.
- Update `packages/content/src/tests/schema.test.ts` `mdxReady` assertion: was `['A-01-what-is-market', 'A-02-price-spread', 'A-03-order-types', 'H-03-notebook-workflow']` (4 ids), becomes the same 4 plus 40 B+C ids = 44 ids.

This is the only file with multi-author write conflicts, and centralizing it avoids cherry-pick storms.

### 6. Agent fleet — single wave, 11 worktrees parallel

| Agent | Scope | # lessons | # files |
|---|---|---|---|
| B-MA | B-01, B-02, B-03 | 3 | 9 |
| B-Bollinger | B-04, B-05 | 2 | 6 |
| B-RSI | B-06, B-07, B-08 | 3 | 9 |
| B-MACD | B-09, B-10 | 2 | 6 |
| B-Oscillators | B-11, B-12, B-13 | 3 | 9 |
| B-Momentum | B-14, B-15, B-16 | 3 | 9 |
| B-Volatility | B-17, B-18, B-19 | 3 | 9 |
| B-Volume | B-20, B-21, B-22, B-23 | 4 | 12 |
| B-Ichimoku-Pivots | B-24, B-25, B-26, B-27 | 4 | 12 |
| B-Composite | B-28, B-29, B-30 | 3 | 9 |
| C-All | C-01..C-10 | 10 | 30 |

Total: 40 lessons × 3 files = **120 new files** across 11 worktrees.

All 11 agents spawn in the **same message** with `isolation: "worktree"`. They each commit on a sub-branch under `claude/M7-<agent>`. The main agent picks up the lesson directories by checking out each worktree branch into the main worktree (cherry-pick is unnecessary — each agent writes only non-overlapping paths).

### 7. Quality gates

- `pnpm test` — content schema tests must still pass with the updated mdxReady list.
- `pnpm lint` — biome on every new file.
- `pnpm typecheck` — every `meta.ts` must satisfy the schema.
- CI on push verifies build (web): every `mdxReady: true` lesson must successfully `import` from `packages/content/lessons/...`. This catches missing files or broken MDX at build time, not runtime.

### 8. Style guide (binding on all author agents)

- **Voice:** second-person, friendly but not infantilizing. "You'll see…" not "the reader will…".
- **Math:** KaTeX. Inline `$\sigma_n$`. Display blocks for full formulas, even short ones. Never write math as plain text.
- **Citations:** no external URLs. The platform is its own canonical source.
- **Numbers:** use real, plausible values. Don't say "the indicator is high" — say "RSI > 70".
- **Bilingual register:** zh uses Simplified Chinese, professional but conversational. en uses American English.
- **Length:** zh 800–1200字, en 600–900 words per lesson. Both within ±20% of the A-track baseline.

## Consequences

- **Positive:** Platform has a defensible Indicator Lab and a coherent path from "what is RSI" to "how do you build a non-self-deluding signal". Curriculum is no longer 95% scaffolding.
- **Positive:** Sets the pattern for M9 (Tracks D-H, ~50 lessons) — same agent fleet shape, larger scope.
- **Negative:** 40 lessons of educational content are inherently long-tail. Reviewer agent should sample, not enumerate. Authors are trusted to follow the style guide.
- **Negative:** Locks the M7 indicator set to the M2 5-indicator playground until a future milestone explicitly expands it. Lessons about ATR/ADX/Ichimoku/etc. are conceptual rather than interactive.

## Verification

- 40 new directories under `packages/content/lessons/{B,C}/<module>/<id>/`, each with `meta.ts` + `lesson.zh.mdx` + `lesson.en.mdx`.
- `pnpm --filter @quant-academy/content test` reports 44 mdxReady lessons.
- `pnpm --filter web build` succeeds.
- Spot-check 4 random lessons (1 zh + 1 en × 2 lessons) — formulas render, quizzes interact, charts/playgrounds mount.
