# ArtPraxis brand assets

## Sources of truth

| Layer | Location |
|-------|----------|
| **Visual** | `docs/references/branding/logo/artpraxis-approved-logo-package.png.png` |
| **Implementation** | `ArtPraxisLogo`, `ArtPraxisLoadingMark` in `src/components/brand/` |
| **Production artwork** | Exported SVG/PNG lockups placed in this folder |

Do **not** redraw, reinterpret, or trace the package screenshot for live UI.
Do **not** use the package PNG directly in the navbar.
Do **not** arbitrarily resize or recolor logo artwork.

## Files

| File | Role | Component variant | Status vs approved package |
|------|------|-------------------|----------------------------|
| `artpraxis-logo-full.svg` | Primary — marketing, splash | `primary` | **Approximation** — awaiting final export |
| `artpraxis-logo-navigation.svg` | **Lesson / app top-bar navigation lockup** | `navigation` | **Slot for approved export** — seeded from compact; see `APPROVED_NAV_LOGO.md` |
| `artpraxis-logo-compact.svg` | Legacy compact alias (same approximation family) | — | Prefer `artpraxis-logo-navigation.svg` for chrome |
| `artpraxis-logo-sidebar.svg` | Studio sidebar stacked lockup | `sidebar` | **Approximation** — wordmark + short stroke + full brush |
| `artpraxis-logo-inverse.svg` | Ivory lockup on navy grounds | `inverse` | **Approximation** — awaiting final export |
| `artpraxis-mark.svg` | App icon / favicon / collapsed sidebar | `icon` | **Approximation** — serif **A** + short stroke + brush tip |
| `brush-stroke-navy.svg` | Secondary stroke motif | `BrushStroke` | Temporary |
| `brush-reveal.svg` | Brush detail | `PaintbrushMark` | Temporary |

## Rules

- Never scale the primary logo down for navigation.
- Never invent inline SVG / emoji / generic icon substitutes.
- Never stretch or crop — `width: auto`, `object-fit: contain`, height from size presets only.
- Never squeeze `artpraxis-logo-compact.svg` into the studio sidebar — use `artpraxis-logo-sidebar.svg` (or the mark when collapsed).
- Generation waits use a pipeline checklist + studio tips — **not** animated brush GIFs or loading-mark paint reveals.
- Approved size presets: `primary`, `navigationDesktop`, `navigationMobile`, `sidebar`, `splash`, `icon`, `favicon`.

## Production exports still needed

Replace the approximation SVGs with designer-exported assets that match the approved package:

1. Primary lockup (wordmark + textured navy stroke + realistic brush tip on stroke + optional tagline treatment)
2. Navigation lockup (same system, no tagline, balanced for ~36–48px height)
3. Sidebar lockup (stacked wordmark ~28–32px + short stroke + full brush; ~190–205px wide)
4. Inverse navigation / primary
5. Icon / favicon mark: serif **A** + short stroke + brush tip connected
