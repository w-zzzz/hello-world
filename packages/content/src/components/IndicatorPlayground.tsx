'use client'
import type { Overlay } from '@quant-academy/charts'
import { Chart, sampleSpyDaily } from '@quant-academy/charts'
import { INDICATORS } from '@quant-academy/indicators-ts'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState, useTransition } from 'react'
import { type ClientIndicatorMeta, type ClientParamSpec, INDICATOR_META } from './indicator-meta'
import { MathBox } from './MathBox'

export interface IndicatorPlaygroundProps {
  /** Indicator id, e.g. 'rsi'. */
  indicator: string
  initialParams?: Record<string, string | number>
  height?: number
}

type ParamValue = string | number
type ParamState = Record<string, ParamValue>

type ComputeFn = (args: {
  bars: typeof sampleSpyDaily
  params: ParamState
}) => Record<string, (number | null)[]>

function defaultParams(meta: ClientIndicatorMeta): ParamState {
  const out: ParamState = {}
  for (const [k, spec] of Object.entries(meta.params)) {
    out[k] = spec.default
  }
  return out
}

const OVERLAY_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ec4899']

export function IndicatorPlayground({
  indicator,
  initialParams,
  height = 360,
}: IndicatorPlaygroundProps) {
  const meta = INDICATOR_META[indicator]
  if (!meta) {
    return (
      <div className="my-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Unknown indicator: <code className="font-mono">{indicator}</code>
      </div>
    )
  }
  return (
    <PlaygroundBody
      meta={meta}
      indicator={indicator}
      initialParams={initialParams}
      height={height}
    />
  )
}

