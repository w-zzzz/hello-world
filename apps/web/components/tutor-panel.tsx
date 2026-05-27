'use client'

import { Button } from '@quant-academy/ui'
import { AlertCircle, Bot, Send, User as UserIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { TutorMessage } from './tutor-message'

type Role = 'user' | 'assistant'

interface ChatMsg {
  role: Role
  content: string
}

interface Props {
  lessonId: string | null
  isSignedIn: boolean
}

export function TutorPanel({ lessonId, isSignedIn }: Props) {
  const t = useTranslations()
  const locale = useLocale() as 'zh' | 'en'

  const [history, setHistory] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [quotaError, setQuotaError] = useState<{ usedToday: number; cap: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [streamingText])

  if (!isSignedIn) {
    return (
      <aside className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        {t('tutor.signInPrompt')}
      </aside>
    )
  }

  async function send() {
    const message = draft.trim()
    if (!message || isStreaming) return
    setDraft('')
    setError(null)
    setQuotaError(null)
    setStreamingText('')
    setIsStreaming(true)
    const nextHistory = [...history, { role: 'user' as Role, content: message }]
    setHistory(nextHistory)

    const controller = new AbortController()
    abortRef.current = controller

    let accText = ''
    try {
      const res = await fetch('/api/tutor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, conversationId, locale, history, message }),
        signal: controller.signal,
      })
      if (res.status === 401) {
        setError(t('tutor.signInPrompt'))
        setIsStreaming(false)
        return
      }
      if (!res.body) {
        setError('No response body')
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''
        for (const frame of frames) {
          const lines = frame.split('\n')
          let eventName = 'message'
          let data = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim()
            else if (line.startsWith('data: ')) data += line.slice(6)
          }
          try {
            const payload = data ? JSON.parse(data) : {}
            if (eventName === 'text') {
              accText += payload.delta ?? ''
              setStreamingText(accText)
            } else if (eventName === 'done') {
              if (payload.conversationId) setConversationId(payload.conversationId)
              setHistory([...nextHistory, { role: 'assistant', content: accText }])
              setStreamingText('')
              setIsStreaming(false)
            } else if (eventName === 'quota_exceeded') {
              setQuotaError({ usedToday: payload.usedToday, cap: payload.cap })
              setIsStreaming(false)
            } else if (eventName === 'error') {
              setError(payload.message ?? 'Unknown error')
              setIsStreaming(false)
            }
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
      setIsStreaming(false)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setHistory([])
    setStreamingText('')
    setConversationId(undefined)
    setQuotaError(null)
    setError(null)
    setIsStreaming(false)
  }

  return (
    <aside className="flex h-[600px] flex-col rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-2 text-sm">
        <div className="inline-flex items-center gap-2 font-semibold">
          <Bot className="size-4" aria-hidden="true" />
          {t('tutor.title')}
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-muted-foreground hover:underline"
        >
          {t('tutor.reset')}
        </button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {history.length === 0 && !streamingText && (
          <p className="text-sm text-muted-foreground">{t('tutor.placeholder')}</p>
        )}
        {history.map((m, i) => (
          <div key={`${i}-${m.role}`} className="flex gap-3 text-sm">
            <div
              className={`mt-0.5 size-6 shrink-0 rounded-full ${
                m.role === 'user' ? 'bg-brand-500/10' : 'bg-muted'
              } flex items-center justify-center`}
            >
              {m.role === 'user' ? (
                <UserIcon className="size-3.5" aria-hidden="true" />
              ) : (
                <Bot className="size-3.5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <TutorMessage content={m.content} />
              )}
            </div>
          </div>
        ))}
        {streamingText && (
          <div className="flex gap-3 text-sm">
            <div className="mt-0.5 size-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
              <Bot className="size-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <TutorMessage content={streamingText} />
            </div>
          </div>
        )}
      </div>
      {quotaError && (
        <div className="flex items-center gap-2 border-t bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="size-4" aria-hidden="true" />
          {t('tutor.quotaExceeded', { used: quotaError.usedToday, cap: quotaError.cap })}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 border-t bg-rose-500/10 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="flex gap-2 border-t p-3"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('tutor.inputPlaceholder')}
          disabled={isStreaming}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button
          type="submit"
          disabled={isStreaming || !draft.trim()}
          size="sm"
          className="inline-flex items-center gap-1.5"
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </aside>
  )
}
