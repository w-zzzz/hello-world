import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getOrCreateUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const userId = await getOrCreateUserId();
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (slug) {
    const p = await prisma.progress.findUnique({
      where: { userId_topicSlug: { userId, topicSlug: slug } },
    });
    return NextResponse.json({ progress: p });
  }
  const all = await prisma.progress.findMany({ where: { userId } });
  return NextResponse.json({ progress: all });
}

const PatchSchema = z.object({
  slug: z.string().min(3),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  scrollDepth: z.number().min(0).max(1).optional(),
  mastery: z.number().min(0).max(1).optional(),
});

export async function PATCH(req: NextRequest) {
  const rl = rateLimit(`progress:${clientKey(req)}`, 60, 60_000);
  if (!rl.ok) {
    logger.warn("rate_limited", { route: "/api/progress", retryAfterMs: rl.retryAfterMs });
    return tooManyRequests(rl.retryAfterMs);
  }

  const userId = await getOrCreateUserId();
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { slug, ...rest } = parsed.data;
  const status =
    rest.status ??
    (rest.scrollDepth !== undefined && rest.scrollDepth >= 0.05 ? "in_progress" : undefined);
  const completedAt =
    status === "completed" || (rest.scrollDepth !== undefined && rest.scrollDepth >= 0.95)
      ? new Date()
      : undefined;

  const p = await prisma.progress.upsert({
    where: { userId_topicSlug: { userId, topicSlug: slug } },
    create: {
      userId,
      topicSlug: slug,
      status: status ?? "in_progress",
      scrollDepth: rest.scrollDepth ?? 0,
      mastery: rest.mastery ?? 0,
      completedAt,
    },
    update: {
      ...(status ? { status } : {}),
      ...(rest.scrollDepth !== undefined ? { scrollDepth: rest.scrollDepth } : {}),
      ...(rest.mastery !== undefined ? { mastery: rest.mastery } : {}),
      ...(completedAt ? { completedAt } : {}),
    },
  });
  return NextResponse.json({ progress: p });
}
