# Token Migration Audit

## Scope

This audit captures the current visual-token state on `feature/stability-ui-cleanup` after the approved Brand Kit and navigation work already landed.

The goal is to preserve approved rendering, centralize it behind semantic tokens, and identify the safest migration order for later screen-by-screen work.

## Files inspected

- `package.json`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`
- `src/components/AuthPanel.tsx`
- `src/components/shell/AppHeader.tsx`
- `src/components/shell/LessonShell.tsx`
- `src/components/studio/LessonCreator.tsx`
- `src/components/studio/LessonLoadingView.tsx`
- `src/components/studio/LessonExperience.tsx`
- `src/components/studio/LessonView.tsx`
- `src/components/studio/FinalPaintingCandidateCompare.tsx`
- `src/components/studio/FinalPaintingRegenStatus.tsx`
- `src/components/studio-reference/StudioReferencePage.tsx`
- `src/components/studio-reference/StudioReferencePanel.tsx`
- `src/components/studio-reference/StudioReferencePair.tsx`
- `src/components/studio-reference/StudioReferenceViewer.tsx`
- `src/components/studio-reference/LessonReferenceDock.tsx`
- `src/components/project/ProjectOverview.tsx`
- `src/components/project/ProjectMaterials.tsx`
- `src/components/project/StatusPill.tsx`
- `src/components/dashboard/LessonCard.tsx`
- `docs/brand/ARTPRAXIS_BRAND_GUIDE.md`
- `docs/brand/artpraxis-design-tokens.css`
- `docs/brand/artpraxis-design-tokens.json`
- `docs/DECISION_LOG.md`
- `docs/design/component-principles.md`
- `docs/design/design-reviews.md`
- `docs/design/ui-patterns.md`
- `docs/design/atelier-design-manifesto.md.txt`

## Current central token sources

Before this pass, central visual values were split across:

- `src/app/globals.css`
- `src/app/globals-app-shell.css`
- `docs/brand/artpraxis-design-tokens.css`

After this pass, the intended runtime token source is:

- `src/styles/artpraxis-tokens.css`

Compatibility and usage layers remain in:

- `src/app/globals.css`
- `src/app/globals-app-shell.css`

## Approved current values preserved

These values were treated as approved because they are consistent with the locked brand sources and the latest approved implementation on this branch:

- paper family: `#F2ECE3`, `#F8F4ED`, `#FBF8F2`, `#E9E0D4`
- deep indigo / structure: `#2C3E56`
- approved primary hover / pressed: `#223246`, `#192737`
- ultramarine instructional accent: `#415D8C`
- ochre accent: `#DAA35A`
- red earth / warning-warm danger accent: `#A24A3A`
- olive success family: `#69735F`
- primary ink: `#1E1C19`
- secondary ink: `#4F5963`
- warm muted text: `#8A8278`

## Duplicate colors found

- Paper tones are represented in multiple places:
  - `--color-warm-white`
  - `--color-canvas`
  - `--color-canvas-light`
  - `--color-paper-white`
  - `--ap-kit-paper`
  - `--ap-kit-paper-light`
  - inline `rgba(248,243,235,...)` and `rgba(242,236,227,...)`

- Indigo values are duplicated across:
  - `--color-indigo`
  - `--color-atelier-navy`
  - `--brand-navy`
  - `--ap-kit-ink`
  - hard-coded `#2c3e56`

- Ochre and red-earth accents are duplicated across:
  - `--color-yellow-ochre`
  - `--ap-kit-ochre`
  - hard-coded `#daa35a`
  - `--color-red-earth`
  - `--color-venetian-red`
  - `--ap-kit-earth`
  - hard-coded `#a24a3a`

## Conflicting colors found

- The branch uses both paper-base values `#F8F4ED` and `#F8F3EB`.
  - Decision: preserve both for now because `#F8F3EB` appears inside the approved current app-shell treatment and changing it risks visual churn.

- The branch uses both `#FBF8F2` and `#F2ECE3` for light paper surfaces.
  - Decision: treat them as separate semantic paper elevations rather than collapsing them prematurely.

- Lesson and app-shell borders use several alpha variants of indigo:
  - `rgba(44,62,86,.12)`
  - `rgba(44,62,86,.14)`
  - `rgba(44,62,86,.15)`
  - `rgba(44,62,86,.16)`
  - `rgba(44,62,86,.17)`
  - `rgba(44,62,86,.18)`
  - `rgba(44,62,86,.22)`

- Older gray-black overlays also appear:
  - `rgba(13,27,42,...)`
  - `rgba(23,23,23,...)`

These should migrate toward semantic border, overlay, and frame tokens in later passes rather than being normalized blindly now.

## Duplicated spacing values

Repeated spacing values found across the global styles:

- `4px`
- `8px`
- `12px`
- `16px`
- `20px`
- `24px`
- `32px`
- `40px`
- `48px`
- `64px`

Additional repeated layout values:

- control min heights around `38px`, `40px`, `42px`, `48px`, `58px`
- app header heights `56px`, `60px`, `72px`
- page paddings using `clamp(20px,4.5vw,72px)` and related variations

## Duplicated radii

Repeated radii found:

- `3px`
- `4px`
- `5px`
- `6px`
- `7px`
- `8px`
- `10px`
- `14px`
- `999px`
- custom organic blob radii in the loading motif

High-risk migration items:

- `var(--r-pill)` is widely used in chips, tabs, and compact controls
- approved current branch app-shell controls intentionally use `5px`
- artwork frames intentionally use `3px`

## Duplicated shadows

Repeated shadow patterns found:

- `var(--shadow-sm)`
- `var(--shadow-md)`
- `var(--shadow-lg)`
- `0 5px 18px rgba(44,62,86,.035)` in app header
- `0 18px 50px rgba(44,62,86,.10)` in artwork framing and loading surfaces
- inset accent underline shadows such as `inset 0 -3px 0 var(--ap-kit-ochre)`

