# Visual QA and Screenshot Readiness

## Audit metadata

- Date: 2026-07-28 (continued pass)
- Branch: `feature/stability-ui-cleanup`
- HEAD: `b397335` (`Checkpoint lesson surfaces and state system`)
- Previous checkpoint preserved: `08f1495` (`Checkpoint design system and core UI migrations`)
- Audit operator: Cursor agent with local browser MCP
- Nothing committed or pushed in this pass

## Local environment

- Dev command: `npm run dev -- --hostname 127.0.0.1 --port 3001`
- Local URL: `http://127.0.0.1:3001`
- Browser: Cursor IDE browser (`cursor-ide-browser` MCP)
- Measurement note: lesson scroll lives on `.app-main.app-main--lesson` (not `documentElement`); overflow and scroll checks use that scroller

## Authentication

- Method: email/password (Google popup = Cursor-browser limitation)
- Session: **authenticated and usable** throughout this pass
- Refresh persistence: **Pass** (earlier)
- Mobile Sign out: fixed earlier (menu stacking + header z-index); not re-signed-out unless needed
- Auth code: unchanged; no `globalThis` Firebase singleton

## Test lesson used

- Lesson ID: `eJcl58mY5ox6TRlizyB5`
- Title: Beginner Watercolor: Poolside Hedges, Grass and Floating Baskets
- No new lesson generation triggered
- Prior ID `z18kzOR6So0eV1xCQQRc`: Project not found on this account

## Completed viewport matrix (ready lesson)

Checked at every size for Overview, Lesson (Study), Materials, Progress:

| Viewport | Overview | Lesson | Materials | Progress | Notes |
| --- | --- | --- | --- | --- | --- |
| 1440×1000 | Pass | Pass | Pass | Pass | Desktop sticky artwork on Study |
| 1280×800 | Pass | Pass | Pass | Pass | Sticky artwork on |
| 1024×768 | Pass | Pass | Pass | Pass | Sticky artwork off |
| 834×1194 | Pass | Pass | Pass | Pass | Sticky off (tablet) |
| 768×1024 | Pass | Pass | Pass | Pass | Sticky off |
| 430×932 | Pass | Pass | Pass | Pass | Stage rail may extend past edge (intentional horizontal scroll) |
| 390×844 | Pass | Pass | Pass | Pass | Mobile menu open/close/Escape |
| 375×667 | Pass | Pass | Pass | Pass | Mobile menu |
| 320×568 | Pass | Pass | Pass | Pass | Title wraps; logo/menu no collision |

Common pass criteria observed:

- No page-level horizontal overflow (`overflowX` false on document + `.app-main`)
- Vertical scrolling available via `.app-main` where content exceeds viewport
- Artwork `object-fit: contain` (no `cover` on visible lesson images)
- Warm paper background `rgb(242, 236, 227)`
- Single Overview primary CTA (`Begin lesson`)
- No dock on Overview; Studio Reference FAB present on Lesson surfaces

## Overview

- Final painting + Reference pair early; labels **Reference** / **Final painting**
- Images contain; mixed aspect ratios readable
- One dominant Begin action
- No dock on Overview
- Long title wraps at 320 without breaking nav
- Screenshot-ready classification: **desktop + tablet + mobile rendered and reviewed** → Overview candidate **Pass**

## Study Mode

- Six stages mounted: sketch → value → first wash → developing → refinement → final accents
- Continuous scroll works; stage rail click scrolls to anchors
- Sticky artwork on desktop (≥1280); disabled at ≤1024 / tablet / mobile
- Stage targets contain; tips secondary; transition cues present
- Final completion treatment calm (`Review previous stages` secondary, not gamified)
- Dock/FAB does not create page overflow

## Studio Reference — panel

- Opens from dock Compare / Studio Reference affordance
- Closes (button + Escape)
- Warm studio background `rgb(248, 244, 237)`
- Close control visible; body overflow locked while open, restored on close
- Modes: Side by side, Overlay, Reference only, Final painting only
- Images contain; no black/cold viewer chrome
- No page-level horizontal overflow

