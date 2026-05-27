import type { BacktestTrade } from '@/app/actions/backtests-types'

interface Props {
  trades: BacktestTrade[]
}

function fmtNum(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

function fmtDate(s: string): string {
  return s.length > 10 ? s.slice(0, 10) : s
}

export function TradesTable({ trades }: Props) {
  const recent = trades.slice(-50).reverse()
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Trades</h2>
        <span className="text-xs text-muted-foreground">
          Showing {recent.length} of {trades.length}
        </span>
      </header>
      {recent.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No trades.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Entry</th>
                <th className="px-4 py-2 text-left font-medium">Exit</th>
                <th className="px-4 py-2 text-left font-medium">Side</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Entry $</th>
                <th className="px-4 py-2 text-right font-medium">Exit $</th>
                <th className="px-4 py-2 text-right font-medium">PnL</th>
                <th className="px-4 py-2 text-right font-medium">Bars</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recent.map((t, idx) => {
                const pnlClass =
                  t.pnl > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : t.pnl < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : ''
                return (
                  <tr key={`${t.entry_t}-${t.exit_t}-${idx}`}>
                    <td className="px-4 py-2 font-mono tabular-nums">{fmtDate(t.entry_t)}</td>
                    <td className="px-4 py-2 font-mono tabular-nums">{fmtDate(t.exit_t)}</td>
                    <td className="px-4 py-2 font-mono">{t.side}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtNum(t.qty, 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtNum(t.entry)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtNum(t.exit)}</td>
                    <td className={`px-4 py-2 text-right font-medium tabular-nums ${pnlClass}`}>
                      {t.pnl > 0 ? '+' : ''}
                      {fmtNum(t.pnl)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{t.bars_held}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
