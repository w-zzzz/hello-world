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

function whitespaceTokenize(text: string): Token[] {
  if (!text) return [];
  return text
    .split(/(\s+)/)
    .filter((s) => s.length > 0 && !/^\s+$/.test(s))
    .map((w) => ({ text: w, id: hashStr(w) }));
}

function hashStr(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffff;
  return h;
}

export function TokenizerViz() {
  const [text, setText] = React.useState(SAMPLES[0]);
  const [compare, setCompare] = React.useState(false);
  const tokens = React.useMemo(() => tokenize(text), [text]);
  const wsTokens = React.useMemo(() => whitespaceTokenize(text), [text]);
  const uniqueTokens = React.useMemo(() => new Set(tokens.map((t) => t.text)).size, [tokens]);

  return (
    <VizFrame
      title="Tokenizer"
      subtitle={`${tokens.length} tokens · ${text.length} chars · ${uniqueTokens} unique`}
      onReset={() => { setText(SAMPLES[0]); setCompare(false); }}
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
          aria-label="Text to tokenize"
          name="tokenizer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-soft bg-[var(--color-bg)] p-4 text-[15px] leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
          placeholder="Type or paste text…"
        />
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-[var(--color-fg)]">Compare with whitespace tokenization</span>
          </label>
          <div className="text-[10px] text-[var(--color-muted-fg)]">
            BPE: {tokens.length} tokens · Whitespace: {wsTokens.length} tokens
          </div>
        </div>
        <div className={compare ? "mt-5 grid lg:grid-cols-2 gap-4" : "mt-5"}>
          <div className="rounded-2xl border border-soft bg-[var(--color-muted)]/40 p-5 min-h-[120px]">
            {compare && (
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-2">
                BPE ({tokens.length})
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((t, i) => (
                <TokenChip key={i} token={t} idx={i} />
              ))}
            </div>
          </div>
          {compare && (
            <div className="rounded-2xl border border-soft bg-[var(--color-muted)]/40 p-5 min-h-[120px]">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-2">
                Whitespace ({wsTokens.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {wsTokens.map((t, i) => (
                  <TokenChip key={i} token={t} idx={i} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <Legend swatch="·" label="Leading space" />
          <Legend swatch="abc" label="Subword unit" />
          <Legend swatch="ID" label="Hashed token id" />
          <Legend swatch="↗" label="Hover for bytes" />
        </div>
      </div>
    </VizFrame>
  );
}

function TokenChip({ token, idx }: { token: Token; idx: number }) {
  const color = PALETTE[idx % PALETTE.length];
  const [show, setShow] = React.useState(false);
  // bytes view: convert token.text → utf-8 byte array
  const bytes = React.useMemo(() => {
    const enc = new TextEncoder();
    const raw = token.text.replace(/·/g, " ");
    return Array.from(enc.encode(raw));
  }, [token.text]);
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(0.5, idx * 0.008), ease: [0.32, 0.72, 0, 1] }}
      className="group relative inline-flex flex-col items-center gap-0.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
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
      {show && (
        <span className="absolute z-10 top-full mt-1 left-1/2 -translate-x-1/2 rounded-md border border-soft bg-[var(--color-card)] px-2 py-1 text-[9px] font-mono text-[var(--color-fg)] whitespace-nowrap shadow-lg pointer-events-none">
          [{bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}]
          <span className="text-[var(--color-muted-fg)] ml-1">· {bytes.length}B</span>
        </span>
      )}
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
