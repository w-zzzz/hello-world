import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Researcher } from "@/lib/types";

export function ResearcherCard({ r }: { r: Researcher }) {
  return (
    <Link
      href={`/researchers/${r.slug}`}
      aria-label={`${r.name} — ${r.affiliation}`}
      className="group block rounded-2xl border border-soft surface p-5 hover:border-[var(--color-accent)]/40 hover:shadow-md hover:shadow-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        <Avatar name={r.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold leading-tight">{r.name}</span>
          </div>
          <div className="text-xs text-[var(--color-muted-fg)] mt-0.5">{r.affiliation}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {r.area.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted-fg)] leading-relaxed text-pretty">
        {r.short}
      </p>
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  // deterministic hue per name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      role="img"
      aria-label={`Avatar for ${name}`}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, oklch(0.65 0.16 ${h}), oklch(0.55 0.18 ${(h + 60) % 360}))`,
      }}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );
}
