import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/** Return per-day quiz attempt counts for the last 84 days (12 weeks),
 *  oldest → newest, including zero-count days so the heatmap can render
 *  a contiguous grid. */
export async function GET(req: NextRequest) {
  const rl = rateLimit(`activity:${clientKey(req)}`, 30, 60_000);
  if (!rl.ok) {
    logger.warn("rate_limited", { route: "/api/activity", retryAfterMs: rl.retryAfterMs });
    return tooManyRequests(rl.retryAfterMs);
  }

  const userId = await getOrCreateUserId();
  const days = 84;

  // Anchor to the start of *today* in the server's local TZ. Heatmap is a
  // single-user tool so server-local is acceptable.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, createdAt: { gte: start } },
    select: { createdAt: true, correct: true },
  });

  const buckets = new Map<string, { count: number; correct: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(toKey(d), { count: 0, correct: 0 });
  }
  for (const a of attempts) {
    const key = toKey(a.createdAt);
    const b = buckets.get(key);
    if (b) {
      b.count += 1;
      if (a.correct) b.correct += 1;
    }
  }

  const data = Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    count: v.count,
    correct: v.correct,
  }));

  return NextResponse.json({ days, data });
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
