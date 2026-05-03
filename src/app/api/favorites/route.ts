import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET() {
  const userId = await getOrCreateUserId();
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { topicSlug: true, createdAt: true },
  });
  return NextResponse.json({ favorites });
}

const PostSchema = z.object({ slug: z.string().min(3) });

/** Toggle: returns { favorited: boolean } reflecting the new state. */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`favorites:${clientKey(req)}`, 60, 60_000);
  if (!rl.ok) {
    logger.warn("rate_limited", { route: "/api/favorites", retryAfterMs: rl.retryAfterMs });
    return tooManyRequests(rl.retryAfterMs);
  }

  const userId = await getOrCreateUserId();
  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { slug } = parsed.data;
  const existing = await prisma.favorite.findUnique({
    where: { userId_topicSlug: { userId, topicSlug: slug } },
  });
  if (existing) {
    await prisma.favorite.delete({
      where: { userId_topicSlug: { userId, topicSlug: slug } },
    });
    return NextResponse.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId, topicSlug: slug } });
  return NextResponse.json({ favorited: true });
}