## Typography inconsistencies

- Runtime font families are approved (`Fraunces`, `Source Sans 3`) but documentation still contains older references and legacy wording.
- Serif and sans usage is mostly coherent, but class naming is mixed across `.display`, `.dashboard-title`, `.lesson-shell-title`, `.overview-summary`, and other bespoke typography classes.
- Letter spacing values vary across metadata labels: `.08em`, `.1em`, `.12em`, `.14em`, `.16em`, `.18em`, `.19em`, `.24em`.

## Uppercase CTA occurrences

No forced uppercase was found on the primary CTA classes themselves.

Uppercase remains common in labels and metadata in `src/app/globals.css`, including:

- `.eyebrow`
- `.quote-label`
- `.field-label`
- `.material-section-title`
- `.stage-focus-label`
- `.stage-checkpoint-heading`
- `.stage-mistake-heading`

These are informational labels, not direct CTA labels, but they should still be reviewed for restraint during future migrations.

## Existing approved semantic classes

Existing reusable classes that already function as de facto semantic foundations:

- `.primary`
- `.secondary`
- `.btn-solid`
- `.btn-ghost`
- `.card`
- `.status`
- `.status-pill`
- `.display`
- `.display-sm`
- `.lesson-shell`
- `.app-header-*`
- `.creator-*`
- `.studio-ref-*`
- `.artwork-frame`

New foundation classes added in this pass:

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

## Legacy variables retained as aliases

The following variable families remain as compatibility aliases and should not be removed until their migration areas are complete:

- `--brand-*`
- `--color-*`
- `--ap-color-*` legacy aliases already present in `globals.css`
- `--bg`, `--paper`, `--paper-2`, `--ink`, `--ink-2`
- `--r*`
- `--shadow-*`
- `--space-*`
- `--ap-kit-*`

## Files with the highest remaining inconsistency

1. `src/app/globals.css`
   - holds token history, base styles, component styles, and many remaining hard-coded values
2. `src/app/globals-app-shell.css`
   - contains approved current branch treatments plus many inline rgba variants
3. `src/components/studio/LessonCreator.tsx`
   - large class surface area with multiple creator-specific patterns
4. `src/components/studio-reference/StudioReferenceViewer.tsx`
   - dense studio-reference class family likely to benefit from future semantic surface and artwork-frame reuse
5. `src/components/project/ProjectOverview.tsx`
   - overview is visually central and already partly normalized by the approved branch work

## Recent approved changes that must be preserved

The following recent approved branch work should be treated as settled evidence:

- `1244f4c` `Polish branded overview and mobile header`
- `75d9763` `Polish mobile lesson navigation`
- `ad1fd4c` `Fix mobile lesson tab overflow`
- `1dbcd6a` `Bring core lesson surfaces into approved brand system`
- `01bec97` `Document approved Brand Kit application decision`

Affected files:

- `src/app/globals-app-shell.css`
- `src/components/studio/LessonLoadingView.tsx`
- `docs/DECISION_LOG.md`

## Recommended migration order

1. Global application shell
   - `src/app/globals.css`
   - `src/app/globals-app-shell.css`
   - `src/app/layout.tsx`
   - `src/components/shell/AppHeader.tsx`

2. Authentication
   - `src/components/AuthPanel.tsx`
   - related auth styles in `src/app/globals.css`

3. Create Lesson intake
   - `src/components/studio/LessonCreator.tsx`
   - creator styles in `src/app/globals.css`

4. Loading and generation states
   - `src/components/studio/LessonLoadingView.tsx`
   - `src/components/studio/LessonExperience.tsx`
   - loading styles in `src/app/globals-app-shell.css`
   - `src/components/ui/ArtPraxisDotLoader.tsx`

5. Lesson Overview
   - `src/components/project/ProjectOverview.tsx`
   - overview styles in `src/app/globals.css`
   - overview/app-shell overrides in `src/app/globals-app-shell.css`

6. Lesson navigation
   - `src/components/shell/LessonShell.tsx`
   - `src/components/progression/StageScrollNav.tsx`
   - `src/components/progression/StageContinueNav.tsx`
   - `src/app/globals-app-shell.css`

7. Study Mode
   - `src/components/progression/StudyMode.tsx`
   - `src/components/progression/StageGuideColumn.tsx`
   - `src/components/progression/GuideNoteCard.tsx`
   - study-mode styles in `src/app/globals.css`

8. Paint Mode
   - `src/components/progression/StageComparison.tsx`
   - `src/components/progression/StageCompletion.tsx`
   - paint-mode styles in `src/app/globals.css`

9. Studio Reference
   - `src/components/studio-reference/StudioReferencePage.tsx`
   - `src/components/studio-reference/StudioReferencePanel.tsx`
   - `src/components/studio-reference/StudioReferencePair.tsx`
   - `src/components/studio-reference/StudioReferenceViewer.tsx`
   - `src/components/studio-reference/LessonReferenceDock.tsx`

10. Materials
   - `src/components/project/ProjectMaterials.tsx`
   - materials styles in `src/app/globals.css`

11. Notes
   - `src/components/progression/StageInstructorNote.tsx`
   - `src/components/progression/GuideNoteCard.tsx`
   - note and terminology styles in `src/app/globals.css`

12. Progress
   - `src/components/project/StatusPill.tsx`
   - `src/components/progression/LessonSummaryGrid.tsx`
   - `src/components/studio/FinalPaintingRegenStatus.tsx`
   - `src/components/studio/FinalPaintingCandidateCompare.tsx`

13. Empty, error, and completion states
   - `src/components/project/ProjectPlaceholder.tsx`
   - `src/components/studio/ComingSoon.tsx`
   - `src/components/progression/StageCompletion.tsx`
   - `src/components/dashboard/LeadProject.tsx`

