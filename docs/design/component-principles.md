# Cards

## Purpose

Component-level UI rules for ArtPraxis surfaces (cards, logos, anti-patterns).

## Related Documents

- [ArtPraxis Principles](../Product/ArtPraxis%20Principles.md)
- [Atelier Design Manifesto](./atelier-design-manifesto.md.txt)
- [Logo Standards](../brand/Logo%20Standards.md)
- [Design Review Checklist](../DESIGN_REVIEW_CHECKLIST.md)

## Depends On

[ArtPraxis Principles](../Product/ArtPraxis%20Principles.md)

## Used By

Frontend UI work.

## Last Reviewed

2026-07-24

## Future Improvements

Split logo section into Brand-only doc once Brand Bible is complete; keep anti-patterns here. See also [Component Architecture Improvements](../COMPONENT_ARCHITECTURE.md).

---

Cards should feel like paper.

Never look clickable unless they are.

Max border opacity: 8%

Corner radius: 18px

Shadow:
0 8px 32px rgba(22,27,34,.04)

## Approved Logo System

- **Visual source of truth:** `docs/references/branding/logo/artpraxis-approved-logo-package.png.png`
- **Implementation source of truth:** `ArtPraxisLogo`, `ArtPraxisLoadingMark` in `src/components/brand/`
- **Production artwork** must come from approved exported assets in `public/brand/`
- Do **not** redraw or reinterpret the logo
- Do **not** use the package screenshot directly in the live navbar
- Do **not** arbitrarily resize or recolor logo artwork

Variants:

- Primary: serif wordmark + realistic brown brush + navy stroke (+ tagline in large brand moments)
- Navigation: dedicated compact lockup for horizontal chrome (same system, no tagline)
- Sidebar: dedicated stacked lockup (`artpraxis-logo-sidebar.svg`) — wordmark ~30px, short stroke, full brush; never scale primary/compact into the narrow sidebar
- App icon / favicon / collapsed sidebar: serif **A** + short stroke + brush
- Inverse: ivory lockup on navy
- Generation waits: pipeline checklist + Studio Tip (not a brush loading mark)

Sidebar brand wrappers must use `object-fit: contain`, `overflow: visible`, and width-driven sizing (`min(100%, 198px)`, `height: auto`). Never clip the brush.

Use only:

- `<ArtPraxisLogo variant="primary" />`
- `<ArtPraxisLogo variant="navigation" />`
- `<ArtPraxisLogo variant="sidebar" />`
- `<ArtPraxisLogo variant="icon" />`
- `<ArtPraxisLogo variant="inverse" />`
- `<ArtPraxisLoadingMark label="…" />` — secondary text status only

Size presets only: `primary`, `navigationDesktop`, `navigationMobile`, `sidebar`, `splash`, `icon`, `favicon`.

Current SVGs in `public/brand/` are temporary approximations until final exports replace them.

## Things We No Longer Do

❌ Full-width dashboard progress bars

❌ Lock icons for lesson stages

❌ More than one progress indicator on screen

❌ Bright colored status chips

❌ Technical wording ("Generating", "Processing", "Rendering")

❌ Multiple competing navigation systems

❌ Cards with heavy borders

❌ Dense grids for educational content

❌ Tiny thumbnails used for navigation

❌ Empty placeholder boxes

❌ Hardcoded “ArtPraxis” text as a faux logo

❌ Inline SVG / emoji / generic brush icons as brand marks

❌ CSS underlines pretending to be the logo stroke

❌ Scaling the primary logo for navbar use

❌ Treating approximation SVGs as approved merely because they compile

❌ BrushStroke / BrushProgress / PaintedCheckmark / ArtworkBrandAccent (use ArtPraxisLogo / ArtPraxisLoadingMark)

❌ LearningCard / learning-note (use GuideNoteCard / studio-guide-card)

## Preferred Patterns

✓ Artwork is always the largest visual element

✓ Progress is subtle and collapsible

✓ One primary action per screen

✓ Soft paper cards

✓ Editorial typography

✓ Gentle motion

✓ Large images

✓ Calm spacing

✓ Natural language from an instructor

✓ Progressive disclosure

✓ Brand moments use approved logo components + exported assets only
