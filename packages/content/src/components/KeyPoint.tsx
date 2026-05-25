import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'

export function KeyPoint({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/30">
      <div className="mb-2 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-200">
        <Lightbulb className="size-4" />
        <span>{title ?? 'Key point'}</span>
      </div>
      <div className="prose prose-sm dark:prose-invert">{children}</div>
    </aside>
  )
}
