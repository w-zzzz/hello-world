# MLMap

A PhD-grade interactive learning map for modern machine learning, deep learning, and AI.

48 topics across 11 parts. 8 hand-built hero visualizations. 65+ featured researchers. Quiz-based mastery with SuperMemo-2 spaced repetition. Apple-quality interactions.

## What's inside

- **Curriculum**: from linear algebra and probability to attention, scaling laws, mixture-of-experts, state-space models (Mamba), mechanistic interpretability with sparse autoencoders, RAG, JEPA, neural ODEs, geometric deep learning, and reasoning models (o1/o3/DeepSeek-R1).
- **Hero interactives**: gradient descent on 4 loss surfaces with 3 optimizers, a tiny MLP that trains in your browser, a multi-head attention heatmap, a procedural diffusion denoiser, a 3D embedding-space explorer (react-three-fiber), a BPE tokenizer, a step-through backpropagation graph, and a 3D transformer walkthrough.
- **Researchers**: bios, key papers, and links for Hinton, LeCun, Bengio, Karpathy, Sutskever, Hassabis, Fei-Fei Li, Tri Dao, Albert Gu, Chris Olah, Lilian Weng, Sebastian Raschka, and 50+ others.
- **Mastery**: cookie-based anonymous sessions, per-topic mastery (EMA), XP, streaks, and a SuperMemo-2 review queue.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Motion (Framer Motion) + Lenis smooth scroll
- react-three-fiber + drei + three.js for 3D
- Visx + d3-force for the curriculum graph; canvas + SVG for the rest
- next-mdx-remote-client + rehype-katex (build-time math) + rehype-pretty-code / Shiki (build-time syntax)
- Prisma 7 + better-sqlite3 (local-first; swap to Postgres by changing the schema datasource)
- Vitest unit tests · Playwright e2e (config included; install browsers separately)

## Getting started

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000.

## Scripts

```bash
pnpm dev          # Next dev server
pnpm build        # Production build
pnpm start        # Production server
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright (requires `pnpm exec playwright install chromium`)
pnpm db:migrate   # apply Prisma migrations
pnpm db:seed      # seed Topic table from content/
pnpm db:studio    # Prisma Studio
```

## Layout

```
content/
├─ topics/           48 .mdx files across 11 parts
├─ curriculum.ts     canonical part / topic / prereq DAG
├─ researchers.ts    65+ researchers
└─ resources.ts      curated reading lists
prisma/
├─ schema.prisma     User, Topic, Progress, QuizAttempt, ReviewItem
└─ seed.ts
src/
├─ app/              landing, /map, /learn/[part]/[topic], /researchers,
│                    /resources, /dashboard, /playground/[viz], /api/*
├─ components/
│  ├─ apple/         Hero, ScrollReveal, ParallaxLayer, MarqueeRow, ...
│  ├─ content/       MDXComponents, CodeBlock, Callout, Embed
│  ├─ learn/         TopicHeader, QuizBlock, ReferencesPanel, ...
│  ├─ map/           CurriculumGraph (Visx force-directed)
│  ├─ dashboard/     StreakRing, XPBar, DueQueue, PartProgress
│  ├─ researcher/    ResearcherCard
│  └─ viz/           the 8 hero interactives
└─ lib/              mdx, db, session, sr, mastery, math/, viz/
```

## Architecture notes

- **Math + code rendered at build time.** rehype-katex emits HTML; the client only ships KaTeX CSS. rehype-pretty-code (Shiki) emits syntax-highlighted HTML in dual themes — zero JS for highlighting at runtime.
- **MDX is read by a server component**, compiled with `next-mdx-remote-client/rsc`, and passed through `<MDXRemote>` with a tiny components registry that handles math, code, callouts, paper cards, and a `<Embed viz="...">` slot for the hero visualizations.
- **Hero viz are lazy-loaded** via `next/dynamic({ ssr: false })`. The 3D ones (R3F) only ship to clients that visit a page using them.
- **Curriculum is the single source of truth** in `content/curriculum.ts`. The DB's `Topic` table mirrors a subset for relational queries; `prisma/seed.ts` keeps it in sync.
- **Anonymous session** via cookie (`mlmap_uid`), set by `src/proxy.ts` (Next 16's renamed middleware) and ensured by `/api/session` on first load.

## Deploy notes

The default DB is SQLite (`prisma/dev.db`). For production:

1. Change `provider = "postgresql"` in `prisma/schema.prisma`.
2. Set `DATABASE_URL` to your Postgres URL.
3. Run `pnpm exec prisma migrate deploy && pnpm db:seed`.
