'use client'

import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'qa.lesson.progress.'

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export function LessonProgress({ lessonId }: { lessonId: string }) {
  const [percent, setPercent] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`)
      if (stored !== null) {
        setPercent(clampPercent(Number.parseFloat(stored)))
      } else {
        setPercent(0)
      }
    } catch {
      setPercent(0)
    }
  }, [lessonId])

  const display = mounted ? percent : 0

  return (
    <div className="mt-4">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={display}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson progress"
      >
        <div
          className="h-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${display}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(display)}%
      </div>
    </div>
  )
}
