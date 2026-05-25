export type { CompareProps } from './Compare'
export { Compare } from './Compare'
export type { GlossaryProps } from './Glossary'
export { Glossary } from './Glossary'
export { IndicatorPlayground } from './IndicatorPlayground'
export { KeyPoint } from './KeyPoint'
export { MathBox } from './MathBox'
export type { MdxPlaceholderProps } from './MdxPlaceholder'
export { MdxPlaceholder } from './MdxPlaceholder'
export { Pitfall } from './Pitfall'
export type { QuizProps } from './Quiz'
export { Quiz } from './Quiz'
export { Reveal } from './Reveal'

// Stubs for M5/M6 deferred interactive components.
export const TryIt = () => (
  <div className="my-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
    Try-it sandbox — available in M6.
  </div>
)

export const Backtest = () => (
  <div className="my-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
    Backtest widget — available in M5.
  </div>
)
