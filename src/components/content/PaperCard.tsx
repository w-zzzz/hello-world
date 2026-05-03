import { ArrowUpRight, FileText } from "lucide-react";

export function PaperCard({
  title,
  authors,
  year,
  url,
  venue,
}: {
  title: string;
  authors: string;
  year: number;
  url: string;
  venue?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group mt-6 flex items-start gap-4 rounded-2xl border border-soft surface p-5 transition-all hover:border-[var(--color-accent)]/40 hover:shadow-md hover:shadow-black/5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-muted)] text-[var(--color-accent)]">
        <FileText className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">{venue ?? "Paper"} · {year}</span>
        </div>
        <div className="mt-1 font-semibold leading-snug">
          {title}
        </div>
        <div className="mt-0.5 text-sm text-[var(--color-muted-fg)]">{authors}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
