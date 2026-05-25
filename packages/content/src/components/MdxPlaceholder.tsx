import type { ReactNode } from 'react'

export interface MdxPlaceholderProps {
  milestone: string
  children?: ReactNode
}

export function MdxPlaceholder({ milestone, children }: MdxPlaceholderProps) {
  return (
    <div className="my-4 rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
      Interactive widget — available in <span className="font-mono font-semibold">{milestone}</span>
      .{children}
    </div>
  )
}
