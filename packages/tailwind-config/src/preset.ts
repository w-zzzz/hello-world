/**
 * Tailwind v4 uses CSS-first configuration via `@theme` blocks in the
 * consumer's CSS entry (see `apps/web/app/globals.css`). This package
 * exists as the convention point for cross-package design-token sharing
 * and future plugin additions (e.g. typography, container queries).
 *
 * For now, this preset is intentionally empty — downstream packages
 * import the OKLCH tokens via `@import '@quant-academy/ui/styles'` and
 * the `@theme` block defined in the app shell.
 */
export const preset = {} as const

export default preset
