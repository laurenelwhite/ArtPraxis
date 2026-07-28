# ArtPraxis Design Bible

## 1. Purpose and authority

This document defines the approved engineering foundation for the ArtPraxis product experience.

Authority order for implementation work:

1. Locked approved brand assets and `docs/brand/ARTPRAXIS_BRAND_GUIDE.md`
2. This Design Bible
3. Latest approved implementation decisions documented in `docs/DECISION_LOG.md`
4. Central semantic tokens in `src/styles/artpraxis-tokens.css`

When older guidance conflicts with the current approved branch implementation, preserve the latest approved implementation, centralize it behind semantic tokens, and document the decision rather than reverting it for theoretical consistency.

## 2. Mission

ArtPraxis helps people build transferable artistic skill through observation, structured practice, and realistic physical-art references.

The final target painting is not simply the product or reward. It is the visual teacher that helps the learner understand the decisions required to create the work.

## 3. Product philosophy

The core product principle is: The final painting is the teacher.

ArtPraxis should feel like a quiet, professional atelier rather than a software dashboard. The software exists to support observation, sequencing, and encouragement. The interface should recede so the learner can focus on painting decisions, not application mechanics.

## 4. Emotional goals

The interface should feel:

- calm
- inspiring
- professional
- intentional
- crafted
- patient
- rewarding

It should never feel:

- chaotic
- clinical
- childish
- gamified
- synthetic
- excessively technical
- generically AI-generated

## 5. Experience principles

1. The artwork is always the visual hero.
2. Every screen has one obvious next action.
3. White space is instructional.
4. Interface elements should teach, orient, or encourage.
5. The software should recede so the user can focus on painting.
6. The experience should feel calm, physical, restrained, sophisticated, and handcrafted.
7. Generated lesson imagery must resemble real physical artwork rather than glossy AI-generated digital art.
8. The product must remain approachable to beginners without feeling childish or unserious to experienced artists.

## 6. Visual language

Use:

- the currently approved warm, bright paper background
- charcoal ink
- restrained historic ultramarine
- burnt umber
- raw sienna
- muted olive
- warm gray
- graphite
- natural wood
- linen
- aged brass
- soft north-light studio shadows
- subtle physical texture
- restrained borders and elevation

Avoid:

- darkening the approved paper background
- cold gray software surfaces
- glossy gradients
- neon colors
- chrome
- glassmorphism
- plastic-looking controls
- cartoonish art tools
- excessive pills
- heavy shadows
- busy dashboards
- game-like UI
- decorative elements that compete with artwork

## 7. Color philosophy

The interface should stay quiet so the artwork provides most of the chroma.

- Paper tones should remain warm, bright, and materially believable.
- Ink tones should carry structure, hierarchy, and legibility.
- Ultramarine should be used as a disciplined instructional accent, not a decorative flood.
- Ochre, sienna, umber, olive, and brass should appear as restrained material accents.
- Status colors must remain muted and readable.
- Global background brightness should not be darkened to create false drama.

Implementation rule: choose existing approved values already in use on the current branch before inventing new ones.

## 8. Typography principles

- Display and section headings use the approved serif display family.
- Body, controls, metadata, and form inputs use the approved UI sans family.
- Serif communicates art, hierarchy, and reflection.
- Sans communicates navigation, labels, controls, and utility information.
- Uppercase is reserved for restrained labels and organizational metadata, not CTA copy.
- Body text must remain comfortable and instructional rather than compressed or dashboard-like.

## 9. Spacing and composition

- White space is not empty; it teaches emphasis and sequence.
- Layout should feel editorial, not widget-driven.
- Reading columns should stay comfortable and never stretch into generic full-width dashboard text blocks.
- Artwork requires generous breathing room.
- Grouping should come from spacing first, then borders if needed.

## 10. Component principles

- Cards and panels should feel like paper, not floating software modules.
- Controls should be quiet, clearly tappable, and subordinate to artwork.
- One local decision point should have one dominant action.
- Borders and shadows should communicate grouping, not decoration.
- Rounded corners should be soft and restrained, not playful or inflated.
- New components must consume semantic tokens and should prefer the `.ap-*` base classes where appropriate.

## 11. Artwork and generated-image standards

Generated and displayed artwork must look physically created in a believable medium.

- preserve paper, canvas, graphite, or brush character
- favor tactile variation over glossy smoothness
- avoid synthetic gradients and sterile rendering
- avoid oversharpening and digital polish that competes with instruction
- maintain the sense that the image is teaching through real material decisions

