import 'server-only'
import { db, tutorMessages } from '@quant-academy/db'
import type { UsageDelta } from './types'

export async function recordUserMessage(input: {
  userId: string
  lessonId: string | null
  conversationId: string
  content: string
  model: string
}): Promise<void> {
  await db.insert(tutorMessages).values({
    userId: input.userId,
    lessonId: input.lessonId,
    conversationId: input.conversationId,
    role: 'user',
    content: input.content,
    model: input.model,
  })
}

export async function recordAssistantMessage(input: {
  userId: string
  lessonId: string | null
  conversationId: string
  content: string
  model: string
  usage: UsageDelta
}): Promise<void> {
  await db.insert(tutorMessages).values({
    userId: input.userId,
    lessonId: input.lessonId,
    conversationId: input.conversationId,
    role: 'assistant',
    content: input.content,
    model: input.model,
    tokensIn: input.usage.inputTokens,
    tokensOut: input.usage.outputTokens,
    cacheReadInputTokens: input.usage.cacheReadInputTokens,
    cacheCreationInputTokens: input.usage.cacheCreationInputTokens,
  })
}
