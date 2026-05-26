'use client'

import { Button } from '@quant-academy/ui'
import { Check, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { markLessonComplete } from '@/app/actions/progress'
import { Link } from '@/i18n/navigation'

interface Props {
  lessonId: string
  isSignedIn: boolean
  alreadyCompleted: boolean
}

type Feedback =
  | { kind: 'success'; xp: number; level: number; leveledUp: boolean }
  | { kind: 'error'; message: string }
  | null

export function MarkCompleteButton({ lessonId, isSignedIn, alreadyCompleted }: Props) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback>(null)
  const router = useRouter()
  const t = useTranslations()

  if (!isSignedIn) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-sm">
        <span className="text-muted-foreground">{t('lesson.signInPrompt')}</span>
        <Button asChild size="sm">
          <Link href="/sign-in">{t('auth.signIn')}</Link>
        </Button>
      </div>
    )
  }

  function complete() {
    startTransition(async () => {
      const result = await markLessonComplete({ lessonId })
      if ('error' in result) {
        setFeedback({ kind: 'error', message: result.error })
        return
      }
      setFeedback({
        kind: 'success',
        xp: result.xpAwarded,
        level: result.newLevel,
        leveledUp: result.leveledUp,
      })
      router.refresh()
    })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button
        onClick={complete}
        disabled={isPending || alreadyCompleted}
        className="inline-flex items-center gap-2"
      >
        <Check className="size-4" aria-hidden="true" />
        {alreadyCompleted ? t('lesson.completed') : t('lesson.markComplete')}
      </Button>
      {feedback?.kind === 'success' && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-4" aria-hidden="true" />
          {t('lesson.xpAwarded', { xp: feedback.xp })}
          {feedback.leveledUp && <span> · {t('lesson.levelUp', { level: feedback.level })}</span>}
        </span>
      )}
      {feedback?.kind === 'error' && (
        <span className="text-sm text-rose-600">{feedback.message}</span>
      )}
    </div>
  )
}
