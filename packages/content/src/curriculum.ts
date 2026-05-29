import type { Difficulty, LessonMeta, TrackId } from './schema'
import { LessonMetaSchema } from './schema'
import { getTrack } from './tracks'

export interface LessonRecord {
  meta: LessonMeta
  mdxReady: boolean
}

interface RawLesson {
  id: string
  module: string
  difficulty: Difficulty
  durationMin: number
  xp: number
  prerequisites?: string[]
  tags?: string[]
  mdxReady?: boolean
}

const DEFAULT_DURATION: Record<Difficulty, number> = {
  beginner: 14,
  intermediate: 18,
  advanced: 22,
}

const DEFAULT_XP: Record<Difficulty, number> = {
  beginner: 60,
  intermediate: 100,
  advanced: 160,
}

function lesson(trackId: TrackId, order: number, raw: RawLesson): LessonRecord {
  const durationMin = raw.durationMin ?? DEFAULT_DURATION[raw.difficulty]
  const xp = raw.xp ?? DEFAULT_XP[raw.difficulty]
  const meta = LessonMetaSchema.parse({
    id: raw.id,
    trackId,
    module: raw.module,
    order,
    difficulty: raw.difficulty,
    durationMin,
    xp,
    prerequisites: raw.prerequisites ?? [],
    tags: raw.tags ?? [],
    contributors: ['@quant-academy'],
  })
  return { meta, mdxReady: raw.mdxReady ?? false }
}

// =================================================================================
// Track A — 市场基础 (Market Fundamentals, 10 lessons, all beginner)
// =================================================================================
const TRACK_A: LessonRecord[] = [
  lesson('A', 1, {
    id: 'A-01-what-is-market',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 12,
    xp: 50,
    tags: ['fundamentals', 'market-structure'],
    mdxReady: true,
  }),
  lesson('A', 2, {
    id: 'A-02-price-spread',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 60,
    prerequisites: ['A-01-what-is-market'],
    tags: ['fundamentals', 'market-microstructure'],
    mdxReady: true,
  }),
  lesson('A', 3, {
    id: 'A-03-order-types',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 16,
    xp: 70,
    prerequisites: ['A-02-price-spread'],
    tags: ['fundamentals', 'orders'],
    mdxReady: true,
  }),
  lesson('A', 4, {
    id: 'A-04-candlesticks',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 15,
    xp: 60,
    prerequisites: ['A-03-order-types'],
    tags: ['fundamentals', 'candlesticks'],
  }),
  lesson('A', 5, {
    id: 'A-05-volume',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 60,
    prerequisites: ['A-04-candlesticks'],
    tags: ['fundamentals', 'volume'],
  }),
  lesson('A', 6, {
    id: 'A-06-timeframes',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 15,
    xp: 60,
    prerequisites: ['A-05-volume'],
    tags: ['fundamentals', 'timeframes'],
  }),
  lesson('A', 7, {
    id: 'A-07-us-vs-china',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 16,
    xp: 70,
    prerequisites: ['A-06-timeframes'],
    tags: ['fundamentals', 'markets'],
  }),
  lesson('A', 8, {
    id: 'A-08-trading-sessions',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 60,
    prerequisites: ['A-07-us-vs-china'],
    tags: ['fundamentals', 'sessions'],
  }),
  lesson('A', 9, {
    id: 'A-09-fees-and-costs',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 15,
    xp: 70,
    prerequisites: ['A-08-trading-sessions'],
    tags: ['fundamentals', 'costs'],
  }),
  lesson('A', 10, {
    id: 'A-10-market-review',
    module: 'fundamentals',
    difficulty: 'beginner',
    durationMin: 18,
    xp: 80,
    prerequisites: ['A-09-fees-and-costs'],
    tags: ['fundamentals', 'review'],
  }),
]

