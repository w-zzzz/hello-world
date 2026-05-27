# syntax=docker/dockerfile:1.7
# Quant Academy sandbox runner.
# Layer-2 isolation for the qa_sandbox.runner subprocess. Combines a
# minimal python:3.12-slim base with a non-root user; the production
# `docker run` invocation (see README) adds --network=none --read-only
# --cap-drop=ALL and, when available, --runtime=runsc (gVisor).

FROM python:3.12-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv==0.8.17

WORKDIR /workspace

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    QA_SANDBOX=1

# Copy the workspace manifest + lock first so dependency resolution caches
# independently of source changes.
COPY pyproject.toml uv.lock* ./
COPY python/ ./python/
COPY apps/sandbox-runner/ ./apps/sandbox-runner/

RUN uv sync --all-packages --frozen || uv sync --all-packages

# Drop privileges. The image only ever runs `python -m qa_sandbox.runner`,
# which reads stdin and writes stdout — no filesystem state required.
USER nobody

ENTRYPOINT ["uv", "run", "python", "-m", "qa_sandbox.runner"]