## Studio Reference — fullscreen

- Opens (often with panel); warm background
- Escape closes fullscreen (**Pass** via real Escape key)
- Close control visible; body scroll lock restored
- Side-by-side / overlay fit; short heights usable in tested sizes
- **Known missing:** focus does not return to the open trigger after close (focus lands on `BODY`) — document only; not fixed this pass

## Overlay / opacity

- Overlay selectable; active state clear (`is-active` / checked radio)
- Opacity slider `aria-label="Final painting opacity"` visible in Overlay
- Opacity updates image style when set through browser fill (verified `0.2`)
- Images remain `object-fit: contain`; no crop/stretch
- Reference only / Final only / Side by side cycled
- Study-stage “Target opacity” slider is separate from Studio Reference opacity (do not confuse)
- Arrow-key opacity: not cleanly isolated in this browser after fill; treat as **partial**

## Materials

- Palette near top; swatches readable; filter targets ~44px (`All`)
- Mark ready / checklist interaction works
- Long names wrap; thumbnails contain
- Quantity/specification often absent = **existing product limitation**, not regression
- No ecommerce appearance; no page overflow across matrix

## Progress

- Status buttons work (Not started / In progress / Finished); saving copy appears
- File-input / Upload photo placeholder present; no fake stage-photo history
- Upload remains unwired product functionality (documented, not implemented)
- Note: QA click left status as **In progress** during verification; confirm desired status before marketing capture

## Mobile menu and navigation

- 430 / 390 / 375 / 320: open, close, Escape close
- Menu items: Studio, Create a lesson, Sign out (no grid-area overlap)
- Header z-index 60 when menu open
- Logo and menu trigger do not collide at 320
- Lesson tabs and stage nav remain horizontally scrollable rails (not page overflow)

## 200% zoom

- Emulated via `document.documentElement.style.zoom = '200%'` (CDP pageScaleFactor did not change visualViewport in this browser)
- Overview / Lesson / Materials / Progress: no page-level overflow-X
- Begin lesson reachable after scroll
- Modal/panel close controls remain reachable
- Zoom reset after test

## Reduced motion

- `prefers-reduced-motion: reduce` emulated
- Fade animations collapse to ~`1e-06s`
- `scroll-behavior: auto`
- Studio Reference usable without depending on motion
- Content remains present; controls usable
- Emulation cleared after test

## Keyboard / focus

| Check | Result |
| --- | --- |
| Escape closes menu / fullscreen / panel | Pass |
| Logical focus order (shell → tabs → actions → Studio Ref) | Pass (programmatic) |
| Opacity slider accessible name | Pass |
| Focus return to trigger after Studio Ref close | **Fail / known missing** |
| Visible `:focus-visible` rings via real Tab | **Incomplete** in Cursor browser (Tab often does not advance; scripted focus shows `outline: none`) |
| Full keyboard-only Materials/Progress traversal | Partial |

Do **not** claim full keyboard accessibility passed.

## Console / runtime

- No fatal React crash on ready lesson surfaces during this pass
- Next.js Dev Tools present (dev only)
- Hydration: no blocking hydration failure observed on lesson reload
- Classify: no new screenshot-blocker runtime defects recorded this pass
- Progress status write during QA = expected live Firebase write (environment), not a visual defect

## Defects by severity

### Blocker

- None verified this pass

### High

- None verified this pass

### Medium

- Focus does not return to Studio Reference trigger after panel/fullscreen close (a11y)
- Visible keyboard focus rings not proven in Cursor browser Tab automation
- Progress screenshot candidate may show **In progress** after QA status click (state hygiene before capture)

### Low

- Stage rail buttons (e.g. Stage 6) extend past viewport width by design (horizontal rail scroll)
- Create Lesson route is `/studio/new` (not `/studio/create`); selected-image state not re-verified this pass

### Known product limitations (not regressions)

