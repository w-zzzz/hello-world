# Summary

<!-- One or two sentences describing the change and why it's needed. -->

## Milestone

<!-- Check the milestone this PR targets. -->

- [ ] M0 — Bootstrap
- [ ] M1
- [ ] M2 — Parity
- [ ] M3
- [ ] M4
- [ ] M5 — Sandbox
- [ ] M6
- [ ] M7
- [ ] M8
- [ ] M9
- [ ] M10
- [ ] M11
- [ ] M12 — Preview + Deploy
- [ ] Other / cross-cutting

## Changes

<!-- Bulleted list of the concrete changes in this PR. -->

-
-

## Verification

<!-- How can a reviewer verify this locally? Commands, URLs, fixtures, etc. -->

```
# example: pnpm test && uv run pytest -q
```

## Risk / blast radius

<!-- Pick one. Explain briefly. -->

- [ ] Low — isolated change, easy to revert
- [ ] Medium — touches shared module or public API
- [ ] High — schema/migration, infra, security boundary, or sandbox

## Screenshots

<!-- For UI changes. Remove section if N/A. -->

## Checklist

- [ ] Biome clean (`pnpm exec biome ci .`)
- [ ] Ruff clean (`uv run ruff check . && uv run ruff format --check .`)
- [ ] Tests pass (`pnpm test`, `uv run pytest -q`)
- [ ] Types pass (`pnpm exec tsc -b --noEmit`, `uv run mypy ...`)
- [ ] Docs updated (README / inline / ADR as appropriate)

---

Plan: [docs/PLAN.md](../docs/PLAN.md)
