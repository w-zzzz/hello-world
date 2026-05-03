/**
 * In-memory token-bucket rate limiter.
 *
 * Per-process — counters live in a single `Map` shared by the Node runtime that
 * serves a request. This is a meaningful production safety net (it stops a
 * single misbehaving client from hammering us) but it is NOT distributed: if
 * we ever scale to >1 process or to the edge runtime, swap this for Redis or
 * an Upstash-backed limiter. Documented intentionally.
 */

type Bucket = {
  // tokens remaining in the current window
  tokens: number;
  // ms timestamp at which the current window started
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

// Periodic compaction so the Map doesn't grow unbounded. Runs lazily inside
// `rateLimit` once per ~1000 calls.
let calls = 0;
function maybeSweep(now: number) {
  calls += 1;
  if (calls < 1000) return;
  calls = 0;
  for (const [k, b] of buckets) {
    // Expire anything older than ~5 minutes idle. Cheap & safe.
    if (now - b.windowStart > 5 * 60_000) buckets.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
};

/**
 * Consume one token for `key`. Returns `{ ok: false, retryAfterMs }` when the
 * caller has exceeded `limit` requests within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    // New window.
    buckets.set(key, { tokens: limit - 1, windowStart: now });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }

  if (existing.tokens <= 0) {
    const retryAfterMs = Math.max(0, windowMs - (now - existing.windowStart));
    return { ok: false, retryAfterMs, remaining: 0 };
  }

  existing.tokens -= 1;
  return { ok: true, retryAfterMs: 0, remaining: existing.tokens };
}

/** For tests. */
export function __resetRateLimit() {
  buckets.clear();
  calls = 0;
}

// ----- Request-level helpers -----------------------------------------------

const COOKIE = "mlmap_uid";

/** Best-effort client identity: cookie uid first, then forwarded headers, then
 *  a literal "anon" sentinel. Never returns empty. */
export function clientKey(req: Request): string {
  // NextRequest has `cookies.get()`; plain Request needs to parse the header.
  // Handle both shapes via duck-typing so this works in route handlers and
  // in tests that pass a plain Request.
  const r = req as Request & {
    cookies?: { get?: (name: string) => { value: string } | undefined };
  };
  const fromCookie = r.cookies?.get?.(COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const m = cookieHeader.match(/(?:^|;\s*)mlmap_uid=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return `ip:${xri.trim()}`;
  return "anon";
}

/** Construct a 429 NextResponse-compatible Response with `Retry-After`. */
export function tooManyRequests(retryAfterMs: number): Response {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return new Response(JSON.stringify({ error: "rate_limited", retryAfterMs }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(seconds),
    },
  });
}
