import { Chart, MiniChart } from '@quant-academy/charts'
import {
  Backtest,
  Compare,
  Glossary,
  IndicatorPlayground,
  KeyPoint,
  MathBox,
  Pitfall,
  Quiz,
  Reveal,
  TryIt,
} from '@quant-academy/content/components'
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: (props) => <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight" {...props} />,
    h2: (props) => <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight" {...props} />,
    h3: (props) => <h3 className="mt-6 mb-2 text-xl font-semibold" {...props} />,
    p: (props) => <p className="my-3 leading-7" {...props} />,
    ul: (props) => <ul className="my-3 ml-6 list-disc space-y-1" {...props} />,
    ol: (props) => <ol className="my-3 ml-6 list-decimal space-y-1" {...props} />,
    a: (props) => <a className="text-brand-500 underline underline-offset-2" {...props} />,
    code: (props) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props} />
    ),
    pre: (props) => (
      <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm" {...props} />
    ),
    blockquote: (props) => (
      <blockquote
        className="my-4 border-l-4 border-brand-500 pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
    table: (props) => <table className="my-4 w-full border-collapse" {...props} />,
    th: (props) => <th className="border-b px-3 py-2 text-left font-semibold" {...props} />,
    td: (props) => <td className="border-b px-3 py-2" {...props} />,
    Chart,
    MiniChart,
    MathBox,
    Pitfall,
    KeyPoint,
    Quiz,
    Reveal,
    Compare,
    Glossary,
    IndicatorPlayground,
    TryIt,
    Backtest,
  }
}
