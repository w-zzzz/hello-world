import * as React from "react";

export function Figure({
  caption,
  children,
}: {
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="mt-8 rounded-2xl border border-soft surface p-6">
      <div className="overflow-hidden rounded-xl">{children}</div>
      {caption && (
        <figcaption className="mt-4 text-sm text-[var(--color-muted-fg)] text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
