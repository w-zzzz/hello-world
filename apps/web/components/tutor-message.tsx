'use client'

import katex from 'katex'
import Markdown from 'markdown-to-jsx'
import { useMemo } from 'react'

interface Props {
  content: string
}

function renderMath(html: string): string {
  // $$...$$ blocks (multi-line)
  let s = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) =>
    katex.renderToString(tex.trim(), {
      displayMode: true,
      throwOnError: false,
      output: 'htmlAndMathml',
    }),
  )
  // inline $...$
  s = s.replace(
    /(^|[^\\])\$([^$\n]+?)\$/g,
    (_, lead, tex) =>
      `${lead}${katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'htmlAndMathml',
      })}`,
  )
  return s
}

export function TutorMessage({ content }: Props) {
  const rendered = useMemo(() => renderMath(content), [content])
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Markdown
        options={{
          overrides: {
            a: {
              props: {
                className: 'text-brand-500 underline',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            },
            code: {
              props: { className: 'rounded bg-muted px-1.5 py-0.5 font-mono text-xs' },
            },
            pre: {
              props: { className: 'my-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs' },
            },
            blockquote: {
              props: {
                className: 'border-l-4 border-brand-500 pl-3 italic text-muted-foreground',
              },
            },
          },
        }}
      >
        {rendered}
      </Markdown>
    </div>
  )
}
