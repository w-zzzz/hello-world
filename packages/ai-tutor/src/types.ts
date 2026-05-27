export const DEFAULT_MODEL = 'claude-sonnet-4-6' as const
export const MAX_SONNET_INPUT_PER_DAY = 200_000
export const MAX_SONNET_OUTPUT_PER_DAY = 40_000
export const MAX_CONVERSATION_TURNS = 50

export type Role = 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

export interface StreamRequest {
  userId: string
  lessonId: string | null
  conversationId: string
  locale: 'zh' | 'en'
  history: ChatMessage[] // prior turns; last entry must be the new user message
}

export interface UsageDelta {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
}

export type StreamEvent =
  | { kind: 'text'; delta: string }
  | { kind: 'usage'; usage: UsageDelta }
  | { kind: 'done' }
  | { kind: 'error'; message: string }
  | {
      kind: 'quota_exceeded'
      reason: 'sonnet_input' | 'sonnet_output'
      usedToday: number
      cap: number
    }
