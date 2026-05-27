import type { Locale } from '@quant-academy/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { TutorPanel } from '@/components/tutor-panel'
import { getCurrentUser } from '@/lib/auth'

export default async function TutorPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('tutor.title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('tutor.fullPageHint')}</p>
      <TutorPanel lessonId={null} isSignedIn={!!user} />
    </main>
  )
}
