# Lesson Standards

## Purpose

Standardize lesson structure, teaching order, vocabulary, feedback, timing, and transitions so no lesson contradicts another.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Governance](./GOVERNANCE.md)
- [Glossary](./GLOSSARY.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Curriculum Standards](./Curriculum%20Standards.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)
- [Writing Style Guide](./Writing%20Style%20Guide.md)
- [Atelier Design Manifesto](./design/atelier-design-manifesto.md.txt)
- [Decision Log](./DECISION_LOG.md)

## Depends On

[ArtPraxis Principles](./Product/ArtPraxis%20Principles.md), [Glossary](./GLOSSARY.md)

## Used By

Lesson UI on any client surface, progression pipeline, curriculum authors, AI assistants editing Study/Paint flows.

## Last Reviewed

2026-07-23

## Future Improvements

Add medium-specific timing tables; formalize assessment rubrics; document Paint vs Study differences in detail.

---

## Contents

1. [Canonical stage order](#canonical-stage-order)
2. [Lesson structure](#lesson-structure)
3. [Difficulty progression](#difficulty-progression)
4. [Vocabulary](#vocabulary)
5. [Feedback & checkpoints](#feedback--checkpoints)
6. [Timing](#timing)
7. [Transitions](#transitions)
8. [Consistency rules](#consistency-rules)
9. [Acceptance criteria](#acceptance-criteria-lesson-ux)

---

## Canonical stage order

Six stages — always in this order:

| # | Stage ID | Process label | Purpose (one line) |
|---|----------|---------------|--------------------|
| 1 | `pencil-sketch` | Sketch | Lock placement and proportion |
| 2 | `value-study` | Value Map | Map light and dark shapes |
| 3 | `first-wash` | First Wash | Lay the lightest transparent color |
| 4 | `second-wash` | Build Color | Strengthen main color relationships |
| 5 | `refinement` | Refine | Add selective edges and contrast |
| 6 | `finished` | Finished | Review the completed painting |

Do not invent alternate stage taxonomies in UI copy.

---

## Lesson structure

Each active stage presents, in order of importance:

1. **Artwork** (stage demonstration / comparison) — largest element  
2. **Instruction** — what to do now (short)  
3. **Technique / Watch for / Goal** — glance notes (no duplication of the instruction)  
4. **Materials & notes** — progressive disclosure  
5. **Quiet next step** — instructor note, not a marketing card  
6. **Progress** — tucked away (Atelier Ribbon), never competing with the painting  

### Teaching order within a stage

1. What to observe  
2. What to prepare (materials / mix)  
3. What to place (brush action)  
4. What to check (checkpoint)  
5. What to avoid (common mistake)  

---

## Difficulty progression

- Stages increase commitment of paint and commitment of value — not “more UI.”  
- Early stages: more white paper, lighter marks, reversible decisions.  
- Later stages: selective darks, focal detail; secondary areas stay loose.  
- Finished is review and comparison — not a new composition.

---

## Vocabulary

- Use professional atelier language (value, wash, edge, mix, reserve whites).  
- Explain terms inline when first needed; do not dump a glossary on entry.  
- Prefer **Value Map** for the tonal planning stage (see [Glossary](./GLOSSARY.md)) — not “grayscale photo.”  
- Frame the **master** / Finished stage as **inspiration for the student’s final piece**, not a mandate to copy.  
  See [Decision Log — Finished Painting wording](./DECISION_LOG.md).

---

## Feedback & checkpoints

- One clear checkpoint per stage when possible.  
- Mistakes are instructional (“Watch for”), never punitive.  
- Celebrate progress without gamified noise (no streaks, badges, or LMS locks).

---

## Timing

- Suggest time as a calm guide, not a countdown.  
- Relative weights (implementation hint): sketch ~15%, value ~12%, washes heavier mid-lesson — adjust per medium, keep calm pacing.

---

## Transitions

- Reveal the next demonstration when ready — language like “When you are ready, begin {Next}.”  
- Loading / generation copy follows instructor language ([Principles — Writing](./Product/ArtPraxis%20Principles.md)).  
- Do not show duplicate Prev/Next chrome alongside the process rail.

---

## Consistency rules

- Same six stages across Study and Paint.  
- Same process labels in navigator and copy.  
- Goal omitted when it duplicates the stage instruction.  
- Materials consolidated; avoid three competing collapses saying the same thing.  
- No lock icons on future stages as primary metaphor.

---

## Acceptance criteria (lesson UX)

A lesson screen passes when:

- [ ] Painting dominates every scroll position  
- [ ] One primary action  
- [ ] No duplicate navigation or status  
- [ ] Progress is optional / compact  
- [ ] Copy sounds like an instructor  
- [ ] Stage order and labels match this document  
