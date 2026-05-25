export interface Bar {
  /** ISO date 'YYYY-MM-DD' */
  t: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type LineOverlay = {
  kind: 'line'
  data: { t: string; v: number }[]
  color?: string
  lineWidth?: 1 | 2 | 3
  title?: string
}

export type BandOverlay = {
  kind: 'band'
  upper: { t: string; v: number }[]
  lower: { t: string; v: number }[]
  color?: string
  title?: string
}

export type Overlay = LineOverlay | BandOverlay

export interface ChartProps {
  data?: Bar[]
  symbol?: string
  height?: number
  overlays?: Overlay[]
  showVolume?: boolean
  intervalLabel?: string
  className?: string
}

export interface MiniChartProps {
  data?: Bar[]
  height?: number
  className?: string
}
