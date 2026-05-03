import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const COOKIE = "mlmap_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;
const isProd = process.env.NODE_ENV === "production";

function newId() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(`session:${clientKey(req)}`, 30, 60_000);
  if (!rl.ok) {
    logger.warn("rate_limited", { route: "/api/session", retryAfterMs: rl.retryAfterMs });
    return tooManyRequests(rl.retryAfterMs);
  }

  let id = req.cookies.get(COOKIE)?.value;
  let setCookie = false;
  if (!id) {
    id = newId();
    setCookie = true;
  }
  await prisma.user.upsert({
    where: { id },
    create: { id },
    update: { lastSeenAt: new Date() },
  });
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, xp: true, streakCount: true, streakDate: true, prefs: true, createdAt: true },
  });
  const res = NextResponse.json({ user });
  if (setCookie) {
    res.cookies.set(COOKIE, id, {
      maxAge: ONE_YEAR,
      path: "/",
      sameSite: "lax",
      secure: isProd,
    });
  }
  return res;
}
