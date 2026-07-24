# Component Architecture Improvements

## Purpose

Document the 2026-07-24 component-architecture audit and the maintainability changes that followed. Scope is structure only — Study vs Paint behavior and visual design were preserved unless noted.

## Related Documents

- [Architecture](./ARCHITECTURE.md)
- [Component Principles](./design/component-principles.md)

## Last Reviewed

2026-07-24

---

## Live progression spine (after cleanup)

```
LessonExperience
├── StudyMode → StageScrollNav + StudyStageSection[] + StageCompletion
└── PaintMode → StageProcessRail (inline chrome) + DeskStage (+ StageCompletion when last)
         └── both → StageComparison → AnnotatedImage | target AppImage
                    + StageGuideColumn → LessonSummaryGrid / GuideNoteCard
                                      + Materials / Notes collapses
```

## Improvements

### 1. Removed dead components

Deleted unused exports with zero app importers:

| Removed | Replaced by / reason |
|---------|----------------------|
| `TutorialView` | Study/Paint + `AnnotatedImage` |
| `StageImageView` | `StageComparison` uses `AppImage` directly |
| `StageMistake`, `StageFocusPanel` | Orphan panels; helpers stay in `stage-focus.ts` |
| `LearningCard` | `GuideNoteCard` + `LessonSummaryGrid` |
| `LessonMeta`, `StudyIndex`, `StageChapter`, `StageProgressStepper` | Aliases / superseded nav |
| `PaletteSuppliesPreview` (+ `PaletteStrip`) | `StagePalette` / chips |
| `StageIconArtwork` | Unused artwork overlays |
| `StageGenerationView` | UI state never returned `"stageGenerating"` |
| `MaterialCard` | `ProjectMaterials` inlines workbench cards |
| `RedirectIfAuthed` | `HomeGate` handles auth gate |
| `ArtPraxisDotLoader.demo` | Demo never imported |
| `StageNav` | Thin wrapper; `PaintMode` calls `StageProcessRail` |
| Brand: `BrushStroke`, `BrushProgress`, `PaintedCheckmark`, `ArtworkBrandAccent` | Unused; prefer `ArtPraxisLogo` / `ArtPraxisLoadingMark` |

Also removed unused exports: `CREATOR_PIPELINE`, `ART_PRAXIS_LOGO_ASSETS`, `ART_PRAXIS_LOGO_SIZES`.

### 2. Removed dead state / prop drilling

- Dropped unused `imageUrl` from `StudyMode` props (still used by `LessonExperience` for progression build).
- Dropped unused `masterImageUrl` drill through Paint → rail.
- `LessonSummaryGrid` now only takes `stage` (removed unused `tutorial` / `medium` / `instruction`).
- Removed `"stageGenerating"` from `LessonUiState` (never produced by `resolveLessonUiState`).

### 3. Shared stage primitives

| Primitive | Role |
|-----------|------|
| `src/lib/stage-copy.ts` | `firstSentence`, `buildTeachingPoint`, `excerpt` |
| `src/lib/paint-material-id.ts` | Shared `paint:${name}` id helper |
| `stage-shell-props.ts` | `StageShellBaseProps` / `StageModeBaseProps` |
| `StageTeachingHeader` | Index · label · teaching point (`variant: study \| paint`) |
| `StageGuideColumn` | Summary + Materials + Notes (variant class trees) |
| `StageContinueNav` | Shared next-stage control |
| `GuideNoteCard` | Single studio-guide-card primitive |

Desk and Study shells compose these instead of copy-pasting the guide tree.

### 4. Reduced render depth

- Removed `StageNav` indirection (`PaintMode` → `StageProcessRail`).
- Shared guide column collapses duplicated materials/notes nesting in both shells.
- Study sticky observer constants named and aligned with CSS tokens (`--ap-bp-stage-sticky`, `--ap-offset-stage-sticky`).

### 5. Naming standardization

| Prefer | Avoid |
|--------|--------|
| `StageProcessRail` | `StageProgressStepper`, `StageNav`, `StudyIndex` |
| `StudyStageSection` | `StageChapter` |
| `StageScrollNav` (Study) / `StageProcessRail` (Paint) | Generic “nav” aliases |
| `GuideNoteCard` / `studio-guide-card` | `LearningCard` / `learning-note` |
| `StagePalette` + `StageMaterialsChips` | `PaletteSuppliesPreview` / `PaletteStrip` |
| Brand: `ArtPraxisLogo`, `ArtPraxisLoadingMark`, `PaintbrushMark` | BrushStroke / BrushProgress / PaintedCheckmark |

Mode CSS class trees (`desk` / `atelier` / `study-stage-*`) stay for visual compatibility; do not rename class names without a design pass.

### 6. Spacing & typography tokens

Canonical consumer scale (defined in `:root`):

- Spacing: `--ap-space-1` … `--ap-space-12`
- Type: `--ap-text-xs`, `--ap-text-sm`, `--ap-text-body`, `--ap-text-lg`, `--ap-text-title`, `--ap-text-display`
- Stage sticky layout: `--ap-bp-stage-sticky` (1100px), `--ap-offset-stage-sticky` (120px)

Touched live Study stage rules now use `--ap-space-*` / `--ap-text-sm` where values matched exactly (no visual drift). New lesson CSS should use `--ap-*` tokens; do not introduce new raw `px`/`rem` for the same steps.

Color aliases (`--color-*`, `--brand-*`, `--ink`/`--paper`) remain for backward compatibility.

### 7. Orphan CSS removed

Purged styles only referenced by deleted components, including:

- `.learning-note*`
- `.stage-focus*` / `.stage-mistake*`
- `.palette-supplies*` / `.atelier-materials*`
- `.atelier-target*` (no TSX consumers)
- `.lesson-meta*` (component deleted)

Mixed selectors that still style live classes (e.g. `.stage-setup`) were kept.

### 8. What was intentionally not changed

- Study continuous scroll vs Paint single-active-stage product model
- Compare / overlay interaction and annotation geometry
- Lesson orchestration / `resolveLessonUiState` ready-path semantics
- Visual brand direction and medium accents
- Unifying Desk + Study into one shell with `variant` (deferred — shared primitives first)
- Full globals.css token migration (incremental only on touched rules)

## Follow-ups (optional)

1. Merge remaining Study/Paint shells into one `StageShell` after a visual regression pass.
2. Continue replacing magic sizes in atelier CSS with `--ap-space-*` / `--ap-text-*`.
3. Consider a shared `LessonThumbMeta` for `LessonCard` / `LeadProject` (related, not identical).
