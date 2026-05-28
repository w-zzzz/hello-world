import type { Locale } from '@quant-academy/i18n'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { StrategyEditorClient } from '@/components/strategy-editor'
import { Link } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth'

const DEFAULT_SAMPLES = [
  {
    name: 'sma_crossover',
    code: `def run(close):
    """SMA crossover: fast 20-day vs slow 50-day."""
    n = len(close)
    if n < 50:
        return {"signal": [0] * n, "note": "not enough bars"}
    fast = []
    slow = []
    for i in range(n):
        fast.append(sum(close[max(0, i - 19):i + 1]) / min(20, i + 1))
        slow.append(sum(close[max(0, i - 49):i + 1]) / min(50, i + 1))
    signal = [0] * n
    for i in range(1, n):
        if fast[i] > slow[i] and fast[i - 1] <= slow[i - 1]:
            signal[i] = 1
        elif fast[i] < slow[i] and fast[i - 1] >= slow[i - 1]:
            signal[i] = -1
    return {"signal": signal, "fast": fast, "slow": slow}
`,
  },
  {
    name: 'mean_reversion',
    code: `def run(close):
    """RSI(14) mean reversion: enter long when RSI < 30, exit when RSI > 70."""
    n = len(close)
    if n < 15:
        return {"signal": [0] * n}
    rsi = [None] * 14
    gains = [max(0, close[i] - close[i - 1]) for i in range(1, n)]
    losses = [max(0, close[i - 1] - close[i]) for i in range(1, n)]
    avg_gain = sum(gains[:14]) / 14
    avg_loss = sum(losses[:14]) / 14
    for i in range(14, n):
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi.append(100 - 100 / (1 + rs))
        if i < n - 1:
            avg_gain = (avg_gain * 13 + gains[i]) / 14
            avg_loss = (avg_loss * 13 + losses[i]) / 14
    signal = [0] * n
    for i in range(15, n):
        if rsi[i] is not None and rsi[i] < 30:
            signal[i] = 1
        elif rsi[i] is not None and rsi[i] > 70:
            signal[i] = -1
    return {"signal": signal, "rsi": rsi}
`,
  },
  {
    name: 'momentum',
    code: `def run(close):
    """20-day momentum: enter when last 20-day return > 5%, else exit."""
    n = len(close)
    signal = [0] * n
    for i in range(20, n):
        ret = (close[i] - close[i - 20]) / close[i - 20]
        if ret > 0.05 and signal[i - 1] != 1:
            signal[i] = 1
        elif ret < 0 and signal[i - 1] == 1:
            signal[i] = -1
    return {"signal": signal}
`,
  },
] as const

export default async function EditorPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale })
  const user = await getCurrentUser()
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('editor.title')}</h1>
        <p className="mb-4 text-muted-foreground">{t('editor.signInPrompt')}</p>
        <Link href="/sign-in" className="text-brand-500 underline">
          {t('auth.signIn')}
        </Link>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('editor.title')}</h1>
        <p className="text-muted-foreground">{t('editor.subtitle')}</p>
      </header>
      <StrategyEditorClient
        initialCode={DEFAULT_SAMPLES[0].code}
        samples={DEFAULT_SAMPLES.map((s) => ({ name: s.name, code: s.code }))}
      />
    </main>
  )
}
