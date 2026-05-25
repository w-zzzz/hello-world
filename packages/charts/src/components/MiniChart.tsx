'use client'

import { createChart, type IChartApi, LineSeries, type Time } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn'
import { readChartTheme } from '../lib/theme'
import { sampleSpyDaily } from '../sample-data'
import type { MiniChartProps } from '../types'

export function MiniChart({ data, height = 120, className }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const bars = data ?? sampleSpyDaily
    let theme = readChartTheme()

    const chart = createChart(container, {
      height,
      autoSize: true,
      layout: {
        background: { color: theme.background },
        textColor: theme.text,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      handleScale: false,
      handleScroll: false,
    })
    chartRef.current = chart

    const lineSeries = chart.addSeries(LineSeries, {
      color: theme.bull,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    lineSeries.setData(bars.map((b) => ({ time: b.t as Time, value: b.close })))
    chart.timeScale().fitContent()

    const applyTheme = () => {
      theme = readChartTheme()
      chart.applyOptions({
        layout: { background: { color: theme.background }, textColor: theme.text },
      })
      lineSeries.applyOptions({ color: theme.bull })
    }
    let observer: MutationObserver | null = null
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(applyTheme)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }

    return () => {
      observer?.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [data, height])

  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg', className)} style={{ height }}>
      <div ref={containerRef} className="size-full" />
    </div>
  )
}
