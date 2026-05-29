import { desc, gte, sum } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db, xpEvents } from '@/lib/db'

/**
 * GET /api/leaderboard?period=weekly|all_time
 *
 * Returns the top 50 users by XP for the requested window. Identities are
 * anonymized to an 8-character handle derived from `user_id` — the opt-in
 * mechanism to surface real handles is a v2 concern (see M8 prompt).
 *
 * An empty result is a 200 with `entries: []`, never a 404.
 */

export const revalidate = 60

const TOP_N = 50
const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

type Period = 'weekly' | 'all_time'

function parsePeriod(raw: string | null): Period {
  return raw === 'weekly' ? 'weekly' : 'all_time'
}

function anonymizeHandle(userId: string): string {
  // user_id is a UUID; first 8 hex chars give us a stable pseudonym with
  // enough entropy to feel distinct in a 50-row leaderboard.
  return userId.replace(/-/g, '').slice(0, 8)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const period = parsePeriod(url.searchParams.get('period'))

  const totalXp = sum(xpEvents.amount).mapWith(Number)

  // Two near-identical branches because Drizzle's query builder rejects an
  // optional `.where()`; we either include the time filter or we don't.
  const rows =
    period === 'weekly'
      ? await db
          .select({ userId: xpEvents.userId, xp: totalXp })
          .from(xpEvents)
          .where(gte(xpEvents.createdAt, new Date(Date.now() - WEEKLY_WINDOW_MS)))
          .groupBy(xpEvents.userId)
          .orderBy(desc(totalXp))
          .limit(TOP_N)
      : await db
          .select({ userId: xpEvents.userId, xp: totalXp })
          .from(xpEvents)
          .groupBy(xpEvents.userId)
          .orderBy(desc(totalXp))
          .limit(TOP_N)

  const entries = rows
    .filter((r) => (r.xp ?? 0) > 0)
    .map((r, idx) => ({
      rank: idx + 1,
      handle: anonymizeHandle(r.userId),
      xp: Number(r.xp ?? 0),
    }))

  return NextResponse.json({ entries })
}
