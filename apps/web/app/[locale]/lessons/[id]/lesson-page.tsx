import { getLesson, getNextLesson, getPreviousLesson } from '@quant-academy/content'
import type { Locale } from '@quant-academy/i18n'
import { BookOpen } from 'lucide-react'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getCompletedLessons } from '@/app/actions/progress'
import { LessonBreadcrumb } from '@/components/lesson-breadcrumb'
import { LessonNav } from '@/components/lesson-nav'
import { LessonProgress } from '@/components/lesson-progress'
import { MarkCompleteButton } from '@/components/mark-complete-button'
import { TutorPanel } from '@/components/tutor-panel'
import { getCurrentUser } from '@/lib/auth'

function ComingSoonPlaceholder({ meta }: { meta: { id: string; trackId: string } }) {
  return (
    <div className="not-prose rounded-xl border border-dashed p-12 text-center">
      <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-lg font-semibold">Coming soon</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Lesson <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{meta.id}</code>{' '}
        is scaffolded and will be authored in a later milestone.
      </p>
    </div>
  )
}

export async function LessonPage({ locale, lessonId }: { locale: Locale; lessonId: string }) {
  setRequestLocale(locale)

  const lesson = await getLesson(lessonId, locale)
  if (!lesson) notFound()

  const next = getNextLesson(lessonId)
  const prev = getPreviousLesson(lessonId)
  const { meta, Mdx, ready } = lesson

  const user = await getCurrentUser()
  const completed = user ? await getCompletedLessons() : null
  const alreadyCompleted = completed?.lessons.some((l) => l.lessonId === meta.id) ?? false

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <LessonBreadcrumb trackId={meta.trackId} lessonId={meta.id} />
      <LessonProgress lessonId={meta.id} />
      <article className="prose prose-slate dark:prose-invert max-w-none mt-6">
        {ready ? <Mdx /> : <ComingSoonPlaceholder meta={meta} />}
      </article>
      {ready && (
        <MarkCompleteButton
          lessonId={meta.id}
          isSignedIn={!!user}
          alreadyCompleted={alreadyCompleted}
        />
      )}
      {ready && (
        <div className="mt-6">
          <TutorPanel lessonId={meta.id} isSignedIn={!!user} />
        </div>
      )}
      <LessonNav prev={prev?.meta.id ?? null} next={next?.meta.id ?? null} />
    </main>
  )
}
