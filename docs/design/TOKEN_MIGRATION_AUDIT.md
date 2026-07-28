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

Paint Mode is the safest next migration target.

Relevant files:

- `src/components/progression/PaintMode.tsx`
- `src/components/studio/DeskStage.tsx`
- `src/components/studio/StageChapter.tsx`
- paint-mode / desk-stage styles in `src/app/globals.css`

Reason:

Continuous Study Mode is now tokenized; Paint Mode remains the paginated one-stage-at-a-time experience with legacy desk/chapter chrome that should adopt the same semantic token layer without altering stage-generation or pagination behavior.

## Completed: Study Mode

### Files inspected

- `src/components/progression/StudyMode.tsx`
- `src/components/progression/StudyStageSection.tsx`
- `src/components/progression/StageTeachingHeader.tsx`
- `src/components/progression/StageGuideColumn.tsx`
- `src/components/progression/StageComparison.tsx`
- `src/components/progression/StageContinueNav.tsx`
- `src/components/progression/FinalPaintingEntry.tsx`
- `src/components/progression/StageCompletion.tsx`
- `src/components/progression/AtelierRibbon.tsx`
- `src/components/progression/useActiveStage.ts` (read-only)
- `src/components/progression/StageScrollNav.tsx` (read-only)
- `src/components/studio/LessonExperience.tsx` (read-only mode host)
- `src/components/studio/DeskStage.tsx` (legacy — not mounted in live Study)
- `src/components/studio/StageChapter.tsx` (legacy — Paint path)
- `src/components/studio/PaintMode.tsx` (read-only — paginated alternate)
- `src/app/globals.css` (continuous Study block, atelier polish, desktop grid)
- `src/app/globals-app-shell.css` (study-stage section card removal)
- `src/styles/artpraxis-tokens.css`

### Active components identified

Live continuous Study path:

- `StudyMode` → `StageScrollNav` + all mounted `StudyStageSection` + `StageCompletion`
- `StudyStageSection` → `StageTeachingHeader`, `FinalPaintingEntry`, `StageGuideColumn` (instructions + extras), `StageComparison`, `StageContinueNav`
- Studio Reference access via `FinalPaintingEntry` (panel / fullscreen); dock unchanged

Not active in live Study:

- `DeskStage`, `StageChapter`, paginated `PaintMode`

Behavior preserved:

- All stages mounted in document order
- Vertical scroll; no pagination or content swapping
- `useActiveStage` IntersectionObserver + `StageScrollNav` anchor scroll
- No per-stage `ProgressUpload` (completion ribbon only at end)

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/progression/StudyMode.tsx`
- `src/components/progression/StudyStageSection.tsx`
- `src/components/progression/FinalPaintingEntry.tsx`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`

### Tokens introduced or reused

Reused:

- `--ap-color-paper-*`, `--ap-kit-ink`, `--ap-kit-earth`, `--ap-kit-rule`
- `--ap-overview-image-*`, `--ap-shadow-artwork-frame`
- `--ap-lesson-sticky-top`, `--ap-stage-scroll-offset` (via study scroll offset)
- spacing, radius, typography, focus tokens

Introduced for Study:

- `--ap-study-max-width`
- `--ap-study-stage-gap`
- `--ap-study-stage-padding-block`
- `--ap-study-stage-divider`
- `--ap-study-guidance-min` / `--ap-study-guidance-max`
- `--ap-study-workspace-min`
- `--ap-study-grid-gap`
- `--ap-study-workspace-sticky-top`
- `--ap-study-scroll-offset`
- `--ap-study-image-background` / `border` / `shadow` / `radius`
- `--ap-study-stage-label` / `title` / `purpose`
- `--ap-study-instruction-gap`
- `--ap-study-tip-background` / `border` / `text`
- `--ap-study-this-stage-background` / `border`
- `--ap-study-transition-rule` / `text`
- `--ap-study-mobile-gap`

### Hard-coded values removed

- Study stage divider, label, title, and purpose rgba/ink values → `--ap-study-*` tokens
- Stage section scroll-margin calc → `--ap-study-scroll-offset`
- Desktop sticky top calc → `--ap-study-workspace-sticky-top`
- Tip/guide card backgrounds and borders → `--ap-study-tip-*` tokens
- Uppercase on stage meta, focus kicker, canvas label, tip labels, final-painting eyebrow, transition kicker
- Final-painting thumb `object-fit: cover` → `contain`
- Card background on `.study-mode--continuous .study-stage-section` in app-shell

### Values intentionally retained

- Sketch stage display filter (`cmp-frame-img--sketch`) for legibility
- Museum artwork matte values on image surfaces (scoped museum block)
- `.cmp-caption` uppercase (comparison chrome, not instruction hierarchy)
- Historical polish blocks that refine spacing rhythm without reintroducing hard-coded ink
- `StageCompletion` branded primary button styling (completion surface, out of scope)
- All stage instructional copy, URLs, and data mapping unchanged
- IntersectionObserver rootMargin and active-stage logic unchanged
- Studio Reference open/compare behavior unchanged

### Continuous-flow behavior preserved

- All six stages remain mounted in `StudyMode`
- No active-index content swapping or carousel
- No Previous/Next pagination controls
- `StageContinueNav` quiet transition cues only
- Vertical document scroll primary; no scroll snapping
- Stage IDs and `scrollTo` anchor navigation unchanged

### Stage composition improvements

- Semantic `role="region"` on Study Mode container
- Guide column wrapped in `<aside aria-label="Stage guidance">`
- “This stage” promoted to `<h3 className="study-stage-canvas-label">`
- DOM order: head → final → guide → workspace (desktop atelier grid)
- Mobile CSS `order` restores artwork-before-guidance reading order
- Restrained section dividers instead of card framing per stage

### Artwork workspace improvements

- Stage target images use `object-fit: contain`
- Tokenized inset background, border, shadow on artwork surfaces
- Desktop sticky workspace with semantic top offset; releases on narrow viewports
- Max-height guard on large viewports without cropping
- Final painting entry subordinate to stage canvas

### Instruction hierarchy improvements

- Stage header: meta + title + purpose (sentence case)
- Today’s focus kicker de-emphasized vs title
- Guide cards use restrained inset paper; technique/avoid tones via left rule only
- Primary instructions visually stronger than tips

### Tip treatment improvements

- Tips/common mistakes use `--ap-study-tip-background` and subtle border
- Removed alert-style uppercase labels on study guide cards
- No bright status fills for ordinary tips

### Transition-cue improvements

- Existing `StageContinueNav` quiet text treatment preserved
- Tokenized transition rule and text colors where styled in Study block

### Progress-upload changes

- No per-stage `ProgressUpload` in live path; unchanged
- `StageCompletion` / `AtelierRibbon` at journey end only

### Studio Reference observations

- `FinalPaintingEntry` provides compare affordance without duplicating large reference pair
- Dock padding-right on wide viewports preserved (`has-ref-dock`)
- Full Studio Reference panel/fullscreen redesign deferred to dedicated pass
- Minor duplication: final/reference thumb in entry + dock — acceptable until Reference pass

### Responsive improvements

- Desktop ≥1100px: two-column grid (`guide` left, `canvas` right), full-width head/final rows
- Below 1100px: single column, sticky disabled, artwork before guidance via `order`
- Tokenized stage gaps; mobile gap tightening at 699px
- `overflow-x: clip` on study container preserved

### Accessibility improvements

