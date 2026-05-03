import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/** Liveness + DB readiness check. No auth. Cheap.
 *  - 200 with `db: "up"` when the trivial query succeeds.
 *  - 503 with `db: "down"` when it doesn't. */
export async function GET() {
  const ts = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts, db: "up" }, { status: 200 });
  } catch (err) {
    logger.error("health:db_down", { err: String(err) });
    return NextResponse.json({ ok: false, ts, db: "down" }, { status: 503 });
  }
}
