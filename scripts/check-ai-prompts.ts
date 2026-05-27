import { buildSystem, estimateInputTokens } from '@quant-academy/ai-tutor'

async function main() {
  const blocks = await buildSystem({ lessonId: null, locale: 'zh' })
  if (blocks.length !== 2) {
    console.error(`FAIL: expected 2 blocks (no lesson), got ${blocks.length}`)
    process.exit(1)
  }
  const total = estimateInputTokens(blocks.map((b) => b.text).join('\n'))
  if (total > 100_000) {
    console.error(`FAIL: prompt size ${total} > 100k tokens`)
    process.exit(1)
  }
  for (const b of blocks) {
    if (!b.cache_control || b.cache_control.type !== 'ephemeral') {
      console.error('FAIL: cache_control missing on a block')
      process.exit(1)
    }
  }
  console.log(`OK: ${blocks.length} blocks, ~${total} tokens`)
}

main()
