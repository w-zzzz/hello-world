export interface ChartTheme {
  background: string
  text: string
  border: string
  bull: string
  bear: string
  grid: string
}

const FALLBACK: ChartTheme = {
  background: 'transparent',
  text: '#0f172a',
  border: '#e2e8f0',
  bull: '#26a69a',
  bear: '#ef5350',
  grid: 'rgba(120,120,120,0.12)',
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function readChartTheme(): ChartTheme {
  return {
    background: 'transparent',
    text: readVar('--color-foreground', FALLBACK.text),
    border: readVar('--color-border', FALLBACK.border),
    bull: readVar('--color-bull-500', FALLBACK.bull),
    bear: readVar('--color-bear-500', FALLBACK.bear),
    grid: 'rgba(120,120,120,0.12)',
  }
}
