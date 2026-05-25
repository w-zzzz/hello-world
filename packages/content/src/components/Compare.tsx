import type { ReactNode } from 'react'

export interface CompareProps {
  left: ReactNode
  right: ReactNode
  leftTitle?: string
  rightTitle?: string
}

export function Compare({ left, right, leftTitle, rightTitle }: CompareProps) {
  return (
    <div className="my-6 grid gap-4 rounded-xl border p-4 md:grid-cols-2 md:divide-x">
      <div className="md:pr-4">
        {leftTitle && (
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {leftTitle}
          </h4>
        )}
        <div className="prose prose-sm dark:prose-invert">{left}</div>
      </div>
      <div className="md:pl-4">
        {rightTitle && (
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {rightTitle}
          </h4>
        )}
        <div className="prose prose-sm dark:prose-invert">{right}</div>
      </div>
    </div>
  )
}
