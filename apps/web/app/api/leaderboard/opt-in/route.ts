import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/leaderboard/opt-in   body: { optedIn: boolean }
 *
 * Records the user's preference to appear (under an anonymized handle) on the
 * public leaderboard.
 *
 * NOTE (M8): there is no `leaderboard_opt_in` column on `users` yet — the
 * preference is persisted client-side (localStorage) by the caller, which is
 * sufficient for the current anonymized-handle leaderboard where opting in
 * only affects whether the client highlights "you". This endpoint validates
 * auth and acknowledges the request so the client isn't firing into a 404;
 * server-side persistence lands with the opt-in column in a follow-up
 * (tracked alongside the deferred quiz-perfection achievements). The response
 * is explicit that nothing was persisted server-side.
 */
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let optedIn = false
  try {
    const body = (await req.json()) as { optedIn?: unknown }
    optedIn = body.optedIn === true
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // No persistence column yet — acknowledge without claiming durability.
  return NextResponse.json({ ok: true, optedIn, persisted: false })
}
