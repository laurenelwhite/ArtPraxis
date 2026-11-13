# Image Generation Standards

## Purpose

Make every lesson stage **deterministic and visually consistent**. This is the production guide for stage plates, master/target paintings, and prompt behavior.

## Related Documents

- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Glossary](./GLOSSARY.md)
- [Lesson Standards](./Lesson%20Standards.md)
- [Prompt Engineering Standards](./Prompt%20Engineering%20Standards.md)
- [Governance](./GOVERNANCE.md)
- [design/image-generation-standards.md.txt](./design/image-generation-standards.md.txt) (notes pointer)
- Implementation: `src/lib/stage-image-prompts.ts`, `src/lib/progression.ts`

## Depends On

[ArtPraxis Principles](./Product/ArtPraxis%20Principles.md), [Lesson Standards](./Lesson%20Standards.md), [Glossary](./GLOSSARY.md)

## Used By

Image pipeline on any client, prompt authors, QA, curriculum.

## Last Reviewed

2026-07-23

## Future Improvements

Add per-medium appendices; attach golden-reference image sets under `references/`; expand failure galleries with real rejects.

---

## Contents

1. [Global rules](#global-rules-all-stages)
2. [Completion targets](#completion-targets-teaching-signal)
3. [Sketch](#stage-sketch-pencil-sketch)
4. [Value Map](#stage-value-map-value-study)
5. [First Wash](#stage-first-wash-first-wash)
6. [Build Color](#stage-build-color-second-wash)
7. [Refine](#stage-refine-refinement)
8. [Finished](#stage-finished-finished)
9. [QA checklist](#qa-checklist-any-stage-plate)

---

## Terms

Use [Glossary](./GLOSSARY.md): **reference**, **master** (target painting), **stage plate** / **demonstration**. Do not call the learner’s upload the “target,” or the master the “reference.”

## Global rules (all stages)

### Must include

- Exact composition, crop, subject placement, and perspective from the locked reference / validated master  
- One pedagogical job for the stage  
- Painterly, traditional media behavior appropriate to the lesson medium  
- Readable progression from prior stage (except Sketch as foundation)

### Must avoid

- Composition or crop changes  
- Hallucinated objects, text, watermarks, signatures, labels  
- “AI collage” lighting that contradicts the reference  
- Jumping to a finished painting early  
- Photographic grayscale conversions sold as value studies  
- Dense graphite shading on the Sketch stage  

### Shared prompt constraints (implementation)

- No text / letters / numbers / watermarks in the image  
- No subject change relative to the master  
- Completion targets are approximate teaching signals, not marketing percentages  

---

## Completion targets (teaching signal)

| Stage | Approx. completion |
|-------|--------------------|
| Sketch | ~5% — light transfer contour |
| Value Map | ~15% — light planning map; mostly white paper |
| First Wash | ~25–30% — pale transparent color |
| Build Color | ~50–60% — midtones; still unfinished |
| Refine | ~75–85% — selective focal detail |
| Finished | 100% — validated master |

---

## Stage: Sketch (`pencil-sketch`)

### Purpose

Lock placement and proportion with a light construction drawing.

### Teaching objective

Student transfers major shapes confidently without committing tone or color.

### Paint / mark behavior

Dry graphite (or pencil-like contour). Paper dominates.

### Brush / tool behavior

Pencil / light graphite only — no wash tools.

### Visual characteristics

Sparse contours; major shapes; white paper field.

### Lighting / values

No tonal shading. No filled dark masses.

### Composition

Identical to reference.

### Must include

- Clean sparse construction lines  
- Proportion of major masses  

### Must avoid

- Crosshatching, graphite shading, photo edge-detection look  
- Dense dark fills  

### Prompt directive (canonical)

> Very light graphite contours only: clean sparse construction lines for major shapes. No tonal shading, no crosshatching, no dense edge detection, no grayscale photo rendering, no filled dark masses. Paper remains dominant.

### Acceptance criteria

- [ ] Feels like a light transfer drawing (~5%)  
- [ ] Composition locked  
- [ ] No text  

### Common AI failures

- Over-rendered graphite painting  
- Missing subject silhouettes  
- Crop drift  

### Failure examples (describe)

- Near-photographic grayscale of the reference  
- Black silhouette fills  

---

## Stage: Value Map (`value-study`)

### Purpose

Map light and dark shapes as a planning diagram.

### Teaching objective

See 3–4 value families before color.

### Paint / mark behavior

Light instructional tonal map — **not** a finished monochrome painting.

### Visual characteristics

Large white / near-white areas; soft groups; luminous planning feel.

### Lighting / values

Sky almost white; lights reserved; darks only as small structural accents (~10–15% darkest coverage; no true black).

### Must include

- 3–4 broad value groups  
- ~45–60% white or nearly white  

### Must avoid

- Photographic grayscale conversion  
- Dense graphite rendering  
- Dramatic contrast / black areas / finished textures  

### Prompt directive (canonical)

See `STAGE_IMAGE_SPECS["value-study"].directive` in `stage-image-prompts.ts` — preserve white paper and soft groups.

### Acceptance criteria

- [ ] Reads as a plan, not a finished grisaille  
- [ ] Composition locked  

### Common AI failures

- Full grayscale photo  
- Muddy midtones everywhere  
- Lost whites  

---

## Stage: First Wash (`first-wash`)

### Purpose

Lay the lightest transparent color over the foundation.

### Teaching objective

Establish large color masses without opaque coverage.

### Paint behavior

Watery, transparent washes; prior lines faintly visible; white paper preserved.

### Brush behavior

Large, light washes — mop / large round character depending on medium.

### Must include

- Pale transparent color for large masses  
- Sketch still faintly readable  

### Must avoid

- Opaque coverage  
- Finished edges / fine texture  
- Repainting the whole surface from scratch  

### Prompt directive (canonical)

> MINIMAL EDIT of prior plate only: transparent watery washes for large masses. Keep prior lines faintly visible. Preserve white paper. No opaque coverage.

### Acceptance criteria

- [ ] ~25–30% completion feel  
- [ ] Lights reserved  

### Common AI failures

- Jumping to midtone density  
- Hiding the foundation drawing completely  

---

## Stage: Build Color (`second-wash`)

### Purpose

Strengthen main color relationships.

### Teaching objective

Deepen selected midtones / shadow families while protecting first-wash lights.

### Paint behavior

Second layer; selective deepening; still unfinished.

### Must include

- Clearer forms without finishing  
- Protected light passages  

### Must avoid

- Full-surface repaint  
- Finished edges and fine texture everywhere  

### Prompt directive (canonical)

> MINIMAL EDIT: deepen SELECTED existing areas (shadow families / midtones). Leave lighter first-wash passages untouched.

### Acceptance criteria

- [ ] ~50–60% feel  
- [ ] Lights from first wash still readable  

### Common AI failures

- Uniform darkening  
- Premature detail  

---

## Stage: Refine (`refinement`)

### Purpose

Add selective edges and contrast at the focal point.

### Teaching objective

Prioritize focal detail; keep secondary areas loose.

### Must include

- Selective darker accents  
- Focal clarity  

### Must avoid

- Re-rendering the entire painting  
- Equal detail everywhere  

### Prompt directive (canonical)

> MINIMAL EDIT: adjust focal details and selective darker accents. Keep secondary areas loose.

### Acceptance criteria

- [ ] ~75–85% feel  
- [ ] Secondary areas remain open  

### Common AI failures

- Global sharpening  
- Texture noise  

---

## Stage: Finished (`finished`)

### Purpose

Present the validated master as inspiration for the student’s final piece.

### Teaching objective

Review full value range and painterly finish — **interpretation**, not replication mandate.

### Must include

- Validated master painting  
- Exact composition / crop  
- Painterly character  

### Must avoid

- Crop or composition changes  
- Framing language that demands exact copying (see Decision Log)  

### Acceptance criteria

- [ ] Matches accepted master  
- [ ] UI copy frames as inspiration  

### Common AI failures

- Drifted composition when regenerating  
- Over-smoothed “AI finish”  

---

## QA checklist (any stage plate)

- [ ] Composition / crop match master  
- [ ] Stage intent recognizable in 2 seconds  
- [ ] No text artifacts  
- [ ] Progression vs previous stage is sensible  
- [ ] Medium behavior plausible  
- [ ] No hallucinated objects  

---

## Reference examples

Store golden examples under `docs/references/` by medium/subject once curated. Catalog: [REFERENCE_LIBRARY.md](./references/REFERENCE_LIBRARY.md).

Do not use the logo package screenshot as painting reference.
