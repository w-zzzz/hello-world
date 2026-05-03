"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

export function QuizBlock({
  topicSlug,
  questions,
}: {
  topicSlug: string;
  questions: QuizQuestion[];
}) {
  const [idx, setIdx] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [startedAt, setStartedAt] = React.useState(() => Date.now());
  const [submitting, setSubmitting] = React.useState(false);

  // Refs let the keydown listener (registered once) read fresh values.
  const idxRef = React.useRef(idx);
  const revealedRef = React.useRef(revealed);
  const submittingRef = React.useRef(submitting);
  const questionsRef = React.useRef(questions);
  const submitRef = React.useRef<(choice: number) => Promise<void>>(async () => {});
  const nextQuestionRef = React.useRef<() => void>(() => {});
  React.useEffect(() => { idxRef.current = idx; }, [idx]);
  React.useEffect(() => { revealedRef.current = revealed; }, [revealed]);
  React.useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  React.useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Keyboard ergonomics: 1-4 / a-d picks a choice, Enter advances after reveal.
  // Bail when the user is typing into a form control so we don't hijack input.
  React.useEffect(() => {
    function isTypingInForm() {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingInForm()) return;
      const q = questionsRef.current[idxRef.current];
      if (!q) return;
      const k = e.key.toLowerCase();
      // 1-9 / a-z map to choice index when within range.
      let choiceIdx = -1;
      if (k >= "1" && k <= "9") choiceIdx = Number(k) - 1;
      else if (k >= "a" && k <= "z") choiceIdx = k.charCodeAt(0) - "a".charCodeAt(0);
      if (choiceIdx >= 0 && choiceIdx < q.choices.length) {
        if (!revealedRef.current && !submittingRef.current) {
          e.preventDefault();
          void submitRef.current(choiceIdx);
        }
        return;
      }
      if (e.key === "Enter" && revealedRef.current && !submittingRef.current) {
        e.preventDefault();
        nextQuestionRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = questions[idx];

  const submit = React.useCallback(
    async (choice: number) => {
      if (revealed || submitting) return;
      const current = questions[idx];
      if (!current) return;
      setSelected(choice);
      setRevealed(true);
      setSubmitting(true);
      const correct = choice === current.answer;
      const timeMs = Date.now() - startedAt;
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topicSlug,
            questionId: current.id,
            selected: choice,
            correct,
            timeMs,
          }),
        }).then((r) => r.json());
        if (correct) {
          toast.success(`+${res.xpDelta} XP · streak ${res.streakCount}d`, { duration: 2200 });
        } else {
          toast.message("Saved for review", {
            description: "We'll bring this back later.",
            duration: 2200,
          });
        }
      } catch {
        toast.error("Could not save attempt");
      } finally {
        setSubmitting(false);
      }
    },
    [revealed, submitting, questions, idx, startedAt, topicSlug]
  );

  const nextQuestion = React.useCallback(() => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
      setRevealed(false);
      setStartedAt(Date.now());
    } else {
      toast.success("Quiz complete", { description: "Mastery updated.", icon: <Sparkles className="h-4 w-4" /> });
    }
  }, [idx, questions.length]);

  // Keep handler refs current so the global keydown listener calls the latest closures.
  React.useEffect(() => {
    submitRef.current = submit;
    nextQuestionRef.current = nextQuestion;
  }, [submit, nextQuestion]);

  if (!questions.length) return null;

  return (
    <section
      aria-label="Topic quiz"
      className="mt-16 rounded-3xl border border-soft surface p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
          Check your understanding
        </div>
        <div className="text-xs tabular-nums text-[var(--color-muted-fg)]">
          Question {idx + 1} of {questions.length}
        </div>
      </div>
      <h3 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-balance">
        {q.question}
      </h3>
      <ul className="mt-5 space-y-2">
        {q.choices.map((c, i) => {
          const isSelected = selected === i;
          const isAnswer = i === q.answer;
          const showCorrect = revealed && isAnswer;
          const showWrong = revealed && isSelected && !isAnswer;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => submit(i)}
                disabled={revealed}
                aria-label={`Choice ${String.fromCharCode(65 + i)}: ${c.replace(/\$([^$]+)\$/g, "$1")}`}
                className={cn(
                  "group w-full text-left rounded-2xl border border-soft bg-[var(--color-bg)] px-5 py-3.5",
                  "transition-all duration-200 disabled:cursor-default",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                  !revealed && "hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-muted)]/40",
                  showCorrect && "!border-emerald-500/60 !bg-emerald-500/10",
                  showWrong && "!border-rose-500/60 !bg-rose-500/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border border-soft text-xs font-medium tabular-nums shrink-0",
                      showCorrect && "border-emerald-500 bg-emerald-500 text-white",
                      showWrong && "border-rose-500 bg-rose-500 text-white"
                    )}
                  >
                    {showCorrect ? <Check className="h-3.5 w-3.5" /> : showWrong ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[15px]" dangerouslySetInnerHTML={{ __html: renderInlineMath(c) }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!revealed && (
        <div
          className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]/80 font-medium"
          aria-hidden
        >
          Press 1–{q.choices.length} or A–{String.fromCharCode(64 + q.choices.length)}
        </div>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="mt-5 rounded-2xl border border-soft bg-[var(--color-muted)]/40 p-5"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              {selected === q.answer ? "Correct" : "Why the right answer is right"}
            </div>
            <p className="mt-2 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderInlineMath(q.explanation) }} />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={nextQuestion}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2 text-sm font-medium hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                {idx + 1 < questions.length ? "Next question" : "Finish"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Tiny KaTeX-free inline math: render $...$ as italic monospace fallback.
 *  For robust math we'd use KaTeX runtime; quizzes typically have simple notation
 *  so we keep them lightweight by escaping HTML and italicizing the math. */
function renderInlineMath(s: string): string {
  const escape = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "";
  let i = 0;
  while (i < s.length) {
    const m = s.indexOf("$", i);
    if (m === -1) {
      out += escape(s.slice(i));
      break;
    }
    out += escape(s.slice(i, m));
    const end = s.indexOf("$", m + 1);
    if (end === -1) {
      out += escape(s.slice(m));
      break;
    }
    const math = s.slice(m + 1, end);
    out += `<span class="font-mono italic text-[var(--color-accent)]">${escape(math)}</span>`;
    i = end + 1;
  }
  return out;
}
