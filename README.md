# Quant Academy — 系统性学习量化交易 / Systematic Quant Trading Education

Quant Academy is an open, bilingual (中文 / English) learning platform for systematic
quantitative trading. It pairs an interactive curriculum with real charts, real
indicators, and real backtests so learners can move from "what is an SMA?" to
"how do I evaluate a momentum strategy on five years of equities data?" without
ever leaving the browser.

Quant Academy 是一个开源、中英双语的系统化量化交易学习平台。课程内容与可交互的
K 线图表、指标实验台、真实回测引擎深度结合，帮助学习者从理解一条均线，
一直走到对一个动量策略做出有依据的评估。

## Features

- Bilingual curriculum (中文 / English) with progressive lessons and quizzes
- Interactive K-line charts powered by lightweight-charts
- Indicator playground with Python ↔ TypeScript implementation parity tests
- Real backtests powered by vectorbt with reproducible reports
- AI tutor powered by Claude, scoped to lesson context
- Gamification: XP, streaks, achievements, and learning paths
- Two-tier code sandbox: in-browser Pyodide for exploration, server-side gVisor
  for graded submissions

## Architecture

A pnpm + Turborepo + uv polyglot monorepo. See `/docs` for full ADRs.

- `apps/web` — Next.js 15 (React 19) learner app
- `apps/api` — FastAPI service (auth, lessons, AI tutor, backtests)
- `apps/docs` — Curriculum authoring & static docs site
- `python/qa_core` — Domain types, OHLCV models, shared utils
- `python/qa_indicators` — Indicators (parity-tested against TS)
- `python/qa_backtest` — vectorbt-based backtest engine
- `python/qa_sandbox` — gVisor-fronted Python execution sandbox
- `packages/*` — Shared TS libraries (UI, charts, indicators-ts, eslint configs)
- `infra/` — Docker, Fly.io, Terraform, observability
- `docs/` — ADRs, curriculum spec, product brief

## Quick start

Requirements: Node 22+, pnpm 10+, Python 3.12+, uv 0.8+, Docker (for full stack).

```bash
pnpm install && uv sync
make dev    # boots web + api
```

Then open http://localhost:3000.

## Structure

```
quant-academy/
├── apps/
│   ├── web/              # Next.js 15 learner app
│   ├── api/              # FastAPI service
│   └── docs/             # Curriculum docs site
├── packages/             # Shared TS libs (ui, charts, indicators-ts, configs)
├── python/
│   ├── qa_core/          # Shared domain models
│   ├── qa_indicators/    # Indicators (parity-tested)
│   ├── qa_backtest/      # vectorbt engine
│   └── qa_sandbox/       # gVisor sandbox client
├── infra/                # Docker, Fly, Terraform
├── docs/                 # ADRs, curriculum spec
├── biome.json            # JS/TS formatter + linter
├── ruff.toml             # Python linter + formatter
├── mypy.ini              # Python type checker
├── turbo.json            # Turborepo task graph
├── pnpm-workspace.yaml   # JS workspace
├── pyproject.toml        # uv Python workspace
└── Makefile              # Convenience targets
```

## Contributing

Curriculum contributions, indicator implementations, and translations are very
welcome. See `/docs/curriculum` for authoring guidelines, the lesson schema,
and the indicator parity-test contract. PRs run lint, typecheck, and tests on
both the TS and Python toolchains.

## License

MIT — see [LICENSE](./LICENSE). Copyright (c) 2026 Quant Academy contributors.

## Disclaimer

Quant Academy is an educational project. Nothing in this repository,
including lessons, indicator implementations, backtest results, or AI tutor
output, constitutes financial, investment, legal, or tax advice. Markets are
risky; past performance does not predict future results. Always do your own
research and consult a licensed professional before making financial
decisions.