14. Mobile and tablet polish
   - responsive sections in `src/app/globals.css`
   - responsive sections in `src/app/globals-app-shell.css`
   - mobile header and tab flows already approved on this branch

15. Marketing screenshot capture
   - capture only after the above migrations are approved and frozen

## Migration guidance

- Prefer aliasing when a variable is already widely used and approved.
- Prefer semantic classes for new work.
- Avoid mass search-and-replace of hard-coded values without checking rendered context.
- Keep changes grouped by screen or workflow, not by abstract token category alone.

## Completed: Global application shell

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/app/globals-app-shell.css`
- `src/app/globals.css`
- `src/components/shell/AppHeader.tsx`
- `src/components/Icon.tsx`

### Tokens introduced or reused

Reused:

- `--ap-layout-app-max`
- `--ap-layout-lesson-max`
- `--ap-shadow-dialog`
- `--ap-shadow-artwork-frame`
- `--ap-color-paper-canvas`
- `--ap-color-paper-elevated`
- `--ap-color-focus-ring`
- `--ap-shell-divider`

Introduced for the shell:

- `--ap-shell-background`
- `--ap-shell-header-background`
- `--ap-shell-header-border`
- `--ap-shell-header-shadow`
- `--ap-shell-header-height`
- `--ap-shell-header-height-mobile`
- `--ap-shell-z-header`
- `--ap-shell-z-overlay`
- `--ap-shell-z-menu`
- `--ap-shell-nav-gap`
- `--ap-shell-logo-height`
- `--ap-shell-logo-height-mobile`
- `--ap-shell-page-padding-inline`
- `--ap-shell-page-padding-inline-tablet`
- `--ap-shell-page-padding-inline-mobile`
- `--ap-shell-nav-text`
- `--ap-shell-nav-text-muted`
- `--ap-shell-nav-text-secondary`
- `--ap-shell-nav-active-text`
- `--ap-shell-nav-hover-background`
- `--ap-shell-nav-active-underline`
- `--ap-shell-overlay-background`
- `--ap-shell-menu-background`
- `--ap-shell-menu-shadow`
- `--ap-shell-menu-width`
- `--ap-shell-content-top-offset`

### Legacy values removed

- Duplicate root-level app-shell token declarations in `src/app/globals-app-shell.css`
- Legacy shell overrides in `src/app/globals.css` for:
  - `.app-shell`
  - `.app-main--lesson`
  - `.lesson-shell` max-width reset
  - `.app-header` background and border overrides
  - `.app-header-*` typography/color/button overrides
- Duplicate `56px` mobile header-height override

### Values intentionally retained

- The textured paper background SVG and its warm overlay remain inline in CSS because they are approved presentation details, not generic tokens.
- Several branded lesson-surface rgba values remain in `src/app/globals-app-shell.css` because they belong to approved lesson-content treatments rather than the neutral global shell.
- `overflow-x:hidden` remains on `.app-main` as a narrow shell safeguard while lesson tabs and wide artwork containers continue to rely on horizontal scroll behavior elsewhere.
- The legacy inactive `.studio-topbar*` rules remain in `src/app/globals.css` because they are not mounted by the active shell and removing them was outside this pass.

### Responsive behavior preserved

- Desktop and laptop headers still keep the approved centered navigation and restrained branded CTA treatment.
- Tablet widths retain the approved non-crowded inline navigation until the mobile cutoff.
- At `760px` and below, the shell now transitions cleanly to a menu button and paper menu panel instead of squeezing the inline header.
- Very narrow mobile keeps the logo legible and hides the menu button label before collision.
- Existing lesson tab overflow fixes and mobile lesson navigation behavior were preserved.

### Accessibility improvements made

- Added a mobile menu trigger with an accessible label and `aria-expanded`
- Added `aria-controls` wiring between the trigger and menu container
- Preserved `aria-current="page"` on active navigation links
- Kept one header landmark and one primary navigation landmark
- Ensured decorative icons remain `aria-hidden`
- Raised mobile shell controls to ~44px targets
- Added Escape and backdrop closing for the mobile menu
- Closed the menu on navigation and on resize back to desktop widths
- Added shell scroll-padding for sticky-header-aware in-page scrolling

### Unresolved shell inconsistencies

- The app shell still depends on some approved inline rgba values for menu surfaces and branded lesson framing instead of a completely exhaustive shell-token matrix.
- `src/app/globals.css` still contains inert legacy shell CSS (`.studio-topbar*`) that should eventually be deleted after confirming no hidden dependency remains.
- The textured shell paper treatment is still authored inline rather than abstracted into a reusable physical-surface pattern system.

### Exact next migration target

Authentication is the safest next migration target.

Relevant files:

- `src/components/AuthPanel.tsx`
- auth-related form and card rules in `src/app/globals.css`

Reason:

Authentication already relies on global card, form, and button primitives, so it can adopt the semantic token layer cleanly without touching lesson-generation or studio-reference behavior.

## Completed: Authentication

### Files inspected

- `src/components/AuthPanel.tsx`
- `src/components/shell/AppShell.tsx`
- `src/components/brand/ArtPraxisLogo.tsx`
- `src/lib/firebase.ts` (read-only)
- `src/lib/auth-errors.ts` (read-only)
- `src/providers/AuthProvider.tsx` (read-only)
- `src/app/globals.css` (auth section)
- `src/app/globals-app-shell.css` (no auth-specific rules)
- `src/styles/artpraxis-tokens.css`
- `src/app/layout.tsx` (read-only)

### Files migrated

- `src/components/AuthPanel.tsx`
- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css`

### Tokens introduced or reused

Reused:

