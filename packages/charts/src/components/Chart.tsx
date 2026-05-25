'use client'

import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  type Time,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn'
import { readChartTheme } from '../lib/theme'
import { sampleSpyDaily } from '../sample-data'
import type { ChartProps, Overlay } from '../types'

function hexToRgba(hex: string, alpha: number): string {
  const trimmed = hex.trim()
  if (trimmed.startsWith('rgb')) return trimmed
  const value = trimmed.replace('#', '')
  if (value.length === 3 || value.length === 6) {
    const expanded =
      value.length === 3
        ? value
            .split('')
            .map((c) => c + c)
            .join('')
        : value
    const r = Number.parseInt(expanded.slice(0, 2), 16)
    const g = Number.parseInt(expanded.slice(2, 4), 16)
    const b = Number.parseInt(expanded.slice(4, 6), 16)
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  // Fallback for oklch / unknown formats — wrap with color-mix so opacity still works.
  return `color-mix(in srgb, ${trimmed} ${Math.round(alpha * 100)}%, transparent)`
}

export function Chart({
  data,
  symbol = 'SPY',
  height = 360,
  overlays = [],
  showVolume = true,
  intervalLabel = 'D',
  className,
}: ChartProps) {
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
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: { borderColor: theme.border },
      timeScale: { borderColor: theme.border, timeVisible: false },
    })
    chartRef.current = chart

    // Candlestick series — main price.
    const candleSeries: ISeriesApi<'Candlestick'> = chart.addSeries(CandlestickSeries, {
      upColor: theme.bull,
      downColor: theme.bear,
      borderUpColor: theme.bull,
      borderDownColor: theme.bear,
      wickUpColor: theme.bull,
      wickDownColor: theme.bear,
    })
    candleSeries.setData(
      bars.map((b) => ({
        time: b.t as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    )

    // Optional volume histogram on a dedicated price scale.
    if (showVolume !== false) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      })
      volumeSeries.setData(
        bars.map((b) => ({
          time: b.t as Time,
          value: b.volume,
          color: b.close >= b.open ? hexToRgba(theme.bull, 0.4) : hexToRgba(theme.bear, 0.4),
        })),
      )
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })
    }

    // Overlays.
    const overlayDisposers: Array<() => void> = []
    for (const overlay of overlays) {
      addOverlay(chart, overlay, overlayDisposers)
    }

    // Re-read theme when the `dark` class on <html> toggles.
    const applyTheme = () => {
      theme = readChartTheme()
      chart.applyOptions({
        layout: { background: { color: theme.background }, textColor: theme.text },
        grid: {
          vertLines: { color: theme.grid },
          horzLines: { color: theme.grid },
        },
        rightPriceScale: { borderColor: theme.border },
        timeScale: { borderColor: theme.border, timeVisible: false },
      })
      candleSeries.applyOptions({
        upColor: theme.bull,
        downColor: theme.bear,
        borderUpColor: theme.bull,
        borderDownColor: theme.bear,
        wickUpColor: theme.bull,
        wickDownColor: theme.bear,
      })
    }
    let observer: MutationObserver | null = null
    if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(applyTheme)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }

    return () => {
      observer?.disconnect()
      for (const dispose of overlayDisposers) dispose()
      chart.remove()
      chartRef.current = null
    }
  }, [data, height, overlays, showVolume])

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-xl border bg-card', className)}
      style={{ height }}
    >
      <div className="absolute left-3 top-2 z-10 text-xs text-muted-foreground">
        {symbol} · {intervalLabel}
      </div>
      <div ref={containerRef} className="size-full" />
    </div>
  )
}

function addOverlay(chart: IChartApi, overlay: Overlay, disposers: Array<() => void>) {
  if (overlay.kind === 'line') {
    const series = chart.addSeries(LineSeries, {
      color: overlay.color ?? '#6366f1',
      lineWidth: overlay.lineWidth ?? 2,
      title: overlay.title ?? '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    series.setData(overlay.data.map((d) => ({ time: d.t as Time, value: d.v })))
    disposers.push(() => {
      try {
        chart.removeSeries(series)
      } catch {
        /* chart already disposed */
      }
    })
    return
  }
  // Band overlay: render upper and lower as two semi-transparent line series.
  const baseColor = overlay.color ?? '#6366f1'
  const bandColor = hexToRgba(baseColor, 0.5)
  const upper = chart.addSeries(LineSeries, {
    color: bandColor,
    lineWidth: 1,
    title: overlay.title ? `${overlay.title} (upper)` : '',
    priceLineVisible: false,
    lastValueVisible: false,
  })
  upper.setData(overlay.upper.map((d) => ({ time: d.t as Time, value: d.v })))
  const lower = chart.addSeries(LineSeries, {
    color: bandColor,
    lineWidth: 1,
    title: overlay.title ? `${overlay.title} (lower)` : '',
    priceLineVisible: false,
    lastValueVisible: false,
  })
  lower.setData(overlay.lower.map((d) => ({ time: d.t as Time, value: d.v })))
  disposers.push(() => {
    try {
      chart.removeSeries(upper)
      chart.removeSeries(lower)
    } catch {
      /* chart already disposed */
    }
  })
}
