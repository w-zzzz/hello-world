import { type Locale, locales } from '@quant-academy/i18n'
import { cn } from '@quant-academy/ui'
import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { CommandPalette } from '@/components/command-palette'
import { UserMenu } from '@/components/user-menu'
import { Link } from '@/i18n/navigation'
import 'katex/dist/katex.min.css'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansSc = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? 'Quant Academy - 量化交易学习平台' : 'Quant Academy',
    description: isZh
      ? '从K线基础到自主策略部署，一站式趣味教学平台'
      : 'Learn quantitative trading from candlesticks to autonomous strategies.',
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params

  if (!locales.includes(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          notoSansSc.variable,
          'min-h-screen bg-background text-foreground antialiased font-sans',
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
            <Link href="/" className="font-semibold tracking-tight">
              Quant Academy
            </Link>
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </header>
          {children}
          <CommandPalette />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
