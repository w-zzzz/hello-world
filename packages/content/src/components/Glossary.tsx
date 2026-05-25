import type { ReactNode } from 'react'

export interface GlossaryProps {
  term: string
  children: ReactNode
}

export function Glossary({ term, children }: GlossaryProps) {
  return (
    <abbr
      title={term}
      className="cursor-help border-b border-dotted border-current decoration-dotted underline-offset-2"
    >
      {children}
    </abbr>
  )
}
