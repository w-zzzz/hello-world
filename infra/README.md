# infra

Infrastructure scaffolding for Quant Academy.

## Local development stack

Bring up Postgres + Redis + API + Web with docker compose:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

Services:

- `postgres` — Postgres 16, exposed on `localhost:5432` (user `qa`, password `qa`, db `qa`)
- `redis` — Redis 7, exposed on `localhost:6379`
- `api` — FastAPI on `http://localhost:8000` with `--reload`
- `web` — Next.js on `http://localhost:3000`, pointed at `http://api:8000`

Environment defaults live in `infra/docker/.env.example`. Copy to `.env` and tweak as needed.

To stop and clear data:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

## Deployment

- `infra/fly/api.fly.toml` — Fly.io app config for the API. **Scaffold only; activated in M12.**
- `infra/fly/sandbox-runner.fly.toml` — Fly.io app config for the sandbox runner. **Scaffold only; activated in M5.**
- `infra/vercel/vercel.json` — Vercel config for the Next.js web app. **Scaffold only; activated in M12.**

The CI workflow `.github/workflows/preview.yml` reserves a `preview-stub` check now so branch protection can pin it from M0. M12 will replace the stub with real preview deploys to Vercel (web) and per-PR Fly apps (api, sandbox-runner).
