# Decision Log

## Purpose

Preserve institutional knowledge. Record significant product, curriculum, branding, UX, and engineering decisions so future contributors (and AI assistants) do not reverse settled choices by accident.

## Related Documents

- [START_HERE](./START_HERE.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Gap Analysis](./GAP_ANALYSIS.md)

## Depends On

[START_HERE](./START_HERE.md)

## Used By

Everyone before changing product behavior.

## Last Reviewed

2026-07-23

## Future Improvements

Add owners and PR links to each entry.

---

## How to add an entry

```markdown
## YYYY-MM-DD

### Short title

**Decision**

…

**Reason**

…

**Outcome**

…

**Related Documents**

- …
```

---

## 2026-07-26

### Approved Brand Kit 1.0 application surfaces

**Decision**

The approved Brand Kit 1.0 is the visual authority for application chrome, lesson generation, Overview, and Lesson surfaces. Product UI must express the system through visible warm handmade paper, Fraunces editorial headings, Source Sans 3 UI text, indigo structure and brushwork, restrained yellow-ochre and red-earth accents, quiet material-integrated controls, and mounted-artwork presentation.

Generation waits retain the truthful pipeline checklist and qualitative timing, preceded by the approved three-pigment loading motif (yellow ochre, red earth, indigo) and “Practice. Progress. Master.” message. The motif supplements status communication; it does not fabricate completion or replace accessible text.

Existing logo SVGs remain temporary approximations. They must be replaced by isolated designer-exported production assets when available; the composite brand-kit image must not be cropped, traced, or shipped as navigation artwork.

**Reason**

Using only the palette and fonts produced a generic beige editorial interface that did not reflect the approved handcrafted, tactile atelier identity.

**Outcome**

Production application surfaces now use the approved material, color, typography, brushwork, loading, and artwork-framing language while preserving lesson state, generation, accessibility, and responsive behavior.

**Related Documents**

- [ArtPraxis Brand and UI Source of Truth](./brand/ARTPRAXIS_BRAND_GUIDE.md)
- [Component Principles](./design/component-principles.md)
- [UI Patterns](./design/ui-patterns.md)
- [Logo Standards](./brand/Logo%20Standards.md)
- [public/brand/README](../public/brand/README.md)

---

## 2026-07-23

### Design-system audit polish (brand / type / chrome)

**Decision**

Audit pass against Brand Bible, Logo Standards, UI Patterns, and Design Review Checklist. Corrections: pipeline wording → “Building your painting steps”; homepage hero-level primary logo (remove demo media overlay badge); unify generating/loading max-width to ~1180px; instructional body ≥16px; replace hard-coded `#2c2823` with `--ink`; standardize review/toolbar secondary buttons; remove dead `.wordmark` / `.gen-progress*` / legacy `.master-review` loader CSS; instructor language for dashboard “Painting…” badges.

**Reason**

Implementation had drifted from approved patterns (tech wording, duplicate brand treatments, nested max-width clamps, sub-16px instructional type).

**Outcome**

Docs (`ui-patterns`, `component-principles`) updated to match. Generation/Firebase/validation unchanged.

**Related Documents**

- [UI Patterns](./design/ui-patterns.md)
- [DESIGN_REVIEW_CHECKLIST](./DESIGN_REVIEW_CHECKLIST.md)

---

### Loading experience — pipeline checklist + studio tips

**Decision**

Replace animated brush / paint-reveal loading with a vertical generation checklist and rotating Studio Tip card. Delete `artpraxis-loading-mark.svg`. `ArtPraxisLoadingMark` is now a calm text status for secondary waits only.

**Reason**

Brush animation read as generic AI waiting; a pipeline checklist reinforces thoughtful atelier construction.

**Outcome**

CSS/SVG motion only; respects `prefers-reduced-motion`; no fake percentages.

**Related Documents**

- [UI Patterns](./design/ui-patterns.md)
- [Brand Bible](./brand/Brand%20Bible.md)

---

### Lesson loading + regen polish; sidebar lockup; master timing

**Decision**

- Studio sidebar uses dedicated `variant="sidebar"` SVG (width-driven, no height clamp).
- Master wait UI is a two-column reference + status panel with time-based progress copy (no fake %).
- Project tabs (except Overview/Lesson) are disabled until `lessonUi.state === "ready"`.
- Regeneration keeps the prior master visible; UI overlay says “Painting another option…”.
- Duplicate regen clicks are ignored via sync lock + `masterInflight`; log `master_regeneration_*` events.
- API logs `master_generation_timing` (reference fetch / edit / validation / total); request-local URL buffer cache; client logs uploadMs.

**Superseded in part (2026-07-24)** by non-blocking Final Painting regeneration: atelier “Try another” keeps `masterStatus: ready`, stages intact, and writes a separate `candidateFinalPaintingUrl` until Use new painting / Keep current. Stages regenerate only after accept. Explicit `regenerationState` machine + dock-attached status. See [ui-patterns.md](./design/ui-patterns.md).

