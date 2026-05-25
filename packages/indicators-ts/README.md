# @quant-academy/indicators-ts

Pure-TypeScript implementations of the M2 indicators (SMA, EMA, RSI, MACD,
Bollinger Bands). Zero runtime dependencies — only `vitest` and a workspace
tsconfig in `devDependencies`.

## Status

The Python package `qa_indicators` is the **canonical implementation**. This
TS package mirrors it bar-for-bar. Any divergence between the two is a bug
**here**, not in Python. Parity is verified by `src/__tests__/parity.test.ts`
which loads golden JSON fixtures produced by the Python package and asserts
equivalence within `1e-9` absolute / `1e-6` relative tolerance.

## Usage

```ts
import { INDICATORS } from '@quant-academy/indicators-ts'
import type { Bar } from '@quant-academy/indicators-ts'

const bars: Bar[] = [
  { t: '2024-01-02', open: 100, high: 101, low: 99, close: 100.5, volume: 1_000_000 },
  // ...
]

const { rsi } = INDICATORS.rsi({
  bars,
  params: { period: 14, source: 'close' },
})
// rsi is (number | null)[] aligned to `bars`; the first 14 entries are null.
```

Each compute function takes an `IndicatorInput` (`{ bars, params }`) and
returns an `IndicatorOutput` (`Record<string, (number|null)[]>`). Output
arrays are the same length as `bars`; leading entries are `null` while the
indicator warms up.

## Indicators

| id          | output columns                  | key params                              |
| ----------- | ------------------------------- | --------------------------------------- |
| `sma`       | `sma`                           | `period`, `source`                      |
| `ema`       | `ema`                           | `period`, `source`                      |
| `rsi`       | `rsi`                           | `period`, `source`                      |
| `macd`      | `macd`, `signal`, `histogram`   | `fast`, `slow`, `signal`, `source`      |
| `bollinger` | `middle`, `upper`, `lower`      | `period`, `k`, `source`                 |

## Scripts

```sh
pnpm --filter @quant-academy/indicators-ts typecheck
pnpm --filter @quant-academy/indicators-ts test
pnpm --filter @quant-academy/indicators-ts lint
```
