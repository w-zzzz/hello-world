import Link from "next/link";
import { PARTS, topicsInPart } from "../../../content/curriculum";

/**
 * Screen-reader-only flat list of every part and topic. The interactive SVG
 * curriculum graph isn't keyboard-traversable, so this gives AT users (and
 * `<noscript>` clients) an equivalent navigable sitemap. Visually hidden via
 * `sr-only` so it doesn't disturb sighted layout.
 */
export function SitemapFallback() {
  return (
    <nav aria-label="Curriculum sitemap" className="sr-only">
      <h2>Curriculum sitemap</h2>
      <ol>
        {PARTS.map((p) => (
          <li key={p.slug}>
            <span>
              Part {p.index}: {p.title}
            </span>
            <ol>
              {topicsInPart(p.slug).map((t) => (
                <li key={t.slug}>
                  <Link href={`/learn/${t.slug}`}>{t.title}</Link>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}
