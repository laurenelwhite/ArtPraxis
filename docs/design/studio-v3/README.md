# ArtPraxis Studio v3 — Design Source of Truth

**Purpose:** Permanent index for every Studio v3 design decision, specification, implementation pass, and QA result. The repository—not chat history—is the source of truth.

**Status:** Structure established. Content marked “Pending design review” until approved.

**Related baseline:** Continuous lesson-document implementation on `feature/stability-ui-cleanup` (see `docs/design/LESSON_DOCUMENT_REDESIGN.md`).

---

## Core specifications

| Document | Purpose |
|---|---|
| [STUDIO_V3_PRODUCT_SPEC.md](./STUDIO_V3_PRODUCT_SPEC.md) | Product goals, scope, non-goals, and success criteria |
| [STUDIO_V3_VISUAL_DIRECTION.md](./STUDIO_V3_VISUAL_DIRECTION.md) | Visual art direction, hierarchy, and brand application |
| [STUDIO_V3_INTERACTION_SPEC.md](./STUDIO_V3_INTERACTION_SPEC.md) | Interaction patterns, navigation, and state behaviors |
| [STUDIO_V3_RESPONSIVE_SPEC.md](./STUDIO_V3_RESPONSIVE_SPEC.md) | Breakpoints, layout rules, and mobile adaptations |
| [STUDIO_V3_COMPONENT_INVENTORY.md](./STUDIO_V3_COMPONENT_INVENTORY.md) | Components in scope and their design responsibilities |
| [STUDIO_V3_IMPLEMENTATION_PLAN.md](./STUDIO_V3_IMPLEMENTATION_PLAN.md) | Phased implementation order and acceptance gates |
| [STUDIO_V3_DECISION_LOG.md](./STUDIO_V3_DECISION_LOG.md) | Dated decisions with rationale, alternatives, and status |

## Screen specifications

| # | Screen | Document |
|---|---|---|
| 01 | Create lesson | [screens/01-create-lesson.md](./screens/01-create-lesson.md) |
| 02 | Generation | [screens/02-generation.md](./screens/02-generation.md) |
| 03 | Lesson plan | [screens/03-lesson-plan.md](./screens/03-lesson-plan.md) |
| 04 | Observe | [screens/04-observe.md](./screens/04-observe.md) |
| 05 | Draw | [screens/05-draw.md](./screens/05-draw.md) |
| 06 | Values | [screens/06-values.md](./screens/06-values.md) |
| 07 | Color | [screens/07-color.md](./screens/07-color.md) |
| 08 | First layer | [screens/08-first-layer.md](./screens/08-first-layer.md) |
| 09 | Build | [screens/09-build.md](./screens/09-build.md) |
| 10 | Refine | [screens/10-refine.md](./screens/10-refine.md) |
| 11 | Finish | [screens/11-finish.md](./screens/11-finish.md) |
| 12 | Studio reference | [screens/12-studio-reference.md](./screens/12-studio-reference.md) |
| 13 | Materials | [screens/13-materials.md](./screens/13-materials.md) |
| 14 | Progress | [screens/14-progress.md](./screens/14-progress.md) |
| 15 | Mobile | [screens/15-mobile.md](./screens/15-mobile.md) |

## Research (informs original pedagogy only)

Research materials inform **original** ArtPraxis pedagogical principles. They must not reproduce copyrighted book text or illustrations.

| Document | Purpose |
|---|---|
| [../research/ART_INSTRUCTION_RESEARCH.md](../research/ART_INSTRUCTION_RESEARCH.md) | Synthesis of art-instruction research themes |
| [../research/BOTANICAL_COURSE_FINDINGS.md](../research/BOTANICAL_COURSE_FINDINGS.md) | Findings from botanical / observational course study |
| [../research/PHYSICAL_ART_PROGRESSION_STANDARDS.md](../research/PHYSICAL_ART_PROGRESSION_STANDARDS.md) | Standards for physical-art progression presentation |

## Brand source of truth

Studio v3 UI work must follow:

- `docs/brand/ARTPRAXIS_BRAND_GUIDE.md`
- `docs/brand/artpraxis-design-tokens.json`
- `docs/brand/artpraxis-design-tokens.css`

## Working rules

1. Record every material design decision in the decision log before treating it as approved.
2. Do not invent final design decisions in these stubs; mark unresolved content as **Pending design review**.
3. Implementation passes update specs and QA notes in-repo—not only in chat.
4. Preserve the continuous lesson-document checkpoint as the current lesson baseline until Studio v3 supersedes it deliberately.
