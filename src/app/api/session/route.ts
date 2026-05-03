import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const COOKIE = "mlmap_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function newId() {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
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
    res.cookies.set(COOKIE, id, { maxAge: ONE_YEAR, path: "/", sameSite: "lax" });
  }
  return res;
}