## 12. Lesson-stage image standards

Sketch:

- clear construction lines
- confident but economical graphite
- little or no unnecessary shading
- appropriate complexity for the selected skill level
- visible paper
- believable hand-drawn variation

Value study:

- intentionally simplified value families
- readable light and shadow structure
- no muddy near-black over-rendering
- no photographic or digital airbrush effect
- enough paper visible to understand the study

First wash:

- transparent pigment
- substantial untouched paper
- broad initial color relationships
- soft blooms, granulation, and natural edge variation where medium-appropriate
- no premature detail

Color-building stages:

- progressive layering
- believable pigment accumulation
- stage-to-stage continuity
- selective edge control
- no unexplained jumps to a nearly finished image

Refinement:

- selective detail
- controlled contrast
- preserved physical texture
- emphasis only where instruction requires it

Finished painting:

- must look physically created in the selected medium
- preserve brushwork, paper, canvas, or drawing-surface character
- avoid glossy digital rendering
- avoid oversharpening
- avoid synthetic gradients
- avoid perfect symmetry or sterile finish
- clearly communicate that the target is instructional and that learners may take creative liberty

## 13. Motion principles

- Motion should reassure, not entertain.
- Prefer fades, soft emergence, and quiet emphasis.
- Fast interactions should feel responsive but never twitchy.
- Ambient or panel transitions should stay calm and materially plausible.
- Motion must respect `prefers-reduced-motion`.
- Never require animation for comprehension.

## 14. Voice and writing style

- Write like an experienced instructor, not a system console.
- Prefer plain, encouraging, craft-oriented language.
- Avoid machine-centered or pipeline-centered phrasing when learner-centered language is possible.
- Keep CTA copy in sentence case.
- Avoid technical jargon in core lesson flows unless the user explicitly needs it.

## 15. Accessibility requirements

- Maintain readable contrast across text, borders, and controls.
- Do not rely on color alone for status.
- Preserve visible keyboard focus.
- Keep touch targets comfortably usable.
- Ensure texture never harms legibility.
- Support reduced motion.
- Preserve semantic structure and clear landmarks.

## 16. Responsive behavior

- The interface must remain calm and legible at desktop, tablet, and mobile widths.
- Artwork remains primary at every breakpoint.
- Horizontal overflow is a defect unless explicitly required and controlled.
- Navigation density should reduce gracefully rather than stack into visual noise.
- Layout changes must preserve continuity with approved mobile navigation fixes already on this branch.

## 17. Screenshot-readiness standards

Screenshots are not just captures; they are evidence of a settled and approved experience.

Do not capture official screenshots until:

- the relevant screen is approved
- duplicate or transitional UI has been removed
- the token migration for that screen is stable enough to avoid churn
- responsive and accessibility checks are complete

## 18. Engineering implementation rules

- Semantic tokens are the source of truth for shared visual values.
- Tokens change centrally, not ad hoc in components.
- Widely used legacy variables may remain as aliases while migration is in progress.
- New components must use semantic tokens rather than new one-off values.
- Do not introduce one-off colors, radii, shadows, or typography values without justification.
- Preserve current approved rendering when normalizing code.
- Do not touch locked brand assets as part of routine UI implementation.
- Do not rewrite unrelated logic during design-system work.

## 19. UI review checklist

Every screen must pass:

- Is the artwork the first visual focus?
- Can the screen’s purpose be understood within three seconds?
- Is there one dominant next action?
- Is the hierarchy calm and legible?
- Are controls subordinate to the artwork?
- Does the page feel like a premium creative-learning product?
- Does it express craftsmanship rather than generic AI?
- Is the screen free of temporary, duplicate, legacy, or contradictory UI?
- Does it work at desktop, tablet, and mobile widths?
- Does it remain usable with keyboard navigation and reduced motion?

## 20. Change-control process

- Approved brand assets are locked.
- Semantic tokens are changed centrally.
- New components must consume semantic tokens.
- One-off colors, radii, shadows, and typography values require justification.
- Changes affecting the brand system require visual-regression review.
- Screenshots are captured only after the relevant screen is approved and frozen.
- Recent approved implementation work should not be reverted merely to achieve theoretical consistency.

Before merging a visual-system change:

1. Confirm the change is consistent with the locked brand direction.
2. Confirm the change preserves the latest approved implementation where applicable.
3. Update semantic tokens or aliases centrally.
4. Update documentation if the decision is durable.
5. Review the affected screens for regressions at desktop, tablet, and mobile widths.
