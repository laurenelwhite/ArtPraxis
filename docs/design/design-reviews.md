## 2026-07-23 — Logo system enforcement

Approved

- Vertical scrolling lesson
- Side-by-side comparison as default
- Compact Atelier Ribbon
- Logo system per approved package image
- Editorial spacing
- Larger artwork
- Preparing Next Demonstration as studio note
- Centralized `ArtPraxisLogo` + `ArtPraxisLoadingMark`
- Size presets only (no arbitrary logo sizing)

Rejected

- Dashboard-style progress bars
- Full-page stage checklist
- Lock icons
- Thumbnail stage navigation
- LMS appearance
- Busy header
- Scaling the primary logo for UI use
- Inline SVG approximations treated as final art
- Navbar treatments that shrink the brush into a decorative underline
- Generic spinners as the primary brand expression during loading
- Using the package screenshot as a live UI image
- Redrawing / tracing / recoloring logo artwork in code

## Approved Logo System

- **Visual source of truth:** `docs/references/branding/logo/artpraxis-approved-logo-package.png.png`
- **Implementation source of truth:** `ArtPraxisLogo` / `ArtPraxisLoadingMark`
- Production artwork must come from approved exported assets
- Do not redraw or reinterpret the logo
- Do not use the package screenshot directly in the live navbar
- Do not arbitrarily resize or recolor logo artwork

### Production exports still needed

- Primary lockup (wordmark + textured stroke + realistic brush + tagline treatment)
- Navigation lockup (dedicated compact, ~36–48px)
- Inverse lockups
- Icon / favicon: serif A + short stroke + brush
- Loading mark: brush painting blue watercolor/ink from the tip
