# Logo Standards

## Purpose

Define when and how to use ArtPraxis logo variants. Visual fidelity comes from the approved package and exported assets — not from redesigns in code.

## Related Documents

- [Approved logo package](../references/branding/logo/artpraxis-approved-logo-package.png.png)
- [ASSET_AUDIT](../references/branding/logo/ASSET_AUDIT.md)
- [public/brand/README](../../public/brand/README.md)
- [Component Principles](../design/component-principles.md)
- [Decision Log — Logo system](../DECISION_LOG.md)

## Depends On

Approved package image; runtime components `ArtPraxisLogo`, `ArtPraxisLoadingMark`

## Used By

All branded surfaces.

## Last Reviewed

2026-07-23

## Future Improvements

Replace approximation SVGs with final exports; fill construction diagrams from `logo construction/`.

---

## Variants

| Variant | Use |
|---------|-----|
| Primary | Marketing, splash, large brand moments |
| Navigation | Top nav / horizontal chrome only (dedicated compact lockup) |
| Sidebar | Studio desktop sidebar — stacked wordmark + short stroke + full brush (~190–205px) |
| Icon / favicon | Serif A + short stroke + brush tip; also collapsed/narrow sidebar |
| Inverse | Ivory on navy grounds |

Generation waits use a pipeline checklist (see [UI Patterns](../design/ui-patterns.md)) — not a brush loading animation.

## Rules

- Never scale primary for navbar.  
- Never squeeze the horizontal navigation lockup into the narrow studio sidebar — use `sidebar` (or `icon` when collapsed).  
- Never improvise SVG/emoji logos.  
- Never recolor core logo outside navy / brush brown / blue paint system.  
- Never use the package screenshot in live UI.  
- Size presets only: primary, navigationDesktop, navigationMobile, sidebar, splash, icon, favicon.  
- Sidebar uses `variant="sidebar"` with dedicated `artpraxis-logo-sidebar.svg` (width-driven, `object-fit: contain`, no height clamp). Optional `priority` for above-the-fold eager load.  

Implementation: see `src/components/brand/` and `public/brand/README.md`.
