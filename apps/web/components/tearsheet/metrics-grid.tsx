import { Card, CardContent } from '@quant-academy/ui'
import type { Metrics } from '@/app/actions/backtests-types'

// Accepts the wire shape from BacktestResultJson, which is widened to
// Record<string, number | null> for backward compatibility. The `Metrics`
// type names the documented keys; null values render as an em dash to
// preserve the C-METRICS-1 distinction between "undefined" and "zero".
interface Props {
  metrics: Record<string, number | null>
}

interface MetricSpec {
  key: keyof Metrics
  label: string
  format: 'pct' | 'num' | 'int'
}

const METRICS: readonly MetricSpec[] = [
  { key: 'sharpe', label: 'Sharpe', format: 'num' },
  { key: 'sortino', label: 'Sortino', format: 'num' },
  { key: 'max_drawdown', label: 'Max Drawdown', format: 'pct' },
  { key: 'profit_factor', label: 'Profit Factor', format: 'num' },
  { key: 'win_rate', label: 'Win Rate', format: 'pct' },
  { key: 'expectancy', label: 'Expectancy', format: 'num' },
  { key: 'exposure', label: 'Exposure', format: 'pct' },
  { key: 'trade_count', label: 'Trade Count', format: 'int' },
]

// `null` arrives from the Python side for the four ratio fields when they
// are mathematically undefined for the run (no losses, no downside, etc.).
// Render an em dash so it's visually distinct from a literal 0.
function formatValue(v: number | null | undefined, format: MetricSpec['format']): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  switch (format) {
    case 'pct':
      return `${(v * 100).toFixed(2)}%`
    case 'int':
      return Math.round(v).toLocaleString()
    default:
      return v.toFixed(2)
  }
}

function valueClasses(key: keyof Metrics, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return ''
  if (key === 'max_drawdown') {
    return v < 0 ? 'text-rose-600 dark:text-rose-400' : ''
  }
  if (key === 'sharpe' || key === 'sortino' || key === 'expectancy' || key === 'profit_factor') {
    if (v > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (v < 0) return 'text-rose-600 dark:text-rose-400'
  }
  return ''
}

export function MetricsGrid({ metrics }: Props) {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Backtest performance metrics"
    >
      {METRICS.map((m) => {
        const value = metrics[m.key]
        return (
          <Card key={m.key}>
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </div>
              <div
                className={`mt-2 text-2xl font-semibold tabular-nums ${valueClasses(m.key, value)}`}
              >
                {formatValue(value, m.format)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
