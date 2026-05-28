'use client'

import Editor from '@monaco-editor/react'
import { sampleSpyDaily } from '@quant-academy/charts'
import { type RunResult, runUserCode } from '@quant-academy/pyodide-bridge'
import { Button } from '@quant-academy/ui'
import { FileCode, Play, Server } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

interface Sample {
  name: string
  code: string
}

interface Props {
  initialCode: string
  samples: Sample[]
}

// Lift once at module load — the bundler dedupes against any other importers.
const SAMPLE_CLOSES: number[] = sampleSpyDaily.map((b) => b.close)

export function StrategyEditorClient({ initialCode, samples }: Props) {
  const t = useTranslations()
  const [code, setCode] = useState(initialCode)
  const [selectedSample, setSelectedSample] = useState(samples[0]?.name ?? '')
  const [isRunning, startRunning] = useTransition()
  const [isPromoting, startPromoting] = useTransition()
  const [result, setResult] = useState<RunResult | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  function pickSample(name: string) {
    setSelectedSample(name)
    const s = samples.find((x) => x.name === name)
    if (s) setCode(s.code)
    setResult(null)
  }

  function runLocal() {
    setResult(null)
    setServerError(null)
    startRunning(async () => {
      const r = await runUserCode({ code, bars: sampleSpyDaily })
      setResult(r)
    })
  }

  function promoteToServer() {
    setServerError(null)
    startPromoting(async () => {
      try {
        const res = await fetch('/api/backtests/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, params: {} }),
        })
        const data = (await res.json()) as { runId?: string; error?: string }
        if (!res.ok) {
          setServerError(data.error ?? `HTTP ${res.status}`)
          return
        }
        if (data.runId) {
          window.location.href = `/workshop/${data.runId}`
        } else {
          setServerError('No runId in response')
        }
      } catch (e) {
        setServerError(e instanceof Error ? e.message : String(e))
      }
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-muted-foreground" aria-hidden="true" />
          <label className="text-sm">
            {t('editor.sample')}:{' '}
            <select
              aria-label={t('editor.sample')}
              value={selectedSample}
              onChange={(e) => pickSample(e.target.value)}
              className="ml-1 rounded-md border bg-background px-2 py-1 text-sm"
            >
              {samples.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runLocal}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5"
          >
            <Play className="size-4" aria-hidden="true" />
            {isRunning ? t('editor.running') : t('editor.run')}
          </Button>
          <Button
            variant="secondary"
            onClick={promoteToServer}
            disabled={isPromoting}
            className="inline-flex items-center gap-1.5"
          >
            <Server className="size-4" aria-hidden="true" />
            {isPromoting ? t('editor.promoting') : t('editor.promote')}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="overflow-hidden rounded-xl border bg-card md:col-span-7">
          <Editor
            height="500px"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <aside className="rounded-xl border bg-card p-4 md:col-span-5">
          <ResultPanel result={result} serverError={serverError} closes={SAMPLE_CLOSES} />
        </aside>
      </div>
    </div>
  )
}

interface ResultPanelProps {
  result: RunResult | null
  serverError: string | null
  closes: number[]
}

function ResultPanel({ result, serverError, closes }: ResultPanelProps) {
  const t = useTranslations()
  if (serverError) {
    return (
      <div className="text-sm">
        <div className="mb-2 font-semibold text-rose-600">{t('editor.serverError')}</div>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">{serverError}</pre>
      </div>
    )
  }
  if (!result) {
    return <p className="text-sm text-muted-foreground">{t('editor.empty')}</p>
  }
  if (!result.ok) {
    return (
      <div className="text-sm">
        <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-700 dark:text-rose-300">
          <span className="font-mono text-xs">{result.code}</span>
        </div>
        <p className="mb-2">{result.message}</p>
        {result.stdout && (
          <div className="mb-2">
            <div className="text-xs text-muted-foreground">stdout</div>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">{result.stdout}</pre>
          </div>
        )}
        {result.stderr && (
          <div>
            <div className="text-xs text-muted-foreground">stderr</div>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">{result.stderr}</pre>
          </div>
        )}
      </div>
    )
  }
  // Success branch.
  const signal = Array.isArray(result.result?.signal)
    ? (result.result.signal as (number | null)[])
    : []
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-muted-foreground">
        {t('editor.completedIn', { ms: Math.round(result.durationMs) })}
      </div>
      <SignalOverlay closes={closes} signal={signal} />
      {result.stdout && (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">stdout</summary>
          <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">{result.stdout}</pre>
        </details>
      )}
      {result.stderr && (
        <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">stderr</summary>
          <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">{result.stderr}</pre>
        </details>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">
          {t('editor.rawReturn')}
        </summary>
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(result.result, null, 2)}
        </pre>
      </details>
    </div>
  )
}

interface SignalOverlayProps {
  closes: number[]
  signal: (number | null)[]
}

function SignalOverlay({ closes, signal }: SignalOverlayProps) {
  if (closes.length === 0) return null
  const W = 600
  const H = 200
  const padTop = 6
  const padBottom = 6
  const innerH = H - padTop - padBottom
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const denom = Math.max(1, closes.length - 1)

  const pts = closes
    .map((v, i) => {
      const x = (i / denom) * W
      const y = padTop + (1 - (v - min) / range) * innerH
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const markers: Array<{ s: 1 | -1; i: number; x: number; y: number }> = []
  for (let i = 0; i < signal.length && i < closes.length; i++) {
    const s = signal[i]
    if (s !== 1 && s !== -1) continue
    const c = closes[i]
    if (c === undefined) continue
    const x = (i / denom) * W
    const y = padTop + (1 - (c - min) / range) * innerH
    markers.push({ s, i, x, y })
  }

  return (
    <div className="rounded-lg border bg-background p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        aria-label="Signal overlay chart"
        role="img"
      >
        <title>Signal overlay</title>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.6"
          strokeWidth="1.5"
          points={pts}
        />
        {markers.map((m) => {
          // Up triangle for buy, down triangle for sell.
          const size = 4
          const color = m.s === 1 ? '#10b981' : '#ef4444'
          const points =
            m.s === 1
              ? `${m.x},${(m.y - size).toFixed(2)} ${(m.x - size).toFixed(2)},${(m.y + size).toFixed(2)} ${(m.x + size).toFixed(2)},${(m.y + size).toFixed(2)}`
              : `${m.x},${(m.y + size).toFixed(2)} ${(m.x - size).toFixed(2)},${(m.y - size).toFixed(2)} ${(m.x + size).toFixed(2)},${(m.y - size).toFixed(2)}`
          return <polygon key={m.i} points={points} fill={color} />
        })}
      </svg>
    </div>
  )
}
