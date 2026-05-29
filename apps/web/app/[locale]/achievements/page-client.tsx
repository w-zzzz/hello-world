'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import {
  type AchievementListItem,
  AchievementsGrid,
} from '@/components/achievements-grid'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; items: AchievementListItem[] }
  | { kind: 'error' }

/**
 * Loads `/api/achievements` on mount and renders the grid. Falls back to an
 * empty state if the route 404s or 500s (the M8-Backend agent may not have
 * landed the route yet at the moment a user opens this page).
 */
export function AchievementsPageClient() {
  const t = useTranslations()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/achievements', {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) {
          if (!cancelled) setState({ kind: 'ready', items: [] })
          return
        }
        const body = (await res.json()) as { achievements?: AchievementListItem[] }
        if (!cancelled) {
          setState({ kind: 'ready', items: Array.isArray(body.achievements) ? body.achievements : [] })
        }
      } catch {
        if (!cancelled) setState({ kind: 'error' }) // network failure → distinct from empty
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.kind === 'loading') {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t('common.error')}
      </div>
    )
  }

  return <AchievementsGrid achievements={state.items} />
}
