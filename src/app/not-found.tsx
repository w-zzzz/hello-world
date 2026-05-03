import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export const metadata = {
  title: "Not found",
  description: "The page you're looking for doesn't exist on MLMap.",
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] grid place-items-center px-6 py-24">
      <div className="text-center max-w-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-part-7)] text-white shadow-lg">
          <Compass className="h-7 w-7" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
          404 · off the map
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-balance">
          That page isn&apos;t in the curriculum.
        </h1>
        <p className="mt-4 text-base text-[var(--color-muted-fg)] text-pretty">
          Maybe you typed a slug that doesn&apos;t exist yet, or followed a stale link.
          Try the map — every topic from linear algebra to JEPA is one click away.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2.5 text-sm font-medium hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            Open the map
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-soft px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
