import type { Locale } from '@quant-academy/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AchievementsPageClient } from './page-client'

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('achievements.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('achievements.subtitle')}</p>
      </header>
      <AchievementsPageClient />
    </main>
  )
}
