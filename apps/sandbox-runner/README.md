# `quant-academy/sandbox-runner`

Container image that runs a single `qa_sandbox.runner` invocation: read one
JSON job spec from stdin, run the named backtest preset under the in-process
import allowlist + resource limits, write one JSON `BacktestResult` to stdout.

This is **Layer-2 isolation** — the in-process hook in `qa_sandbox` is
Layer-1. The two layers are independent: tests cover Layer-1 directly; the
container adds OS-level kernel boundaries that catch anything Layer-1 fails
to prevent.

## Build

From the repository root (so the build context includes `python/` and the
workspace `pyproject.toml`/`uv.lock`):

```bash
docker build -f apps/sandbox-runner/Dockerfile -t quant-academy/sandbox .
```

## Run (production)

Per-job invocation. The job spec is piped via stdin; the result is captured
from stdout. Stderr is logged.

```bash
docker run --rm -i \
    --network=none \
    --read-only \
    --tmpfs /tmp:rw,size=64m,noexec,nosuid \
    --cap-drop=ALL \
    --security-opt=no-new-privileges \
    --pids-limit=16 \
    --memory=512m \
    --cpus=1 \
    --user nobody \
    quant-academy/sandbox \
    < job.json > result.json
```

Notes:
- `--network=none` removes the network namespace entirely (defence in depth
  on top of the import-hook denying `socket`/`urllib`).
- `--read-only` plus a small `--tmpfs /tmp` covers vectorbt’s scratch needs
  without granting any persistent write surface.
- `--cap-drop=ALL` strips Linux capabilities; the runner does not need any.
- `--memory=512m` and `--cpus=1` mirror the rlimits set inside the runner
  so the kernel kills runaway jobs even if `resource.setrlimit` were
  bypassed somehow.

## gVisor (optional, recommended)

If the host has [gVisor](https://gvisor.dev/) installed, add
`--runtime=runsc` to the `docker run` command above. gVisor runs the
container under a user-space kernel, neutralising syscall-based escapes
(e.g. recent `io_uring` and `bpf` bugs) at the cost of a small startup
overhead.

```bash
docker run --runtime=runsc --rm -i ...
```

## Development / CI

Inside the worktree the executor (`qa_sandbox.execute`) invokes
`python -m qa_sandbox.runner` directly via `subprocess`, skipping Docker.
Negative tests under `python/qa_sandbox/tests/test_negative.py` validate
Layer-1 isolation in CI; the Docker image is built and smoke-tested
separately (deferred to the release pipeline — Docker is not required to
run the unit suite locally).

## Files

- `Dockerfile` — image definition (`python:3.12-slim` + `uv sync`)
- `.dockerignore` — excludes build artefacts and virtualenvs
- `README.md` — this document