// =================================================================================
// Track B — 单个指标 (Single Indicators, 30 lessons)
// =================================================================================
const TRACK_B: LessonRecord[] = [
  // moving-averages cluster
  lesson('B', 1, {
    id: 'B-01-sma',
    mdxReady: true,
    module: 'moving-averages',
    difficulty: 'beginner',
    durationMin: 15,
    xp: 70,
    tags: ['indicators', 'ma'],
  }),
  lesson('B', 2, {
    id: 'B-02-ema',
    mdxReady: true,
    module: 'moving-averages',
    difficulty: 'beginner',
    durationMin: 16,
    xp: 70,
    prerequisites: ['B-01-sma'],
    tags: ['indicators', 'ma'],
  }),
  lesson('B', 3, {
    id: 'B-03-wma',
    mdxReady: true,
    module: 'moving-averages',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 60,
    prerequisites: ['B-02-ema'],
    tags: ['indicators', 'ma'],
  }),
  // bollinger cluster
  lesson('B', 4, {
    id: 'B-04-bollinger-bands',
    mdxReady: true,
    module: 'bollinger',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-02-ema'],
    tags: ['indicators', 'bollinger'],
  }),
  lesson('B', 5, {
    id: 'B-05-bollinger-strategies',
    mdxReady: true,
    module: 'bollinger',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    prerequisites: ['B-04-bollinger-bands'],
    tags: ['indicators', 'bollinger'],
  }),
  // rsi cluster
  lesson('B', 6, {
    id: 'B-06-rsi-intro',
    mdxReady: true,
    module: 'rsi',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'rsi'],
  }),
  lesson('B', 7, {
    id: 'B-07-rsi-math',
    mdxReady: true,
    module: 'rsi',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-06-rsi-intro'],
    tags: ['indicators', 'rsi'],
  }),
  lesson('B', 8, {
    id: 'B-08-rsi-divergence',
    mdxReady: true,
    module: 'rsi',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    prerequisites: ['B-07-rsi-math'],
    tags: ['indicators', 'rsi', 'divergence'],
  }),
  // macd cluster
  lesson('B', 9, {
    id: 'B-09-macd-intro',
    mdxReady: true,
    module: 'macd',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-02-ema'],
    tags: ['indicators', 'macd'],
  }),
  lesson('B', 10, {
    id: 'B-10-macd-histogram',
    mdxReady: true,
    module: 'macd',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-09-macd-intro'],
    tags: ['indicators', 'macd'],
  }),
  // oscillators cluster
  lesson('B', 11, {
    id: 'B-11-stochastic',
    mdxReady: true,
    module: 'oscillators',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['indicators', 'oscillators'],
  }),
  lesson('B', 12, {
    id: 'B-12-cci',
    mdxReady: true,
    module: 'oscillators',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'oscillators'],
  }),
  lesson('B', 13, {
    id: 'B-13-williams-r',
    mdxReady: true,
    module: 'oscillators',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'oscillators'],
  }),
  // momentum cluster
  lesson('B', 14, {
    id: 'B-14-adx-dmi',
    mdxReady: true,
    module: 'momentum',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    tags: ['indicators', 'momentum'],
  }),
  lesson('B', 15, {
    id: 'B-15-parabolic-sar',
    mdxReady: true,
    module: 'momentum',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['indicators', 'momentum'],
  }),
  lesson('B', 16, {
    id: 'B-16-supertrend',
    mdxReady: true,
    module: 'momentum',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['indicators', 'momentum'],
  }),
  // volatility cluster
  lesson('B', 17, {
    id: 'B-17-atr',
    mdxReady: true,
    module: 'volatility',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'volatility'],
  }),
  lesson('B', 18, {
    id: 'B-18-keltner-channels',
    mdxReady: true,
    module: 'volatility',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-17-atr'],
    tags: ['indicators', 'volatility'],
  }),
  lesson('B', 19, {
    id: 'B-19-donchian-channels',
    mdxReady: true,
    module: 'volatility',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'volatility'],
  }),
  // volume-flow cluster
  lesson('B', 20, {
    id: 'B-20-obv',
    mdxReady: true,
    module: 'volume-flow',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'volume'],
  }),
  lesson('B', 21, {
    id: 'B-21-vwap',
    mdxReady: true,
    module: 'volume-flow',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['indicators', 'volume'],
  }),
  lesson('B', 22, {
    id: 'B-22-mfi',
    mdxReady: true,
    module: 'volume-flow',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'volume'],
  }),
  lesson('B', 23, {
    id: 'B-23-volume-profile',
    mdxReady: true,
    module: 'volume-flow',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    prerequisites: ['B-21-vwap'],
    tags: ['indicators', 'volume'],
  }),
  // ichimoku cluster
  lesson('B', 24, {
    id: 'B-24-ichimoku-intro',
    mdxReady: true,
    module: 'ichimoku',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['indicators', 'ichimoku'],
  }),
  lesson('B', 25, {
    id: 'B-25-ichimoku-signals',
    mdxReady: true,
    module: 'ichimoku',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    prerequisites: ['B-24-ichimoku-intro'],
    tags: ['indicators', 'ichimoku'],
  }),
  // pivots cluster
  lesson('B', 26, {
    id: 'B-26-pivot-points',
    mdxReady: true,
    module: 'pivots',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['indicators', 'pivots'],
  }),
  lesson('B', 27, {
    id: 'B-27-fibonacci-pivots',
    mdxReady: true,
    module: 'pivots',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['B-26-pivot-points'],
    tags: ['indicators', 'pivots'],
  }),
  // composite cluster
  lesson('B', 28, {
    id: 'B-28-indicator-quality',
    mdxReady: true,
    module: 'composite',
    difficulty: 'advanced',
    durationMin: 20,
    xp: 140,
    tags: ['indicators', 'meta'],
  }),
  lesson('B', 29, {
    id: 'B-29-lookahead-traps',
    mdxReady: true,
    module: 'composite',
    difficulty: 'advanced',
    durationMin: 20,
    xp: 140,
    tags: ['indicators', 'pitfalls'],
  }),
  lesson('B', 30, {
    id: 'B-30-indicator-review',
    mdxReady: true,
    module: 'composite',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['indicators', 'review'],
  }),
]

