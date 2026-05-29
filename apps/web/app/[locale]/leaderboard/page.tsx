import type { Locale } from '@quant-academy/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { LeaderboardPageClient } from './page-client'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  const user = await getCurrentUser()
  // Mirror M8-Backend handle convention: leaderboard rows expose only the
  // first 8 characters of a user's UUID. We compare against that prefix to
  // highlight the current user without leaking their full id to other
  // browser sessions through the bundle.
  const currentUserHandle = user ? user.id.slice(0, 8) : null

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('leaderboard.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('leaderboard.subtitle')}</p>
      </header>
      <LeaderboardPageClient currentUserHandle={currentUserHandle} />
    </main>
  )
}
