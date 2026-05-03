import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextReview } from "@/lib/sr";
import { XP } from "@/lib/mastery";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const COOKIE = "mlmap_uid";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get(COOKIE)?.value;
  if (!userId) return NextResponse.json({ items: [] });
  const now = new Date();
  const items = await prisma.reviewItem.findMany({
    where: { userId, dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
    take: 50,
  });
  return NextResponse.json({ items });
}

const Body = z.object({
  topicSlug: z.string(),
  questionId: z.string(),
  grade: z.number().int().min(0).max(5),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(`review:${clientKey(req)}`, 60, 60_000);
  if (!rl.ok) {
    logger.warn("rate_limited", { route: "/api/review", retryAfterMs: rl.retryAfterMs });
    return tooManyRequests(rl.retryAfterMs);
  }

  const userId = req.cookies.get(COOKIE)?.value;
  if (!userId) return NextResponse.json({ error: "no session" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { topicSlug, questionId, grade } = parsed.data;
  const existing = await prisma.reviewItem.findUnique({
    where: { userId_topicSlug_questionId: { userId, topicSlug, questionId } },
  });
  const next = nextReview(existing, grade);
  await prisma.reviewItem.upsert({
    where: { userId_topicSlug_questionId: { userId, topicSlug, questionId } },
    create: { userId, topicSlug, questionId, ...next },
    update: { ...next },
  });
  if (grade >= 3) {
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: XP.reviewSuccess } } });
  }
  return NextResponse.json({ ok: true, dueAt: next.dueAt });
}
