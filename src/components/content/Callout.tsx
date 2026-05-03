import * as React from "react";
import { Info, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "insight" | "warning" | "aside";

const variants: Record<Variant, { Icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  info: { Icon: Info, label: "Note", color: "var(--color-accent)" },
  insight: { Icon: Lightbulb, label: "Insight", color: "var(--color-part-3)" },
  warning: { Icon: AlertTriangle, label: "Watch out", color: "var(--color-part-1)" },
  aside: { Icon: Sparkles, label: "Aside", color: "var(--color-part-7)" },
};

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
}) {
  const { Icon, label, color } = variants[variant];
  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border surface p-5",
        "shadow-sm shadow-black/[0.03]"
      )}
      style={{ borderColor: `color-mix(in oklch, ${color}, transparent 70%)`, background: `color-mix(in oklch, ${color}, var(--color-card) 92%)` }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color }}>
        <Icon className="h-4 w-4" />
        {title ?? label}
      </div>
      <div className="mt-3 text-[16px] leading-relaxed text-[var(--color-fg)]">{children}</div>
    </div>
  );
}
