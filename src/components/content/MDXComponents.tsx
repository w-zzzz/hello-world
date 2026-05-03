import * as React from "react";
import Link from "next/link";
import { Callout } from "./Callout";
import { PaperCard } from "./PaperCard";
import { Embed } from "./Embed";
import { Figure } from "./Figure";
import { CodeBlock } from "./CodeBlock";

const headingClasses: Record<string, string> = {
  h1: "scroll-mt-28 mt-16 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-balance",
  h2: "scroll-mt-28 mt-16 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-balance",
  h3: "scroll-mt-28 mt-12 text-2xl font-semibold tracking-tight leading-snug",
  h4: "scroll-mt-28 mt-10 text-xl font-semibold tracking-tight",
};

function Heading({
  level,
  children,
  id,
  ...rest
}: { level: 1 | 2 | 3 | 4 } & React.HTMLAttributes<HTMLHeadingElement>) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={headingClasses[`h${level}`]} {...rest}>
      {children}
    </Tag>
  );
}

export const mdxComponents = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => <Heading level={1} {...p} />,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <Heading level={2} {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <Heading level={3} {...p} />,
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => <Heading level={4} {...p} />,
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mt-5 text-[17px] leading-[1.75] text-[var(--color-fg)] text-pretty" {...props} />
  ),
  a: ({ href = "", children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-accent)] underline-offset-4 hover:underline"
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className="text-[var(--color-accent)] underline-offset-4 hover:underline">
        {children}
      </Link>
    );
  },
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mt-4 ml-6 list-disc marker:text-[var(--color-muted-fg)] space-y-2 text-[17px] leading-relaxed" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mt-4 ml-6 list-decimal marker:text-[var(--color-muted-fg)] space-y-2 text-[17px] leading-relaxed" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="pl-1" {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mt-6 border-l-2 border-[var(--color-accent)] pl-5 italic text-[var(--color-muted-fg)]" {...props} />
  ),
  hr: () => <hr className="my-12 border-soft" />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-[var(--color-fg)]" {...props} />,
  em: (props: React.HTMLAttributes<HTMLElement>) => <em className="italic text-[var(--color-fg)]" {...props} />,
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded-md bg-[var(--color-muted)] px-1.5 py-0.5 text-[0.92em] font-mono text-[var(--color-fg)]"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => <CodeBlock {...props} />,
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-soft surface">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left px-4 py-3 border-b border-soft font-semibold text-[var(--color-muted-fg)]" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 border-b border-soft last:border-0" {...props} />
  ),
  Callout,
  PaperCard,
  Embed,
  Figure,
};
