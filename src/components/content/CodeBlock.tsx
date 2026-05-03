"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** rehype-pretty-code renders <pre> with syntax-highlighted children and
 *  decorates the element with `data-language="ts"` etc. We surface that
 *  language as a small uppercase pill in the top-left, alongside the existing
 *  copy button. */
export function CodeBlock(props: React.HTMLAttributes<HTMLPreElement> & { "data-language"?: string }) {
  const { "data-language": lang, ...rest } = props;
  const ref = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    if (!ref.current) return;
    const text = ref.current.innerText;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  // Some languages rehype-pretty-code emits aren't great as labels — normalize
  // a few common ones to the form readers expect.
  const display = lang ? normalize(lang) : null;

  return (
    <div className="group relative mt-6 overflow-hidden rounded-2xl border border-soft surface">
      {display && (
        <span
          aria-hidden
          className={cn(
            "absolute left-3 top-3 z-10 rounded-md border border-soft bg-[var(--color-bg)]/80 backdrop-blur",
            "px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-fg)] font-mono"
          )}
        >
          {display}
        </span>
      )}
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          "absolute right-3 top-3 z-10 rounded-md border border-soft surface/80 p-1.5 text-[var(--color-muted-fg)]",
          "opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--color-fg)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre
        ref={ref}
        data-language={lang}
        className={cn(
          "overflow-x-auto py-5 px-5 text-[13.5px] leading-relaxed",
          "[&_code]:!bg-transparent [&_code]:!p-0",
          display && "pt-9"
        )}
        {...rest}
      />
    </div>
  );
}

function normalize(lang: string): string {
  const k = lang.toLowerCase();
  const map: Record<string, string> = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    jsx: "jsx",
    py: "python",
    python: "python",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    md: "md",
    mdx: "mdx",
    yml: "yaml",
    yaml: "yaml",
    json: "json",
    rust: "rust",
    rs: "rust",
    cpp: "c++",
    "c++": "c++",
    plaintext: "text",
    text: "text",
  };
  return map[k] ?? k;
}
