/**
 * Visually hidden link that becomes visible on keyboard focus and jumps to
 * the main landmark. Renders as the first focusable element so users of
 * assistive tech can bypass the navigation chrome.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="
        sr-only focus-visible:not-sr-only
        focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[100]
        focus-visible:rounded-full focus-visible:bg-[var(--color-fg)] focus-visible:text-[var(--color-bg)]
        focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium
        focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
      "
    >
      Skip to main content
    </a>
  );
}
