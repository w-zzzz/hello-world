'use client'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface QuizProps {
  id: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export function Quiz({ id, question, options, answer, explanation }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(`qa.quiz.${id}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { selected: number | null; submitted: boolean }
        setSelected(parsed.selected)
        setSubmitted(parsed.submitted)
      } catch {
        // ignore corrupted localStorage entries
      }
    }
  }, [id])

  function submit() {
    if (selected === null) return
    setSubmitted(true)
    localStorage.setItem(`qa.quiz.${id}`, JSON.stringify({ selected, submitted: true }))
  }

  const correct = selected === answer
  return (
    <section className="my-6 rounded-xl border bg-card p-5">
      <p className="mb-3 font-medium">{question}</p>
      <ul className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = submitted && i === answer
          const isWrong = submitted && isSelected && i !== answer
          return (
            <li key={`${id}-opt-${i}`}>
              <button
                type="button"
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                className={[
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition',
                  isCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                  isWrong && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
                  !submitted && isSelected && 'border-brand-500 bg-brand-50/40',
                  !submitted && !isSelected && 'hover:bg-muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {submitted && i === answer && <CheckCircle2 className="size-4 text-emerald-600" />}
                {submitted && isWrong && <XCircle className="size-4 text-rose-600" />}
                <span>{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {!submitted && (
        <button
          type="button"
          onClick={submit}
          disabled={selected === null}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Submit
        </button>
      )}
      {submitted && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            correct ? 'border-emerald-500' : 'border-rose-500'
          }`}
        >
          <strong>{correct ? 'Correct.' : 'Not quite.'}</strong> {explanation}
        </div>
      )}
    </section>
  )
}
