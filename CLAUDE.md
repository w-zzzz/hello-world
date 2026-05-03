# CLAUDE.md

Guidance for Claude Code (or future contributors) working in this repo.

## What this is

A Next.js 16 / React 19 interactive learning platform for ML, deep learning, and AI:

- **68 MDX topics** across 11 parts (`content/curriculum.ts` is the source of truth).
- **12 hand-built hero visualizations** (canvas + SVG + react-three-fiber).
- **138-event chronological timeline** + **7 curated learning paths** + **20 paper origin stories** + **101 researcher profiles**.
- **Prisma + SQLite** for anonymous-session-based progress, with a **SuperMemo-2** review queue.

## Where things live

| Path | Purpose |
|---|---|
| `content/curriculum.ts` | **Single source of truth** for the 68-topic graph. Editing a topic's prereqs/title/researchers happens here, then re-seed the DB. |
| `content/researchers.ts` | 101 researcher records used on `/researchers` and as side-rail credits on each topic page. |
| `content/stories.ts` | 20 long-form paper origin stories surfaced under `/stories/[slug]`. |
| `content/paths.ts` | 7 curated reading orders (`/paths/[slug]`). Each step references an existing topic slug. |
| `content/timeline.ts` | 138-event chronological timeline rendered at `/timeline`. |
| `content/topics/<part>/<n>-<slug>.mdx` | Topic content. Frontmatter is validated by `FrontmatterSchema` in `src/lib/mdx.ts`. |
| `prisma/schema.prisma` | DB models. `Topic` mirrors a subset of `curriculum.ts` for relational joins. |
| `src/lib/mdx.ts` | Loads + parses MDX; `mdx-render.ts` defines the rehype/remark plugin chain. |
| `src/components/content/Embed.tsx` | Lazy registry mapping a `vizKey` to a dynamically-imported viz component. |
| `src/components/viz/` | The 12 hero interactives. Each has its own algorithm in `src/lib/viz/*` or `src/lib/math/*`. |
| `src/app/learn/[part]/[topic]/page.tsx` | The reader. Server component reads MDX, renders via `MDXRemote`, mounts QuizBlock + scroll tracker + references rail. |
| `src/app/sitemap.ts` / `src/app/robots.ts` / `src/app/manifest.ts` | SEO + PWA. Sitemap is generated from the content modules at build time. |
| `src/app/icon.tsx` / `src/app/apple-icon.tsx` / `src/app/opengraph-image.tsx` | Brand artifacts produced by Next's `ImageResponse` (no binary blobs in the repo). |
| `src/proxy.ts` | Next 16's renamed middleware. Sets the `mlmap_uid` cookie. |

## Conventions

- **Don't bypass the curriculum**: if a topic is added or removed, update `content/curriculum.ts`, run `pnpm db:seed`. Pages, map, and dashboard derive from it.
- **MDX gotcha**: `{class}` in body text gets parsed as JSX. Wrap such cases in code spans, or escape: `\{class\}`.
- **Resource `kind`** is enum: `course | blog | paper | video | book | model | dataset | library | doc`. Adding a new kind requires updating both the Zod schema in `src/lib/mdx.ts` and the icon map in `src/app/resources/page.tsx`.
- **Math** uses KaTeX. Inline `$x$`, block `$$\nabla L$$`. In YAML strings (frontmatter quizzes), escape backslashes: `"\\nabla"`.
- **Code blocks** use rehype-pretty-code (Shiki). Specify a language fence (```python). Highlighting is build-time so the client doesn't ship a tokenizer.
- **Hero viz must be `"use client"`** and ideally lazy-loaded. Add new ones to the `registry` in `src/components/content/Embed.tsx` *and* the `VALID_KEYS` array in `src/app/playground/[viz]/page.tsx` *and* the `VIZ_KEYS` array in `src/app/sitemap.ts`.

## Build / test

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Should be clean. The Playwright e2e suite needs Chromium (`pnpm exec playwright install chromium`); CI/sandbox environments may not allow the download — the specs still serve as documentation.

CI runs the same chain on every push and PR via `.github/workflows/ci.yml` (Node 22, pnpm 10, with caching).

## Adding a topic

1. Add an entry to `TOPICS` in `content/curriculum.ts` (slug, partSlug, indices, title, hook, etc.).
2. Create `content/topics/<part>/<NN>-<slug>.mdx` with the frontmatter shape — `slug`, `part`, `partTitle`, indices, prereqs, researchers list, papers, hfResources, freeResources, quiz array. Use existing topics as templates.
3. `pnpm db:seed` to upsert the new row.
4. `pnpm dev` and visit `/learn/<part>/<slug>`. Build will fail if frontmatter doesn't pass Zod.

## Adding a hero viz

1. Create `src/components/viz/<Name>.tsx` exporting `Name`. Wrap in `<VizFrame>` for consistent chrome.
2. Heavy lifting (algorithms, data) goes in `src/lib/viz/*` or `src/lib/math/*`.
3. Register in `src/components/content/Embed.tsx` (dynamic import) and add the `VizKey` literal to `src/lib/types.ts`.
4. Add to `VALID_KEYS` + `TITLES` in `src/app/playground/[viz]/page.tsx` so the standalone route works.
5. Add the same key to `VIZ_KEYS` in `src/app/sitemap.ts` so the playground route shows up in the sitemap.
6. Set `hasHeroViz: true, vizKey: "<name>"` on the relevant topic in `curriculum.ts`, and use `<Embed viz="<name>" />` in the MDX body.

## Deployment

- **Production image**: a multi-stage `Dockerfile` lives at the repo root (`deps` → `builder` → `runner`, runs as uid 1001, healthchecks `/api/health`). Build with `docker build -t mlmap .` and run with the env vars listed in `README.md` → Deploy.
- **Hosted previews**: `.github/workflows/preview.yml` is a placeholder for Vercel / Render / Fly. Wire up the provider's GitHub App and replace the placeholder echo step with the official action.
- **DB swap**: SQLite by default; for any real deploy switch `prisma/schema.prisma` to `provider = "postgresql"`, run `prisma migrate deploy`, then `pnpm db:seed`.
- **SEO**: `src/app/sitemap.ts` derives from the content modules — a fresh build picks up new topics/researchers/stories without code changes. `NEXT_PUBLIC_SITE_URL` controls the absolute URL emitted in the sitemap and robots.txt.

## Useful one-liners

```bash
# Smoke-test all routes locally
pnpm exec next dev --port 3001 &
sleep 8
for p in / /map /timeline /paths /stories /researchers /resources /dashboard \
         "/learn/03-deep-learning/04-attention" "/playground/gradient-descent" \
         /sitemap.xml /robots.txt /manifest.webmanifest; do
  curl -sS -o /dev/null -w "%{http_code}  $p\n" http://localhost:3001$p
done

# Reset progress DB
rm prisma/dev.db && pnpm db:migrate && pnpm db:seed
```
