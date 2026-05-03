import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { XP, applyStreak, levelOf, updateMastery } from "@/lib/mastery";
import { nextReview } from "@/lib/sr";

const COOKIE = "mlmap_uid";

const Body = z.object({
  topicSlug: z.string(),
  questionId: z.string(),
  selected: z.number().int().min(0),
  correct: z.boolean(),
  timeMs: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const userId = req.cookies.get(COOKIE)?.value;
  if (!userId) return NextResponse.json({ error: "no session" }, { status: 401 });
  await prisma.user.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { topicSlug, questionId, selected, correct, timeMs } = parsed.data;

  const now = new Date();

  await prisma.quizAttempt.create({
    data: { userId, topicSlug, questionId, selected, correct, timeMs },
  });

  // Update progress mastery (EMA per topic across attempts)
  const prog = await prisma.progress.findUnique({
    where: { userId_topicSlug: { userId, topicSlug } },
  });
  const newMastery = updateMastery(prog?.mastery ?? 0, correct);
  await prisma.progress.upsert({
    where: { userId_topicSlug: { userId, topicSlug } },
    create: { userId, topicSlug, status: "in_progress", mastery: newMastery, scrollDepth: prog?.scrollDepth ?? 0 },
    update: { mastery: newMastery },
  });

  // Schedule review item
  const grade = correct ? 4 : 1;
  const existing = await prisma.reviewItem.findUnique({
    where: { userId_topicSlug_questionId: { userId, topicSlug, questionId } },
  });
  const sr = nextReview(existing, grade, now);
  await prisma.reviewItem.upsert({
    where: { userId_topicSlug_questionId: { userId, topicSlug, questionId } },
    create: { userId, topicSlug, questionId, ...sr },
    update: { ...sr },
  });

  // Update XP and streak
  const xpDelta = correct ? XP.quizCorrect : XP.quizWrong;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const streak = applyStreak(user?.streakCount ?? 0, user?.streakDate ?? null, now);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpDelta },
      streakCount: streak.streakCount,
      streakDate: streak.streakDate,
    },
  });
  const lvl = levelOf(updatedUser.xp);

  return NextResponse.json({
    ok: true,
    correct,
    xpDelta,
    xp: updatedUser.xp,
    level: lvl,
    streakCount: updatedUser.streakCount,
    mastery: newMastery,
    nextDueAt: sr.dueAt,
  });
}
