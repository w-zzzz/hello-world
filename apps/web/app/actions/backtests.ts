'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { backtestResults, backtestRuns, db } from '@/lib/backtests'
import type { BacktestResultJson } from './backtests-types'

const API_BASE = process.env.QA_API_BASE ?? 'http://localhost:8000'

export interface PresetMeta {
  id: string
  name_zh: string
  name_en: string
  description_zh: string
  description_en: string
  params: Record<
    string,
    {
      kind: 'int' | 'float' | 'enum'
      default: number | string
      min?: number
      max?: number
      step?: number
      options?: string[]
    }
  >
}

export interface RunOk {
  ok: true
  runId: string
}

export interface RunErr {
  ok: false
  error: string
}

export async function listPresets(): Promise<PresetMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/backtests/presets`, { cache: 'no-store' })
    if (!res.ok) return []
    return (await res.json()) as PresetMeta[]
  } catch {
    return []
  }
}

export async function runBacktest(input: {
  preset: string
  params: Record<string, string | number>
}): Promise<RunOk | RunErr> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Insert pending run.
  const inserted = await db
    .insert(backtestRuns)
    .values({
      userId: user.id,
      preset: input.preset,
      configHash: 'pending',
      status: 'running',
      startedAt: new Date(),
    })
    .returning({ id: backtestRuns.id })

  const runRow = inserted[0]
  if (!runRow) return { ok: false, error: 'insert failed' }

  try {
    const res = await fetch(`${API_BASE}/backtests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: input.preset, params: input.params }),
    })
    if (!res.ok) {
      const text = await res.text()
      await db
        .update(backtestRuns)
        .set({ status: 'failed', error: text.slice(0, 1000), finishedAt: new Date() })
        .where(eq(backtestRuns.id, runRow.id))
      return { ok: false, error: text }
    }
    const payload = (await res.json()) as {
      config_hash: string
      result: BacktestResultJson
    }

    await db.transaction(async (tx) => {
      await tx
        .update(backtestRuns)
        .set({
          status: 'succeeded',
          configHash: payload.config_hash,
          finishedAt: new Date(),
        })
        .where(eq(backtestRuns.id, runRow.id))
      await tx.insert(backtestResults).values({
        runId: runRow.id,
        metrics: payload.result.metrics as Record<string, number>,
        equity: payload.result.equity_curve.map((p) => ({ t: p.t, equity: p.equity })),
        trades: payload.result.trades,
        drawdownPeriods: payload.result.drawdown_periods,
        warnings: payload.result.warnings,
      })
    })

    revalidatePath(`/[locale]/workshop/[runId]`, 'page')
    return { ok: true, runId: runRow.id }
  } catch (e) {
    await db
      .update(backtestRuns)
      .set({ status: 'failed', error: String(e).slice(0, 1000), finishedAt: new Date() })
      .where(eq(backtestRuns.id, runRow.id))
    return { ok: false, error: String(e) }
  }
}

export async function getRun(runId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  const row = await db
    .select()
    .from(backtestRuns)
    .where(and(eq(backtestRuns.id, runId), eq(backtestRuns.userId, user.id)))
    .limit(1)
  const run = row[0]
  if (!run) return null
  const resRow = await db
    .select()
    .from(backtestResults)
    .where(eq(backtestResults.runId, runId))
    .limit(1)
  return { run, result: resRow[0] ?? null }
}

export async function listRecentRuns(limit = 10) {
  const user = await getCurrentUser()
  if (!user) return []
  return db
    .select()
    .from(backtestRuns)
    .where(eq(backtestRuns.userId, user.id))
    .orderBy(desc(backtestRuns.queuedAt))
    .limit(limit)
}