function PlaygroundBody({
  meta,
  indicator,
  initialParams,
  height,
}: {
  meta: ClientIndicatorMeta
  indicator: string
  initialParams?: Record<string, string | number>
  height: number
}) {
  const locale = useLocale()
  const t = useTranslations()

  const [params, setParams] = useState<ParamState>(() => ({
    ...defaultParams(meta),
    ...(initialParams ?? {}),
  }))
  const [serverDelta, setServerDelta] = useState<number | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const compute = (INDICATORS as Record<string, ComputeFn | undefined>)[indicator]
  const bars = sampleSpyDaily

  const result = useMemo(() => {
    if (!compute) return null
    try {
      return compute({ bars, params })
    } catch {
      return null
    }
  }, [compute, bars, params])

  const overlays: Overlay[] = useMemo(() => {
    if (!result) return []
    const overlayOutputs = meta.outputs.filter((o) => o.kind === 'overlay')
    return overlayOutputs.map((o, i) => ({
      kind: 'line',
      data: (result[o.name] ?? [])
        .map((v, idx) => ({ t: bars[idx]?.t ?? '', v: v ?? Number.NaN }))
        .filter((p) => p.t !== '' && Number.isFinite(p.v)),
      color: OVERLAY_COLORS[i % OVERLAY_COLORS.length],
      lineWidth: 2,
      title: o.name,
    }))
  }, [result, meta.outputs, bars])

  function setParam(name: string, value: ParamValue) {
    setParams((p) => ({ ...p, [name]: value }))
    setServerDelta(null)
    setServerError(null)
  }

  function reset() {
    setParams(defaultParams(meta))
    setServerDelta(null)
    setServerError(null)
  }

  function verifyAgainstServer() {
    setServerError(null)
    setServerDelta(null)
    startTransition(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000'
        const res = await fetch(`${base}/indicators/${indicator}/compute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bars, params }),
        })
        if (!res.ok) {
          setServerError(`HTTP ${res.status}`)
          return
        }
        const data = (await res.json()) as {
          outputs: Record<string, (number | null)[]>
        }
        // Compute max abs delta vs local result across all output columns.
        let maxDelta = 0
        if (result) {
          for (const col of Object.keys(result)) {
            const local = result[col] ?? []
            const remote = data.outputs[col] ?? []
            for (let i = 0; i < local.length; i++) {
              const a = local[i]
              const b = remote[i]
              if (a === null || a === undefined || b === null || b === undefined) continue
              const d = Math.abs((a as number) - (b as number))
              if (d > maxDelta) maxDelta = d
            }
          }
        }
        setServerDelta(maxDelta)
      } catch (e) {
        setServerError(e instanceof Error ? e.message : String(e))
      }
    })
  }

  const isPanelIndicator = meta.outputs.every((o) => o.kind === 'panel')
  const displayName = locale === 'zh' ? meta.nameZh : meta.nameEn

  return (
    <section className="not-prose my-6 space-y-4 rounded-xl border bg-card p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold">{displayName}</h3>
        <code className="font-mono text-xs text-muted-foreground">{meta.id}</code>
      </header>
      <MathBox>{meta.formulaTeX}</MathBox>
      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(meta.params).map(([name, spec]) => (
          <ParamControl
            key={name}
            name={name}
            spec={spec}
            value={params[name] ?? spec.default}
            onChange={(v) => setParam(name, v)}
          />
        ))}
      </fieldset>
      {isPanelIndicator ? (
        <PanelChart name={meta.outputs[0].name} result={result} height={height} />
      ) : (
        <Chart data={bars} overlays={overlays} height={height} intervalLabel="D" />
      )}
      <footer className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border px-3 py-1.5 hover:bg-muted"
        >
          {t('indicators.reset')}
        </button>
        <button
          type="button"
          onClick={verifyAgainstServer}
          disabled={isPending}
          className="rounded-md bg-brand-500 px-3 py-1.5 text-white disabled:opacity-50"
        >
          {isPending ? '…' : t('indicators.verifyServer')}
        </button>
        {serverDelta !== null && (
          <span className="text-xs text-muted-foreground">
            {t('indicators.maxDelta')}:{' '}
            <code className="font-mono">{serverDelta.toExponential(3)}</code>
          </span>
        )}
        {serverError && (
          <span className="text-xs text-rose-600">
            {t('indicators.serverErr')}: {serverError}
          </span>
        )}
      </footer>
    </section>
  )
}

function ParamControl({
  name,
  spec,
  value,
  onChange,
}: {
  name: string
  spec: ClientParamSpec
  value: string | number
  onChange: (v: string | number) => void
}) {
  if (spec.kind === 'enum' && spec.options) {
    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-mono">{name}</span>
        <select
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {spec.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }
  const numeric = typeof value === 'number' ? value : Number(value)
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex justify-between font-mono">
        <span>{name}</span>
        <span>{numeric}</span>
      </span>
      <input
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step ?? (spec.kind === 'int' ? 1 : 0.1)}
        value={numeric}
        onChange={(e) =>
          onChange(
            spec.kind === 'int'
              ? Number.parseInt(e.target.value, 10)
              : Number.parseFloat(e.target.value),
          )
        }
        className="accent-brand-500"
      />
    </label>
  )
}

function PanelChart({
  name,
  result,
  height,
}: {
  name: string
  result: Record<string, (number | null)[]> | null
  height: number
}) {
  // Render a simple inline SVG line of the named output. Real chart in M7.
  const values = result?.[name] ?? []
  if (values.length === 0) return null
  const defined = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as {
    v: number
    i: number
  }[]
  if (defined.length === 0) return null
  const min = Math.min(...defined.map((p) => p.v))
  const max = Math.max(...defined.map((p) => p.v))
  const range = max - min || 1
  const W = 600
  const H = height
  const points = defined
    .map((p) => {
      const x = (p.i / Math.max(1, values.length - 1)) * W
      const y = H - ((p.v - min) / range) * (H - 20) - 10
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <div className="rounded-lg border bg-background p-3" style={{ height: H + 32 }}>
      <div className="mb-1 text-xs text-muted-foreground">{name}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-label={`${name} chart`}
        role="img"
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
      </svg>
    </div>
  )
}