- `--ap-color-paper-elevated`
- `--ap-color-paper-muted`
- `--ap-color-border-subtle`
- `--ap-color-border-standard`
- `--ap-color-focus-ring`
- `--ap-color-danger`
- `--color-atelier-navy`
- `--color-venetian-red-soft`
- `--ap-radius-control`
- `--ap-text-heading-lg`
- `--ap-text-ui`
- `--ap-text-small`
- `--ap-text-caption`
- `--ap-reading-width`
- `--ap-space-*` scale
- `.ap-surface`
- `.ap-button-primary`
- `.ap-button-secondary`
- `.ap-button-quiet`

Introduced for authentication:

- `--ap-auth-panel-width`
- `--ap-auth-panel-padding`
- `--ap-auth-panel-padding-mobile`
- `--ap-auth-panel-offset-top`
- `--ap-auth-field-height`
- `--ap-auth-field-background`
- `--ap-auth-field-border`
- `--ap-auth-field-border-hover`
- `--ap-auth-field-border-focus`
- `--ap-auth-field-shadow-focus`
- `--ap-auth-error-background`
- `--ap-auth-error-border`
- `--ap-auth-error-text`
- `--ap-auth-divider`
- `--ap-auth-provider-background`
- `--ap-auth-provider-border`
- `--ap-auth-provider-hover`

### Hard-coded values removed

- `.auth` max-width `430px` → `--ap-auth-panel-width`
- `.auth` padding `34px` → `--ap-auth-panel-padding`
- `.auth` top margin `min(12vh, 90px)` → `--ap-auth-panel-offset-top`
- `.auth h2` font size `1.9rem` → `--ap-text-heading-lg`
- `.auth-brand` margin `18px` → `--ap-space-5`
- Legacy `.auth .form>button:last-child` mode-switch overrides → `.ap-button-quiet.ap-auth-mode-switch`
- Legacy `.card.auth` + `.form` composition → `.ap-auth-panel.ap-surface` + `.ap-auth-form`
- Generic `.status.error` on auth errors → `.ap-auth-error` with auth danger tokens

### Values intentionally retained

- Primary submit keeps `.btn-branded` painted underline treatment for approved CTA continuity.
- Signed-out layout still renders inside `<main className="shell">` from `AppShell.tsx`; no new marketing layout was introduced.
- Global `.form`, `.primary`, `.secondary`, and `.status` rules remain for other screens.
- The fade-up entrance animation now targets `.ap-auth-panel` instead of legacy `.auth`.

### Component and semantic improvements

- Replaced uppercase `.eyebrow` label with calm supporting copy in `.ap-auth-lead`.
- Added explicit auth header block with one associated heading.
- Split fields into `.ap-auth-field` groups with stable `id` / `htmlFor` wiring.
- Preserved email/password `autocomplete` values for password managers.
- Primary submit uses `type="submit"`; Google and mode switch use `type="button"`.
- Google action uses an explicit accessible label.
- Error messaging uses `role="alert"`; message region uses `aria-live="polite"`.
- Form references error text through `aria-describedby` when present.
- Added a restrained “or” divider between email submit and Google provider action.

### Responsive improvements

- Mobile auth panel uses `--ap-auth-panel-padding-mobile` and reduced top/bottom margins.
- Panel width uses `min(var(--ap-auth-panel-width), 100%)` to avoid horizontal overflow.
- Full-width submit, provider, and mode-switch controls remain touch-friendly at 44px minimum height.
- Top offset avoids rigid viewport-height trapping; page remains vertically scrollable.

### Accessibility improvements

- Valid heading hierarchy: brand mark, then `h2` panel heading.
- Visible labels on all fields with programmatic association.
- Focus rings use the shared ultramarine focus treatment.
- Disabled Google state remains announced through button disabled semantics.
- Autofill text remains readable via scoped `-webkit-autofill` treatment.
- Reduced-motion preference disables field transition animation.

### Functional issues observed but intentionally not changed

- `signInWithPopup(auth, googleProvider)` remains unchanged.
- Email auth still has no explicit loading/disabled state during submission; only Google sign-in exposes pending UI.
- `src/lib/firebase.ts` hot-reload fallback returns `getAuth(firebaseApp)` without the custom `browserPopupRedirectResolver`. If that path is hit in development, Google popup sign-in may still surface `auth/argument-error` even though first-load `initializeAuth` is configured correctly.
- Missing or invalid `NEXT_PUBLIC_FIREBASE_*` values can still prevent auth from initializing correctly; this pass did not alter Firebase configuration.

### Unresolved auth inconsistencies

- Signed-out users still see the generic `.shell` wrapper rather than a dedicated auth page layout token; this is acceptable for now because auth is embedded, not a separate marketing route.
- Global late-stage `.primary` color overrides near the end of `globals.css` still affect auth submit styling indirectly through cascade; removing those overrides belongs to a broader button-normalization pass.

### Exact next migration target

Create Lesson intake is the safest next migration target.

Relevant files:

- `src/components/studio/LessonCreator.tsx`
- creator styles in `src/app/globals.css`

Reason:

Lesson intake is the next major signed-in workflow surface after authentication and already has a large, mostly self-contained class family that can adopt the semantic token layer without touching lesson playback or studio-reference behavior.

## Completed: Create Lesson intake

### Files inspected

- `src/components/studio/LessonCreator.tsx`
- `src/app/(app)/studio/new/page.tsx`
- `src/components/ui/AppImage.tsx` (read-only)
- `src/components/Icon.tsx` (read-only)
- `src/components/studio/LessonLoadingView.tsx` (read-only, out of scope)
- `src/lib/lesson-preview.ts` (read-only)
- `src/lib/media.ts` (read-only)
- `src/app/globals.css` (creator section)
- `src/app/globals-app-shell.css` (creator-header / generating surfaces)
- `src/styles/artpraxis-tokens.css`

### Files migrated

