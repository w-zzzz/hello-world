import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quant-academy/ui';
import type { Locale } from '@quant-academy/i18n';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">
          Quant Academy
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <section className="flex flex-col items-start gap-6">
        <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
          {t('home.title')}
        </h1>
        <p className="max-w-2xl text-lg text-foreground/70">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">{t('home.cta.beginTrack')}</Button>
          <Button size="lg" variant="outline">
            {t('home.cta.exploreIndicators')}
          </Button>
        </div>
      </section>

      <section>
        <div className="flex aspect-video items-center justify-center rounded-xl border bg-card text-foreground/60">
          Chart preview (M1)
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('features.kline.title')}</CardTitle>
            <CardDescription>{t('features.kline.desc')}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('features.backtest.title')}</CardTitle>
            <CardDescription>{t('features.backtest.desc')}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('features.tutor.title')}</CardTitle>
            <CardDescription>{t('features.tutor.desc')}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </section>
    </main>
  );
}