- Study region labeled “Study lesson”
- Each stage section `aria-labelledby` tied to stage title id
- Guide aside labeled; focus section labeled “Today’s focus”
- Sentence-case labels (not misread as alerts)
- Focus-visible rings on final-painting entry buttons
- Reduced-motion transitions disabled for nav/transition controls

### Functional concerns observed but intentionally not changed

- Notes tab still absent from `LessonView` TABS
- Study/Paint mode switch not exposed in live UI
- `PaintMode` still paginates when mounted directly
- `lessonEntryMode` state unused in UI
- `StageCompletion` upload placeholder not wired to full Progress page
- Legacy desk/chapter CSS blocks remain for Paint path

### Unresolved Study inconsistencies

- Duplicate polish rhythm blocks in `globals.css` (main Study block + atelier polish) — cascade intentional but verbose
- `.cmp-caption` still uppercase outside Study instruction scope
- Some later globals overrides (e.g. tighter rhythm ~10960) may narrow gaps — monitor in Paint pass

### Exact next migration target

Paint Mode — see top of this section.

## Completed: Paint Mode

### Files inspected

- `src/components/progression/PaintMode.tsx`
- `src/components/progression/DeskStage.tsx`
- `src/components/progression/StageScrollNav.tsx` (read-only)
- `src/components/progression/StageTeachingHeader.tsx`
- `src/components/progression/StageGuideColumn.tsx`
- `src/components/progression/StageComparison.tsx`
- `src/components/progression/StageContinueNav.tsx`
- `src/components/progression/FinalPaintingEntry.tsx`
- `src/components/progression/StageCompletion.tsx`
- `src/components/progression/ProgressUpload.tsx` (read-only — Progress tab only, not mounted in Paint)
- `src/components/studio/LessonExperience.tsx` (read-only — Study only in live path)
- `src/components/studio/LessonView.tsx` (read-only)
- `src/app/globals.css` (paint-mode block, legacy desk/atelier rules)
- `src/app/globals-app-shell.css`
- `src/styles/artpraxis-tokens.css`

### Active and legacy components identified

**Active Paint path (future-ready, not live):**

- `PaintMode` → `StageScrollNav` + single mounted `DeskStage` (selected stage only)
- `DeskStage` → `StageTeachingHeader`, `FinalPaintingEntry`, `StageComparison`, `StageGuideColumn`, `StageContinueNav` / `StageCompletion`

**Not present in repository:**

- `src/components/studio/DeskStage.tsx`, `StageChapter.tsx`, `StageNavControls.tsx`, `StageProcessRail.tsx` (documented in older architecture notes only)

**Not mounted in live app:**

- `PaintMode` is not rendered by `LessonExperience`; continuous `StudyMode` remains sole live lesson surface

**Behavior preserved:**