// =================================================================================
// Track C — 组合与信号构造 (Signal Composition, 10 lessons)
// =================================================================================
const TRACK_C: LessonRecord[] = [
  lesson('C', 1, {
    id: 'C-01-confluence-intro',
    mdxReady: true,
    module: 'confluence',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['signals', 'confluence'],
  }),
  lesson('C', 2, {
    id: 'C-02-multi-timeframe',
    mdxReady: true,
    module: 'confluence',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    prerequisites: ['C-01-confluence-intro'],
    tags: ['signals', 'mtf'],
  }),
  lesson('C', 3, {
    id: 'C-03-divergence-detection',
    mdxReady: true,
    module: 'divergence',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['signals', 'divergence'],
  }),
  lesson('C', 4, {
    id: 'C-04-divergence-game',
    mdxReady: true,
    module: 'divergence',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    prerequisites: ['C-03-divergence-detection'],
    tags: ['signals', 'divergence', 'game'],
  }),
  lesson('C', 5, {
    id: 'C-05-regime-detection',
    mdxReady: true,
    module: 'regime',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['signals', 'regime'],
  }),
  lesson('C', 6, {
    id: 'C-06-signal-aggregation',
    mdxReady: true,
    module: 'composite',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['signals', 'composite'],
  }),
  lesson('C', 7, {
    id: 'C-07-smoothing-vs-lag',
    mdxReady: true,
    module: 'composite',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['signals', 'smoothing'],
  }),
  lesson('C', 8, {
    id: 'C-08-false-signal-filter',
    mdxReady: true,
    module: 'composite',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['signals', 'filters'],
  }),
  lesson('C', 9, {
    id: 'C-09-signal-workshop',
    mdxReady: true,
    module: 'composite',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 180,
    prerequisites: ['C-06-signal-aggregation'],
    tags: ['signals', 'workshop'],
  }),
  lesson('C', 10, {
    id: 'C-10-signal-review',
    mdxReady: true,
    module: 'composite',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['signals', 'review'],
  }),
]

