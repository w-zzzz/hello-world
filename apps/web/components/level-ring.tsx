import { cn } from '@quant-academy/ui'

interface Props {
  level: number
  xpIntoLevel: number
  xpForNext: number
  size?: number
  className?: string
}

export function LevelRing({ level, xpIntoLevel, xpForNext, size = 96, className }: Props) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = xpForNext > 0 ? Math.min(1, xpIntoLevel / xpForNext) : 0
  const offset = circumference * (1 - progress)
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-brand-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">Lv</span>
        <span className="text-xl font-bold tabular-nums">{level}</span>
      </div>
    </div>
  )
}
