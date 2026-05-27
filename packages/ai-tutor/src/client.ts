import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getCurriculumIndex } from './prompts/curriculum'
import { GLOBAL_RULES } from './prompts/global'
import { getLessonContext } from './prompts/lesson'
import {
  type ChatMessage,
  DEFAULT_MODEL,
  type StreamEvent,
  type StreamRequest,
  type UsageDelta,
} from './types'

let client: Anthropic | null = null
export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

export interface BuildSystemInput {
  lessonId: string | null
  locale: 'zh' | 'en'
}

export async function buildSystem(input: BuildSystemInput): Promise<Anthropic.TextBlockParam[]> {
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: GLOBAL_RULES,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: getCurriculumIndex(),
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (input.lessonId) {
    const ctx = await getLessonContext(input.lessonId, input.locale)
    if (ctx) {
      blocks.push({
        type: 'text',
        text: ctx,
        cache_control: { type: 'ephemeral' },
      })
    }
  }
  return blocks
}

export async function* runStream(req: StreamRequest): AsyncGenerator<StreamEvent> {
  const anthropic = getAnthropic()
  if (!anthropic) {
    yield { kind: 'error', message: 'ANTHROPIC_API_KEY not configured' }
    yield { kind: 'done' }
    return
  }

  const system = await buildSystem({ lessonId: req.lessonId, locale: req.locale })

  const messages: ChatMessage[] = req.history.slice(-50).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let totalUsage: UsageDelta = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  }

  try {
    const stream = anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system,
      messages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { kind: 'text', delta: event.delta.text }
      } else if (event.type === 'message_start') {
        const u = event.message.usage
        if (u) {
          totalUsage = {
            inputTokens: u.input_tokens ?? 0,
            outputTokens: u.output_tokens ?? 0,
            cacheReadInputTokens: u.cache_read_input_tokens ?? 0,
            cacheCreationInputTokens: u.cache_creation_input_tokens ?? 0,
          }
        }
      } else if (event.type === 'message_delta') {
        const u = event.usage
        if (u) {
          totalUsage.outputTokens = u.output_tokens ?? totalUsage.outputTokens
        }
      }
    }
    yield { kind: 'usage', usage: totalUsage }
    yield { kind: 'done' }
  } catch (err) {
    yield { kind: 'error', message: err instanceof Error ? err.message : String(err) }
    yield { kind: 'done' }
  }
}
