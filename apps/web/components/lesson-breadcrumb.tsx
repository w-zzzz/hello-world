import type { TrackId } from '@quant-academy/content/schema'
import { ChevronRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function LessonBreadcrumb({
  trackId,
  lessonId,
}: {
  trackId: TrackId
  lessonId: string
}) {
  const t = await getTranslations()

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Link href="/lessons" className="hover:text-foreground hover:underline">
        {t('lessons.explorer.title')}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <Link
        href={{ pathname: '/lessons/[trackId]', params: { trackId } }}
        className="hover:text-foreground hover:underline"
      >
        Track {trackId}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="truncate font-mono text-xs text-foreground" title={lessonId}>
        {lessonId}
      </span>
    </nav>
  )
}
