import { TRACKS } from '@quant-academy/content'
import type { Locale } from '@quant-academy/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

/**
 * Map the track `color` value (a Tailwind palette name like 'sky') to literal
 * class strings so the JIT compiler can pick them up. Dynamic class names
 * built via template literals are not detected by Tailwind.
 */
function trackColorClasses(color: string): string {
  switch (color) {
    case 'sky':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    case 'violet':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    case 'fuchsia':
      return 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'rose':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    case 'indigo':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    default:
      return 'bg-muted text-foreground'
  }
}

export default async function TrackExplorerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('lessons.explorer.title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('lessons.explorer.subtitle')}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRACKS.map((track) => (
          <li key={track.id}>
            <Link
              href={{ pathname: '/lessons/[trackId]', params: { trackId: track.id } }}
              className="block rounded-xl border bg-card p-5 transition hover:bg-muted"
            >
              <div
                className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono font-bold ${trackColorClasses(track.color)}`}
              >
                {track.id}
              </div>
              <div className="font-semibold">{t(track.titleKey)}</div>
              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {t(track.descriptionKey)}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">0% • Beginner-friendly</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
