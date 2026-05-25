import { Button } from '@quant-academy/ui'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function LessonNav({ prev, next }: { prev: string | null; next: string | null }) {
  const t = await getTranslations()

  return (
    <nav className="mt-10 flex items-center justify-between gap-3 border-t pt-6">
      {prev ? (
        <Button asChild variant="outline">
          <Link href={`/lessons/${prev}`} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t('lessons.viewer.previous')}</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t('lessons.viewer.previous')}</span>
        </Button>
      )}
      {next ? (
        <Button asChild>
          <Link href={`/lessons/${next}`} className="inline-flex items-center gap-2">
            <span>{t('lessons.viewer.next')}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button disabled className="inline-flex items-center gap-2">
          <span>{t('lessons.viewer.next')}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </nav>
  )
}
