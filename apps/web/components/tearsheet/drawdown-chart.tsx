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

export function DrawdownChart({ equity, height = 180 }: Props) {
  const view = useMemo(() => {
    const points = equity.filter((p) => Number.isFinite(p.equity))
    if (points.length === 0) return null
    let peak = -Infinity
    const dd = points.map((p) => {
      if (p.equity > peak) peak = p.equity
      const v = peak > 0 ? (p.equity - peak) / peak : 0
      return { t: p.t, v }
    })
    const min = Math.min(0, ...dd.map((p) => p.v))
    const range = Math.abs(min) || 1
    const padTop = 8
    const padBottom = 14
    const innerH = height - padTop - padBottom

    const yFor = (v: number) => padTop + (Math.abs(v) / range) * innerH
    const yZero = padTop

    const linePoints = dd
      .map((p, i) => {
        const x = (i / Math.max(1, dd.length - 1)) * W
        return `${x.toFixed(2)},${yFor(p.v).toFixed(2)}`
      })
      .join(' ')

    const areaPath = [
      `M 0,${yZero.toFixed(2)}`,
      ...dd.map((p, i) => {
        const x = (i / Math.max(1, dd.length - 1)) * W
        return `L ${x.toFixed(2)},${yFor(p.v).toFixed(2)}`
      }),
      `L ${W},${yZero.toFixed(2)}`,
      'Z',
    ].join(' ')

    return { linePoints, areaPath, min, last: dd[dd.length - 1] }
  }, [equity, height])

  if (!view) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold">Drawdown</h2>
        <div className="text-xs text-muted-foreground">No data</div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Drawdown</h2>
        <div className="text-xs text-muted-foreground tabular-nums">
          min {(view.min * 100).toFixed(2)}%
        </div>
      </header>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        style={{ height }}
        aria-label="Drawdown chart"
        role="img"
      >
        <title>Drawdown</title>
        <path d={view.areaPath} fill="#f43f5e" fillOpacity={0.18} stroke="none" />
        <polyline
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.25"
          strokeLinejoin="round"
          points={view.linePoints}
        />
      </svg>
    </section>
  )
}