// =================================================================================
// Track D — 回测基础 (Backtesting Foundations, 15 lessons)
// =================================================================================
const TRACK_D: LessonRecord[] = [
  lesson('D', 1, {
    id: 'D-01-returns',
    mdxReady: true,
    module: 'returns',
    difficulty: 'beginner',
    durationMin: 16,
    xp: 70,
    tags: ['backtest', 'returns'],
  }),
  lesson('D', 2, {
    id: 'D-02-log-returns',
    mdxReady: true,
    module: 'returns',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    prerequisites: ['D-01-returns'],
    tags: ['backtest', 'returns'],
  }),
  lesson('D', 3, {
    id: 'D-03-max-drawdown',
    mdxReady: true,
    module: 'metrics',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['backtest', 'risk-metrics'],
  }),
  lesson('D', 4, {
    id: 'D-04-sharpe-ratio',
    mdxReady: true,
    module: 'metrics',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['backtest', 'risk-metrics'],
  }),
  lesson('D', 5, {
    id: 'D-05-sortino-calmar',
    mdxReady: true,
    module: 'metrics',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['D-04-sharpe-ratio'],
    tags: ['backtest', 'risk-metrics'],
  }),
  lesson('D', 6, {
    id: 'D-06-profit-factor',
    mdxReady: true,
    module: 'metrics',
    difficulty: 'intermediate',
    durationMin: 16,
    xp: 90,
    tags: ['backtest', 'metrics'],
  }),
  lesson('D', 7, {
    id: 'D-07-mae-mfe',
    mdxReady: true,
    module: 'metrics',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['backtest', 'trade-analytics'],
  }),
  lesson('D', 8, {
    id: 'D-08-slippage',
    mdxReady: true,
    module: 'costs',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    tags: ['backtest', 'costs'],
  }),
  lesson('D', 9, {
    id: 'D-09-commissions',
    mdxReady: true,
    module: 'costs',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 70,
    tags: ['backtest', 'costs'],
  }),
  lesson('D', 10, {
    id: 'D-10-lookahead-bias',
    mdxReady: true,
    module: 'bias',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['backtest', 'bias'],
  }),
  lesson('D', 11, {
    id: 'D-11-survivorship-bias',
    mdxReady: true,
    module: 'bias',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['backtest', 'bias'],
  }),
  lesson('D', 12, {
    id: 'D-12-is-vs-oos',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 150,
    tags: ['backtest', 'validation'],
  }),
  lesson('D', 13, {
    id: 'D-13-walk-forward',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    prerequisites: ['D-12-is-vs-oos'],
    tags: ['backtest', 'validation'],
  }),
  lesson('D', 14, {
    id: 'D-14-monte-carlo',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['backtest', 'validation', 'monte-carlo'],
  }),
  lesson('D', 15, {
    id: 'D-15-deflated-sharpe-pbo',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 200,
    prerequisites: ['D-13-walk-forward', 'D-14-monte-carlo'],
    tags: ['backtest', 'validation', 'overfitting'],
  }),
]

