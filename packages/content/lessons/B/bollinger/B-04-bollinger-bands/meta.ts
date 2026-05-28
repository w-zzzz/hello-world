import type { LessonMeta } from '@quant-academy/content'

export const meta: LessonMeta = {
  id: 'B-04-bollinger-bands',
  trackId: 'B',
  module: 'bollinger',
  order: 4,
  title: {
    en: 'Bollinger Bands: math + intuition',
    zh: '布林带：数学与直觉',
  },
  summary: {
    en: 'Derive Bollinger Bands from a rolling mean and standard deviation, see how band width adapts to volatility, and learn why a band touch is descriptive, not predictive.',
    zh: '从滚动均值与标准差推导布林带，理解带宽如何随波动率自适应，并明白触碰带边只是描述性的，并非预测信号。',
  },
  difficulty: 'intermediate',
  durationMin: 18,
  xp: 100,
  prerequisites: ['B-02-ema'],
  tags: ['indicators', 'bollinger'],
  contributors: ['@quant-academy'],
  locales: ['en', 'zh'],
  quizIds: ['B-04-bollinger-bands-q1', 'B-04-bollinger-bands-q2'],
}

export default meta