- `src/components/studio/LessonCreator.tsx`
- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css`

### Tokens introduced or reused

Reused:

- `--ap-color-paper-elevated`
- `--ap-color-paper-inset`
- `--ap-color-border-subtle`
- `--ap-color-ink-faint`
- `--ap-color-ink-secondary`
- `--ap-color-focus-ring`
- `--ap-color-danger`
- `--color-yellow-ochre`
- `--color-ultramarine`
- `--color-venetian-red-soft`
- `--ap-radius-control`
- `--ap-radius-small`
- `--ap-space-*` scale
- `--ap-text-*` scale
- `--ap-layout-workspace-width`
- `.ap-button-primary`
- `.btn-branded`

Introduced for Create Lesson intake:

- `--ap-creator-max-width`
- `--ap-creator-workspace-min-height`
- `--ap-creator-workspace-height`
- `--ap-creator-workspace-max-height`
- `--ap-creator-workspace-min-height-mobile`
- `--ap-creator-workspace-height-mobile`
- `--ap-creator-workspace-max-height-mobile`
- `--ap-creator-workspace-height-tablet`
- `--ap-creator-workspace-max-height-tablet`
- `--ap-creator-workspace-background`
- `--ap-creator-workspace-border`
- `--ap-creator-workspace-border-hover`
- `--ap-creator-workspace-border-active`
- `--ap-creator-workspace-shadow`
- `--ap-creator-preview-background`
- `--ap-creator-preview-max-height`
- `--ap-creator-preview-max-height-tablet`
- `--ap-creator-preview-max-height-mobile`
- `--ap-creator-control-gap`
- `--ap-creator-section-gap`
- `--ap-creator-config-width`
- `--ap-creator-help-text`
- `--ap-creator-error-background`
- `--ap-creator-error-border`
- `--ap-creator-error-text`

### Hard-coded values removed

- Creator max width `1080px` → `--ap-creator-max-width`
- Empty-frame heights `188/220/240` and mobile `176/188/200` → workspace height tokens
- Preview max heights `min(48vh, 420px)` and responsive variants → preview height tokens
- Hard-coded paper/ink/border rgba values in creator workspace, meta, and plan panels → paper/ink/border tokens
- Generic `.status.error` on creator errors → `.creator-error` with creator danger tokens
- Creator primary action class `.primary` → `.ap-button-primary` (avoids late `.primary !important` conflict within creator scope)

### Values intentionally retained

- Stable empty/filled frame structure (`.creator-upload` + `.creator-frame`)
- `object-fit: contain` on the selected reference preview
- Lesson-plan aside preview content and copy
- Dock/FAB hiding selectors for `.creator--atelier`
- Generating-state wrapper and `LessonLoadingView` presentation (out of scope for this pass)
- Validation limits remain `JPEG/PNG/WebP` and `10 MB`
- Generic legacy `.drop` styles remain for other surfaces

### Stable-frame behavior preserved

- Empty and filled states still share one outer workspace
- Header heading and supporting copy remain fixed while the frame populates
- Configuration and primary action stay in predictable positions below the workspace
- Decoding floor still prevents collapse while the preview loads
- No second-page layout is introduced on image selection

### Image-workspace improvements

- Tokenized paper workspace and inset preview matte
- Clearer accepted-format and size guidance in the empty state
- Drag-active border uses ochre token rather than a hard-coded fallback hex
- Selected preview alt text clarified to “Selected reference preview”
- Change-image control remains quiet and subordinate to Create lesson

### Configuration improvements

- Removed the “New lesson” eyebrow
- Replaced “About this lesson” eyebrow with a calm `Lesson settings` section heading
- Medium and Experience labels remain visible and sentence case
- Experience stays tucked under More options
- Disabled Create lesson state now includes quiet guidance when no image is selected

### Responsive improvements

- Tablet still collapses to one column before crowding
- Mobile workspace heights and preview caps remain restrained via tokens
- Primary action remains full-width and reachable without a fixed footer
- Page remains vertically scrollable; no new `100vh` lock on the intake form

### Accessibility improvements

- Removed uppercase/eyebrow chrome from the intake masthead
- File input keeps a stable id, accessible name, and format/size description
- Dropzone region has an accessible name; native file input remains available
- Configuration wrapped in a form with `type="submit"` Create lesson action
- Errors use `role="alert"` and are referenced from the submit control
- Focus rings use the shared ultramarine treatment
- Reduced-motion rules for creator transitions remain intact

### Functional concerns observed but intentionally not changed

- Upload, drag/drop, validation, Firebase storage, generation request, and navigation handlers were not modified
- API failure still surfaces `result.error` text when present; no new error-mapping layer was introduced
- There is still no dedicated remove-image action; replacement uses Change image only
- Generating/loading presentation remains deferred to the next migration pass
- Global late `.primary !important` rules still exist for other screens; creator now prefers `.ap-button-primary`

### Unresolved creator inconsistencies

- The lesson-plan aside remains a supporting panel rather than a tokenized shared “guidance card” pattern
- Generating-state styles in `globals-app-shell.css` still use approved inline rgba values pending the loading-pass migration
- Global late `.primary !important` rules remain for other screens and should be normalized in a later button-system pass

### Exact next migration target

Loading and generation states are the safest next migration target.

Relevant files:

- `src/components/studio/LessonLoadingView.tsx`
- `src/components/studio/LessonExperience.tsx`
- loading styles in `src/app/globals-app-shell.css`
- `src/components/ui/ArtPraxisDotLoader.tsx`

Reason:

Create Lesson now hands off into the generating experience, and those surfaces already share approved pigment treatments that should be centralized without touching lesson playback logic.

## Completed: Loading and generation states

### Files inspected

- `src/components/studio/LessonLoadingView.tsx`
- `src/components/studio/LessonExperience.tsx`
- `src/components/ui/ArtPraxisDotLoader.tsx`
- `src/components/studio/FinalPaintingRegenStatus.tsx` (read-only)
- `src/lib/generation-wait.ts` (read-only)
- `src/lib/medium-language.ts` (read-only)
- `src/lib/lesson-ui-state.ts` (read-only)
- `src/app/globals.css` (loading, pipeline, tip, regen, error)
- `src/app/globals-app-shell.css` (pigment loader + generating panel)
- `src/styles/artpraxis-tokens.css`

### Files migrated

- `src/components/studio/LessonLoadingView.tsx`
- `src/components/studio/LessonExperience.tsx`
- `src/components/ui/ArtPraxisDotLoader.tsx`
- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`

