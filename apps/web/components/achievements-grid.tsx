'use client'

import { motion, useReducedMotion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { Award, Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId } from 'react'

/**
 * Shape returned by the M8-Backend achievements list endpoint. Keep this in
 * lockstep with `GET /api/achievements` (added by M8-Backend) — the
 * frontend doesn't import from @quant-academy/gamification because the
 * Achievement type lives there alongside server-only evaluator code.
 */
export interface AchievementListItem {
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  /** Lucide icon name, lowercase. */
  icon: string
  /** Localizable criterion summary shown on hover. */
  criteriaEn?: string
  criteriaZh?: string
  /** ISO timestamp string. Null/undefined ⇒ locked. */
  unlockedAt?: string | null
}

interface Props {
  achievements: AchievementListItem[]
  /** Cap the number of tiles shown. When set we render most-recent first. */
  limit?: number
  className?: string
}

function resolveIcon(
  name: string,
): React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> {
  const key = name.charAt(0).toUpperCase() + name.slice(1)
  const lib = LucideIcons as unknown as Record<string, unknown>
  const candidate = lib[key]
  if (typeof candidate === 'function' || (typeof candidate === 'object' && candidate !== null)) {
    return candidate as React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  }
  return Award
}

function formatDate(iso: string): string {
  // The achievements page is locale-aware, but we keep dates in a stable
  // ISO-day format so the rendered HTML is identical across SSR and CSR —
  // this avoids hydration drift caused by toLocaleDateString().
  return iso.slice(0, 10)
}

export function AchievementsGrid({ achievements, limit, className }: Props) {
  const locale = useLocale()
  const t = useTranslations('achievements')
  const reduceMotion = useReducedMotion()
  const headingId = useId()

  // Sort: unlocked first (most-recent unlock at the top), then locked.
  // We only sort when a limit is provided (preview mode); the full page
  // keeps the backend's intended ordering otherwise.
  const list = limit
    ? [...achievements]
        .sort((a, b) => {
          const aTs = a.unlockedAt ? Date.parse(a.unlockedAt) : 0
          const bTs = b.unlockedAt ? Date.parse(b.unlockedAt) : 0
          return bTs - aTs
        })
        .slice(0, limit)
    : achievements

  if (list.length === 0) {
    return (
      <div
        className={[
          'rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t('empty')}
      </div>
    )
  }

  return (
    <ul
      aria-labelledby={headingId}
      className={[
        'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span id={headingId} className="sr-only">
        {t('title')}
      </span>
      {list.map((a, idx) => {
        const Icon = resolveIcon(a.icon)
        const unlocked = Boolean(a.unlockedAt)
        const name = locale === 'zh' ? a.nameZh : a.nameEn
        const description = locale === 'zh' ? a.descriptionZh : a.descriptionEn
        const criteria = locale === 'zh' ? a.criteriaZh : a.criteriaEn
        const initial = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
        const animate = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
        return (
          <motion.li
            key={a.slug}
            initial={initial}
            animate={animate}
            transition={{
              duration: reduceMotion ? 0 : 0.25,
              delay: reduceMotion ? 0 : Math.min(idx * 0.03, 0.3),
            }}
            className={[
              'group relative flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors',
              unlocked ? 'hover:border-amber-400' : 'opacity-60',
            ].join(' ')}
            title={criteria}
          >
            <div
              className={[
                'flex size-12 items-center justify-center rounded-full',
                unlocked
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {unlocked ? (
                <Icon className="size-6" aria-hidden={true} />
              ) : (
                <Lock className="size-5" aria-hidden={true} />
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium">{name}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {unlocked && a.unlockedAt
                ? t('unlockedAt', { date: formatDate(a.unlockedAt) })
                : t('locked')}
            </p>
          </motion.li>
        )
      })}
    </ul>
  )
}