- Single selected stage via local `active` index state
- `StageScrollNav` updates selection (no URL change)
- Previous stage via `StageCompletion.onReviewPrevious` on last stage only; `StageContinueNav` advances on non-final stages
- No `ProgressUpload` inside Paint path (Progress tab owns upload)
- Paginated one-stage-at-a-time rendering unchanged

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/progression/PaintMode.tsx`
- `src/components/progression/DeskStage.tsx`
- `src/app/globals.css`
- `src/app/globals-app-shell.css`

### Tokens introduced or reused

Reused:

- Study image/workspace tokens via aliases (`--ap-paint-image-*` → `--ap-study-image-*`)
- paper/ink/kit, spacing, radius, focus, stage-nav tokens

Introduced for Paint:

- `--ap-paint-max-width`
- `--ap-paint-grid-gap`
- `--ap-paint-guidance-min` / `--ap-paint-guidance-max`
- `--ap-paint-workspace-min`
- `--ap-paint-workspace-sticky-top`
- `--ap-paint-stage-divider`
- `--ap-paint-image-background` / `border` / `shadow` / `radius`
- `--ap-paint-stage-label` / `title` / `purpose`
- `--ap-paint-instruction-gap`
- `--ap-paint-tip-background` / `border` / `text`
- `--ap-paint-guidance-background` / `border`
- `--ap-paint-control-gap`
- `--ap-paint-nav-text` / `nav-active`
- `--ap-paint-mobile-gap`

### Hard-coded values removed

- Removed `study-stage-section` class from Paint section (prevented Study continuous CSS leak)
- Paint stage meta/title/purpose uppercase and rgba ink values → `--ap-paint-*` tokens
- Guide card hard-coded borders/backgrounds → `--ap-paint-tip-*` tokens
- “This stage” eyebrow uppercase class removed from DeskStage
- Legacy `atelier-layout` / `atelier-layout--teaching` grid dependency removed from active DeskStage shell

### Values intentionally retained

- Sketch display filter for legibility
- `.cmp-caption` uppercase (comparison chrome)
- `StageCompletion` branded primary button
- Legacy `.paint-mode`, `.desk-stage`, `.atelier-layout` rules for historical selectors
- Single-column `atelier-layout` editorial override block (11409+) for non-paint legacy paths
- All stage copy, URLs, handlers, and index state unchanged
- Paint not exposed in live navigation

### Paint layout improvements

- Dedicated `.paint-stage-grid` with scoped desktop two-column desk (guide left, artwork right)
- Mobile `order` restores artwork-before-guidance reading order
- Removed card framing; transparent section background in app-shell
- Completion/continue row spans full width below workspace

### Artwork workspace improvements

- `object-fit: contain` enforced within `.paint-mode`
- Tokenized image surfaces; sticky workspace on desktop with semantic top offset
- Static workspace on ≤1099px; max-height guard on large viewports

### Instruction hierarchy improvements

- Stage identity → artwork → guidance → progress/navigation
- Today’s focus and guide cards use restrained inset paper
- Primary instructions visually stronger than tips

### Stage navigation improvements

- `StageScrollNav` remains quiet secondary chrome (tokenized from navigation pass)
- `StageContinueNav` quiet “Next →” treatment preserved
- No duplicate Previous/Next pagination controls added
- Stage rail + continue nav duplication documented (rail selects; continue advances one step)

### Progress upload improvements

- None in Paint path — `ProgressUpload` remains on Progress tab only

### Reference/final access observations

- `FinalPaintingEntry` compact compare affordance preserved
- Studio Reference dock behavior unchanged
- Duplication with dock thumb acceptable until Studio Reference pass

### Responsive improvements

- Desktop ≥1100px: two-column desk grid with sticky artwork
- Tablet/mobile: single column, artwork early, no sticky trap
- Compare segment wraps on narrow widths

### Accessibility improvements

- Paint region labeled “Paint lesson”
- Section `aria-labelledby` tied to stage title id via `STAGE_DOM_ID`
- Guide aside labeled; focus section labeled
- Sentence-case labels throughout Paint scope
- `titleId` passed to `StageTeachingHeader` for programmatic heading association

### Functional concerns observed but intentionally not changed

- Paint Mode not wired in `LessonExperience`
- `lessonEntryMode` prop retained but unused in UI
- Notes tab still absent
- `StageScrollNav` + `StageContinueNav` both advance stages (different UX affordances)
- Legacy `atelier-layout` CSS blocks remain for unused DOM shapes

### Unresolved Paint inconsistencies

- Historical `.paint-nav`, `.paint-rail`, `.paint-stage` CSS blocks remain unreferenced
- Global `atelier-layout` single-column override (11409+) still applies to legacy class trees
- `docs/COMPONENT_ARCHITECTURE.md` references removed components (`StageProcessRail`, `StageChapter`)

### Exact next migration target

Studio Reference — panel, fullscreen, dock, and compare surfaces.

Relevant files:

- `src/components/studio-reference/*`
- `LessonReferenceDock` / compare components
- reference dock styles in `src/app/globals.css` and `globals-app-shell.css`

Reason:

Study and Paint stage shells now share tokenized artwork and guidance patterns; the next visible duplication is reference/final compare chrome outside the stage workspace.

## Completed: Studio Reference

### Files inspected

- `src/components/studio-reference/LessonReferenceDock.tsx`
- `src/components/studio-reference/StudioReferencePanel.tsx`
- `src/components/studio-reference/StudioReferenceFullscreen.tsx`
- `src/components/studio-reference/StudioReferencePage.tsx`
- `src/components/studio-reference/StudioReferenceViewer.tsx`
- `src/components/studio-reference/StudioReferencePair.tsx`
- `src/components/studio-reference/StudioCompareControls.tsx`
- `src/components/studio-reference/StudioReferenceContext.tsx`
- `src/components/studio-reference/useStudioComparePreference.ts`
- `src/components/studio-reference/types.ts`
- `src/components/studio-reference/ReferenceColorSampler.tsx` (read-only)
- `src/components/progression/FinalPaintingEntry.tsx` (read-only consumer)
- `src/components/studio/LessonView.tsx` (read-only mount wiring)
- `src/components/project/ProjectOverview.tsx` (read-only pair usage)
- `src/app/globals.css` (studio reference block)
- `src/app/globals-app-shell.css` (overview dock hide, overview pair scopes)
- `src/styles/artpraxis-tokens.css`

### Active components identified

Four-surface architecture preserved:

- **Mini:** `LessonReferenceDock` (desktop card + mobile FAB) — mounted in `LessonView`, hidden on Reference tab and Overview
- **Peek:** `StudioReferencePanel` — modal dialog, opens from dock/FinalPaintingEntry
- **Deep:** `StudioReferenceFullscreen` — modal dialog, body scroll lock, Escape closes
- **Page:** `StudioReferencePage` — dedicated lesson tab via `useStudioComparePreference` (separate hook instance from context)

Shared: `StudioReferenceViewer` + `StudioCompareControls`; `StudioReferencePair` on Overview

State: `StudioReferenceContext` owns panel/fullscreen/dock/compare mode; localStorage key `artpraxis.studioReference.compareMode` unchanged; opacity local to `StudioReferenceViewer` (default 0.55)

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/studio-reference/types.ts` (label casing only)
- `src/components/studio-reference/LessonReferenceDock.tsx`
- `src/components/studio-reference/StudioReferencePanel.tsx`
- `src/components/studio-reference/StudioReferenceFullscreen.tsx`
- `src/components/studio-reference/StudioReferencePage.tsx`
- `src/components/studio-reference/StudioReferenceViewer.tsx`
- `src/app/globals.css`

### Tokens introduced or reused

Reused: study/overview image tokens, paper/ink/kit, focus, motion, shadow, spacing, radius tokens

Introduced: `--ap-reference-dock-*`, `--ap-reference-panel-*`, `--ap-reference-fullscreen-*`, `--ap-reference-control-*`, `--ap-reference-image-*`, `--ap-reference-label`, `--ap-reference-divider`, `--ap-reference-slider-*`, `--ap-reference-mobile-gap`

### Hard-coded values removed

- Dock/panel/fullscreen rgba backgrounds and shadows → reference tokens
- Panel backdrop `rgba(30,28,25,0.28)` → `--ap-reference-fullscreen-overlay`
- Compare control hairline/paper colors → `--ap-reference-control-*`
- Dock FAB/thumb `object-fit: cover` → `contain`
- Uppercase dock eyebrow → sentence-case tokenized label
- Global `.eyebrow` on panel/fullscreen/page → `.studio-ref-kicker`
- Focus rings → `--ap-color-focus-ring`
- Fixed z-index 40/80/90 → semantic reference z tokens
- `padding-right: 176px` dock gutter → `--ap-reference-dock-width`

### Values intentionally retained

- `STUDIO_COMPARE_STORAGE_KEY` and mode enum values unchanged
- Opacity range 0.1–1, step 0.05, default 0.55 unchanged
- Panel modal semantics (`aria-modal="true"`) preserved
- Fullscreen body `overflow: hidden` lock preserved
- Escape handler order (fullscreen → panel → dock) unchanged
- Overview `.overview-ref-pair` museum matte overrides in app-shell preserved
- Regeneration pulse on dock FAB preserved (reduced-motion disables animation)
- `ReferenceColorSampler` untouched

### Dock improvements

- Tokenized paper surface, border, shadow, radius
- Thumbnail `object-fit: contain` on FAB and card thumb
- Sentence-case “Final painting” label
- 44px minimum touch targets on actions

### Mobile FAB improvements

- Tokenized size via `--ap-reference-dock-width-mobile`
- Safe-area positioning preserved
- Contain-fit thumbnail; focus ring tokenized

### Panel improvements

- Warm paper sheet with dialog shadow token
- Semantic overlay (not pure black)
- `.studio-ref-kicker` replaces uppercase eyebrow
- Compact header; artwork-dominant body

### Fullscreen improvements

- Warm paper canvas background (not black)
- Tokenized header divider and title ink
- Close button `aria-label` added
- Motion tokens on enter animation

### Dedicated page improvements

- `.studio-ref-kicker` for section label
- Page title uses `--ap-kit-ink`
- Same viewer/compare modes as fullscreen (shared component)

### Pair/comparison improvements

- Caption labels sentence case in viewer; pair already “Reference” / “Final painting”
- Compare mode labels sentence case in `STUDIO_COMPARE_OPTIONS`
- Radio group semantics preserved; active state uses inset rule + weight

### Mode/opacity improvements

- Mode controls tokenized; 44px min-height on compare buttons
- Opacity slider labeled; accent uses `--ap-reference-slider-fill`
- Overlay top image `pointer-events: none` fix (was invalid `pointer:relative`)

### Responsive improvements

- Mobile: pair and side-by-side panels stack at ≤720px (unchanged)
- Dock FAB bottom offset preserved for lesson chrome
- Panel nearly full width with safe padding
- Compare segment wraps via flex-wrap

### Accessibility improvements

- Fullscreen close `aria-label`
- Panel/fullscreen/page use non-uppercase kicker (not misread as alerts)
- Compare radiogroup + arrow keyboard navigation preserved
- Opacity slider `aria-label` preserved
- Focus-visible on dock, compare, pair hit targets

### Functional concerns observed but intentionally not changed

- `StudioReferencePage` uses separate `useStudioComparePreference` hook — mode on page tab does not sync with context compare mode in panel/fullscreen until both read localStorage on hydrate
- No focus return to trigger on panel/fullscreen close (pre-existing)
- Panel opens with focus on close button only; no focus trap library
- Dock thumb button nested inside aside (valid; not nested buttons)
- `FinalPaintingEntry` duplicates compact compare affordance alongside dock

### Unresolved Studio Reference inconsistencies

- Page vs context compare mode instances may momentarily diverge before localStorage hydrate
- Historical `studio-inspiration--inline` CSS remains for unused DOM
- Regeneration pulse animation still present (disabled under `prefers-reduced-motion`)

## Completed: Materials

### Files inspected

- `src/components/project/ProjectMaterials.tsx`
- `src/components/studio/LessonView.tsx` (read-only tab wiring)
- `src/lib/material-images.ts` (read-only)
- `src/lib/material-readiness.ts` (read-only)
- `src/lib/paint-material-id.ts` (read-only)
- `src/lib/tutorial-schema.ts` (read-only normalization)
- `src/components/progression/StageMaterialsChips.tsx` (read-only — stage chips, out of scope)
- `src/app/globals.css` (materials-workbench, palette-atelier, workbench-* blocks)
- `src/styles/artpraxis-tokens.css`

### Active Materials components identified

- **Materials tab:** `ProjectMaterials` mounted from `LessonView` when `tab === "materials"`
- **Data path:** `tutorial.palette` + `tutorial.materials` → `buildItems()` → categorized workbench
- **Interactions:** filter toolbar (all/essential/optional/ready), palette selection, category expand/collapse, per-item “Mark ready” with localStorage persistence (`material-readiness.ts`), reset checklist, highlight scroll from stage chips
- **Not on Materials tab:** `StageMaterialsChips` (Study stage guidance), Overview materials list preview

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/project/ProjectMaterials.tsx`
- `src/app/globals.css`

### Tokens introduced or reused

Reused: paper/ink/kit, study tip inset tokens, overview empty tokens, spacing, radius, focus, motion tokens

Introduced: `--ap-materials-max-width`, `--ap-materials-section-gap`, `--ap-materials-grid-gap`, `--ap-materials-category-gap`, `--ap-materials-surface`, `--ap-materials-border`, `--ap-materials-shadow`, `--ap-materials-item-*`, `--ap-materials-label`, `--ap-materials-meta`, `--ap-materials-kicker`, `--ap-materials-substitution-*`, `--ap-materials-palette-*`, `--ap-materials-swatch-size*`, `--ap-materials-check-size`, `--ap-materials-mobile-gap`, `--ap-materials-filter-*`, `--ap-materials-ready-summary-background`

### Hard-coded values removed

- Workbench title/lead/action-primary colors → `--ap-materials-label` / `--ap-materials-meta`
- Pill filters terre-verte/navy fills → tokenized filter active state with ochre rule
- Palette atelier canvas/paper borders → `--ap-materials-palette-*`
- Workbench item card shadows and yellow-ochre selection → restrained border emphasis
- Ready state terre-verte fills → `--ap-materials-item-checked-*`
- Uppercase `.eyebrow` on page header → `.materials-kicker`
- Uppercase `.palette-detail-kicker` → sentence-case tokenized label
- Workbench item image `object-fit: cover` → `contain` (scoped)
- Palette chip hover lift/shadow → static border emphasis

### Values intentionally retained

- All material/palette data mapping and `buildItems()` logic unchanged
- Category order (`WORKBENCH_ORDER`) and labels unchanged
- Filter and readiness persistence unchanged
- Substitution text content unchanged (presentation label only)
- Quantity/specification fields in data model not rendered (pre-existing — not added)
- Legacy materials CSS blocks for stage collapse / palette-supplies remain for other surfaces
- Small material SVG thumbnails retained at 40px when resolved

### Page hierarchy improvements

- `.materials-kicker` + clear page title/lead
- Empty state uses semantic `materials-empty` (not generic `.card`)
- Checklist summary and reset remain subordinate to header

### Palette improvements

- Restrained inset-paper palette section; daub swatches sized via tokens
- Removed glossy hover lift; ready/selected states use inset paper + border
- Color chip `aria-label` includes name and role
- Mix toggle and legend preserved

### Material-item improvements

- Quiet item rows without heavy card shadow
- Essential/optional tags sentence case, muted
- Substitution uses inset-paper block with “Substitution” label when item selected
- Thumbnail `object-fit: contain`

### Category improvements

- Section toggles use tokenized borders and sentence-case headings
- List grid collapses to one column on narrow viewports

### Substitution improvements

- Inset-paper treatment with labeled block (replacing inline “Substitute:” prefix)
- Still shown only when item is selected (behavior preserved)

### Interaction improvements

- 44px min-height on filters, ready buttons, reset
- Focus-visible rings on interactive controls
- `aria-pressed` on filters and ready buttons preserved

### Responsive improvements

- Max width via `--ap-materials-max-width`
- Single-column lists and palette grid ≤900px
- Smaller swatches on very narrow mobile

### Accessibility improvements

- Palette chip buttons labeled with color name + role
- Empty state `role="status"`
- Filter toolbar `aria-pressed` preserved
- Category sections `aria-labelledby` preserved
- Focus rings tokenized

### Data-quality concerns observed but intentionally not changed

- `quantity` and `specification` exist on `WorkbenchItem` but are not displayed in UI (pre-existing)
- Generated materials may have incomplete normalization fields (see `tutorial-materials` tests)
- Duplicate or vague generated material names possible from API output

### Unresolved Materials inconsistencies

- Duplicate materials CSS blocks (legacy ~8432 + polish ~11728 + token block ~11788) — cascade intentional
- Historical `palette-supplies` and `project-materials-*` selectors remain for unused/legacy paths
- Stage materials chips not migrated in this pass

### Exact next migration target

Progress — completion status, progress uploads, and Progress tab presentation.

Relevant files:

- `src/components/progression/ProgressUpload.tsx`
- `src/components/project/StatusPill.tsx`
- Progress tab wiring in `src/components/studio/LessonView.tsx`
- progress-related styles in `src/app/globals.css`

Reason:

Materials workbench is tokenized. Notes audit (below) found no learner Notes surface to migrate.

## Audited: Notes not currently implemented

### Files inspected

- `src/components/studio/LessonView.tsx` (tab list, tab rendering)
- `src/components/shell/LessonShell.tsx`
- `src/components/studio/LessonExperience.tsx`
- `src/components/progression/StageGuideColumn.tsx`
- `src/components/progression/LessonSummaryGrid.tsx`
- `src/components/progression/GuideNoteCard.tsx`
- `src/components/progression/StageInstructorNote.tsx`
- `src/components/progression/StageCheckpoint.tsx`
- `src/components/project/ProjectMaterials.tsx` (read-only — mixingNote is palette copy, not learner notes)
- `src/lib/lessons.ts` (Firestore schema + CRUD helpers)
- `src/lib/tutorial-schema.ts` (read-only)
- `src/lib/progression.ts` (read-only — stage copy uses “notes” in prose only)
- `src/lib/stage-copy.ts` (read-only)
- `src/hooks/` (only `useRecentLessons.ts` — no note hooks)
- `src/types/` (no note types)
- `src/app/globals.css` (note-related selectors)
- `src/app/globals-app-shell.css`
- `src/styles/artpraxis-tokens.css`
- `src/app/stability-preview/StabilityPreviewClient.tsx` (mock `notes: ""`)
- `tests/stability-architecture.test.ts`
- `docs/design/ui-patterns.md` (legacy mention of disabled Notes tab during generation)
- git history (`git log --grep=notes`, `--grep=Notes`) — no commits found

Repository searches: `Notes`, `notes`, `lessonNote`, `lessonNotes`, `stageNote`, `stageNotes`, `notebook`, `journal`, `ProjectNotes`, `LessonNotes`, `textarea`, `contentEditable`, `autosave`, `localStorage` + note keys, `updateDoc`/`setDoc` + notes field.

### Notes implementation classification

**E. No Notes implementation** — there is no learner notebook surface, editor, save/autosave flow, or Notes tab/route to migrate.

Supporting evidence:

- `LessonView` `TABS` = Overview, Lesson, Studio Reference, Materials, Progress only — no Notes id, label, or render branch.
- `tests/stability-architecture.test.ts` explicitly asserts `LessonView.tsx` does **not** match `/Notes/`.
- No `ProjectNotes`, `LessonNotes`, `NotesPage`, `NotesPanel`, or similar component anywhere under `src/components`.
- No `<textarea>` or `contentEditable` in `src/components` (no note editor mount point).
- No autosave, debounce-save, dirty-state, `beforeunload`, or note-specific `localStorage` keys.
- No `updateDoc` / helper that writes `summary.notes` after project creation.
- No Notes-specific tests beyond the architecture guard above.

### Active or inactive components found (not learner Notes)

These use “note/notes” in naming or copy but are **instructor or UI chrome**, not a private learner notebook:

| Artifact | Role | Mounted? |
| --- | --- | --- |
| `GuideNoteCard` + `LessonSummaryGrid` | Technique / Watch-for glance cards from stage data | Yes — Study guide column |
| `StageGuideColumn` `.study-stage-notes` | Collapsible “Practical tips” (setup strip, explanation, checkpoint) | Yes — Study/Paint guide |
| `StageInstructorNote` | Single “Insight” line from `stage.paint.insight` | **No** — exported, zero imports |
| `ProjectMaterials` `mixingNote` | Palette mixing copy on Materials tab | Yes — Materials only |
| `studio-ref-notes` / `.studio-ref-notes-body` CSS | Reference viewer footnote styling | **No** — CSS only, no TSX reference |
| `.atelier-studio-note-*` CSS | Loading/wait layout beside painting | **No** — CSS only, no TSX reference |
| `.margin-notes`, glance/integrated note CSS blocks | Atelier/stage instructional layout | Yes — unrelated to learner notes |

### Data and persistence behavior found

- **Firestore reserved field:** `LessonSummary.notes: string` in `src/lib/lessons.ts`, initialized to `""` on `createLesson`, read in `toSummary` from `data.notes ?? ""`.
- **Comment in schema:** “Reserved for future milestones (persisted now, not yet surfaced in UI)”.
- **No write path:** no `saveNotes`, `updateNotes`, or `updateDoc(..., { notes })` helper; field is never updated after create.
- **No read path in UI:** `summary.notes` is never referenced outside `lessons.ts` / stability preview mock.
- **Scope:** field is lesson-wide on the project summary document, not stage-specific; no stage note map exists.
- **Stability preview:** mock summary includes `notes: ""` only for fixture completeness.

### Files migrated

None. No Notes presentation exists to tokenize without inventing a feature.

### Tokens introduced or reused

None. No `--ap-notes-*` tokens added (no consuming UI).

### Hard-coded values removed

None.

### Values intentionally retained

- Reserved `notes` Firestore field and read/create defaults unchanged.
- Instructor “Practical tips” / glance-note surfaces unchanged (Study Mode scope, already migrated).
- Orphan CSS (`.studio-ref-notes`, `.atelier-studio-note-*`, unmounted `StageInstructorNote`) left in place — removal is out of scope for this audit pass.

### Structural / editor / save / empty / error / responsive / accessibility changes

None — no Notes UI to modify.

### Functional concerns observed but not changed

- **Schema without surface:** `notes` is persisted on create but never loaded into an editor or saved back — implementing Notes later will need a write helper and UI mount, not just styling.
- **Documentation drift:** `docs/design/ui-patterns.md` still lists “Reference / Materials / **Notes** / Progress” as disabled during generation, but `LessonView` has no Notes tab (Materials and Progress are live tabs when lesson is ready).
- **Misleading migration list entry:** prior audit section 11 listed `StageInstructorNote` / `GuideNoteCard` under “Notes” — those are instructor guidance, not learner Notes.
- **Orphan artifacts:** `StageInstructorNote.tsx`, `.studio-ref-notes*`, `.atelier-studio-note-*` appear unused; safe cleanup would be a separate hygiene pass, not a Notes migration.

### Reason Notes was not exposed

Product constraint: live `LessonView` tab list must not gain a Notes tab. Audit found no hidden or unmounted learner Notes surface to migrate without building new navigation, persistence, and editor behavior.

### Unresolved Notes inconsistencies

- Reserved Firestore `notes` field vs zero UI/API write path.
- Orphan CSS and unmounted `StageInstructorNote` may confuse future Notes work — distinguish from learner notebook when implementing.
- `ui-patterns.md` Notes tab reference is stale relative to `LessonView`.

### Exact next migration target

**Progress** — `ProgressUpload`, `StatusPill`, Progress tab in `LessonView`, and related completion/upload styles in `globals.css`.

## Completed: Progress

### Files inspected

- `src/components/studio/LessonView.tsx` (Progress tab panel, `changeStatus`, `StatusPill` in eyebrow)
- `src/components/progression/ProgressUpload.tsx`
- `src/components/project/StatusPill.tsx`
- `src/components/progression/AtelierRibbon.tsx`
- `src/components/progression/StageCompletion.tsx` (final-upload placeholder + `progressSlot`)
- `src/components/progression/StudyMode.tsx` (read-only — mounts `StageCompletion` + `AtelierRibbon` hint)
- `src/components/progression/DeskStage.tsx` (read-only — `StageCompletion` without progress slot)
- `src/lib/lessons.ts` (`ProjectStatus`, `setProjectStatus`, `finishedImageUrl` reserved field)
- `src/lib/progression-images.ts` (read-only — stage image storage, not learner progress photos)
- `src/app/globals.css` (legacy `.progress-upload*`, `.study-completion-upload*`, `.atelier-ribbon*`, `.status-pill`)
- `src/app/globals-app-shell.css` (status pill shell overrides)
- `src/styles/artpraxis-tokens.css`
- `tests/stability-architecture.test.ts`
- `src/app/stability-preview/StabilityPreviewClient.tsx` (read-only)

### Active Progress components identified

Live Progress tab path:

- `LessonView` → `#lesson-panel-progress` → `ProgressUpload` (sole mounted progress surface)
- `changeStatus` → optimistic `setStatus` + `setProjectStatus` Firestore write; reverts on error
- `StatusPill` in lesson shell eyebrow (read-only display of same `projectStatus`)

Related but not duplicate controls:

- `StudyMode` end → `StageCompletion` + `AtelierRibbon` hint (redirect copy only; no status buttons or upload)
- `DeskStage` / Paint path → `StageCompletion` without `progressSlot` (not live)

**Not implemented in UI (documented, not invented):**

- Stage-by-stage progress rows or timeline
- Per-stage photo uploads, replace/remove, or previews
- Final painting upload with Firebase Storage (file input is UI-only stub; `onChange` no-op)
- `finishedImageUrl` read/write in UI
- `completionPercentage` display
- Loading/error states for uploads (no storage wiring)

Status model:

- Values: `not-started` | `in-progress` | `completed` (Firestore `projectStatus`)
- User-set via segmented buttons on Progress tab only
- `StatusPill` label for `completed` remains “Completed”; Progress buttons label it “Finished” (pre-existing)

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/progression/ProgressUpload.tsx`
- `src/components/project/StatusPill.tsx`
- `src/components/progression/AtelierRibbon.tsx`
- `src/components/progression/StageCompletion.tsx` (placeholder semantics/classes only)
- `src/app/globals.css` (scoped `.progress-workbench` block)
- `src/app/globals-app-shell.css` (status pill token aliases)
- `docs/design/TOKEN_MIGRATION_AUDIT.md`

### Tokens introduced or reused

Introduced `--ap-progress-*` (max-width, section gap, kicker, label, meta, summary surface, status colors for not-started / in-progress / finished, control surfaces, upload zone, final placeholder, ribbon border, mobile gap, control min-height).

Reused: `--ap-color-paper-*`, `--ap-kit-*`, `--ap-overview-body`, `--ap-study-image-*`, `--ap-radius-control`, `--ap-shadow-resting`, `--ap-color-focus-ring`, motion tokens.

### Hard-coded values removed

- Progress tab: legacy `.progress-upload--compact` uppercase title styling bypassed via new workbench structure
- Status pill shell overrides: hard-coded `rgba` / `#72501f` replaced with `--ap-progress-status-*` tokens
- Atelier ribbon hint: uppercase kicker / italic status replaced with tokenized sentence-case presentation in scoped block
- Stage completion upload placeholder: dashed `rgba(13,27,42,*)` and uppercase label styling superseded by `.progress-final-*` tokens

### Values intentionally retained

- `ProjectStatus` values and Firestore field names unchanged
- `setProjectStatus` persistence and optimistic revert on error unchanged
- File input `accept` list unchanged; `onChange` remains no-op (storage not wired)
- `projectStatusLabels.completed` = “Completed” in `StatusPill`; button label “Finished” preserved
- Legacy `.progress-upload*` rules left in cascade (older paths / stability preview); new tab uses `.progress-workbench`
- `finishedImageUrl`, `completionPercentage` schema fields untouched
- No stage-by-stage progress UI added

### Page hierarchy improvements

- Progress tab now uses `progress-workbench` with kicker, serif title, lead, and summary card (`StatusPill` + saving status)
- Lesson status and photo upload split into two semantic sections with `h3` headings

### Overall-status improvements

- `StatusPill` gains `status-pill--progress` modifier with tokenized state colors and dot indicator
- Saving state exposed with `role="status"` / `aria-live="polite"`

### Stage-progress improvements

None — no stage-by-stage progress surface exists in the mounted UI; documented for future milestone.

### Upload improvements

- File input uses stable `id` + `htmlFor`, visually hidden via clip pattern (not `hidden` attribute)
- Upload trigger uses inset-paper dashed zone with tokenized border/hover/focus
- No `object-fit: cover` added (no preview surface yet)

### Final-painting upload improvements

- `StageCompletion` placeholder uses `progress-final-placeholder` + `aria-labelledby` (label preserved: “Your finished work”)
- Tokenized dashed inset surface; sentence-case label via CSS

### StatusPill improvements

- Shared component: added `--progress` modifier class; tokenized state fills in workbench block and shell overrides
- Non-color dot indicator retained; `white-space: normal` for narrow mobile wrap

### Completion improvements

- `AtelierRibbon` hint tokenized; no duplicate status/upload controls at Study end (unchanged behavior)
- `StageCompletion` compare/review actions untouched

### Empty/loading/error improvements

- Saving indicator on Progress tab during `setProjectStatus`
- No upload error/loading UI added (no storage path)

### Responsive improvements

- Mobile: status controls stack full-width; summary card stretches; upload trigger full width
- Workbench max-width prevents overly wide line lengths

### Accessibility improvements

- Progress page heading hierarchy (`h2` page, `h3` sections)
- Status toggle `aria-pressed` preserved
- File input labeled via `htmlFor`
- Final placeholder uses labelled-by instead of generic `aria-label`
- Focus-visible on status options and upload trigger

### Functional concerns observed but intentionally not changed

- Photo upload is UI-only; no `uploadBytes`, preview URLs, or `finishedImageUrl` persistence
- No per-stage progress photos or replace/remove flows
- `completionPercentage` on lesson summary never surfaced
- `changeStatus` does not set `finishedImageUrl` when marking completed
- Study end `StageCompletion` upload area remains placeholder text
- Pre-existing label mismatch: StatusPill “Completed” vs Progress button “Finished”
- Legacy duplicate `.progress-upload` CSS blocks remain in `globals.css` cascade

### Unresolved Progress inconsistencies

- Task brief assumes richer progress UX than currently mounted; migration tokenized what exists
- `ui-patterns.md` may still describe progress features not yet built
- Orphan `.atelier-ribbon-option` / upload styles unused by live `AtelierRibbon` hint variant

### Exact next migration target

**Empty, error, and completion states** — `ProjectPlaceholder`, `ComingSoon`, `StageCompletion` celebration chrome, generation/error surfaces, and related styles in `globals.css`.

## Completed: Empty, error, and completion states

### Files inspected

- `src/components/project/ProjectPlaceholder.tsx` (unmounted)
- `src/components/studio/ComingSoon.tsx`
- `src/components/dashboard/EmptyState.tsx`
- `src/components/progression/StageCompletion.tsx`
- `src/components/progression/AtelierRibbon.tsx`
- `src/components/project/StatusPill.tsx`
- `src/components/studio/LessonView.tsx` (load error, not-found)
- `src/components/studio/LessonExperience.tsx` (generation error view)
- `src/components/studio/LessonLoadingView.tsx` (read-only)
- `src/components/studio/LessonCreator.tsx` (submit error)
- `src/components/studio/FinalPaintingRegenStatus.tsx`
- `src/components/progression/StageComparison.tsx` (cmp-pending / cmp-empty)
- `src/components/project/ProjectMaterials.tsx` (materials-empty)
- `src/components/AuthPanel.tsx` (read-only — already tokenized)
- `src/lib/lessons.ts` (`projectStatusLabels`)
- `src/app/globals.css` (empty-state, coming-soon, lesson-state, study-completion, cmp-pending, fp-regen)
- `src/styles/artpraxis-tokens.css`
- Route-level `error.tsx` / `not-found.tsx` / `loading.tsx` — **not present** in `src/app`

### Active state components identified

| Component | State type | Mounted? |
| --- | --- | --- |
| `EmptyState` | Dashboard empty | Yes |
| `ComingSoon` | Placeholder pages (coach, collections, favorites, practice, search) | Yes |
| `LessonView` not-found | Empty | Yes |
| `LessonView` load error | Error | Yes |
| `LessonExperience` `lesson-error-view` | Generation error + retry | Yes |
| `StageComparison` `cmp-pending` / `cmp-empty` | Image loading/unavailable/failed | Yes |
| `FinalPaintingRegenStatus` | Regeneration progress/error | Yes (when regen active) |
| `LessonCreator` `creator-error` | Form error | Yes |
| `ProjectMaterials` `materials-empty` | Empty list | Yes |
| `StageCompletion` + `AtelierRibbon` | Completion + hint | Yes (Study end) |
| `ProgressUpload` saving status | Passive status | Yes (Progress tab) |
| `AuthPanel` | Auth error | Yes |
| `ProjectPlaceholder` | Coming soon card | **No** (zero imports) |

### Classification

- **A. Active shared:** `EmptyState`, `ComingSoon`, `LessonView` empty/error wrappers, `lesson-error-view`, `cmp-pending`/`cmp-empty`, `materials-empty`
- **B. Active screen-specific:** `LessonCreator` error, `FinalPaintingRegenStatus`, `StageCompletion`
- **C. Active completion:** `StageCompletion`, `AtelierRibbon` hint, Progress “Finished” control
- **D. Legacy mounted:** Legacy `.cmp-pending` duplicate CSS blocks (cascade retained)
- **E. Legacy unmounted:** `ProjectPlaceholder`
- **F. Placeholder unimplemented:** `ComingSoon` studio routes (coach, collections, etc.)

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/components/dashboard/EmptyState.tsx`
- `src/components/studio/ComingSoon.tsx`
- `src/components/studio/LessonView.tsx`
- `src/components/studio/LessonExperience.tsx`
- `src/components/studio/LessonCreator.tsx`
- `src/components/studio/FinalPaintingRegenStatus.tsx`
- `src/components/progression/StageCompletion.tsx`
- `src/components/progression/StageComparison.tsx`
- `src/components/project/ProjectMaterials.tsx`
- `src/lib/lessons.ts` (display label only)
- `src/app/globals.css`

### Tokens introduced or reused

Introduced `--ap-state-*` and `--ap-completion-*` tokens. Reused `--ap-loading-error-*`, `--ap-overview-empty-background`, paper/ink, focus, progress control min-height.

### Hard-coded values removed

- `cmp-pending.error` `#f7e8e6` / `#7d2f28` superseded in scoped block
- `study-completion-kicker` uppercase/umber styling superseded by `.ap-completion` tokens
- `coming-soon` / `empty-state` hard-coded chrome partially tokenized via `.ap-state` modifiers
- Lesson load error bare `.status.error` replaced with tokenized error panel

### Values intentionally retained

- All error strings, retry handlers, and generation logic unchanged
- `LessonExperience` error `ui.headline` / `ui.detail` mapping unchanged
- `FinalPaintingRegenStatus` may still surface raw `error` string in title when present (pre-existing)
- `ProjectPlaceholder` unmounted — not redesigned
- Legacy duplicate CSS blocks retained in cascade
- `ComingSoon` pages remain placeholder routes (not product features)

### Empty-state improvements

- `EmptyState` and `LessonView` not-found use `ap-state--empty` with tokenized icon, title, body
- `ComingSoon` uses `ap-state--placeholder` with sentence-case kicker
- `materials-empty` aliased to `ap-state-empty` surface tokens

### Error-state improvements

- Lesson load error: semantic `role="alert"` panel with title + preserved message body
- `lesson-error-view` + `LessonCreator` errors use `--ap-state-error-*` surfaces
- Stage image failure: `ap-state-image-error` on `cmp-pending.error`
- `fp-regen-status--error` tokenized; error title uses `role="alert"` (polite live region removed for errors only)

### Image-unavailable improvements

- `cmp-empty` + `ap-state-image-empty`: dashed inset border, stable aspect-ratio container preserved
- `cmp-pending.error`: tokenized error surface without zero-height collapse

### Generation-error improvements

- `lesson-error-view` retains reference image + “Your reference is safe” caption
- Retry button styling unchanged; error card uses state error tokens

### Completion improvements

- `StageCompletion` + `ap-completion`: sentence-case kicker, tokenized title/body, top rule separator
- No confetti, badges, or green success cards added

### Status-language decisions

- `projectStatusLabels.completed` display text changed from **Completed** → **Finished** (enum `completed` unchanged)
- Aligns with Progress status buttons and `AtelierRibbon` hint
- Stage completion copy unchanged (“Painting complete”, “Compare finished work”)

### Live-region improvements

- `FinalPaintingRegenStatus`: `aria-live="polite"` only for non-error phases; `role="alert"` on error title
- Passive Progress saving and materials summaries unchanged
- No whole-page live regions added

### Responsive improvements

- State pages use mobile padding token; completion actions stack on narrow viewports
- Image unavailable containers retain aspect ratio

### Accessibility improvements

- Lesson load error gains heading + alert semantics
- Completion secondary action gets focus-visible ring
- Decorative icons remain `aria-hidden`
- Image empty/error copy remains visible text (not icon-only)

### Functional concerns observed but intentionally not changed

- `FinalPaintingRegenStatus` may render raw API error strings when `error` prop is set
- No route-level `error.tsx` / `not-found.tsx` in app directory
- `ProjectPlaceholder` duplicate of `ComingSoon` but unused
- Photo upload placeholders at Study end and Progress tab still unwired
- `cmp-pending` uses `aria-live="polite"` on whole pending block (pre-existing; not restructured)

### Unresolved state inconsistencies

- Multiple legacy `.cmp-empty`/`.cmp-pending` CSS blocks remain earlier in `globals.css`
- `ComingSoon` practice page mentions “streak” in description (product copy, not migrated)
- `EmptyState` headline “masterpiece” is marketing tone (pre-existing)

### Exact next migration target

**Mobile and tablet polish** — responsive sections in `globals.css`, `globals-app-shell.css`, lesson shell gutters, dock/FAB clearance, and narrow-viewport overflow fixes across migrated surfaces.

## Completed: Mobile and tablet polish

### Viewport matrix reviewed

Structural audit across: 1440×1000, 1280×800, 1024×768, 834×1194, 768×1024, 430×932, 390×844, 375×667, 320×568; plus conceptual checks for 200% zoom, short viewport heights, landscape mobile, long titles/copy, and portrait/landscape/square artwork. Browser visual verification was not completed in this pass (no authenticated dev session opened; no new lesson generated).

### Breakpoint inventory

| Value | Primary use | Classification |
| --- | --- | --- |
| 480px | Header menu label hide; materials filter grid | Narrow mobile / shell |
| 560px | Overlay labels, palette grid, materials | Narrow mobile / component |
| 640px | Auth panel padding; creator fields; loading chip | Mobile layout |
| 699px | App-main mobile gutter; lesson header; study gaps; compare segment grid | Mobile layout |
| 700px | Creator two-column min; desk layouts | Mobile/desktop split (pairs with 699) |
| 720px | Reference dock FAB; progress stack; panel peek; FAB clearance | Component-specific (dock) |
| 760px | App header mobile menu; lesson shell title/tabs; JS menu close (`innerWidth > 760`) | Global shell |
| 800px | Legacy desk/stage rules | Legacy / component |
| 820px | Studio reference image `sizes` attribute | Component (TSX) |
| 860px | Legacy layout | Legacy |
| 899px | Legacy breakpoints | Legacy |
| 900px | Creator stack; materials list; reference sizes | Tablet layout |
| 960px | Legacy | Legacy |
| 961px | Legacy min-width | Legacy |
| 980px | Overview dashboard stack; shell tablet gutters | Tablet layout |
| 1024px | Legacy max-width | Legacy |
| 1099px / 1100px | Study/Paint grid collapse; sticky workspace off; compare panels | Tablet layout |
| 1100px+ | Study/Paint desktop grid; sticky artwork | Desktop layout |

**JavaScript vs CSS:** Only layout JS is `AppHeader` menu close at `760px` — aligned with shell CSS. `matchMedia` is reduced-motion only (no layout breakpoints).

**Near-duplicate pairs intentionally retained:**

- **699 / 700** — off-by-one split for mobile rules vs `min-width:700px` desktop rules (cascade boundary).
- **720 / 760** — 720 controls reference dock FAB and bottom clearance; 760 controls global header and lesson shell chrome.
- **721** — dock desktop card mode threshold (pairs with 720 mobile FAB).
- **980 / 900** — 980 stacks overview dashboard; 900 stacks creator and materials grids (different surfaces).

### Breakpoints consolidated

- None merged in this pass — consolidation would risk changing cascade order across 100+ legacy media blocks. Duplicate study `@media(max-width:1099px)` blocks (lines ~9451 and ~10122) remain; behavior is identical for order/sticky rules.

### Breakpoints intentionally retained

See table above — especially 699/700, 720/760/721, 980/900, 1099/1100.

### Files migrated

- `src/styles/artpraxis-tokens.css`
- `src/app/globals.css` (append-only polish block)
- `src/app/globals-app-shell.css` (shell gutters, menu safe-area, lesson title wrap)
- `docs/design/TOKEN_MIGRATION_AUDIT.md`

No component TypeScript/TSX files modified — responsive pass is CSS/token only.

### Responsive tokens introduced or reused

**Introduced:** `--ap-safe-area-*`, `--ap-page-gutter-current`, `--ap-mobile-control-min-height`, `--ap-mobile-fab-clearance`, `--ap-mobile-section-gap`, `--ap-tablet-section-gap`, `--ap-mobile-dialog-gutter`, `--ap-mobile-panel-max-height`.

**Reused:** `--ap-shell-page-padding-inline-*`, `--ap-reference-panel-*`, `--ap-materials-check-size`, existing spacing and motion tokens.

### Horizontal overflow fixes

- Reinforced `min-width:0` / `max-width:100%` on auth, creator, overview dashboard, and error/state surfaces at ≤720px.
- `overflow-wrap:anywhere` on long error copy, material names, substitution text, loading banners.
- Instructional artwork `max-width:100%; object-fit:contain` guard on migrated image selectors.
- Retained intentional horizontal scroll on lesson primary tabs and stage navigation only.
- No new `overflow-x:hidden` on `body`/`html` (pre-existing `overflow-x:clip` on `html,body` and `.app-main` unchanged).

### Vertical-scroll and viewport-height fixes

- Loading/generation panels gain `max-height` + `overflow-y:auto` on short viewports (≤640px and landscape ≤560px height).
- Reference panel uses `84dvh` via `--ap-mobile-panel-max-height`.
- No rigid `100vh` traps added; modal/body-lock behavior untouched.

### Typography fixes

- Lesson shell title: removed `max-width:18ch` clamp in mobile shell — titles wrap with `text-wrap:balance`.
- Fullscreen reference head wraps on narrow widths.
- No new typography tokens; existing `clamp()` rules preserved.

### Touch-target fixes

At ≤720px, minimum ~44px applied to: overflow menu trigger/items, dock close, stage scroll nav buttons, compare segment buttons, final painting entry, progress status/upload, reference color toggle, materials ready controls, atelier ribbon summaries.

### Shell/header improvements

- Tablet/mobile `--app-main-pad-x` syncs with shell gutter tokens at 980px / 760px.
- Mobile menu respects safe-area top/bottom; menu toggle min-width 44px.
- Lesson title no longer artificially truncated at 18ch on mobile.

### Authentication improvements

- Panel and fields constrained to viewport; error/lead copy wraps at ≤720px.
- Existing 640px padding token retained.

### Create Lesson improvements

- Creator layout `min-width:0` at ≤720px; submit/change-image full-width at ≤640px.
- Workspace height tokens (900/640 breakpoints) unchanged; no upload logic changes.

### Loading improvements

- Wait panel scrollable on short/landscape viewports; long pipeline labels wrap.

### Overview improvements

- Dashboard meta grid single column at ≤720px; dashboard width 100% (overrides `min(760px)`).
- 980px stack rules retained from prior pass.

### Navigation improvements

- Stage nav touch targets enlarged without changing scroll-into-view logic.
- Tab horizontal scroll and nowrap preserved.

### Study improvements

- Sticky workspace still disabled below 1100px (unchanged).
- FAB/dock clearance extended to completion/progress tail content.
- Compare segment touch targets improved at mobile.

### Paint Mode observations

- Structural CSS already mirrors Study collapse at 1099px; not exposed in navigation. No Paint Mode changes required beyond shared touch-target and artwork-contain guards.

### Studio Reference improvements

- FAB clearance on all lesson surfaces; dock close 44px on mobile.
- Panel and fullscreen safe-area padding; panel nearly full width on mobile.
- Fullscreen head wraps controls.

### Materials improvements

- Ready controls meet 44px; header/actions stack on mobile.
- Filter grid 2-column at ≤480px; list already single column at 900px.

### Progress improvements

- Status/upload controls already stack at 720px; touch min-height reinforced.
- FAB clearance on progress workbench.

### State-system improvements

- Empty/error/completion surfaces use mobile padding token; long raw errors wrap safely.
- Completion actions stack at 720px (pre-existing, retained).

### Safe-area improvements

- Tokens centralize `env(safe-area-inset-*)` expressions.
- Applied to mobile menu, reference panel, fullscreen, and FAB bottom offset (pre-existing FAB offset retained and extended).

### Accessibility improvements

- Touch targets and focus-visible rings preserved/enlarged on mobile controls.
- Text wrapping prevents clipping at 200% zoom (structural).
- Keyboard tab/stage nav behavior unchanged.

### Functional concerns observed but intentionally not changed

- `AppHeader` menu closes on `resize` when `innerWidth > 760` — unchanged.
- Studio Reference focus restoration gap — unchanged.
- Progress photo upload still unwired.
- Paint Mode not exposed.
- `LessonView` hook-deps warning — unchanged.
- Full `npm run lint` still scans browser-profile artifacts under `docs/stability-shots/`.

### Remaining responsive inconsistencies

- Many legacy breakpoints (800, 860, 899, 960, 961, 1024) remain in `globals.css` for unmigrated or historical surfaces.
- Duplicate `@media(max-width:1099px)` study blocks could be merged in a future cleanup pass.
- `699px` app-main padding rule in `globals-app-shell.css` overlaps new 760px gutter token (harmless redundancy).
- Browser visual QA across full viewport matrix still pending.

### Exact next target

**Full visual QA and screenshot readiness audit**

## Completed: Full visual QA and screenshot readiness audit

### Final QA status (continued pass)

- Branch/HEAD unchanged: `feature/stability-ui-cleanup` @ `b397335`; checkpoint `08f1495` intact
- Authenticated session working; ready lesson `eJcl58mY5ox6TRlizyB5` used; **no new generation**
- Full viewport matrix (1440→320) completed for Overview, Study, Materials, Progress — no page-level overflow-X; artwork `contain`
- Studio Reference panel + fullscreen + Overlay/opacity verified; Escape closes; warm studio chrome
- 200% zoom (CSS zoom), reduced-motion, mobile menu verified
- Shell fixes retained (menu grid-area + open-menu z-index); no auth/generation/upload logic changes
- Validation: typecheck / test (98) / build pass
- Detail log: `docs/design/VISUAL_QA_SCREENSHOT_READINESS.md`

### Overall readiness decision

**NOT READY** (conservative) — lesson screenshot candidates 3–13 pass browser review with zero Blocker/High defects; still blocked for full READY by Create selected-image unverified, loading unverified, and incomplete keyboard/focus proof (including known missing focus-return after Studio Reference close).

### Exact next step

Verify Create at `/studio/new` without generating; finish keyboard/focus proof or defer as a11y debt; confirm Progress status for capture; then capture candidates 3–13 or reassess.
