import type { ReactNode } from 'react'

export function Reveal({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="my-4 rounded-lg border bg-card p-3 [&_summary]:cursor-pointer">
      <summary className="font-medium text-foreground">{summary}</summary>
      <div className="prose prose-sm mt-3 dark:prose-invert">{children}</div>
    </details>
  )
}
