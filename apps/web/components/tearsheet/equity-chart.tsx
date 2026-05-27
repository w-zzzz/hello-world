'use client'

import { useMemo } from 'react'

interface EquityPoint {
  t: string
  equity: number
}

interface Props {
  equity: EquityPoint[]
  height?: number
}

const W = 800

export function EquityChart({ equity, height = 280 }: Props) {
  const view = useMemo(() => {
    const points = equity.filter((p) => Number.isFinite(p.equity))
    if (points.length === 0) return null
    const values = points.map((p) => p.equity)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const padTop = 14
    const padBottom = 14
    const innerH = height - padTop - padBottom
    const path = points
      .map((p, i) => {
        const x = (i / Math.max(1, points.length - 1)) * W
        const y = padTop + (1 - (p.equity - min) / range) * innerH
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
    return {
      path,
      first: points[0],
      last: points[points.length - 1],
      min,
      max,
    }
  }, [equity, height])

  if (!view) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Equity Curve</h2>
        <div className="text-xs text-muted-foreground">No data</div>
      </section>
    )
  }

  const lastVal = view.last?.equity ?? 0
  const firstVal = view.first?.equity ?? 0
  const totalReturn = firstVal !== 0 ? (lastVal - firstVal) / firstVal : 0

  return (
    <section className="rounded-xl border bg-card p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Equity Curve</h2>
        <div className="flex items-baseline gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{view.first?.t}</span>
          <span aria-hidden="true">→</span>
          <span className="tabular-nums">{view.last?.t}</span>
          <span
            className={`tabular-nums ${
              totalReturn >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {(totalReturn * 100).toFixed(2)}%
          </span>
        </div>
      </header>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        style={{ height }}
        aria-label="Equity curve chart"
        role="img"
      >
        <title>Equity curve</title>
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinejoin="round"
          points={view.path}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{view.min.toFixed(2)}</span>
        <span>{view.max.toFixed(2)}</span>
      </div>
    </section>
  )
}
