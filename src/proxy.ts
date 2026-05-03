import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "mlmap_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function newId() {
  // Stable client id; not cryptographic. Generate at the edge.
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function proxy(req: NextRequest) {
  const existing = req.cookies.get(COOKIE)?.value;
  const res = NextResponse.next();
  if (!existing) {
    res.cookies.set(COOKIE, newId(), {
      maxAge: ONE_YEAR,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // allow client read for SWR keying
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?)).*)"],
};
