'use client'

import { Flame } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

interface Props {
  /** Current streak length in days. */
  current: number
  /** Last active date in ISO 'YYYY-MM-DD' form (UTC day). */
  lastActiveDate?: string | null
  /** Compact mode hides the numeric count next to the icon — used in tight nav slots. */
  compact?: boolean
  className?: string
}

/**
 * Flame + day-count badge with an accessible tooltip on hover/focus.
 * Used in the nav bar and on the profile page. Renders nothing when the
 * current streak is zero to avoid drawing attention to absence.
 */
export function StreakIndicator({ current, lastActiveDate, compact = false, className }: Props) {
  const t = useTranslations('streak')
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  if (current <= 0) return null

  const displayDate = lastActiveDate ?? '—'

  return (
    <span
      className={['relative inline-flex items-center', className].filter(Boolean).join(' ')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={tooltipId}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/30 transition-colors hover:bg-amber-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300"
      >
        <Flame className="size-3.5" aria-hidden="true" />
        {!compact && (
          <span className="tabular-nums">{t('label', { count: current })}</span>
        )}
        {compact && <span className="sr-only">{t('label', { count: current })}</span>}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={[
          'pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {t('tooltip', { date: displayDate })}
      </span>
    </span>
  )
}
