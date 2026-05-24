import type { Locale } from '@quant-academy/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@quant-academy/ui'
import { setRequestLocale } from 'next-intl/server'

const TRACKS = [
  { id: 'A', titleZh: '基础K线与价格行为', titleEn: 'Candlesticks & Price Action' },
  { id: 'B', titleZh: '技术指标入门', titleEn: 'Technical Indicators 101' },
  { id: 'C', titleZh: '量化基础', titleEn: 'Quant Foundations' },
  { id: 'D', titleZh: '策略开发', titleEn: 'Strategy Development' },
  { id: 'E', titleZh: '回测与风险', titleEn: 'Backtesting & Risk' },
  { id: 'F', titleZh: '投资组合', titleEn: 'Portfolio Construction' },
  { id: 'G', titleZh: '机器学习应用', titleEn: 'ML for Trading' },
  { id: 'H', titleZh: '生产部署', titleEn: 'Production Deployment' },
] as const

export default async function LessonsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{isZh ? '课程地图' : 'Lesson Tracks'}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TRACKS.map((track) => (
          <Card key={track.id}>
            <CardHeader>
              <CardTitle>Track {track.id}</CardTitle>
              <CardDescription>{isZh ? track.titleZh : track.titleEn}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-brand-500" style={{ width: '0%' }} />
                </div>
                <span className="text-sm tabular-nums text-foreground/60">0%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
