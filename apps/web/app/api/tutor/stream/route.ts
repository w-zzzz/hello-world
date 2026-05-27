import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import {
  buildSystem,
  type ChatMessage,
  checkSonnetBudget,
  DEFAULT_MODEL,
  estimateInputTokens,
  MAX_CONVERSATION_TURNS,
  recordAssistantMessage,
  recordSonnetUsage,
  recordUserMessage,
  runStream,
} from '@/lib/ai'
import { getCurrentUser } from '@/lib/auth'

interface StreamBody {
  lessonId: string | null
  conversationId?: string
  locale?: 'zh' | 'en'
  history?: ChatMessage[]
  message: string
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: StreamBody
  try {
    body = (await req.json()) as StreamBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'missing_message' }, { status: 400 })
  }

  const conversationId = body.conversationId ?? randomUUID()
  const locale: 'zh' | 'en' = body.locale === 'en' ? 'en' : 'zh'
  const history: ChatMessage[] = (body.history ?? []).slice(-MAX_CONVERSATION_TURNS)
  history.push({ role: 'user', content: body.message })

  // Pre-flight budget
  const system = await buildSystem({ lessonId: body.lessonId, locale })
  const systemText = system.map((b) => b.text).join('\n')
  const historyText = history.map((m) => m.content).join('\n')
  const estimate = estimateInputTokens(systemText + historyText)
  const gate = await checkSonnetBudget(user.id, estimate)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      if (!gate.ok) {
        send('quota_exceeded', {
          reason: gate.reason,
          usedToday: gate.usedToday,
          cap: gate.cap,
        })
        send('done', {})
        controller.close()
        return
      }

      await recordUserMessage({
        userId: user.id,
        lessonId: body.lessonId,
        conversationId,
        content: body.message,
        model: DEFAULT_MODEL,
      })

      let assistantText = ''
      let lastUsage = {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
      }

      for await (const ev of runStream({
        userId: user.id,
        lessonId: body.lessonId,
        conversationId,
        locale,
        history,
      })) {
        switch (ev.kind) {
          case 'text':
            assistantText += ev.delta
            send('text', { delta: ev.delta })
            break
          case 'usage':
            lastUsage = ev.usage
            send('usage', ev.usage)
            break
          case 'error':
            send('error', { message: ev.message })
            break
          case 'done':
            await recordAssistantMessage({
              userId: user.id,
              lessonId: body.lessonId,
              conversationId,
              content: assistantText,
              model: DEFAULT_MODEL,
              usage: lastUsage,
            })
            await recordSonnetUsage(user.id, lastUsage.inputTokens, lastUsage.outputTokens)
            send('done', { conversationId })
            controller.close()
            return
          case 'quota_exceeded':
            send('quota_exceeded', {
              reason: ev.reason,
              usedToday: ev.usedToday,
              cap: ev.cap,
            })
            send('done', {})
            controller.close()
            return
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
    },
  })
}
