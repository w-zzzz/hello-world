'use client'

import { Button } from '@quant-academy/ui'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'

/**
 * Leaderboard opt-in toggle. Persists the user's preference via a backend
 * endpoint owned by M8-Backend (`PATCH /api/leaderboard/opt-in`). Until the
 * route lands, optimistic UI updates still flip the visible label and the
 * frontend remembers the choice locally so a refresh doesn't lose it.
 */
const LOCAL_KEY = 'qa-leaderboard-opt-in'

interface Props {
  initialOptedIn?: boolean
}

export function LeaderboardOptIn({ initialOptedIn = false }: Props) {
  const t = useTranslations('leaderboard')
  const [optedIn, setOptedIn] = useState<boolean>(initialOptedIn)
  const [pending, startTransition] = useTransition()

  // Hydrate from local cache only when the server snapshot had no opinion
  // (i.e. the backend table doesn't track this yet). Avoids overriding a
  // server-confirmed `true` with a stale `false` in localStorage.
  useEffect(() => {
    if (initialOptedIn) return
    try {
      const v = window.localStorage.getItem(LOCAL_KEY)
      if (v === '1') setOptedIn(true)
    } catch {
      // ignore — private mode etc.
    }
  }, [initialOptedIn])

  function toggle(next: boolean) {
    startTransition(async () => {
      setOptedIn(next)
      try {
        window.localStorage.setItem(LOCAL_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      try {
        await fetch('/api/leaderboard/opt-in', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optedIn: next }),
        })
      } catch {
        // ignore — server-side persistence is best-effort until backend lands
      }
    })
  }

  if (optedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
        <span className="text-muted-foreground">{t('optedIn')}</span>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => toggle(false)}>
          {t('optInCta')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('optInTitle')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('optInBody')}</p>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-border accent-brand-500"
          checked={optedIn}
          disabled={pending}
          onChange={(e) => toggle(e.currentTarget.checked)}
          aria-label={t('optInCta')}
        />
        <span>{t('optInCta')}</span>
      </label>
    </div>
  )
}
