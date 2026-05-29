import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { db, streaks } from '@/lib/db'
import { StreakIndicator } from './streak-indicator'

/**
 * Server-side wrapper that reads the current user's streak straight from
 * the DB and renders the StreakIndicator badge. Returns null for anonymous
 * sessions and for users with no streak so the nav stays clean.
 */
export async function NavStreak() {
  const user = await getCurrentUser()
  if (!user) return null

  const rows = await db
    .select({
      current: streaks.current,
      lastActiveDate: streaks.lastActiveDate,
    })
    .from(streaks)
    .where(eq(streaks.userId, user.id))
    .limit(1)
  const row = rows[0]
  if (!row || row.current <= 0) return null

  const lastActiveDate =
    typeof row.lastActiveDate === 'string'
      ? row.lastActiveDate
      : new Date(row.lastActiveDate as unknown as number).toISOString().slice(0, 10)

  return <StreakIndicator current={row.current} lastActiveDate={lastActiveDate} />
}
