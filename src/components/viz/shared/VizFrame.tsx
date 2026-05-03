"use client";

import * as React from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function VizFrame({
  title,
  subtitle,
  onReset,
  fullScreenHref,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  onReset?: () => void;
  fullScreenHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-soft surface overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-soft px-5 py-3">
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          {subtitle && <div className="text-xs text-[var(--color-muted-fg)]">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset"
              className="grid h-8 w-8 place-items-center rounded-lg border border-soft text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {fullScreenHref && (
            <a
              href={fullScreenHref}
              aria-label="Open full screen"
              className="grid h-8 w-8 place-items-center rounded-lg border border-soft text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
