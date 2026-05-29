# ADR M9 — Tracks D–H content build-out (~57 lessons)

**Status:** Accepted
**Date:** 2026-05-29
**Milestone:** M9 (XL complexity)
**Builds on:** M1 (content infra), M2 (indicator playground), M7 (Tracks B+C pattern), M8 (gamification — track-complete achievements now reward finishing D/E/F/G/H conceptually)

## Context

M7 authored Tracks B+C (40 lessons) with a 12-agent fleet. M9 finishes the curriculum body: **Tracks D (15) + E (15) + F (8) + G (10) + H (12, of which H-03 already ships) = 57 new lessons**, all bilingual zh/en. After M9 every one of the 110 curriculum lessons is authored.

The M7 retrospective surfaced two infra fixes that are now in place and de-risk M9:
1. `infra(husky)` — the pre-commit hook tolerates fresh worktrees (no more `--no-verify` scramble).
2. `infra(mdx)` — `scripts/check-mdx-attrs.py` + a `lint-js` CI gate catches the nested-ASCII-`"`-in-JSX-attribute bug that broke M7 builds repeatedly. **Authors must run `python3 scripts/check-mdx-attrs.py` before committing.**

### Non-goals for M9
- **No new indicator implementations.** Same as M7: the M2 5-indicator playground set (sma/ema/rsi/macd/bollinger) is the only interactive set. Strategy/metric lessons teach conceptually with KaTeX + `<Chart>` + worked numeric examples.
- **No new chart primitives or MDX components.** Use the existing set.
- **No live backtest execution embedded in lessons.** Reference `/workshop` (M5) and `/editor` (M6); don't build new compute surfaces.
- **No grading engine for H-12.** The graduation-project lesson describes the rubric in prose; an automated grader is post-M11.
- **No AI tutor code changes.** H-10 (ai-deep-review) describes the deep-review CTA conceptually; the tutor already sees every lesson via the curriculum index.

## Decisions

### 1. Scope — exact lesson list (57 new)

All entries already exist in `curriculum.ts` with `mdxReady: false`. M9 ships MDX + meta for each and flips `mdxReady: true`.

**Track D — Backtesting Foundations (15)** · modules: returns, metrics, costs, bias, validation
D-01 returns, D-02 log-returns, D-03 max-drawdown, D-04 sharpe-ratio, D-05 sortino-calmar, D-06 profit-factor, D-07 mae-mfe, D-08 slippage, D-09 commissions, D-10 lookahead-bias, D-11 survivorship-bias, D-12 is-vs-oos, D-13 walk-forward, D-14 monte-carlo, D-15 deflated-sharpe-pbo

**Track E — Strategy Archetypes (15)** · modules: trend-following, mean-reversion, momentum, breakout, stat-arb, events, factors, crypto, china
E-01 turtle-system, E-02 donchian-breakout, E-03 ma-crossover, E-04 pairs-trading, E-05 bollinger-reversion, E-06 momentum-cross-section, E-07 momentum-time-series, E-08 breakout-strategy, E-09 statistical-arbitrage, E-10 event-driven, E-11 seasonality, E-12 vol-carry, E-13 factor-intro, E-14 crypto-funding-carry, E-15 china-t1-limits

**Track F — Risk & Sizing (8)** · modules: sizing, stops, risk-mgmt
F-01 fixed-fractional, F-02 vol-targeting, F-03 kelly-criterion, F-04 stop-loss-design, F-05 take-profit-trailing, F-06 risk-of-ruin, F-07 portfolio-heat, F-08 risk-review

**Track G — Portfolio Construction (10)** · modules: weights, optimization, rebalance
G-01 equal-weight, G-02 inverse-vol, G-03 risk-parity, G-04 mvo-intro, G-05 ledoit-wolf, G-06 black-litterman, G-07 rebalance-frequency, G-08 turnover-aware, G-09 drift-rebalance-workshop, G-10 portfolio-review

**Track H — Ship Your Strategy (11 new; H-03 already done)** · modules: idea, prototype, validation, submission
H-01 strategy-hypothesis, H-02 universe-selection, H-04 vectorbt-prototype, H-05 realistic-costs, H-06 walk-forward-ship, H-07 robustness-checks, H-08 stress-testing, H-09 strategy-spec, H-10 ai-deep-review, H-11 paper-trading, H-12 graduation-project

### 2. Lesson anatomy (unchanged from M7 ADR §2)