// =================================================================================
// Track E — 策略原型 (Strategy Prototypes, 15 lessons)
// =================================================================================
const TRACK_E: LessonRecord[] = [
  lesson('E', 1, {
    id: 'E-01-turtle-system',
    mdxReady: true,
    module: 'trend-following',
    difficulty: 'intermediate',
    durationMin: 22,
    xp: 130,
    tags: ['strategy', 'trend'],
  }),
  lesson('E', 2, {
    id: 'E-02-donchian-breakout',
    mdxReady: true,
    module: 'trend-following',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    prerequisites: ['E-01-turtle-system'],
    tags: ['strategy', 'trend'],
  }),
  lesson('E', 3, {
    id: 'E-03-ma-crossover',
    mdxReady: true,
    module: 'trend-following',
    difficulty: 'beginner',
    durationMin: 16,
    xp: 80,
    tags: ['strategy', 'trend'],
  }),
  lesson('E', 4, {
    id: 'E-04-pairs-trading',
    mdxReady: true,
    module: 'mean-reversion',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 180,
    tags: ['strategy', 'mean-reversion'],
  }),
  lesson('E', 5, {
    id: 'E-05-bollinger-reversion',
    mdxReady: true,
    module: 'mean-reversion',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 120,
    tags: ['strategy', 'mean-reversion'],
  }),
  lesson('E', 6, {
    id: 'E-06-momentum-cross-section',
    mdxReady: true,
    module: 'momentum',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['strategy', 'momentum'],
  }),
  lesson('E', 7, {
    id: 'E-07-momentum-time-series',
    mdxReady: true,
    module: 'momentum',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['strategy', 'momentum'],
  }),
  lesson('E', 8, {
    id: 'E-08-breakout-strategy',
    mdxReady: true,
    module: 'breakout',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 120,
    tags: ['strategy', 'breakout'],
  }),
  lesson('E', 9, {
    id: 'E-09-statistical-arbitrage',
    mdxReady: true,
    module: 'stat-arb',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 200,
    prerequisites: ['E-04-pairs-trading'],
    tags: ['strategy', 'stat-arb'],
  }),
  lesson('E', 10, {
    id: 'E-10-event-driven',
    mdxReady: true,
    module: 'events',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['strategy', 'events'],
  }),
  lesson('E', 11, {
    id: 'E-11-seasonality',
    mdxReady: true,
    module: 'events',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['strategy', 'seasonality'],
  }),
  lesson('E', 12, {
    id: 'E-12-vol-carry',
    mdxReady: true,
    module: 'factors',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['strategy', 'volatility'],
  }),
  lesson('E', 13, {
    id: 'E-13-factor-intro',
    mdxReady: true,
    module: 'factors',
    difficulty: 'intermediate',
    durationMin: 22,
    xp: 140,
    tags: ['strategy', 'factors'],
  }),
  lesson('E', 14, {
    id: 'E-14-crypto-funding-carry',
    mdxReady: true,
    module: 'crypto',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['strategy', 'crypto'],
  }),
  lesson('E', 15, {
    id: 'E-15-china-t1-limits',
    mdxReady: true,
    module: 'china',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['strategy', 'china', 'microstructure'],
  }),
]

// =================================================================================
// Track F — 风险与仓位 (Risk & Sizing, 8 lessons)
// =================================================================================
const TRACK_F: LessonRecord[] = [
  lesson('F', 1, {
    id: 'F-01-fixed-fractional',
    mdxReady: true,
    module: 'sizing',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 70,
    tags: ['risk', 'sizing'],
  }),
  lesson('F', 2, {
    id: 'F-02-vol-targeting',
    mdxReady: true,
    module: 'sizing',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 120,
    prerequisites: ['F-01-fixed-fractional'],
    tags: ['risk', 'sizing'],
  }),
  lesson('F', 3, {
    id: 'F-03-kelly-criterion',
    mdxReady: true,
    module: 'sizing',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    prerequisites: ['F-01-fixed-fractional'],
    tags: ['risk', 'sizing', 'kelly'],
  }),
  lesson('F', 4, {
    id: 'F-04-stop-loss-design',
    mdxReady: true,
    module: 'stops',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 110,
    tags: ['risk', 'stops'],
  }),
  lesson('F', 5, {
    id: 'F-05-take-profit-trailing',
    mdxReady: true,
    module: 'stops',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 100,
    prerequisites: ['F-04-stop-loss-design'],
    tags: ['risk', 'stops'],
  }),
  lesson('F', 6, {
    id: 'F-06-risk-of-ruin',
    mdxReady: true,
    module: 'risk-mgmt',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['risk', 'ruin'],
  }),
  lesson('F', 7, {
    id: 'F-07-portfolio-heat',
    mdxReady: true,
    module: 'risk-mgmt',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['risk', 'portfolio'],
  }),
  lesson('F', 8, {
    id: 'F-08-risk-review',
    mdxReady: true,
    module: 'risk-mgmt',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['risk', 'review'],
  }),
]

