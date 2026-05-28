import 'server-only'
import { and, count, eq, gte, sql } from 'drizzle-orm'
import { db } from './client'
import { rateLimits } from './schema/rateLimits'

export interface RateLimitConfig {
  /** Action label, e.g. 'markLessonComplete' or 'runBacktest'. */
  action: string
  /** Maximum hits permitted within the window. */
  max: number
  /** Window length in seconds. */
  windowSeconds: number
}

export interface RateLimitOk {
  ok: true
  remaining: number
}

export interface RateLimitDenied {
  ok: false
  retryAfterSeconds: number
  used: number
  max: number
}

/**
 * Atomic check-and-record. Inserts a new hit, then counts hits in the window;
 * if the count exceeds max, returns denied (the hit is still recorded — best-
 * effort fairness; the next attempt sees the same denial). Under READ COMMITTED
 * concurrent calls may both see a count of max and both pass — acceptable for
 * 1-minute windows. For strict limits use SELECT FOR UPDATE on the count row.
 */
export async function checkRateLimit(
  userId: string,
  cfg: RateLimitConfig,
): Promise<RateLimitOk | RateLimitDenied> {
  const cutoff = new Date(Date.now() - cfg.windowSeconds * 1000)
  return db.transaction(async (tx) => {
    await tx.insert(rateLimits).values({ userId, action: cfg.action })
    const rows = await tx
      .select({ n: count() })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userId, userId),
          eq(rateLimits.action, cfg.action),
          gte(rateLimits.hitAt, cutoff),
        ),
      )
    const used = Number(rows[0]?.n ?? 0)
    if (used > cfg.max) {
      return {
        ok: false as const,
        retryAfterSeconds: cfg.windowSeconds,
        used,
        max: cfg.max,
      }
    }
    return { ok: true as const, remaining: Math.max(0, cfg.max - used) }
  })
}

/**
 * Periodic cleanup — call from a cron or post-request best-effort. Removes
 * hits older than 24h to keep the table small.
 */
export async function pruneStaleRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const result = await db.delete(rateLimits).where(sql`hit_at < ${cutoff}`)
  return Number((result as { rowCount?: number }).rowCount ?? 0)
}
