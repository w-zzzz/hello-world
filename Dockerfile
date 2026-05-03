# syntax=docker/dockerfile:1.7

# ---------- deps ----------
# Install production-shaped node_modules (still includes devDeps because the
# builder stage needs `next`, `tsc`, and `prisma` to run a build). Prisma's
# generate is also kicked off here so the schema-derived client is cached
# in the resulting layer.
FROM node:22-alpine AS deps
WORKDIR /app

# pnpm via corepack — pinned in package.json `packageManager` if you set one.
RUN corepack enable && corepack prepare pnpm@10 --activate

# Native deps used by better-sqlite3 + sharp (next/image) on Alpine.
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json pnpm-lock.yaml .npmrc .pnpmfile.cjs* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate

# ---------- builder ----------
# Copies the rest of the app and runs `next build`. Splitting this from `deps`
# means application-source changes don't bust the (slow) install layer.
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

# Carry the prepared node_modules + generated Prisma client from `deps`.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Satisfies the Zod schema in src/lib/env.ts at build time. This value is never
# used at runtime — the runner stage does not inherit it, and Railway injects the
# real DATABASE_URL service variable when the container starts.
ENV DATABASE_URL="file:./placeholder.db"

# `pnpm build` runs `next build`. If `next.config.ts` enables `output: "standalone"`
# the runner stage can switch to copying `.next/standalone` for a smaller image.
RUN pnpm build

# ---------- runner ----------
# Minimal image: ship only what `next start` needs. We deliberately avoid the
# `output: "standalone"` flow because that flag is owned by next.config.ts and
# may not always be present; copying `.next` + node_modules + public is safe
# either way.
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user — Next.js doesn't need any privileged capabilities at runtime.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nodejs

# App artifacts.
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/content ./content

USER nodejs

EXPOSE 3000

# Liveness probe hits the in-app /api/health endpoint, which also pings the DB.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["pnpm", "start"]