// =================================================================================
// Track G — 组合构建 (Portfolio Construction, 10 lessons)
// =================================================================================
const TRACK_G: LessonRecord[] = [
  lesson('G', 1, {
    id: 'G-01-equal-weight',
    mdxReady: true,
    module: 'weights',
    difficulty: 'beginner',
    durationMin: 14,
    xp: 70,
    tags: ['portfolio', 'weights'],
  }),
  lesson('G', 2, {
    id: 'G-02-inverse-vol',
    mdxReady: true,
    module: 'weights',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    prerequisites: ['G-01-equal-weight'],
    tags: ['portfolio', 'weights'],
  }),
  lesson('G', 3, {
    id: 'G-03-risk-parity',
    mdxReady: true,
    module: 'weights',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    prerequisites: ['G-02-inverse-vol'],
    tags: ['portfolio', 'risk-parity'],
  }),
  lesson('G', 4, {
    id: 'G-04-mvo-intro',
    mdxReady: true,
    module: 'optimization',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['portfolio', 'optimization'],
  }),
  lesson('G', 5, {
    id: 'G-05-ledoit-wolf',
    mdxReady: true,
    module: 'optimization',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 170,
    prerequisites: ['G-04-mvo-intro'],
    tags: ['portfolio', 'shrinkage'],
  }),
  lesson('G', 6, {
    id: 'G-06-black-litterman',
    mdxReady: true,
    module: 'optimization',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 200,
    prerequisites: ['G-04-mvo-intro'],
    tags: ['portfolio', 'optimization', 'bayesian'],
  }),
  lesson('G', 7, {
    id: 'G-07-rebalance-frequency',
    mdxReady: true,
    module: 'rebalance',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['portfolio', 'rebalance'],
  }),
  lesson('G', 8, {
    id: 'G-08-turnover-aware',
    mdxReady: true,
    module: 'rebalance',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    prerequisites: ['G-07-rebalance-frequency'],
    tags: ['portfolio', 'rebalance', 'costs'],
  }),
  lesson('G', 9, {
    id: 'G-09-drift-rebalance-workshop',
    mdxReady: true,
    module: 'rebalance',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 180,
    prerequisites: ['G-08-turnover-aware'],
    tags: ['portfolio', 'rebalance', 'workshop'],
  }),
  lesson('G', 10, {
    id: 'G-10-portfolio-review',
    mdxReady: true,
    module: 'rebalance',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['portfolio', 'review'],
  }),
]

