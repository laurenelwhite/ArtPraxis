# Lesson Document Redesign

Status: First implementation pass
Branch: `feature/stability-ui-cleanup`
Date: 2026-08-03

## Source-derived pedagogical principles

Applied as general studio pedagogy only (not copied from any specific book or page design):

- Observe before acting
- Understand form and structure before detail
- Plan composition and negative space
- Establish line and value before color commitment
- Test mixtures before large passages
- Build physical media progressively
- Refine selectively
- Evaluate rather than copy mechanically

Experience principle: **the final painting is the teacher**. The interface should feel like a premium artist’s workbook and studio assignment, not a SaaS dashboard, wizard, or slideshow.

## Original ArtPraxis lesson model

Stored progression remains fixed at six stages:

1. `pencil-sketch`
2. `value-study`
3. `first-wash`
4. `second-wash`
5. `refinement`
6. `finished`

Authoritative sources:

- `src/lib/progression.ts` (`StageId`, `buildProgression`)
- `src/lib/stage-icons.ts` (`STAGE_PROCESS_ORDER`, `STAGE_DOM_ID`)
- `src/lib/stage-image-prompts.ts` (generation order)
- Firestore `users/{uid}/projects/{id}/detail/progression` → `stages[]`

Tutorial analysis is distributed across `overview`, `composition`, `visualGuides`, `valueMap`, `palette`, `materials`, `creativeChoices`, and `steps` (`src/lib/tutorial-schema.ts`). There is no separate persisted `tutorial-analysis` object.

## Live component map

```
/studio/lessons/[id]
  → LessonView
    → StudioReferenceProvider
      → LessonShell (destination tabs: Overview / Lesson / Studio Reference / Materials / Progress)
        → LessonExperience (finite loading/error or continuous Study)
          → StudyMode (continuous document)
            → StageScrollNav / Lesson step map
            → LessonPlanSection
            → LessonObserveSection
            → StudyStageSection × 6 (Draw…Finish)
            → LessonColorSection (between Values and First layer)
            → StageCompletion (Finish coda)
```

## Existing schema limitations

| Desired section | Stored source | Limitation |
|---|---|---|
| Plan | Overview + meta + skills | Not a generated stage; no independent deep-link in old schema |
| Observe | composition / valueMap / visualGuides | Warm/cool, negative space, personality only when fields exist |
| Draw | `pencil-sketch` | Direct |
| Values | `value-study` | Direct |
| Color | `tutorial.palette` | No generated image plate |
| First layer | `first-wash` | Direct |
| Build | `second-wash` | Direct |
| Refine | `refinement` | Direct |
| Finish | `finished` + completion UI | Direct |

This pass does **not** mutate persisted lessons, stage order, generation prompts, or Firestore records.

## Continuous-document architecture

- Every pedagogical section mounts in document order after lesson data resolves.
- Stages are not swapped, paginated, hidden, or unmounted for navigation.
- Active section tracking uses existing `useActiveStage` IntersectionObserver.
- Stage image records still arrive via one progression `onSnapshot` (not per-stage client fetches).
- Background regeneration banners remain non-blocking.

## Presentation mapping (six stages → nine sections)

| Map label | DOM id | Source |
|---|---|---|
| Plan | `lesson-section-plan` | Tutorial overview + reference/final pair |
| Observe | `lesson-section-observe` | Composition / value / guides |
| Draw | `lesson-stage-sketch` | `pencil-sketch` |
| Values | `lesson-stage-value-study` | `value-study` |
| Color | `lesson-section-color` | Palette / materials notes |
| First layer | `lesson-stage-first-wash` | `first-wash` |
| Build | `lesson-stage-second-wash` | `second-wash` |
| Refine | `lesson-stage-refinement` | `refinement` |
| Finish | `lesson-stage-final-touches` | `finished` + completion coda |

Legacy stage hashes remain supported through existing stage DOM ids.

## Top lesson-map behavior

- Landmark: `<nav aria-label="Lesson steps">`
- One horizontal row; scrolls horizontally when needed
- Active item uses `aria-current="step"` plus underline/weight (not color alone)
- Click scrolls to section; may update URL hash without full navigation
- Active item auto-centers on narrow rails
- Not implemented as `role="tablist"` / `tab` / `tabpanel`
- No Previous/Next pagination in Study Mode
- Destination tabs and step map stay in document flow (no stacked sticky chrome)
- Desktop artwork workspace may remain sticky within a stage only

## Section anatomy

Reusable hierarchy for generated stages:

1. Section number and title
2. One-sentence purpose
3. Large target artwork (`object-fit: contain`)
4. What changes now
5. Ordered actions
6. Technique / mixture notes
7. Visual checkpoint
8. Common mistake
9. Creative liberty
10. Quiet transition cue (“Next: …”)

## Medium-specific adaptation

Map labels stay pedagogical (`First layer`, `Build`, …). Section titles may use medium vocabulary (e.g. watercolor “First wash”) via `resolveDocumentSectionTitle` without renaming `StageId`.

## Responsive behavior

Validated intent across desktop → phone widths:

- Full lesson remains vertically scrollable
- No page-level horizontal overflow; step rail may scroll horizontally
- Artwork uncropped (`contain`)
- Mobile order: identity → artwork → guidance
- No fixed viewport trap / stacked sticky wall

## Accessibility decisions

- Semantic headings per section
- Lesson-steps nav landmark
- Unique section ids / anchors
- Visible focus rings
- Logical DOM order; no positive `tabindex` added
- `aria-current="step"` on active map item
- Reduced-motion honored for scroll centering
- Meaningful alt text on artwork; decorative marks `aria-hidden`

## Files changed

