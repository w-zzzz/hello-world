'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { Award, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

/**
 * Achievement payload — matches the M8-Backend `completeLesson` contract.
 * Keep this in lockstep with `apps/web/app/actions/progress.ts` once
 * backend lands the extended response. Defined locally so the frontend
 * doesn't need to wait on the @quant-academy/gamification re-export.
 */
export interface UnlockedAchievement {
  slug: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  /** Lucide icon name, e.g. 'trophy', 'flame', 'sparkles', 'medal', 'award'. */
  icon: string
}

/** Global event name dispatched whenever lessons unlock achievements. */
export const ACHIEVEMENT_UNLOCK_EVENT = 'qa:achievement-unlock'

/** Imperative helper any client component can call after `completeLesson` resolves. */
export function dispatchAchievementUnlock(unlocked: UnlockedAchievement[]): void {
  if (typeof window === 'undefined' || unlocked.length === 0) return
  window.dispatchEvent(
    new CustomEvent<UnlockedAchievement[]>(ACHIEVEMENT_UNLOCK_EVENT, { detail: unlocked }),
  )
}

interface ToastItem extends UnlockedAchievement {
  id: string
}

const AUTO_DISMISS_MS = 5000

/**
 * Resolve a Lucide icon by name with a sensible fallback. Lucide ships
 * icons in PascalCase (e.g. `Trophy`), so we capitalize the contract's
 * lowercase slug first. We treat the namespace as an icon map and fall
 * back to <Award /> when the requested icon doesn't exist.
 */
function resolveIcon(name: string): React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> {
  const key = name.charAt(0).toUpperCase() + name.slice(1)
  const lib = LucideIcons as unknown as Record<string, unknown>
  const candidate = lib[key]
  if (typeof candidate === 'function' || (typeof candidate === 'object' && candidate !== null)) {
    return candidate as React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  }
  return Award
}

/**
 * Singleton listener mounted near the root that turns
 * `qa:achievement-unlock` events into animated toasts. Auto-dismisses each
 * toast after 5 seconds; users can also click the close button to dismiss
 * sooner. Respects prefers-reduced-motion.
 */
export function AchievementToastListener() {
  const [items, setItems] = useState<ToastItem[]>([])
  const reduceMotion = useReducedMotion()
  const t = useTranslations('achievements')
  const locale = useLocale()

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<UnlockedAchievement[]>
      const list = Array.isArray(ce.detail) ? ce.detail : []
      if (list.length === 0) return
      const next = list.map((a) => ({
        ...a,
        id: `${a.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }))
      setItems((prev) => [...prev, ...next])
    }
    window.addEventListener(ACHIEVEMENT_UNLOCK_EVENT, handler)
    return () => window.removeEventListener(ACHIEVEMENT_UNLOCK_EVENT, handler)
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const timers = items.map((it) =>
      window.setTimeout(() => dismiss(it.id), AUTO_DISMISS_MS),
    )
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [items, dismiss])

  const initial = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }
  const animate = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
  const exit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-3 px-4"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const Icon = resolveIcon(item.icon)
          const name = locale === 'zh' ? item.nameZh : item.nameEn
          const description = locale === 'zh' ? item.descriptionZh : item.descriptionEn
          return (
            <motion.div
              key={item.id}
              role="status"
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-sm rounded-xl border bg-card p-4 text-card-foreground shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
                  <Icon className="size-5" aria-hidden={true} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('toastTitle')}
                  </p>
                  <p className="mt-0.5 truncate font-semibold">{name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss"
                  className="-mr-1 -mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <X className="size-4" aria-hidden={true} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
