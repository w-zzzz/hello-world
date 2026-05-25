import { IndicatorPlayground } from '@quant-academy/content/components'
import type { Locale } from '@quant-academy/i18n'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

const M2_IDS = new Set(['sma', 'ema', 'rsi', 'macd', 'bollinger'])

export function generateStaticParams() {
  return Array.from(M2_IDS).flatMap((id) =>
    (['zh', 'en'] as const).map((locale) => ({ locale, id })),
  )
}

export default async function IndicatorPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  if (!M2_IDS.has(id)) notFound()
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/indicators" className="hover:underline">
          Indicators
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono uppercase text-foreground">{id}</span>
      </nav>
      <IndicatorPlayground indicator={id} />
    </main>
  )
}
