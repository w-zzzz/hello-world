import type { Locale } from '@quant-academy/i18n'
import { Card, CardDescription, CardHeader, CardTitle } from '@quant-academy/ui'
import { Lock } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

const M2_IDS = ['sma', 'ema', 'rsi', 'macd', 'bollinger'] as const
const LATER_IDS = [
  'stochastic',
  'atr',
  'obv',
  'adx',
  'ichimoku',
  'vwap',
  'pivots',
  'donchian',
  'keltner',
  'cci',
  'mfi',
  'williams',
  'supertrend',
  'sar',
  'volume-profile',
]

export default async function IndicatorsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('indicators.title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('indicators.subtitle')}</p>
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          M2
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {M2_IDS.map((id) => (
            <li key={id}>
              <Link href={`/indicators/${id}`} className="block">
                <Card className="transition hover:bg-muted">
                  <CardHeader>
                    <CardTitle className="font-mono uppercase">{id}</CardTitle>
                    <CardDescription>Interactive playground</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          M7
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LATER_IDS.map((id) => (
            <li key={id}>
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-mono uppercase">
                    {id}
                    <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                  </CardTitle>
                  <CardDescription>{t('indicators.coming.M7')}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
