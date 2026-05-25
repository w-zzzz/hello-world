import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export function Pitfall({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
      <div className="mb-2 flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
        <TriangleAlert className="size-4" />
        <span>{title ?? 'Common pitfall'}</span>
      </div>
      <div className="prose prose-sm dark:prose-invert">{children}</div>
    </aside>
  )
}
