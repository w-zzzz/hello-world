import type { Locale } from '@quant-academy/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@quant-academy/ui'
import { BookOpen, Flame, Trophy } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCompletedLessons, getProfileSummary } from '@/app/actions/progress'
import { LevelRing } from '@/components/level-ring'

export default async function ProfilePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })

  const summary = await getProfileSummary()
  if (!summary) {
    redirect(`/${locale}/sign-in`)
  }
  const completed = await getCompletedLessons()

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-center gap-6">
        <LevelRing
          level={summary.level}
          xpIntoLevel={summary.xpIntoLevel}
          xpForNext={summary.xpForNext}
          size={120}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{summary.user.displayName}</h1>
          <p className="font-mono text-sm text-muted-foreground">{summary.user.handle}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Trophy className="size-4" aria-hidden="true" /> {t('profile.totalXp')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{summary.xpTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Flame className="size-4" aria-hidden="true" /> {t('profile.streak')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{summary.streak.current}</div>
            <div className="text-xs text-muted-foreground">/ {summary.streak.longest}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="size-4" aria-hidden="true" /> {t('profile.lessonsCompleted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{summary.lessonsCompleted}</div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('profile.recentLessons')}
        </h2>
        {completed && completed.lessons.length > 0 ? (
          <ul className="divide-y rounded-xl border bg-card">
            {completed.lessons.map((l) => (
              <li key={l.lessonId} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono">{l.lessonId}</span>
                <span className="text-muted-foreground tabular-nums">
                  {new Date(l.completedAt).toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t('profile.empty')}
          </div>
        )}
      </section>
    </main>
  )
}
