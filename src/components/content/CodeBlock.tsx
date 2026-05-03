"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** rehype-pretty-code renders <pre> with syntax-highlighted children. We wrap with a copy button. */
export function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
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

  return (
    <div className="group relative mt-6 overflow-hidden rounded-2xl border border-soft surface">
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy code"
        className={cn(
          "absolute right-3 top-3 z-10 rounded-md border border-soft surface/80 p-1.5 text-[var(--color-muted-fg)]",
          "opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100 hover:text-[var(--color-fg)]"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre ref={ref} className="overflow-x-auto py-5 px-5 text-[13.5px] leading-relaxed [&_code]:!bg-transparent [&_code]:!p-0" {...props} />
    </div>
  );
}