```
lessons/<TrackId>/<module>/<lesson-id>/
├── meta.ts                 # export default defineLesson({...})  — CANONICAL shape
├── lesson.zh.mdx           # 800–1200 字
└── lesson.en.mdx           # 600–900 words
```

Each MDX: H1 title, intro, 3–6 sections, ≥1 KaTeX `$$…$$` block, ≥1 `<Chart symbol="SPY" />` (or `<IndicatorPlayground>` only for the M2 5), one `<Pitfall>`, one `<KeyPoint>`, exactly two `<Quiz>` with ids `<lesson-id>-q1`/`-q2` and **identical answer indices across locales**.

### 3. Hard rules for every author agent (learned from M7)

- **meta.ts uses `defineLesson({...})` default export.** Do NOT use `export const meta: LessonMeta = {…}` and do NOT add `title`/`summary`/`locales`/`quizIds` fields — the schema rejects them (M7 B-Bollinger broke typecheck this way).
- **No YAML frontmatter in MDX.** There is no `remark-frontmatter` plugin; a `---` block renders as junk. Start the file with `# H1` directly (M7 B-Bollinger broke this way).
- **No straight ASCII `"` inside JSX attribute values.** Use single quotes (en) or full-width 「」 (zh). Run `python3 scripts/check-mdx-attrs.py` before committing — it must report 0 issues.
- **Do NOT touch `curriculum.ts`.** The integrator flips `mdxReady`.
- **Do NOT spawn sub-agents. Do NOT run `pnpm install`/`build`.**

### 4. Agent fleet — 8 agents, one wave

| Agent | Scope | # |
|---|---|---|
| D-Metrics | D-01..D-07 (returns, metrics) | 7 |
| D-Pitfalls | D-08..D-15 (costs, bias, validation) | 8 |
| E-TrendMR | E-01..E-08 (trend-following, mean-reversion, momentum, breakout) | 8 |
| E-Advanced | E-09..E-15 (stat-arb, events, factors, crypto, china) | 7 |
| F-Risk | F-01..F-08 (all of Track F) | 8 |
| G-Portfolio | G-01..G-10 (all of Track G) | 10 |
| H-IdeaProto | H-01, H-02, H-04, H-05, H-06 (idea + prototype + first validation) | 5 |
| H-ShipGrad | H-07, H-08, H-09, H-10, H-11, H-12 (validation tail + submission) | 6 |

Total 59 author-slots → 57 lessons (H-IdeaProto/H-ShipGrad skip the already-shipped H-03). All spawn in **one message** with `isolation: "worktree"`.

### 5. Integration (integrator = main agent, after all return)

1. Gather each agent's lesson dirs into the main worktree (agents write non-overlapping paths; the husky fix means most commit cleanly to their branch — cherry-pick or copy).
2. Flip `mdxReady: true` for all 57 in `curriculum.ts` (the H-03 entry stays as-is).
3. Update `schema.test.ts` mdxReady assertion: 44 → **101** (A×3 + B×30 + C×10 + D×15 + E×15 + F×8 + G×10 + H×12). Keep the robust `getLessonsByTrack` composition; for H, the full track is now ready so use `getLessonsByTrack('H')`.
4. Run: `python3 scripts/check-mdx-attrs.py` (0 issues), content test (101 ready), `tsc -b`, `QA_AUTH_MODE=dev next build` (CI if local OOMs).

### 6. Quality gates (CI)

Same as M7 plus the new MDX-attr gate in `lint-js`. The `build` job is the backstop that every `mdxReady` lesson imports + prerenders cleanly.

## Consequences

- **Positive:** All 110 lessons authored — the curriculum is complete end-to-end (market basics → indicators → signals → honest backtesting → strategy archetypes → risk → portfolio → shipping).
- **Positive:** M8 track-complete achievements (Track A/B/C) have a natural extension path; D–H completion achievements can be added in a future migration without content changes.
- **Negative:** 57 long-tail educational lessons; reviewer samples rather than enumerates. Authors are trusted on the style guide, with the three hard MDX rules now mechanically enforced by `check-mdx-attrs.py` + typecheck.

## Verification

- 57 new dirs under `packages/content/lessons/{D,E,F,G,H}/<module>/<id>/`, each with meta.ts + both MDX.
- `pnpm --filter @quant-academy/content test` → 101 mdxReady.
- `python3 scripts/check-mdx-attrs.py` → 0 issues across ~195 MDX files.
- `tsc -b` clean; web build green (CI).
