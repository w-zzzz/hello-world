"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Hash, Type } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { tokenize, type Token } from "@/lib/viz/tokenize";

const SAMPLES = [
  "Attention is all you need.",
  "Deep learning is the new electricity.",
  "Tokenizers split text into the units a language model actually sees.",
  "DeepSeek-R1 incentivizes reasoning capability via reinforcement learning.",
];

const PALETTE = [
  "var(--color-part-1)",
  "var(--color-part-2)",
  "var(--color-part-3)",
  "var(--color-part-4)",
  "var(--color-part-5)",
  "var(--color-part-6)",
  "var(--color-part-7)",
  "var(--color-part-8)",
];

export function TokenizerViz() {
  const [text, setText] = React.useState(SAMPLES[0]);
  const tokens = React.useMemo(() => tokenize(text), [text]);

  return (
    <VizFrame
      title="Tokenizer"
      subtitle={`${tokens.length} tokens · ${text.length} chars`}
      onReset={() => setText(SAMPLES[0])}
      fullScreenHref="/playground/tokenizer"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                onClick={() => setText(s)}
                className="rounded-full border border-soft px-3 py-1 text-[11px] hover:bg-[var(--color-muted)] transition-colors"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-muted-fg)]">
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {text.length}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              {tokens.length}
            </span>
            <span className="tabular-nums">
              {tokens.length > 0 ? (text.length / tokens.length).toFixed(2) : "0"} chars/token
            </span>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-soft bg-[var(--color-bg)] p-4 text-[15px] leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          placeholder="Type or paste text…"
        />
        <div className="mt-5 rounded-2xl border border-soft bg-[var(--color-muted)]/40 p-5 min-h-[120px]">
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((t, i) => (
              <TokenChip key={i} token={t} idx={i} />
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <Legend swatch="·" label="Leading space" />
          <Legend swatch="abc" label="Subword unit" />
          <Legend swatch="ID" label="Hashed token id" />
          <Legend swatch="↗" label="Frequent merges win" />
        </div>
      </div>
    </VizFrame>
  );
}

function TokenChip({ token, idx }: { token: Token; idx: number }) {
  const color = PALETTE[idx % PALETTE.length];
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(0.5, idx * 0.008), ease: [0.32, 0.72, 0, 1] }}
      className="group inline-flex flex-col items-center gap-0.5"
    >
      <span
        className="rounded-md px-2 py-1 text-sm font-mono"
        style={{
          backgroundColor: `color-mix(in oklch, ${color}, var(--color-bg) 80%)`,
          border: `1px solid color-mix(in oklch, ${color}, transparent 60%)`,
        }}
      >
        {token.text}
      </span>
      <span className="text-[9px] tabular-nums text-[var(--color-muted-fg)] opacity-70 group-hover:opacity-100 transition-opacity">
        {token.id.toString().padStart(6, "0")}
      </span>
    </motion.span>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[var(--color-muted-fg)]">
      <span className="inline-block min-w-[28px] text-center rounded border border-soft px-1.5 py-0.5 font-mono text-[var(--color-fg)]">
        {swatch}
      </span>
      <span>{label}</span>
    </div>
  );
}
