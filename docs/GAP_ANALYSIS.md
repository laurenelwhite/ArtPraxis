# Gap Analysis

## Purpose

Honest inventory of missing, weak, conflicting, or duplicated documentation — ranked for action.

## Related Documents

- [START_HERE](./START_HERE.md)
- [DOCUMENTATION_ROADMAP](./DOCUMENTATION_ROADMAP.md)
- [Decision Log](./DECISION_LOG.md)

## Depends On

Full `/docs` audit (2026-07-23)

## Used By

Doc owners, leads, AI assistants prioritizing writing work.

## Last Reviewed

2026-07-23

## Future Improvements

Re-run after Brand Bible and medium appendices land.

---

## Ecosystem summary (audit)

| Area | State |
|------|--------|
| Philosophy | Strong outline in Principles + rich Atelier Manifesto |
| Product spec / architecture | Short but useful MVP docs |
| Lesson / image standards | Were stubs; production guides created 2026-07-23 |
| Brand | Approved logo package exists; most brand `.md.txt` files empty |
| Design | Component principles + manifesto strong; motion/writing thin |
| References | Good PDF libraries; catalog was missing → Reference Library added |
| Academy | Folder tree exists; largely unscanned deep content |
| Meta | START_HERE was a link list only; Decision Log / Gap / Roadmap missing |

---

## Ranked gaps

| Priority | Item | Impact | Difficulty | Notes |
|----------|------|--------|------------|-------|
| P0 | Fill Brand Bible, Color, Typography, Logo Standards from package + stubs | High | M | Empty files block designers |
| P0 | Keep Image Generation Standards synced with `stage-image-prompts.ts` | High | M | Code is currently richer than old stubs |
| P1 | Prompt Engineering Standards (full production doc) | High | M | File empty |
| P1 | Writing Style Guide (merge manifesto + empty guide) | High | S | Duplicate risk with manifesto loading language |
| P1 | Accessibility.md production checklist | High | M | Stub + branding/accessibility notes |
| P1 | Resolve duplicate image standards (`Image Generation Standards.md` vs `design/image-generation-standards.md.txt`) | Med | S | Point stub → canonical |
| P2 | Curriculum Standards body + academy index | Med | L | Empty + large academy zip/tree |
| P2 | Motion Standards (expand 4-line guideline) | Med | S | |
| P2 | UI Patterns doc (folder name exists; content unclear) | Med | M | |
| P2 | Archive or merge overlapping vision stubs under `references/branding/vision/` | Low | S | |
| P3 | Tag reference images with metadata | Low | L | Standard defined; do not backfill yet |
| P3 | Product Vision separate from Principles | Low | S | Optional split |

---

## Duplicates

| Topic | Locations | Recommendation |
|-------|-----------|----------------|
| Principles / philosophy | `ArtPraxis Principles.md.txt`, `Product/ArtPraxis Principles.md`, Manifesto | Canonical = `Product/ArtPraxis Principles.md`; keep manifesto for UX depth; stub `.txt` → pointer |
| Image standards | Root + `design/image-generation-standards.md.txt` | Canonical = root `.md`; design file becomes notes/changelog |
| Logo rules | component-principles, design-reviews, public/brand README, ASSET_AUDIT | Keep package as visual SoT; link rather than rewrite |
| Writing / loading language | Manifesto + Writing Style Guide | Fill Writing Style; manifesto remains emotional north star |
| Brand Bible | `brand/Brand Bible.md.txt` vs `references/branding/ArtPraxis Brand Bible.md.txt` | Merge into one Brand Bible; other becomes pointer |

---

## Contradictions

| Topic | Tension | Resolution |
|-------|---------|------------|
| Finished painting as “target” vs inspiration | Older copy vs Learning Principles | Decision Log 2026-07-23 — inspiration framing wins |
| Temporary logo SVGs vs approved package | Implementation used approximations | Labeled approximations; exports required — do not claim fidelity |
| “Hero adaptive colors” (color stub) vs “do not recolor logo” | Accent on artwork vs logo lockup | Adaptive accents for artwork only; logo stays navy system |

---

## Missing documentation

- Full Brand Bible  
- Prompt Engineering production guide  
- Assessment Standards  
- Architecture deep-dive (pipelines, lesson UI state machine)  
- Performance budget  
- Mobile / iPad patterns (roadmap mentions iPad)  
- Critique engine standards (`academy/17`)  
- Marketing / landing content standards  

---

## Weak documentation

- Motion (4 lines)  
- Visual language (aphorisms only — useful but incomplete)  
- Most `references/branding/**` notes (outlines without body)  
- UI Audit (aspiration only)  
- Roadmap sketch (one path diagram)

---

## Future opportunities

- Auto-generate stage tables from `stage-image-prompts.ts` into docs  
- Academy → Curriculum Standards extractor  
- Reference metadata registry  
- Decision Log linked from PR template  
