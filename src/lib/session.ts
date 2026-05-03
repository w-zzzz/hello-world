import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "mlmap_uid";

/** Get the current user id from cookie, ensuring a User row exists.
 *  Falls back to a freshly-generated id if the cookie isn't yet set
 *  (this happens on the very first request before middleware writes it). */
export async function getOrCreateUserId(): Promise<string> {
  const c = await cookies();
  const id =
    c.get(COOKIE)?.value ??
    "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  await prisma.user.upsert({
    where: { id },
    create: { id },
    update: { lastSeenAt: new Date() },
  });
  return id;
}

export async function getUserIdOrNull(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}
