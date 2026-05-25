import { MiniChart } from '@quant-academy/charts'
import type { Locale } from '@quant-academy/i18n'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quant-academy/ui'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Link } from '@/i18n/navigation'

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">Quant Academy</div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <section className="flex flex-col items-start gap-6">
        <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
          {t('home.title')}
        </h1>
        <p className="max-w-2xl text-lg text-foreground/70">{t('home.subtitle')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/lessons">{t('home.cta.beginTrack')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/lessons">{t('home.cta.exploreIndicators')}</Link>
          </Button>
        </div>
      </section>

      <section>
        <MiniChart height={280} className="my-8" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href={{
            pathname: '/lessons/[lessonId]',
            params: { lessonId: 'A-01-what-is-market' },
          }}
          className="block transition hover:opacity-90"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('features.kline.title')}</CardTitle>
              <CardDescription>{t('features.kline.desc')}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
        <Link href="/lessons" className="block transition hover:opacity-90">
          <Card>
            <CardHeader>
              <CardTitle>{t('features.backtest.title')}</CardTitle>
              <CardDescription>{t('features.backtest.desc')}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
        <Link href="/tutor" className="block transition hover:opacity-90">
          <Card>
            <CardHeader>
              <CardTitle>{t('features.tutor.title')}</CardTitle>
              <CardDescription>{t('features.tutor.desc')}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      </section>
    </main>
  )
}
