import type { BacktestResultJson } from '@/app/actions/backtests-types'
import { DrawdownChart } from './tearsheet/drawdown-chart'
import { EquityChart } from './tearsheet/equity-chart'
import { MetricsGrid } from './tearsheet/metrics-grid'
import { RunHeader } from './tearsheet/run-header'
import { TradesTable } from './tearsheet/trades-table'

interface Props {
  run: {
    id: string
    preset: string | null
    status: string
    configHash: string
    queuedAt: Date
    finishedAt: Date | null
  }
  result: BacktestResultJson | null
  params?: Record<string, string | number>
}

export function Tearsheet({ run, result, params }: Props) {
  return (
    <div className="space-y-6">
      <RunHeader run={run} params={params ?? {}} />
      {result ? (
        <>
          <MetricsGrid metrics={result.metrics} />
          <EquityChart equity={result.equity_curve} />
          <DrawdownChart equity={result.equity_curve} />
          <TradesTable trades={result.trades} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Result not yet available.
        </div>
      )}
    </div>
  )
}
