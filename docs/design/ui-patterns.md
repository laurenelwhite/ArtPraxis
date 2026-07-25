# UI Patterns

## Purpose

Canonical UI patterns for studio chrome, generation waits, and regeneration — so implementation does not invent one-off layouts.

## Related Documents

- [Component Principles](./component-principles.md)
- [Brand Bible](../brand/Brand%20Bible.md)
- [Logo Standards](../brand/Logo%20Standards.md)
- [DESIGN_REVIEW_CHECKLIST](../DESIGN_REVIEW_CHECKLIST.md)
- [Decision Log](../DECISION_LOG.md)

## Last Reviewed

2026-07-23

---

## Studio sidebar brand

```tsx
<Link className="studio-brand" href="/studio">
  <ArtPraxisLogo variant="sidebar" priority decorative />
</Link>
```

- Dedicated SVG: `public/brand/artpraxis-logo-sidebar.svg`
- Width-driven: `min(100%, 198px)`, `height: auto`, `object-fit: contain`, `overflow: visible`
- Collapsed / narrow: `variant="icon"` mark only
- Never scale primary or navigation lockups into the sidebar

## Homepage brand

- First viewport includes a hero-level primary lockup (`variant="primary"`), not only masthead navigation.
- Do not overlay logos on demo media (floating badges).

## Master / lesson loading

`LessonLoadingView` — desktop grid `minmax(420px,1.15fr) minmax(320px,.85fr)`, max-width ~1180px (aligned with `.lesson-experience--generating`).

Hierarchy (no duplicates, no decorative italics):

1. Eyebrow (sans, caps) — Creating your lesson  
2. Heading (serif) — Painting your finished inspiration  
3. Body (sans, ≥1rem / 1.0625rem preferred)  
4. Estimate — Usually takes about 1–2 minutes.  
5. Vertical pipeline checklist (pending → active → complete)  
6. Rotating Studio Tip card (~9s, stable `min-height`)  
7. Reassure — You can safely keep this tab open…

Pipeline steps (presentation-only timing during master wait):

- Studying composition  
- Creating master painting  
- Building your painting steps  
- Preparing your studio  

Prefer customer wording **painting steps** over internal “lesson stages.”

Active step uses ultramarine accent; charcoal for complete; muted for pending. Faint watercolor paper texture behind the list. CSS/SVG motion only — **no brush GIFs, Lottie, percentages, or spinners**. Respect `prefers-reduced-motion`.

## Buttons (decision points)

- One primary (`primary btn-branded`) per local decision  
- Secondary actions use `secondary` (not `tertiary` for the same family)  
- Master review: Accept = primary; Try another = secondary  
- Ready toolbar: Try another painting = secondary; avoid “Regenerate / Regenerating…” tech wording  

## Project tabs during generation

Until `resolveLessonUiState(...).state === "ready"`:

- Overview + Lesson remain available  
- Reference / Materials / Notes / Progress are `disabled` + `aria-disabled`  

## Regeneration

- Keep the accepted Final Painting and lesson fully usable (non-blocking)
- Explicit machine: `idle | queued | generating | validating | candidateReady | applying | error`
- Status attaches to the Final Painting dock / frame — not a distant disabled toolbar box
- Checklist phases (indeterminate, no fake %): Studying → Creating → Checking → Preparing
- Waiting copy: “This can take a few minutes.”; elapsed after ~15s
- Atelier: generate candidate only; stages refresh **after** Use new painting
- Candidate UI: Current vs New option → Use new painting / Keep current / Try another
- Disable actions immediately (sync lock + regenerationState + lease)
- Review overlay uses the same compact status; prior candidate stays visible
- On failure, accepted painting and lesson are unchanged
- Log: `regeneration.*` timing keys + `master_regeneration_*` events

## Typography (instructional)

- Body / instructional: minimum `1rem` (16px) on mobile; prefer `1.0625rem–1.125rem`  
- Measure ~55–72ch for editorial copy; narrower in side panels  
- Use `--ink` / `--ink-2` — avoid hard-coded charcoal hexes  
