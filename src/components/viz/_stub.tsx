"use client";

import { Sparkles } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";

export function VizStub({ title, note }: { title: string; note?: string }) {
  return (
    <VizFrame title={title} subtitle="Interactive visualization">
      <div className="grid place-items-center h-[440px] gradient-mesh">
        <div className="text-center max-w-sm px-6">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-muted)] mx-auto text-[var(--color-accent)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="mt-4 text-base font-semibold">{title}</div>
          <p className="mt-2 text-sm text-[var(--color-muted-fg)] leading-relaxed">
            {note ?? "Hand-built interactive visualization. Coming soon."}
          </p>
        </div>
      </div>
    </VizFrame>
  );
}