### Tokens introduced or reused

Reused:

- paper / ink / border / focus / success / danger tokens
- ochre / red-earth / atelier navy pigment tokens
- spacing, radius, motion, and elevation scales
- `.ap-button-primary`
- `.visually-hidden`

Introduced for loading:

- `--ap-loading-panel-width`
- `--ap-loading-panel-padding`
- `--ap-loading-panel-padding-mobile`
- `--ap-loading-panel-background`
- `--ap-loading-panel-border`
- `--ap-loading-panel-shadow`
- `--ap-loading-step-gap`
- `--ap-loading-step-marker-size`
- `--ap-loading-step-complete`
- `--ap-loading-step-active`
- `--ap-loading-step-pending`
- `--ap-loading-step-border`
- `--ap-loading-tip-background`
- `--ap-loading-tip-border`
- `--ap-loading-tip-text`
- `--ap-loading-overlay-background`
- `--ap-loading-overlay-border`
- `--ap-loading-overlay-shadow`
- `--ap-loading-progress-track`
- `--ap-loading-progress-fill`
- `--ap-loading-error-background`
- `--ap-loading-error-border`
- `--ap-loading-error-text`
- `--ap-loading-dot-size`
- `--ap-loading-dot-gap`
- `--ap-loading-dot-color`
- `--ap-loading-motion`
- `--ap-loading-tip-min-height`
- `--ap-loading-z-overlay`

### Hard-coded values removed

- Pigment drop hex values → brand pigment tokens
- Loading panel / pipeline / tip / overlay rgba and radius values → loading tokens
- Dot-loader navy `#0D1B2A` and uppercase small-caps label treatment → semantic tokens and sentence-case label
- Regeneration status hard-coded ochre mixes → loading/panel tokens
- Error-state uppercase kickers and hard-coded paper surfaces → semantic loading/error styling
- Missing compact-wait and stages-live styles filled with tokenized rules

### Values intentionally retained

- Approved three-pigment loader motif and soft ambient wash on generating panels
- Expected-wait track (presentation timing, not generation %)
- Rotating studio-tip content and 7.5s interval
- Pipeline sequence and status mapping from existing helpers
- Time-based checklist heuristics when `activeStepIndex` is absent
- Tip SVG illustration
- Non-blocking final-painting regeneration chrome

### Checklist improvements

- Completed / active / pending states remain visually distinct with markers plus text state labels
- Active step no longer relies on motion translation
- Pulse on the active checklist marker was removed; quiet filled-dot + focus ring remain
- Current-step live region is limited to the “Now:” line

### Loader improvements

- Pigment loader remains decorative (`aria-hidden`) beside visible status copy
- ArtPraxisDotLoader tokenized and softened; still unused by live views
- Dot-loader brush travel amplitude reduced slightly
- Reduced-motion disables pigment, pulse, tip fade, and track transitions

### Studio-tip improvements

- Tip remains outside live regions so rotations are not announced repeatedly
- Reserved tip slot prevents layout jump before first tip reveal
- Tip styling uses loading tip tokens; uppercase kicker removed
- Copy wrapped in `.atelier-studio-tip-copy` for stable grid layout

### Overlay improvements

- Master regen overlay uses translucent paper tokens and loading z-index
- Final-painting regen status chrome tokenized without changing regen behavior
- Stage-generation live banner styles added so accurate stage counts remain readable

### Responsive improvements

- Chip loading layout stays single-column and panel-width constrained
- Framed layout still becomes two-column only at desktop widths
- Mobile panel padding uses `--ap-loading-panel-padding-mobile`
- Stages-live banner expands to available width on small screens

### Accessibility improvements

- Removed redundant `aria-live` / `role="status"` from the whole loading section/panel
- One polite live region for the current step only
- Checklist items expose Complete / In progress / Upcoming text for non-color state
- Medium/eyebrow labels rendered in sentence case
- Generation error retry uses `.ap-button-primary` and remains `type="button"`
- Decorative pigment loader and tip artwork remain `aria-hidden`

### Functional concerns observed but intentionally not changed

- When `activeStepIndex` is omitted, checklist progress is elapsed-time heuristic (`generation-wait.ts`), not backend phase state
- Expected-wait fill and “about Xs remaining” copy are estimated presentation aids, not exact completion guarantees
- `formatRemainingCopy` can still say “Finishing up — almost ready” after the average window; left unchanged
- API/generation errors may still surface raw `result.error` / `generationError` strings
- ArtPraxisDotLoader remains unused by live loading views; pigment loader is the approved active motif
- Tip rotation continues under reduced motion (fade removed only), matching prior behavior

### Unresolved loading inconsistencies

- Creating-flow pipeline labels still come from medium-language variants and are not identical to the canonical four master-wait labels in every medium
- Some legacy `.lesson-state-*` spinner/track rules remain for unused historical views
- Global late `.primary !important` rules remain for other screens

### Exact next migration target

Lesson Overview is the safest next migration target.

Relevant files:

- `src/components/project/ProjectOverview.tsx`
- overview styles in `src/app/globals.css`
- overview/app-shell overrides in `src/app/globals-app-shell.css`

Reason:

Overview is the next major post-generation destination and already carries approved branded treatments that can adopt the semantic token layer without touching Study/Paint generation logic.

