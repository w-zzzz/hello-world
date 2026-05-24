# ADR M0 — Monorepo Bootstrap

**Status:** Accepted
**Date:** 2026-05-24
**Milestone:** M0 (Repo bootstrap)

## Context

This ADR captures the concrete file-level decisions for M0, which establishes the monorepo skeleton for Quant Academy. See the master plan in `/root/.claude/plans/ok-github-repo-repo-spicy-puzzle.md` (also referenced as the project plan in the repo root).

M0 must establish a working scaffolding so all subsequent milestones can implement feature work in isolation against stable conventions: workspace tooling, lint/format/typecheck, language runtimes, CI skeleton, design tokens, basic FastAPI + Next.js boots, and Docker-based local development.

## Decisions

### Workspace tooling

- **JS:** pnpm 10.x workspaces + Turborepo 2.x. Pinned versions in `package.json#packageManager`.
- **Python:** uv 0.8+ workspace via root `pyproject.toml` with `[tool.uv.workspace] members = ["apps/api", "python/*"]`.
- **Make targets:** A root `Makefile` exposes convenience targets (`dev`, `api-dev`, `web-dev`, `build`, `lint`, `test`, `parity`, `data-refresh`).

### Language runtimes

- Node **22 LTS** (declared in `.nvmrc`).
- Python **3.12** (declared in `.python-version`, managed by uv).

### Lint / Format / Type

- **JS:** Biome 2.x (replaces ESLint + Prettier). Config at root `biome.json`. Per-package overrides discouraged.
- **Python:** ruff (format + lint) + mypy (strict mode for libraries, relaxed for apps). Configs at `ruff.toml` and `mypy.ini`.
- **Pre-commit:** Husky + lint-staged for JS; `pre-commit` framework for Python; both configured in M0 with hooks that run formatting and the changed-file linter only.

### Frontend skeleton

- `apps/web` runs Next.js **16.x** with App Router + RSC.
- Routes mounted under `[locale]` segment; `zh` and `en` supported via next-intl 3.x.
- TailwindCSS v4 with `@theme` block declaring OKLCH brand / bull / bear ramps.
- `packages/ui` ships shadcn-style primitives (Button, Card) consuming Tailwind tokens.
- `packages/i18n` ships `messages/{zh,en}/common.json` and the next-intl request config.
- Shared TS configs in `packages/tsconfig-config` (`base`, `nextjs`).
- Shared Tailwind preset in `packages/tailwind-config`.

### Backend skeleton

- `apps/api` runs FastAPI on uvicorn with Pydantic v2.
- Exposes `/healthz`, `/version`, `/openapi.json`, and stub routers for `/indicators`, `/market`, `/backtests`, `/ai`.
- `python/qa_core` declares the canonical Pydantic models (`BacktestResult`, `EquityPoint`, `Trade`, `Metrics`, `IndicatorMeta`, etc.). This is the **single wire schema source**.
- `python/qa_indicators` ships SMA as a starter indicator with metadata so the registry pattern is exercised.
- `python/qa_backtest` and `python/qa_sandbox` are stubbed with `__init__.py` only.

### CI / CD skeleton

- `.github/workflows/ci.yml`: lint (Biome + ruff), typecheck (`tsc -b` + mypy), test placeholders (Vitest + pytest), build (turbo build).
- `.github/workflows/codeql.yml`: scheduled JS + Python scanning.
- `.github/workflows/preview.yml`: scaffold only (real deploy enabled in M12).
- `.github/CODEOWNERS` + PR template.

### Local development

- `infra/docker/docker-compose.yml` brings up `web`, `api`, `postgres:16`, `redis:7`. Web and api use bind-mounted source for hot reload.
- `infra/docker/Dockerfile.web` is multi-stage; `infra/docker/Dockerfile.api` is Python 3.12-slim + uvicorn.
- Fly + Vercel deployment configs scaffolded under `infra/{fly,vercel}/` but not wired in M0.

## File inventory

See the file list embedded in the M0 implementation prompts (Tooling / Frontend / Backend / Infra). Total expected new files in M0: ~50.

## Exit criteria

1. `pnpm install && pnpm turbo run build --filter=web` exits 0.
2. `pnpm --filter web dev` boots Next.js on :3000 and serves `/zh` and `/en`.
3. `uv sync && uv run uvicorn qa_api.main:app --reload --app-dir apps/api` returns `{ "ok": true }` on `/healthz`.
4. `docker compose -f infra/docker/docker-compose.yml up --build` brings the stack up.
5. `.github/workflows/ci.yml` green on the bootstrap PR.

## Parallel execution

M0 is built by four implementer agents working in worktree-isolated branches:

| Agent | Owner of (paths) | Branch suffix |
|---|---|---|
| Tooling | root configs (`pnpm-workspace.yaml`, `turbo.json`, `pyproject.toml`, `biome.json`, `ruff.toml`, `mypy.ini`, `Makefile`, `.gitignore`, root `package.json`, `LICENSE`, root `README.md`) | `M0-tooling` |
| Frontend | `apps/web/**` + `packages/{ui,i18n,tsconfig-config,tailwind-config}/**` | `M0-frontend` |
| Backend | `apps/api/**` + `python/**` | `M0-backend` |
| Infra | `.github/**` + `infra/**` | `M0-infra` |

After all four complete, their branches are merged into `claude/quant-trading-platform-3RrRH` (or its M0 child) and a single PR is opened.

## References

- Master plan: `/root/.claude/plans/ok-github-repo-repo-spicy-puzzle.md`
- Next.js 16 docs validated via context7 `/vercel/next.js/v16.2.2`
- Pyodide capabilities validated via context7 `/pyodide/pyodide`