- `src/lib/lesson-document.ts` (new)
- `src/components/progression/LessonPlanSection.tsx` (new)
- `src/components/progression/LessonObserveSection.tsx` (new)
- `src/components/progression/LessonColorSection.tsx` (new)
- `src/components/progression/StudyMode.tsx`
- `src/components/progression/StageScrollNav.tsx`
- `src/components/progression/StudyStageSection.tsx`
- `src/components/progression/StageTeachingHeader.tsx`
- `src/components/progression/StageGuideColumn.tsx`
- `src/components/progression/StageContinueNav.tsx`
- `src/components/progression/StageCompletion.tsx`
- `src/components/progression/PaintMode.tsx` (API compatibility only)
- `src/components/progression/useActiveStage.ts` (comments)
- `src/components/shell/LessonShell.tsx` (comments)
- `src/app/globals.css`
- `src/app/globals-app-shell.css`
- `docs/design/LESSON_DOCUMENT_REDESIGN.md` (this file)
- `docs/design/TOKEN_MIGRATION_AUDIT.md` (pointer entry)

## Future generation-schema recommendations

1. Optional structured observation fields (directional movement, negative spaces, personality trait) persisted explicitly
2. Optional dedicated color-test plate or mixture-strength schema per medium
3. Optional Plan/Observe section metadata without forcing nine generated images
4. Avoid inventing missing plates; keep Plan/Observe/Color as composable document sections unless product requires generated imagery

## Deliberately not changed

- Firebase authentication / ownership / API authorization
- Image-generation prompts, model, and sequential refinement orchestration
- localStorage keys and progress persistence
- Upload destination and Progress behavior
- Route structure
- Notes / Paint Mode exposure as a user-facing dual model
- Package dependencies / lockfiles
- Brand source-of-truth assets
- Untracked QA scripts
- Screenshot automation
- Generic token migration of unrelated surfaces

## Visual art-direction pass (2026-08-03)

### Real lesson used

- URL: `http://127.0.0.1:3001/studio/lessons/eJcl58mY5ox6TRlizyB5`
- Title: Beginner Watercolor: Poolside Hedges, Grass and Floating Baskets
- Auth: existing email/password session (`artpraxisai@…`)
- No new lesson generation

### Before-state findings

- Lesson title still rendered at gallery scale (~37.6px) because `.lesson-view .lesson-title` overrode shell-title rules
- Plan treated reference and final as equal-weight peers
- Observe was text-only; analysis not image-adjacent
- Stage compare defaulted to `both`, splitting the workspace so targets were ~250px tall
- Desktop guidance sat left of artwork, reducing first-glance painting weight
- Step-map visible labels duplicated full+short text for assistive aggregation
- First wash / Build / Refine targets frequently empty (`naturalWidth: 0`) on this lesson

### Visual hierarchy decisions

- Compact masthead title via higher-specificity shell/title selectors (~22px desktop)
- Plan: artwork before brief; final painting wider than reference (~458 vs ~318)
- Observe: reference figure + numbered observations side-by-side
- Stage workspace left, compact guidance right on desktop
- Default compare mode `target` so the stage plate dominates; reference remains in Tools
- Quieter section titles; typographic guidance hierarchy instead of card stacks
- Value-family legend and “what remains unfinished” notes added from existing data only

### Section-by-section changes

| Section | Change |
|---|---|
| Masthead | Compact title cascade fix; quiet meta preserved |
| Plan | Final-dominant pair; intention moved under artwork |
| Observe | Image-adjacent numbered analysis |
| Draw–Finish | Artwork-first grid; larger target plate; unfinished cue |
| Values | Value-family legend from `valueMap` |
| Color | Unchanged structure; painterly note styling retained |
| Mobile | Stack Plan pair; identity → artwork → guidance order |

### Physical-art progression audit

Lesson: `eJcl58mY5ox6TRlizyB5` (watercolor)

| Stage | Classification | Visible issue | Future generation recommendation |
|---|---|---|---|
| Draw (`pencil-sketch`) | B | Construction is extremely faint; readable as light graphite but hard to study on screen | Generate a clearer paint-ready construction with visible axes/major shapes while remaining light |
| Values (`value-study`) | A/B | Legible value map present; still soft | Keep pale paper whites; avoid muddy grayscale filters |
| First wash (`first-wash`) | E | Target image unloaded / empty plate in live review | Ensure first-wash plate always lands before atelier open, or show honest awaiting state with dimensions |
| Build (`second-wash`) | E | Empty target plate | Same as first wash; plate must show incomplete color building, not blank |
| Refine (`refinement`) | E | Empty target plate | Same; selective edge/accent plate required |
| Finish (`finished`) | A | Final painting reads as credible completed watercolor | Preserve master as teaching destination; do not fade it for earlier stages |

### Desktop findings

- Title compact; destination tabs + step map remain non-sticky
- Artwork workspace sticky on wide desktop; guidance compact
- Target-default compare yields ~680×450–510 artwork weight
- No page-level horizontal overflow on 1480-wide lesson scroller

### Mobile findings (390×844)

- Title ~18px; step map horizontal
- DOM order: head → artwork → guide
- No `app-main` overflow-X
- Build/First-wash plates still empty (generation gap, not layout)

### Remaining schema and generation gaps

- Empty mid-stage plates on this ready lesson
- Drawing plate too faint for instructional clarity
- No multi-step drawing developmental assets (construction vs corrected)
- Observe fields still inferred from composition/guides rather than dedicated analysis schema

### Screenshots still needed for user approval

Temporary browser captures were reviewed in-session and **not** added to the repository. User should review:

1. Masthead + step map
2. Plan (final-dominant)
3. Observe (image + numbered notes)
4. Draw / Values / Color / First layer / Build / Refine / Finish
5. Mobile Draw and Mobile Build

Exact next step: **user visual approval of those screenshots, then narrowly targeted revisions.**