## Completed: Lesson Overview

### Files inspected

- `src/components/project/ProjectOverview.tsx`
- `src/components/studio-reference/StudioReferencePair.tsx`
- `src/components/progression/ArtworkFrame.tsx` (read-only)
- `src/components/studio/LessonView.tsx` (read-only render site)
- `src/components/shell/LessonShell.tsx` (read-only title context)
- `src/app/globals.css` (overview + studio-ref-pair)
- `src/app/globals-app-shell.css` (branded overview overrides)
- `src/styles/artpraxis-tokens.css`

### Files migrated

- `src/components/project/ProjectOverview.tsx`
- `src/components/studio-reference/StudioReferencePair.tsx`
- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`

### Tokens introduced or reused

Reused:

- paper / ink / border / focus tokens
- `--ap-kit-ink`, `--ap-kit-earth`, `--ap-kit-rule`
- `--ap-shadow-artwork-frame`
- spacing / radius / typography scales
- `.ap-button-primary`
- `.btn-branded`

Introduced for Overview:

- `--ap-overview-max-width`
- `--ap-overview-hero-gap`
- `--ap-overview-hero-gap-mobile`
- `--ap-overview-reference-surface`
- `--ap-overview-final-surface`
- `--ap-overview-image-background`
- `--ap-overview-image-border`
- `--ap-overview-image-shadow`
- `--ap-overview-image-radius`
- `--ap-overview-final-emphasis-border`
- `--ap-overview-meta-gap`
- `--ap-overview-fact-background`
- `--ap-overview-fact-border`
- `--ap-overview-summary-width`
- `--ap-overview-actions-gap`
- `--ap-overview-empty-background`
- `--ap-overview-empty-border`
- `--ap-overview-dashboard-background`
- `--ap-overview-label`
- `--ap-overview-body`

### Hard-coded values removed

- Overview dashboard gap/padding/border/background rgba values → overview tokens
- Overview meta uppercase + wide tracking → sentence-case `.overview-label` / `dt`
- Primary CTA `.btn-solid` + late indigo `!important` dependency → `.ap-button-primary.overview-begin`
- Legacy `.overview-reference img { object-fit: cover }` → `contain`
- Studio-ref pair caption uppercase treatment → sentence case
- Stale empty final copy “arrives after review” → “still being prepared”

### Values intentionally retained

- Approved museum artwork-frame treatment and matte/fillet emphasis for final painting
- Dock hiding while Overview is active (`:has(.project-overview--dashboard)`)
- StatusPill + Progress-tab deferral pattern
- Dynamic Begin / Resume / Review lesson labels
- Desktop two-column Overview composition
- Existing Begin-lesson navigation handler in LessonView

### Reference/final composition improvements

- Pair remains above the fold in the hero region
- Overview pair uses a slightly wider final column (`1fr / 1.18fr`)
- Final figure caption receives stronger ink color
- Images keep `object-fit: contain` with stable empty containers
- Captions clarified to “Reference” and “Final painting”

### Final-painting emphasis

- Final painting frame uses stronger border/surface tokens on Overview
- Creative-liberty line added: “Use this painting as your guide, then make the final choices your own.”
- No glow, badge, or AI-forward promotional language

### Summary and metadata improvements

- Summary, time/difficulty/medium, materials, and skills remain secondary to the image pair
- Labels use calm sentence-case overview labels instead of uppercase eyebrows
- Skills heading softened to “Skills practiced”
- Secondary dates/status remain visually quieter after the primary action

### Primary-action improvements

- Begin lesson moved below summary/facts/materials so the action follows review
- Single primary CTA uses `.ap-button-primary btn-lg btn-branded`
- Minimum 44–48px target height preserved
- Status editing remains deferred to Progress

### Empty/loading/error-state changes

- Empty final state copy no longer implies a separate review gate
- Empty reference/final containers keep minimum height and paper tokens
- Readiness and image URL selection logic unchanged

### Responsive improvements

- Tablet/mobile collapse to one column before crowding
- Overview pair stacks cleanly under 980px
- Meta facts collapse to two columns on narrow widths
- Page remains vertically scrollable; dock stays hidden on Overview

### Accessibility improvements

- Orientation region uses an accessible name
- Section labels upgraded from `.eyebrow` paragraphs to heading-level `.overview-label` / `h2`
- Image captions remain visible outside alt text
- Pair hit targets keep focus-visible rings
- Begin lesson remains a keyboard-accessible `type="button"`

### Functional concerns observed but intentionally not changed

- Overview can still render when `masterImageUrl` is null; empty final state is shown rather than blocking Begin lesson
- Begin/Resume/Review still only switches to the Lesson tab; it does not validate final readiness
- Studio Reference open behavior still depends on optional context (`openFullscreen`)
- Artwork-frame museum colors still include approved hard-coded matte values outside Overview token scope

### Unresolved Overview inconsistencies

- Lesson title remains in LessonShell rather than inside ProjectOverview
- Artwork-frame museum matte ring values still use approved hard-coded rgba inside Overview shell overrides (scoped to `.overview-ref-pair`)
- StatusPill color variants remain in app-shell rather than a dedicated status-token pass

### Exact next migration target

Lesson navigation is the safest next migration target.

Relevant files:

- `src/components/shell/LessonShell.tsx`
- `src/components/progression/StageScrollNav.tsx`
- `src/components/progression/StageContinueNav.tsx`
- `src/app/globals-app-shell.css`

Reason:

With Overview migrated, the next shared chrome surface is lesson tab/stage navigation, which already carries approved mobile overflow fixes that should be preserved while adopting semantic tokens.

## Completed: Lesson navigation

### Files inspected

- `src/components/shell/LessonShell.tsx`
- `src/components/progression/StageScrollNav.tsx`
- `src/components/progression/StudyMode.tsx` (read-only)
- `src/components/progression/PaintMode.tsx` (read-only)
- `src/components/progression/useActiveStage.ts` (read-only)
- `src/components/studio/LessonView.tsx` (read-only tab wiring)
- `src/components/studio/LessonExperience.tsx` (read-only mode host)
- `src/app/globals.css` (lesson tabs, stage scroll nav, mode switch)
- `src/app/globals-app-shell.css` (branded lesson chrome)
- `src/styles/artpraxis-tokens.css`

### Files migrated

- `src/components/shell/LessonShell.tsx`
- `src/components/progression/StageScrollNav.tsx`
- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`

