'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { type AchievementListItem, AchievementsGrid } from '@/components/achievements-grid'
import { Link } from '@/i18n/navigation'

interface Props {
  limit?: number
}

/**
 * Profile-page widget that fetches the achievements list client-side and
 * shows the N most-recent unlocks. Keeps the profile server component
 * lean — no need to thread M8-Backend's not-yet-shipped server action
 * through the page boundary. Gracefully renders the empty state on error
 * or while the route is still missing.
 */
export function AchievementsPreview({ limit = 4 }: Props) {
  const t = useTranslations('achievements')
  const [items, setItems] = useState<AchievementListItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/achievements', { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) return { achievements: [] as AchievementListItem[] }
        return (await res.json()) as { achievements?: AchievementListItem[] }
      })
      .then((body) => {
        if (cancelled) return
        setItems(Array.isArray(body.achievements) ? body.achievements : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (items === null) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
        {/* using a dot to indicate the loader without taxing the i18n bundle */}…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AchievementsGrid achievements={items} limit={limit} />
      {items.length > 0 && (
        <div className="flex justify-end">
          <Link
            href="/achievements"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
          >
            {t('viewAll')} <ArrowRight className="size-3" aria-hidden={true} />
          </Link>
        </div>
      )}
    </div>
  )
}
