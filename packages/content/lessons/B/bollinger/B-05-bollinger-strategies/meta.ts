import type { LessonMeta } from '@quant-academy/content'

export const meta: LessonMeta = {
  id: 'B-05-bollinger-strategies',
  trackId: 'B',
  module: 'bollinger',
  order: 5,
  title: {
    en: 'Bollinger Bands: squeeze, mean-reversion, breakout',
    zh: '布林带策略：挤压、均值回归与突破',
  },
  summary: {
    en: 'Three classic uses of Bollinger Bands — mean reversion, the squeeze/breakout, and walking the bands — and why regime detection is the real edge.',
    zh: '布林带的三种经典用法——均值回归、挤压突破与沿带行走——以及为什么识别市场状态才是真正的优势。',
  },
  difficulty: 'intermediate',
  durationMin: 20,
  xp: 110,
  prerequisites: ['B-04-bollinger-bands'],
  tags: ['indicators', 'bollinger'],
  contributors: ['@quant-academy'],
  locales: ['en', 'zh'],
  quizIds: ['B-05-bollinger-strategies-q1', 'B-05-bollinger-strategies-q2'],
}

export default meta
