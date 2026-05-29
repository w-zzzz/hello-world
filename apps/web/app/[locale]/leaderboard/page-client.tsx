'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

type Period = 'weekly' | 'all_time'

interface LeaderboardEntry {
  rank: number
  handle: string
  xp: number
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; entries: LeaderboardEntry[] }
  | { kind: 'disabled' } // 5xx — backend not ready
  | { kind: 'empty' }

interface Props {
  currentUserHandle: string | null
}

export function LeaderboardPageClient({ currentUserHandle }: Props) {
  const t = useTranslations()
  const [period, setPeriod] = useState<Period>('weekly')
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`, {
          headers: { Accept: 'application/json' },
        })
        if (res.status >= 500) {
          if (!cancelled) setState({ kind: 'disabled' })
          return
        }
        if (!res.ok) {
          if (!cancelled) setState({ kind: 'empty' })
          return
        }
        const body = (await res.json()) as { entries?: LeaderboardEntry[] }
        const entries = Array.isArray(body.entries) ? body.entries : []
        if (!cancelled) {
          setState(entries.length === 0 ? { kind: 'empty' } : { kind: 'ready', entries })
        }
      } catch {
        if (!cancelled) setState({ kind: 'disabled' })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <section className="space-y-4">
      <div
        role="tablist"
        aria-label={t('leaderboard.title')}
        className="inline-flex rounded-lg border bg-card p-1"
      >
        {(['weekly', 'all_time'] as const).map((p) => {
          const selected = p === period
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPeriod(p)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  setPeriod((curr) => (curr === 'weekly' ? 'all_time' : 'weekly'))
                }
              }}
              className={[
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {t(p === 'weekly' ? 'leaderboard.tabs.weekly' : 'leaderboard.tabs.all_time')}
            </button>
          )
        })}
      </div>

      {state.kind === 'loading' && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('common.loading')}
        </div>
      )}

      {state.kind === 'disabled' && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('leaderboard.empty')}
        </div>
      )}

      {state.kind === 'empty' && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('leaderboard.empty')}
        </div>
      )}

      {state.kind === 'ready' && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 w-16">
                  {t('leaderboard.rank')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('leaderboard.learner')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('leaderboard.xp')}
                </th>
              </tr>
            </thead>
            <tbody>
              {state.entries.slice(0, 50).map((entry) => {
                const isMe = currentUserHandle !== null && entry.handle === currentUserHandle
                return (
                  <tr
                    key={`${entry.rank}-${entry.handle}`}
                    className={['border-b last:border-b-0', isMe ? 'bg-brand-500/5' : ''].join(' ')}
                  >
                    <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                      #{entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">{entry.handle}</span>
                      {isMe && (
                        <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-500">
                          {t('leaderboard.you')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{entry.xp}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
