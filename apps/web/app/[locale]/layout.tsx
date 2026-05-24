import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cn } from '@quant-academy/ui';
import { locales, type Locale } from '@quant-academy/i18n';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSc = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  return {
    title: isZh ? 'Quant Academy - 量化交易学习平台' : 'Quant Academy',
    description: isZh
      ? '从K线基础到自主策略部署，一站式趣味教学平台'
      : 'Learn quantitative trading from candlesticks to autonomous strategies.',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
