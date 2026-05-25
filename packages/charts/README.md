# @quant-academy/charts

Canonical chart primitives for Quant Academy. Thin wrapper around
[`lightweight-charts`](https://tradingview.github.io/lightweight-charts/) v5,
theme-aware via Tailwind CSS variables, SSR-safe, and tree-shakeable.

## Components

### `<Chart />`

Full-featured candlestick chart with optional volume histogram and overlays.

```tsx
import { Chart } from '@quant-academy/charts'

export function Demo() {
  return <Chart symbol="SPY" height={420} />
}
```

With overlays:

```tsx
import { Chart, sampleSpyDaily } from '@quant-academy/charts'

const sma20 = sampleSpyDaily.map((b, i, arr) => {
  const window = arr.slice(Math.max(0, i - 19), i + 1)
  const avg = window.reduce((s, x) => s + x.close, 0) / window.length
  return { t: b.t, v: avg }
})

export function WithSMA() {
  return (
    <Chart
      data={sampleSpyDaily}
      overlays={[{ kind: 'line', data: sma20, color: '#6366f1', title: 'SMA(20)' }]}
    />
  )
}
```

### `<MiniChart />`

Compact close-price sparkline (no axes, no controls). Ideal for cards and lists.

```tsx
import { MiniChart } from '@quant-academy/charts'

export function Card() {
  return <MiniChart height={96} />
}
```

## Sample data

`sampleSpyDaily` provides a deterministic 504-bar (~2-year) synthetic
SPY-like OHLCV series generated via a seeded mulberry32 PRNG and geometric
Brownian motion. Useful for storybook demos, tests, and indicator playgrounds.

```ts
import { generateSpyDaily, sampleSpyDaily } from '@quant-academy/charts/sample-data'
```

## Theming

Both components read CSS variables (`--color-foreground`, `--color-border`,
`--color-bull-500`, `--color-bear-500`) from `document.documentElement` and
re-apply them when the `dark` class on `<html>` toggles.