- Photo upload unwired
- Material quantity/specification often absent
- Loading/generation not exercised (no new generation)
- Paint Mode not exposed
- Notes not implemented

## Defects fixed this continued pass

- None (no new High/Blocker render defects requiring CSS/code fixes)

### Prior shell fixes still present (uncommitted)

1. Mobile menu `grid-area` reset so Sign out is not under Create a lesson (`globals-app-shell.css`)
2. `.app-header.is-menu-open { z-index: var(--ap-shell-z-menu) }` so overlay no longer intercepts Sign out
3. Related token z-index additions in `artpraxis-tokens.css`
4. Mobile/tablet polish in `globals.css` (uncommitted)

## Screenshot-candidate matrix

| # | Candidate | Viewport | State | Lesson | Result | Artwork focus | ArtPraxis clear | Incomplete UI visible | Safe to capture later |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Create Lesson — selected image | — | — | — | Unverified | — | — | — | No until verified at `/studio/new` |
| 2 | Loading and generation | — | — | — | Unverified | — | — | — | No (do not trigger generation) |
| 3 | Lesson Overview | 1440 / tablet / mobile | Ready | eJcl58mY5ox6TRlizyB5 | Pass | Yes | Yes | No | Yes |
| 4 | Study — drawing | Desktop + mobile spot | Stage 1 | same | Pass | Yes | Yes | No | Yes |
| 5 | Study — paint-building | Desktop | Mid stages | same | Pass | Yes | Yes | No | Yes |
| 6 | Study — final stage | Desktop | Final accents | same | Pass | Yes | Yes | No | Yes |
| 7 | Studio Reference — side by side | Desktop + 430 | Panel/FS | same | Pass | Yes | Yes | No | Yes |
| 8 | Studio Reference — overlay | Desktop + 430 | Overlay + opacity | same | Pass | Yes | Yes | No | Yes |
| 9 | Materials | Full matrix | Checklist | same | Pass | Secondary | Yes | Qty/spec absent (known) | Yes |
| 10 | Progress | Full matrix | Status + upload placeholder | same | Pass* | N/A | Yes | Upload unwired (known) | Yes* after status hygiene |
| 11 | Mobile Lesson Overview | 430/390/375/320 | Ready | same | Pass | Yes | Yes | No | Yes |
| 12 | Mobile Study Mode | 430+ | Lesson tab | same | Pass | Yes | Yes | No | Yes |
| 13 | Mobile Studio Reference | 430 | Panel/FS/overlay | same | Pass | Yes | Yes | No | Yes |

\*Confirm Progress status button state before marketing capture.

Paint Mode: structurally deferred / not exposed.

## Validation (this pass)

- `npm run typecheck` — Pass
- `npm test` — Pass (98)
- `npm run build` — Pass (existing LessonView hooks warning only)
- `git diff --check` — Pass (CRLF warnings only)
- Diff scan: no new `!important`, `object-fit: cover` on lesson artwork, credentials, or local paths introduced in this continued QA pass
- Untracked scripts untouched
- Nothing committed; branch ahead of origin by 2 (checkpoints only)

## Final go/no-go decision

**NOT READY**

Reason (conservative):

- Core ready-lesson screenshot surfaces (Overview, Study, Studio Reference including overlay/fullscreen, Materials, Progress, mobile) are browser-verified with **zero Blockers and zero High** defects
- Remaining readiness gaps that still block a full “READY” claim:
  1. Create Lesson selected-image candidate unverified
  2. Loading/generation intentionally unverified
  3. Keyboard/focus not fully passed (focus-return missing; focus-visible not proven)
  4. Progress live status may need reset before capture

## Exact next action

Resolve the exact remaining screenshot-readiness blockers:

1. Verify Create Lesson selected-image at `http://127.0.0.1:3001/studio/new` without starting generation
2. Finish keyboard focus-visible proof (or accept as deferred a11y debt outside marketing stills)
3. Confirm Progress status presentation for capture
4. Then begin marketing screenshot capture for candidates 3–13 only, or re-run readiness decision
