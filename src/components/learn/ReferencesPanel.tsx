import { ArrowUpRight } from "lucide-react";
import type { ExternalResource, Paper, Researcher } from "@/lib/types";
import { RESEARCHER_BY_SLUG } from "../../../content/researchers";

export function ReferencesPanel({
  papers,
  hf,
  free,
  researchers,
}: {
  papers: Paper[];
  hf: ExternalResource[];
  free: ExternalResource[];
  researchers: string[];
}) {
  const people = researchers.map((s) => RESEARCHER_BY_SLUG[s]).filter(Boolean) as Researcher[];
  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      {people.length > 0 && (
        <Section title="Featured researchers">
          <ul className="space-y-2">
            {people.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/researchers/${p.slug}`}
                  className="group flex items-center justify-between gap-2 text-sm hover:text-[var(--color-accent)]"
                >
                  <span>
                    <span className="font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)]">
                      {p.name}
                    </span>
                    <br />
                    <span className="text-xs text-[var(--color-muted-fg)]">{p.affiliation}</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {papers.length > 0 && (
        <Section title="Key papers">
          <ul className="space-y-3">
            {papers.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block text-sm hover:text-[var(--color-accent)]"
                >
                  <div className="font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)] leading-snug">
                    {p.title}
                  </div>
                  <div className="text-xs text-[var(--color-muted-fg)] mt-0.5">
                    {p.authors} · {p.year}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hf.length > 0 && (
        <Section title="Hugging Face">
          <ul className="space-y-1">
            {hf.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-8 -mx-1 px-1 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 text-[var(--color-muted-fg)] hover:text-[var(--color-accent)] hover:bg-[var(--color-muted)]/60 transition-colors"
                >
                  <span className="truncate">{r.title}</span>
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {free.length > 0 && (
        <Section title="Read & watch">
          <ul className="space-y-1">
            {free.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-8 -mx-1 px-1 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 text-[var(--color-muted-fg)] hover:text-[var(--color-accent)] hover:bg-[var(--color-muted)]/60 transition-colors"
                >
                  <span className="truncate">
                    {r.title}
                    {r.source && <span> · {r.source}</span>}
                  </span>
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-soft surface p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}