### Tokens introduced or reused

Reused:

- shell / paper / ink / focus tokens
- `--ap-kit-ink`, `--ap-kit-ochre`, `--ap-kit-rule`
- spacing, radius, motion scales
- `--lesson-sticky`, `--proj-tabs-h`, `--stage-nav-h` compatibility aliases

Introduced for navigation:

- `--ap-lesson-nav-background`
- `--ap-lesson-nav-border`
- `--ap-lesson-nav-shadow`
- `--ap-lesson-nav-height`
- `--ap-lesson-nav-gap`
- `--ap-lesson-nav-padding-inline`
- `--ap-lesson-nav-text`
- `--ap-lesson-nav-text-muted`
- `--ap-lesson-nav-active-text`
- `--ap-lesson-nav-active-rule`
- `--ap-lesson-nav-hover-background`
- `--ap-lesson-mode-background`
- `--ap-lesson-mode-border`
- `--ap-lesson-mode-active-background`
- `--ap-lesson-mode-active-text`
- `--ap-stage-nav-background`
- `--ap-stage-nav-border`
- `--ap-stage-nav-text`
- `--ap-stage-nav-active-text`
- `--ap-stage-nav-active-background`
- `--ap-stage-nav-active-rule`
- `--ap-stage-nav-complete`
- `--ap-stage-nav-gap`
- `--ap-stage-nav-height`
- `--ap-stage-nav-mobile-height`
- `--ap-lesson-sticky-top`
- `--ap-stage-scroll-offset`
- `--ap-lesson-nav-z`
- `--ap-stage-nav-z`

### Hard-coded values removed

- Lesson tab ink/rule rgba values → `--ap-lesson-nav-*` tokens
- Stage navigator warm-gray / navy active colors → `--ap-stage-nav-*` tokens
- Stage scroll-margin hard-coded calc → `--ap-stage-scroll-offset`
- Mode-switch compact pill rgba values → `--ap-lesson-mode-*` tokens
- Conflicting `flex-wrap:wrap` on lesson tabs → `nowrap` with horizontal scroll
- Legacy 40px stage button min-heights → 44px tokenized targets

### Values intentionally retained

- Document-flow (non-sticky) tabs and stage navigator architecture
- Mobile horizontal tab scroll + `overscroll-behavior-inline:contain`
- Hidden scrollbar styling on lesson tab row (existing product behavior)
- Continuous Study Mode with all stages mounted
- IntersectionObserver active-stage logic unchanged
- PaintMode component retained but not wired in LessonExperience
- Legacy stage-process / journey selectors remain hidden via CSS

### Primary-tab improvements

- Tokenized restrained tab colors and ochre active rule
- Active state uses underline rule + weight (not pill background)
- Mobile active tab scroll-into-view in `LessonShell`
- Accessible name updated to “Lesson sections”

### Study/Paint improvements

- Compact mode-switch CSS tokenized for future use
- Study/Paint UI not reintroduced — continuous Study remains sole live mode per current architecture

### Stage-navigation improvements

- Quieter tokenized stage markers with 44px touch targets
- Active stage uses restrained background + bottom rule
- `aria-current="step"` on active stage button
- Mobile horizontal rail preserved with active centering

### Sticky behavior changes

- Confirmed tabs + stage nav remain in document flow (no re-sticky)
- Sticky offset tokens centralized via `--ap-stage-scroll-offset`
- Removed conflicting tab-row wrap that could stack tabs on mid-width viewports

### Mobile behavior preserved

- `flex-wrap:nowrap` + `overflow-x:auto` on lesson tabs at all breakpoints
- Stage navigator horizontal scroll under 899px unchanged
- Touch-action and overscroll containment preserved in app-shell mobile block

### Responsive improvements

- Tab and stage controls scale via tokenized heights
- Mid-width viewports no longer wrap tabs into unpredictable rows

### Accessibility improvements

- Lesson tablist labeled “Lesson sections”
- Active stage uses `aria-current="step"`
- Focus rings use `--ap-color-focus-ring`
- Selected tab scrolls into view on narrow viewports

### Functional concerns observed but intentionally not changed

- `TABS` in LessonView omits a Notes tab (Materials + Progress only beyond Lesson/Reference)
- Study/Paint mode switch is not rendered in live LessonExperience (Study only)
- PaintMode still paginates one stage at a time when used directly
- `useActiveStage` IntersectionObserver rootMargin unchanged
- `lessonEntryMode` state in LessonView retained but not surfaced in UI

### Unresolved navigation inconsistencies

- Notes tab absent from current tab configuration
- Study/Paint switch CSS exists but live lesson chrome does not expose Paint
- Multiple historical stage-nav CSS blocks remain elsewhere in globals.css for hidden legacy selectors
- Global `html/body overflow-x:clip` remains a page-level guard, not navigation-specific

### Exact next migration target

Study Mode is the safest next migration target.

Relevant files:

- `src/components/progression/StudyMode.tsx`
- `src/components/progression/StudyStageSection.tsx`
- `src/components/progression/StageTeachingHeader.tsx`
- study-stage styles in `src/app/globals.css`

Reason:

Navigation chrome is now tokenized; the next visible lesson surface is continuous Study stage content, instructions, and artwork framing inside each mounted stage section.