**Reason**

Clipped logo and empty/duplicated loading UI made a working pipeline feel broken; regen blanking and possible double-clicks eroded trust.

**Outcome**

Premium wait + brand lockup without changing generation models, validation, or Firebase paths.

**Related Documents**

- [Logo Standards](./brand/Logo%20Standards.md)
- [Brand Bible](./brand/Brand%20Bible.md)
- [Component Principles](./design/component-principles.md)
- [DESIGN_REVIEW_CHECKLIST](./DESIGN_REVIEW_CHECKLIST.md)

---

### Master-generation wait UI — qualitative progress, no fake %

**Decision**

While the master is generating, show elapsed time, a 1–2 minute expectation, and time-bucketed phase labels as wait feedback only. Do not show fake completion percentages. Soften studio nav chrome via `:has(.lesson-experience--generating)` so the wait view can lead.

**Reason**

Master requests often take ~1–2 minutes; empty/duplicated copy made the app feel frozen even when generation succeeded.

**Outcome**

`LessonLoadingView` redesigned; generation pipeline and lesson UI state machine unchanged.

**Related Documents**

- [Logo Standards](./brand/Logo%20Standards.md)
- [Motion Standards](./brand/Motion%20Standards.md)

---

### Documentation governance

**Decision**

`/docs` is authoritative. Implementations must not contradict documentation. Conflicts between docs and code must be identified explicitly. New patterns require same-change documentation updates. Missing standards are proposed and documented before implementation.

**Reason**

Consistency—not feature velocity—is the limiting factor.

**Outcome**

[GOVERNANCE.md](./GOVERNANCE.md), [GLOSSARY.md](./GLOSSARY.md), and [Platform Strategy](./Product/Platform%20Strategy.md) are binding onboarding.

**Related Documents**

- [START_HERE](./START_HERE.md)
- [DOCUMENTATION_QUALITY](./DOCUMENTATION_QUALITY.md)

---

### Finished Painting wording

**Decision**

Changed framing of the finished / master painting from language that implied a mandatory target (“What you're working toward”) toward **inspiration for the student’s final piece**.

**Reason**

Users interpreted the finished image as something they needed to copy exactly, which contradicts Learning Principles (interpretation over replication).

**Outcome**

Reinforces artistic interpretation instead of replication.

**Related Documents**

- [Lesson Standards](./Lesson%20Standards.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)

---

### Logo system — package as visual source of truth

**Decision**

The approved logo package image under `docs/references/branding/logo/` is the **visual** source of truth. `ArtPraxisLogo` / `ArtPraxisLoadingMark` are the **implementation** source of truth. Production artwork must be designer-exported assets in `public/brand/`. Do not redraw, trace the screenshot, or use the package PNG in live UI.

**Reason**

Consistency and brand fidelity; temporary SVGs were approximations.

**Outcome**

Size presets only; top nav uses navigation lockup; studio sidebar uses dedicated `sidebar` lockup (or `icon` when collapsed); approximations labeled until final exports arrive.

**Related Documents**

- [design/design-reviews.md](./design/design-reviews.md)
- [design/component-principles.md](./design/component-principles.md)
- [public/brand/README.md](../public/brand/README.md)
- [references/branding/logo/ASSET_AUDIT.md](./references/branding/logo/ASSET_AUDIT.md)

---

### Atelier lesson surface — drafting table, not LMS

**Decision**

Lesson UX optimizes for a digital drafting table: painting-first, reduced chrome, Atelier Ribbon for progress, instructor notes instead of loading widgets / cards, spacing over borders.

**Reason**

LMS / dashboard patterns increase anxiety and compete with the artwork.

**Outcome**

Rejected full-width progress bars, lock icons, thumbnail-primary stage nav, busy headers.

**Related Documents**

- [Atelier Design Manifesto](./design/atelier-design-manifesto.md.txt)
- [Lesson Standards](./Lesson%20Standards.md)
- [design/design-reviews.md](./design/design-reviews.md)

---

### Six-stage process labels

**Decision**

Canonical process labels: Sketch → Value Map → First Wash → Build Color → Refine → Finished.

**Reason**

Shared language across Study, Paint, navigator, and generation.

**Outcome**

UI and prompts align on `STAGE_PROCESS_LABEL` / stage IDs.

**Related Documents**

- [Lesson Standards](./Lesson%20Standards.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)

---

### Documentation as operating system

**Decision**

From 2026-07-23 forward, durable product/design/curriculum/image decisions originate in `/docs`. `START_HERE.md` is the canonical entry point.

**Reason**

Feature velocity exceeded consistency; docs must gate quality.

**Outcome**

Knowledge-base architecture, Decision Log, checklists, Reference Library.

**Related Documents**

- [START_HERE](./START_HERE.md)
- [DOCUMENTATION_ROADMAP](./DOCUMENTATION_ROADMAP.md)