// =================================================================================
// Track H — 上线你自己的策略 (Ship Your Strategy, 12 lessons)
// =================================================================================
const TRACK_H: LessonRecord[] = [
  lesson('H', 1, {
    id: 'H-01-strategy-hypothesis',
    mdxReady: true,
    module: 'idea',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    tags: ['ship', 'idea'],
  }),
  lesson('H', 2, {
    id: 'H-02-universe-selection',
    mdxReady: true,
    module: 'idea',
    difficulty: 'intermediate',
    durationMin: 18,
    xp: 110,
    prerequisites: ['H-01-strategy-hypothesis'],
    tags: ['ship', 'universe'],
  }),
  lesson('H', 3, {
    id: 'H-03-notebook-workflow',
    module: 'idea',
    difficulty: 'intermediate',
    durationMin: 14,
    xp: 80,
    tags: ['ship', 'notebook', 'pyodide'],
    mdxReady: true,
  }),
  lesson('H', 4, {
    id: 'H-04-vectorbt-prototype',
    mdxReady: true,
    module: 'prototype',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    prerequisites: ['H-03-notebook-workflow'],
    tags: ['ship', 'vectorbt'],
  }),
  lesson('H', 5, {
    id: 'H-05-realistic-costs',
    mdxReady: true,
    module: 'prototype',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    prerequisites: ['H-04-vectorbt-prototype'],
    tags: ['ship', 'costs'],
  }),
  lesson('H', 6, {
    id: 'H-06-walk-forward-ship',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    tags: ['ship', 'validation'],
  }),
  lesson('H', 7, {
    id: 'H-07-robustness-checks',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 24,
    xp: 170,
    prerequisites: ['H-06-walk-forward-ship'],
    tags: ['ship', 'validation'],
  }),
  lesson('H', 8, {
    id: 'H-08-stress-testing',
    mdxReady: true,
    module: 'validation',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 160,
    tags: ['ship', 'stress'],
  }),
  lesson('H', 9, {
    id: 'H-09-strategy-spec',
    mdxReady: true,
    module: 'submission',
    difficulty: 'intermediate',
    durationMin: 20,
    xp: 130,
    tags: ['ship', 'spec'],
  }),
  lesson('H', 10, {
    id: 'H-10-ai-deep-review',
    mdxReady: true,
    module: 'submission',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 170,
    prerequisites: ['H-09-strategy-spec'],
    tags: ['ship', 'ai'],
  }),
  lesson('H', 11, {
    id: 'H-11-paper-trading',
    mdxReady: true,
    module: 'submission',
    difficulty: 'advanced',
    durationMin: 22,
    xp: 170,
    prerequisites: ['H-10-ai-deep-review'],
    tags: ['ship', 'paper-trading'],
  }),
  lesson('H', 12, {
    id: 'H-12-graduation-project',
    mdxReady: true,
    module: 'submission',
    difficulty: 'advanced',
    durationMin: 25,
    xp: 200,
    prerequisites: ['H-11-paper-trading'],
    tags: ['ship', 'graduation'],
  }),
]

export const CURRICULUM: { lessons: LessonRecord[] } = {
  lessons: [
    ...TRACK_A,
    ...TRACK_B,
    ...TRACK_C,
    ...TRACK_D,
    ...TRACK_E,
    ...TRACK_F,
    ...TRACK_G,
    ...TRACK_H,
  ],
}

export function getLessonRecord(id: string): LessonRecord | undefined {
  return CURRICULUM.lessons.find((l) => l.meta.id === id)
}

export function getLessonsByTrack(trackId: TrackId): LessonRecord[] {
  return CURRICULUM.lessons
    .filter((l) => l.meta.trackId === trackId)
    .sort((a, b) => a.meta.order - b.meta.order)
}

function sortKey(record: LessonRecord): number {
  const track = getTrack(record.meta.trackId)
  const trackOrder = track ? track.order : 999
  return trackOrder * 1000 + record.meta.order
}

const ORDERED_LESSONS: LessonRecord[] = [...CURRICULUM.lessons].sort(
  (a, b) => sortKey(a) - sortKey(b),
)

export function getNextLesson(currentId: string): LessonRecord | undefined {
  const idx = ORDERED_LESSONS.findIndex((l) => l.meta.id === currentId)
  if (idx === -1 || idx === ORDERED_LESSONS.length - 1) return undefined
  return ORDERED_LESSONS[idx + 1]
}

export function getPreviousLesson(currentId: string): LessonRecord | undefined {
  const idx = ORDERED_LESSONS.findIndex((l) => l.meta.id === currentId)
  if (idx <= 0) return undefined
  return ORDERED_LESSONS[idx - 1]
}
