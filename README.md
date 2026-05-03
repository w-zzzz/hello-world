# MLMap

> A PhD-grade interactive learning map for modern machine learning, deep learning, and AI.

<!-- Banner — capture into docs/screenshots/ during demo prep; the page renders fine if missing. -->
<p align="center">
  <img src="docs/screenshots/landing.png" alt="MLMap landing — animated curriculum graph over a parallax hero" width="900" />
</p>

<p align="center">
  <a href="#quick-start"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" /></a>
  <a href="#stack"><img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react" /></a>
  <a href="#stack"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript" /></a>
  <a href="#testing"><img alt="Vitest" src="https://img.shields.io/badge/tests-vitest-6e9f18?logo=vitest" /></a>
  <a href="#deploy"><img alt="Docker" src="https://img.shields.io/badge/deploy-docker-2496ed?logo=docker" /></a>
</p>

---

## What this is

MLMap is a single-author, opinionated, research-grade tour of modern AI. It treats the field as a graph of ideas (not a linear textbook) and pairs every page with hand-built browser interactives so you can poke at the math instead of just reading it. The design target is "the textbook a top advisor would hand to an incoming PhD student."

- **68 topics across 11 parts** — linear algebra and probability through scaling laws, mixture-of-experts, state-space models (Mamba), mechanistic interpretability with sparse autoencoders, RAG, JEPA, neural ODEs, geometric deep learning, and reasoning models (o1 / o3 / DeepSeek-R1).
- **12 hand-built interactive visualizations** — gradient descent on four loss surfaces, a tiny MLP that trains in the browser, a multi-head attention heatmap, a procedural diffusion denoiser, a 3D embedding-space explorer (react-three-fiber), a BPE tokenizer, a step-through backpropagation graph, a 3D transformer walkthrough, a PCA projector, a kernel-trick toy, a mixture-of-experts router, and a Q-learning gridworld.
- **138-event chronological timeline + 7 curated paths + 20 paper origin stories + 101 researcher profiles** — the historical scaffolding that makes the technical content stick.
- **Anonymous mastery tracking with SuperMemo-2 spaced repetition** — cookie-based, no signup, privacy-first. Per-topic mastery (EMA), XP, streaks, and a daily review queue.

## Live demo

`https://mlmap.example.com` — *coming soon. See the [Deploy](#deploy) section to spin up your own.*

## Screenshots

> Capture these during demo prep into `docs/screenshots/`. The README links them at the paths below; missing files render as broken images but never break the build. See [`docs/SCREENSHOTS.md`](docs/SCREENSHOTS.md) for the capture playbook.

<table>
  <tr>
    <td><img src="docs/screenshots/landing.png" alt="Landing — animated curriculum graph" /></td>
    <td><img src="docs/screenshots/topic.png" alt="Topic page — MDX with embedded viz, references rail, quiz" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Landing — animated parallax hero + map preview</sub></td>
    <td align="center"><sub>Topic — MDX, math, code, embedded interactive, quiz</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/playground.png" alt="Playground — gradient descent on a Rosenbrock surface" /></td>
    <td><img src="docs/screenshots/timeline.png" alt="Timeline — 138 events, 1943 to present" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Playground — full-screen interactive (gradient descent shown)</sub></td>
    <td align="center"><sub>Timeline — chronological view with researcher cross-links</sub></td>
  </tr>
</table>

## Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, RSC), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, [Motion](https://motion.dev/) (Framer Motion successor), [Lenis](https://lenis.darkroom.engineering/) smooth scroll
- **Visualization**: [react-three-fiber](https://r3f.docs.pmnd.rs/) + drei + three.js for 3D, [Visx](https://airbnb.io/visx) + d3-force for the curriculum graph, hand-tuned canvas + SVG for the rest
- **Content**: `next-mdx-remote-client` + `rehype-katex` (build-time math) + `rehype-pretty-code` / Shiki (build-time syntax highlighting)
- **Data**: Prisma 7 + better-sqlite3 (local-first; swap to Postgres by changing the schema datasource)
- **Quality**: Vitest unit tests, Playwright e2e (config included; install browsers separately)

## Quick start

```bash
pnpm install
pnpm db:migrate     # apply Prisma migrations to prisma/dev.db
pnpm db:seed        # seed Topic table from content/curriculum.ts
pnpm dev            # http://localhost:3000
```

Other scripts:

```bash
pnpm build          # production build
pnpm start          # production server
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint
pnpm test           # Vitest
pnpm test:e2e       # Playwright (run `pnpm exec playwright install chromium` first)
pnpm db:studio      # Prisma Studio
```

## Architecture overview

The five files that matter most when reasoning about the system:

- **[`content/curriculum.ts`](content/curriculum.ts)** — single source of truth for the 68-topic graph (parts, prereqs, viz keys).
- **[`src/lib/mdx.ts`](src/lib/mdx.ts)** — MDX loader + Zod-validated frontmatter; `mdx-render.ts` defines the rehype/remark plugin chain (math, code, autolinks).
- **[`src/components/content/Embed.tsx`](src/components/content/Embed.tsx)** — lazy registry mapping a `vizKey` to its dynamically-imported viz component (zero bundle cost on pages that don't use one).
- **[`src/app/learn/[part]/[topic]/page.tsx`](src/app/learn/[part]/[topic]/page.tsx)** — the reader. Server component reads MDX, renders via `MDXRemote`, mounts QuizBlock + scroll tracker + references rail.
- **[`prisma/schema.prisma`](prisma/schema.prisma)** — `User` (anonymous), `Topic` (mirrors curriculum), `Progress`, `QuizAttempt`, `ReviewItem` (SuperMemo-2 state).

Conventions and "how to add a topic / viz" live in [`CLAUDE.md`](CLAUDE.md).

## Deploy

The default DB is SQLite (`prisma/dev.db`). For production, point Prisma at Postgres and bake the migrations into the deployment.

### Vercel (one-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USER%2Fmlmap)

Set `DATABASE_URL` to a Postgres URL (Neon, Supabase, Railway). Vercel runs `pnpm install && pnpm build` automatically; add `pnpm exec prisma migrate deploy && pnpm db:seed` as a "Build Command" prefix on first deploy.

### Docker

A multi-stage `Dockerfile` is included. The runtime image is `node:22-alpine`, runs as uid 1001, and exposes a `HEALTHCHECK` against `/api/health`.

```bash
docker build -t mlmap .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
  mlmap
```

For Postgres in production:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/mlmap" \
  -e NEXT_PUBLIC_SITE_URL="https://mlmap.example.com" \
  mlmap
```

### Fly.io

```bash
fly launch --no-deploy --copy-config         # generates fly.toml from the Dockerfile
fly secrets set DATABASE_URL="postgresql://..." NEXT_PUBLIC_SITE_URL="https://your-app.fly.dev"
fly deploy
```

### PostgreSQL note

For any non-trivial deployment, switch the Prisma datasource:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:

```bash
pnpm exec prisma migrate deploy
pnpm db:seed
```

## Testing

```bash
pnpm test           # Vitest unit suite (lib/, math/, viz/ algorithms)
pnpm test:e2e       # Playwright (cross-browser smoke + a11y via @axe-core/playwright)
```

The e2e suite needs Chromium installed via `pnpm exec playwright install chromium`. CI environments may not allow the download — the specs still serve as documentation.

## Author

Built by a single author as a "what I wish I'd had in grad school" project. PRs that fix typos, expand the curriculum, or add new hero visualizations are welcome — see [`CLAUDE.md`](CLAUDE.md) for the contribution playbook.
