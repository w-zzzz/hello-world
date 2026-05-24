.PHONY: install dev web-dev api-dev build lint format test typecheck clean up down help

help:
	@echo "Quant Academy — make targets"
	@echo "  install     Install JS + Python dependencies (pnpm install && uv sync)"
	@echo "  dev         Run all dev servers via turbo"
	@echo "  web-dev     Run only the Next.js web app"
	@echo "  api-dev     Run only the FastAPI service"
	@echo "  build       Build all packages"
	@echo "  lint        Lint JS/TS and Python"
	@echo "  format      Format JS/TS and Python"
	@echo "  test        Run JS/TS and Python tests"
	@echo "  typecheck   Run tsc and mypy"
	@echo "  clean       Remove caches and build artifacts"
	@echo "  up          docker compose up (infra)"
	@echo "  down        docker compose down (infra)"

install:
	pnpm install && uv sync --all-packages

dev:
	pnpm dev

web-dev:
	pnpm --filter web dev

api-dev:
	uv run uvicorn qa_api.main:app --reload --app-dir apps/api --host 0.0.0.0 --port 8000

build:
	pnpm build

lint:
	pnpm exec biome ci . && uv run ruff check . && uv run ruff format --check .

format:
	pnpm format && uv run ruff format .

test:
	pnpm test && uv run pytest

typecheck:
	pnpm exec tsc -b --noEmit && uv run mypy -p qa_core -p qa_indicators -p qa_api

clean:
	pnpm clean && rm -rf .venv .mypy_cache .ruff_cache .pytest_cache

up:
	docker compose -f infra/docker/docker-compose.yml up --build

down:
	docker compose -f infra/docker/docker-compose.yml down
