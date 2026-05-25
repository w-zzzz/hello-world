import { CURRICULUM, TRACKS } from '@quant-academy/content'
import type { TrackId } from '@quant-academy/content/schema'
import type { Locale } from '@quant-academy/i18n'
import type { Metadata } from 'next'
import { LessonPage } from './lesson-page'
import { TrackPage } from './track-page'

const TRACK_IDS = new Set<TrackId>(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])

function isTrackId(id: string): id is TrackId {
  return TRACK_IDS.has(id as TrackId)
}

export function generateStaticParams() {
  const trackParams = TRACKS.map((t) => ({ id: t.id }))
  const lessonParams = CURRICULUM.lessons.map((l) => ({ id: l.meta.id }))
  return [...trackParams, ...lessonParams].flatMap((p) =>
    (['zh', 'en'] as const).map((locale) => ({ ...p, locale })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return { title: `${id} · Quant Academy` }
}

export default async function LessonsRoute({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  if (isTrackId(id)) {
    return <TrackPage locale={locale} trackId={id} />
  }
  return <LessonPage locale={locale} lessonId={id} />
}
