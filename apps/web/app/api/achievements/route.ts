import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { achievements, db, userAchievements } from '@/lib/db'

/**
 * GET /api/achievements
 *
 * Returns the full achievement catalog merged with the current user's unlock
 * state. Every catalog row is returned; `unlockedAt` is an ISO string when the
 * signed-in user has earned it, otherwise null (⇒ the UI renders it locked).
 *
 * Unauthenticated requests get the catalog with everything locked — this keeps
 * the achievements page renderable for signed-out visitors and lets the
 * profile preview degrade gracefully (it treats a non-ok response as empty).
 *
 * Shape matches `AchievementListItem` in components/achievements-grid.tsx.
 */

export const dynamic = 'force-dynamic'

interface AchievementListItem {
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  icon: string
  unlockedAt: string | null
}

export async function GET() {
  const catalog = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      nameEn: achievements.nameEn,
      nameZh: achievements.nameZh,
      descriptionEn: achievements.descriptionEn,
      descriptionZh: achievements.descriptionZh,
      icon: achievements.icon,
    })
    .from(achievements)

  const user = await getCurrentUser()

  // Map achievementId -> unlockedAt for the current user (empty when signed out).
  const unlockedById = new Map<string, Date>()
  if (user) {
    const rows = await db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, user.id))
    for (const r of rows) unlockedById.set(r.achievementId, r.unlockedAt)
  }

  const list: AchievementListItem[] = catalog.map((a) => {
    const at = unlockedById.get(a.id)
    return {
      slug: a.slug,
      nameEn: a.nameEn,
      nameZh: a.nameZh,
      descriptionEn: a.descriptionEn,
      descriptionZh: a.descriptionZh,
      icon: a.icon,
      unlockedAt: at ? at.toISOString() : null,
    }
  })

  return NextResponse.json({ achievements: list })
}
