# ArtPraxis brand assets

## Sources of truth

| Layer | Location |
|-------|----------|
| **Visual** | `docs/brand/artpraxis-brand-kit-final.png` |
| **Implementation** | `ArtPraxisLogo`, `ArtPraxisLoadingMark` in `src/components/brand/` |
| **Production artwork** | Exported SVG/PNG lockups placed in this folder |

Do **not** redraw, reinterpret, or trace the package screenshot for live UI.
Do **not** use the package PNG directly in the navbar.
Do **not** arbitrarily resize or recolor logo artwork.

## Files

| File | Role | Component variant | Status vs approved package |
|------|------|-------------------|----------------------------|
| `artpraxis-logo-primary-approved.png` | Approved primary lockup master | archival source | **Approved** — preserve unchanged |
| `artpraxis-logo-primary-trimmed.png` | Marketing and landing hero primary lockup | `primary` | **Approved production asset** — transparent crop of master |
| `artpraxis-logo-full.svg` | Legacy primary placeholder | — | Inactive; retained for history only |
| `artpraxis-logo-navigation-approved.png` | Approved navigation lockup master | archival source | **Approved** — preserve unchanged |
| `artpraxis-logo-navigation-trimmed.png` | Landing, app top-bar, and footer navigation lockup | `navigation` | **Approved production asset** — transparent crop of master |
| `artpraxis-logo-navigation.svg` | Legacy navigation placeholder | — | Inactive; retained for history only |
| `artpraxis-logo-compact.svg` | Legacy compact placeholder | — | Inactive; do not use for chrome |
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

1. Sidebar lockup (stacked wordmark ~28–32px + short stroke + full brush; ~190–205px wide)
2. Inverse navigation / primary
3. Icon / favicon mark: serif **A** + short stroke + brush tip connected
