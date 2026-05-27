import type { Locale } from '@quant-academy/i18n'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getRun } from '@/app/actions/backtests'
import type {
  BacktestDrawdownPeriod,
  BacktestEquityPoint,
  BacktestResultJson,
  BacktestTrade,
  BacktestWarning,
} from '@/app/actions/backtests-types'
import { Tearsheet } from '@/components/tearsheet'

export default async function RunPage({
  params,
}: {
  params: Promise<{ locale: Locale; runId: string }>
}) {
  const { locale, runId } = await params
  setRequestLocale(locale)

  const row = await getRun(runId)
  if (!row) notFound()
  const { run, result } = row

  // The DB only stores {t, equity} per equity point; cash and position_value
  // are zeroed for the M5 reconstruction. The full BacktestResultJson is
  // rebuilt so the tearsheet renderer receives one consistent shape.
  let resultJson: BacktestResultJson | null = null
  if (result) {
    const storedEquity = (result.equity ?? []) as { t: string; equity: number }[]
    const equityCurve: BacktestEquityPoint[] = storedEquity.map((p) => ({
      t: p.t,
      equity: p.equity,
      cash: 0,
      position_value: 0,
    }))
    const period = {
      start: equityCurve[0]?.t ?? '',
      end: equityCurve[equityCurve.length - 1]?.t ?? '',
    }
    resultJson = {
      run_id: run.id,
      universe: [],
      period,
      equity_curve: equityCurve,
      trades: (result.trades ?? []) as BacktestTrade[],
      metrics: (result.metrics ?? {}) as Record<string, number>,
      drawdown_periods: (result.drawdownPeriods ?? []) as BacktestDrawdownPeriod[],
      benchmark: null,
      rolling: null,
      artifacts: [],
      warnings: (result.warnings ?? []) as BacktestWarning[],
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Tearsheet
        run={{
          id: run.id,
          preset: run.preset,
          status: run.status,
          configHash: run.configHash,
          queuedAt: run.queuedAt,
          finishedAt: run.finishedAt,
        }}
        result={resultJson}
      />
    </main>
  )
}
