import { Card, CardContent } from '@quant-academy/ui'
import { Clock, Hash, RotateCw } from 'lucide-react'
import { redirect } from 'next/navigation'
import { runBacktest } from '@/app/actions/backtests'

interface RunSummary {
  id: string
  preset: string | null
  status: string
  configHash: string
  queuedAt: Date
  finishedAt: Date | null
}

interface Props {
  run: RunSummary
  params: Record<string, string | number>
}

function statusClasses(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'failed':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'running':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
    case 'queued':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function formatTimestamp(d: Date | null): string {
  if (!d) return '—'
  const iso = new Date(d).toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`
}

export function RunHeader({ run, params }: Props) {
  const presetId = run.preset ?? 'custom'
  const paramEntries = Object.entries(params)

  async function rerun() {
    'use server'
    if (!run.preset) return
    const result = await runBacktest({ preset: run.preset, params })
    if (result.ok) {
      redirect(`/workshop/${result.runId}`)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-xl font-semibold tracking-tight">{presetId}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(
                run.status,
              )}`}
            >
              {run.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Hash className="size-3.5" aria-hidden="true" />
              <code className="font-mono">{run.configHash.slice(0, 12)}</code>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">{formatTimestamp(run.queuedAt)}</span>
            </span>
          </div>
          {paramEntries.length > 0 && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {paramEntries.map(([k, v]) => (
                <div key={k} className="inline-flex gap-1.5">
                  <dt className="font-mono text-muted-foreground">{k}</dt>
                  <dd className="font-mono tabular-nums">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {run.preset && (
          <form action={rerun}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Re-run
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
