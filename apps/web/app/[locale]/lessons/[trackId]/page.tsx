import { getLessonsByTrack, getTrack, type LessonRecord, TRACKS } from '@quant-academy/content'
import type { TrackId } from '@quant-academy/content/schema'
import type { Locale } from '@quant-academy/i18n'
import { Clock, Lock, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

const TRACK_IDS: readonly TrackId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function generateStaticParams() {
  return TRACK_IDS.flatMap((trackId) =>
    (['zh', 'en'] as const).map((locale) => ({ locale, trackId })),
  )
}

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'intermediate':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'advanced':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    default:
      return 'bg-muted text-foreground'
  }
}

function prettifyLessonId(id: string): string {
  // 'A-01-what-is-market' -> 'What Is Market'
  const parts = id.split('-')
  const slugParts = parts.slice(2)
  if (slugParts.length === 0) return id
  return slugParts
    .map((p) => (p.length === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
}

function prettifyModuleId(module: string): string {
  return module
    .split(/[-_]/)
    .map((p) => (p.length === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
}

function groupByModule(lessons: LessonRecord[]): Map<string, LessonRecord[]> {
  const groups = new Map<string, LessonRecord[]>()
  for (const record of lessons) {
    const list = groups.get(record.meta.module) ?? []
    list.push(record)
    groups.set(record.meta.module, list)
  }
  for (const [, list] of groups) {
    list.sort((a, b) => a.meta.order - b.meta.order)
  }
  return groups
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: Locale; trackId: string }>
}) {
  const { locale, trackId } = await params
  setRequestLocale(locale)

  if (!TRACK_IDS.includes(trackId as TrackId)) {
    notFound()
  }

  const typedTrackId = trackId as TrackId
  const track = getTrack(typedTrackId)
  if (!track) notFound()

  const lessons = await getLessonsByTrack(typedTrackId)
  const groups = groupByModule(lessons)
  const t = await getTranslations({ locale })

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/lessons" className="hover:underline">
          {t('lessons.explorer.title')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Track {track.id}</span>
      </nav>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{t(track.titleKey)}</h1>
      <p className="mb-8 text-muted-foreground">{t(track.descriptionKey)}</p>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No lessons yet for this track.
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(groups.entries()).map(([moduleId, moduleLessons]) => (
            <section key={moduleId}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {prettifyModuleId(moduleId)}
              </h2>
              <ul className="divide-y rounded-xl border bg-card">
                {moduleLessons.map((record) => {
                  const lesson = record.meta
                  // M1: completion tracking not implemented yet, always unlocked.
                  const locked = false
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={{
                          pathname: '/lessons/[lessonId]',
                          params: { lessonId: lesson.id },
                        }}
                        className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted"
                      >
                        <div className="w-10 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
                          {String(lesson.order).padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{prettifyLessonId(lesson.id)}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium ${difficultyClasses(lesson.difficulty)}`}
                            >
                              {lesson.difficulty}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {lesson.durationMin} min
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              {lesson.xp} XP
                            </span>
                          </div>
                        </div>
                        {locked ? (
                          <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        {TRACKS.length} tracks in total · this track has {lessons.length} lesson
        {lessons.length === 1 ? '' : 's'}.
      </p>
    </main>
  )
}
