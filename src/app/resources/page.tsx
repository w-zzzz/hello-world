import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, FileText, GraduationCap, Library, MonitorPlay, Wrench } from "lucide-react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { RESOURCES } from "../../../content/resources";
import type { ExternalResource } from "@/lib/types";

export const metadata: Metadata = {
  title: "Resources",
  description: "Curated reading lists, courses, blogs, and Hugging Face starting points.",
};

const ICON: Record<ExternalResource["kind"], React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  course: GraduationCap,
  blog: FileText,
  paper: FileText,
  video: MonitorPlay,
  model: Library,
  dataset: Library,
  library: Wrench,
  doc: FileText,
};

export default function ResourcesPage() {
  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            Curated reading
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            Where to go next.
          </h1>
          <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
            The textbooks that compress decades of theory, the free courses
            taught by the people who shaped the field, and the Hugging Face
            checkpoints to start tinkering with this afternoon.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {Object.entries(RESOURCES).map(([cat, items], i) => (
            <ScrollReveal key={cat} delay={i * 0.04}>
              <section className="rounded-3xl border border-soft surface p-6">
                <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                  {cat}
                </h2>
                <ul className="mt-4 space-y-1.5">
                  {items.map((r) => {
                    const Icon = ICON[r.kind];
                    return (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--color-muted)]/50 transition-colors"
                        >
                          <Icon className="h-4 w-4 text-[var(--color-muted-fg)] shrink-0" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">{r.title}</span>
                            {r.source && (
                              <span className="block text-xs text-[var(--color-muted-fg)] truncate">{r.source}</span>
                            )}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </main>
  );
}
