'use client'

import katex from 'katex'
import Markdown from 'markdown-to-jsx'
import { Fragment, type ReactNode, useMemo } from 'react'

interface Props {
  content: string
}

interface TextSegment {
  kind: 'text'
  value: string
}
interface MathSegment {
  kind: 'math'
  tex: string
  display: boolean
}
type Segment = TextSegment | MathSegment

// Render math by SPLITTING it out of the markdown stream entirely. We can't
// route it through markdown-to-jsx component overrides because the option we
// need for XSS hardening (`disableParsingRawHTML: true`) ALSO disables the
// HTML-syntax-processing engine that overrides depend on. So instead we
// tokenize the input into prose vs math segments, render each prose segment
// with disableParsingRawHTML=true (so raw HTML in untrusted Claude output is
// shown as escaped text), and render math segments as React components that
// hand the TeX to KaTeX. The untrusted string never reaches the DOM as HTML.
function tokenize(src: string): Segment[] {
  const out: Segment[] = []
  // Walk through src looking for the next math delimiter that is NOT inside
  // a backtick code region. We track code state by scanning for opening
  // backticks and resuming after the matching closer.
  let i = 0
  let buf = ''
  const len = src.length
  while (i < len) {
    const ch = src[i]
    // Backtick code: skip until matching backticks (1 or 3).
    if (ch === '`') {
      // Triple fence?
      if (src.slice(i, i + 3) === '```') {
        const end = src.indexOf('```', i + 3)
        const closeAt = end === -1 ? len : end + 3
        buf += src.slice(i, closeAt)
        i = closeAt
        continue
      }
      // Single inline backtick.
      const end = src.indexOf('`', i + 1)
      const closeAt = end === -1 ? len : end + 1
      buf += src.slice(i, closeAt)
      i = closeAt
      continue
    }
    // Escaped dollar: leave literal, advance.
    if (ch === '\\' && src[i + 1] === '$') {
      buf += '\\$'
      i += 2
      continue
    }
    // Block math: $$ ... $$
    if (ch === '$' && src[i + 1] === '$') {
      const end = src.indexOf('$$', i + 2)
      if (end !== -1) {
        if (buf) {
          out.push({ kind: 'text', value: buf })
          buf = ''
        }
        out.push({ kind: 'math', tex: src.slice(i + 2, end).trim(), display: true })
        i = end + 2
        continue
      }
    }
    // Inline math: $ ... $ on one line, non-empty body.
    if (ch === '$') {
      // Find the next unescaped $ on the same line.
      let j = i + 1
      let found = -1
      while (j < len) {
        const c = src[j]
        if (c === '\n') break
        if (c === '$' && src[j - 1] !== '\\') {
          found = j
          break
        }
        j += 1
      }
      if (found !== -1 && found > i + 1) {
        if (buf) {
          out.push({ kind: 'text', value: buf })
          buf = ''
        }
        out.push({ kind: 'math', tex: src.slice(i + 1, found).trim(), display: false })
        i = found + 1
        continue
      }
    }
    buf += ch
    i += 1
  }
  if (buf) out.push({ kind: 'text', value: buf })
  return out
}

function MarkdownProse({ children }: { children: string }) {
  return (
    <Markdown
      options={{
        // Critical: blocks <img onerror>, <iframe>, <script>, etc. in
        // untrusted Claude output. Math is handled OUTSIDE this pipeline.
        disableParsingRawHTML: true,
        forceInline: false,
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
      {children}
    </Markdown>
  )
}

function renderMath(tex: string, display: boolean): string {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    output: 'htmlAndMathml',
  })
}

function MathBlock({ tex }: { tex: string }) {
  const html = useMemo(() => renderMath(tex, true), [tex])
  return (
    <div
      className="my-3 overflow-x-auto"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output is sanitized TeX, not user HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function MathInline({ tex }: { tex: string }) {
  const html = useMemo(() => renderMath(tex, false), [tex])
  return (
    <span
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output is sanitized TeX, not user HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function TutorMessage({ content }: Props) {
  const segments = useMemo(() => tokenize(content), [content])
  const nodes: ReactNode[] = segments.map((seg, idx) => {
    if (seg.kind === 'text') {
      return <MarkdownProse key={idx}>{seg.value}</MarkdownProse>
    }
    if (seg.display) {
      return <MathBlock key={idx} tex={seg.tex} />
    }
    return <MathInline key={idx} tex={seg.tex} />
  })
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {nodes.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </div>
  )
}
