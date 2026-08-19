# ArtPraxis Design System Docs

## Authority

`docs/design/ARTPRAXIS_DESIGN_BIBLE.md` is the authoritative engineering-facing design document for the product UI.

Use it together with:

- `docs/brand/ARTPRAXIS_BRAND_GUIDE.md` for approved brand direction and asset rules
- `docs/DECISION_LOG.md` for approved implementation decisions already landed on the current branch
- `docs/design/TOKEN_MIGRATION_AUDIT.md` for migration order, legacy debt, and compatibility notes

If these sources appear to conflict, preserve the latest explicitly approved implementation and document the reason before changing visuals.

## Token source

Global semantic tokens live in:

- `src/styles/artpraxis-tokens.css`

They are imported once at the application root by:

- `src/app/layout.tsx`

Global consumption and compatibility layers live in:

- `src/app/globals.css`
- `src/app/globals-app-shell.css`

## How to consume tokens

Use semantic tokens, not one-off hex values, ad hoc shadows, or custom radii.

Preferred examples:

- colors: `var(--ap-color-paper-canvas)`, `var(--text-primary)`, `var(--action-primary)`
- typography: `var(--ap-font-display)`, `var(--ap-font-body)`, `var(--text-body)`
- spacing: `var(--ap-space-4)`, `var(--ap-space-8)`
- shape: `var(--r)`, `var(--r-lg)`
- elevation: `var(--shadow-sm)`, `var(--ap-shadow-artwork-frame)`

Where older variables are already widely used, keep using the approved aliases until the migration pass for that area. Do not introduce a second token vocabulary inside components.

## Base classes

The foundation pass provides a small reusable base layer for future migrations:

- `.ap-page`
- `.ap-section`
- `.ap-surface`
- `.ap-surface-elevated`
- `.ap-artwork-frame`
- `.ap-heading-display`
- `.ap-heading-section`
- `.ap-body`
- `.ap-caption`
- `.ap-button-primary`
- `.ap-button-secondary`
- `.ap-button-quiet`
- `.ap-focus-ring`

Existing approved classes such as `.primary`, `.secondary`, `.card`, `.display`, and `.display-sm` remain valid. Prefer semantic `.ap-*` classes for new work, and avoid mass replacing old classes outside an approved migration pass.

## Proposing a token change

1. Confirm the need is systemic, not screen-specific.
2. Check `docs/brand/ARTPRAXIS_BRAND_GUIDE.md`, `docs/design/ARTPRAXIS_DESIGN_BIBLE.md`, and `docs/DECISION_LOG.md`.
3. Update the token centrally in `src/styles/artpraxis-tokens.css`.
4. Record compatibility impacts and any retained aliases in `docs/design/TOKEN_MIGRATION_AUDIT.md`.
5. Review affected screens for visual regressions before capture or merge.

One-off colors, radii, shadows, uppercase CTA treatments, and typography values require explicit justification.

## Reviewing a screen

Use the checklist in `docs/design/ARTPRAXIS_DESIGN_BIBLE.md`.

At minimum confirm:

- the artwork is the primary focus
- there is one dominant next action
- the hierarchy reads within three seconds
- controls are subordinate to the lesson content
- keyboard focus remains visible
- reduced-motion behavior remains usable
- the screen still feels handcrafted rather than software-heavy

## Preserving approved implementation work

Recent approved branch work is evidence, not drift:

- app-shell and lesson chrome
- mobile lesson navigation fixes
- overview/editorial hierarchy
- three-pigment loading treatment

Do not revert those decisions merely to make the code look theoretically cleaner. Centralize them behind semantic tokens and document any remaining legacy aliases instead.

## Screenshot timing

Marketing or regression screenshots should wait until both of the following are true:

1. The relevant screen is approved and visually frozen.
2. The semantic token migration for that screen is complete enough that screenshots will not churn.

Capturing early screenshots creates review noise, locks in transitional UI, and obscures whether a visual difference is intentional or accidental.
