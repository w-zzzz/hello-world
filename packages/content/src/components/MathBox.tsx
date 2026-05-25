import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  display?: boolean
  children: string
}

export function MathBox({ display = true, children }: Props) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
    output: 'htmlAndMathml',
  })
  return (
    <div
      className={display ? 'my-4 overflow-x-auto' : 'inline'}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX-generated HTML is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
