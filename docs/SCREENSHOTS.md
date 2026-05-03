# Screenshots

`README.md` references four images under `docs/screenshots/`. They aren't checked in — capture them once during demo prep and commit the PNGs alongside this doc.

## Targets

| File | Route | What to capture |
|---|---|---|
| `landing.png` | `/` | Full-bleed hero with the parallax curriculum graph mid-animation. Wait ~2s after load so Lenis settles. |
| `topic.png` | `/learn/03-deep-learning/04-attention` | Topic page scrolled to where the embedded `<Embed viz="attention-heatmap" />` is in view, with the references rail visible on the right. |
| `playground.png` | `/playground/gradient-descent` | Click the "Rosenbrock" surface and "Adam" optimizer, let it run for a moment so the trail is visible. |
| `timeline.png` | `/timeline` | Default zoom level, anchored around 2017 (transformers landmark) so several decades show. |

## How to capture

### Option A — Playwright (preferred, reproducible)

```bash
pnpm dev &                                   # localhost:3000
sleep 5

mkdir -p docs/screenshots
pnpm exec playwright codegen \
  --viewport-size=1440,900 \
  --device "Desktop Chrome" \
  http://localhost:3000
```

Then in the codegen window, `await page.screenshot({ path: "docs/screenshots/<name>.png", fullPage: false })` for each route. Prefer `fullPage: false` so the README cards crop cleanly; viewport `1440x900` matches the README's two-column grid.

### Option B — macOS native

`Cmd+Shift+4`, then `Space`, then click the browser window. Saves to `~/Desktop`. Move into `docs/screenshots/` and rename.

## Conventions

- **Resolution**: 1440×900 logical (2880×1800 retina). The README scales them down — anything smaller than 1280 wide will look soft.
- **Theme**: capture in the dark theme. The light theme is a fallback; the brand identity is dark.
- **Privacy**: there's nothing user-specific to redact (anonymous sessions only), but double-check the dashboard screenshot doesn't leak streak counts that misrepresent the demo.
- **Format**: PNG. Run them through `oxipng -o 4` or `imageoptim` before committing — the README ships with the repo, so file size matters.

## When to refresh

Whenever the visual design lands a non-trivial change: hero animation, color palette, viz registry, dashboard layout. The README's screenshot block is graceful — missing files render as broken images but never break the build.
