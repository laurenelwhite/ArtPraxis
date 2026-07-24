# ArtPraxis — Start Here

**Canonical entry point for the ArtPraxis documentation operating system.**

If you are an engineer, designer, curriculum author, or AI assistant: **begin here.** Do not change product, brand, curriculum, or image behavior without checking the authoritative documents linked below.

---

## Contents

1. [Purpose & graph](#purpose)
2. [Governance (required)](#governance-required)
3. [What ArtPraxis is](#what-artpraxis-is)
4. [Mission & philosophy](#product-mission)
5. [Documentation structure](#documentation-structure)
6. [Reading order](#reading-order)
7. [Authority tiers](#document-authority-tiers)
8. [Platforms](#platforms)
9. [Rules & Definition of Done](#documentation-rules)
10. [Document map](#major-document-map)
11. [AI onboarding](#ai-onboarding-self-serve)

---

## Purpose

Orient every contributor to what ArtPraxis is, how decisions are made, and which documents govern work.

## Related Documents

- [Governance](./GOVERNANCE.md) — **required before implementation**
- [Glossary](./GLOSSARY.md) — canonical terminology
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Platform Strategy](./Product/Platform%20Strategy.md)
- [Decision Log](./DECISION_LOG.md)
- [Documentation Quality & Health](./DOCUMENTATION_QUALITY.md)
- [Gap Analysis](./GAP_ANALYSIS.md)
- [Documentation Roadmap](./DOCUMENTATION_ROADMAP.md)
- [Reference Library](./references/REFERENCE_LIBRARY.md)

## Depends On

None — this is the root.

## Used By

All other documentation; all product and engineering work across current and future surfaces.

## Last Reviewed

2026-07-23

## Future Improvements

Keep this page as the map. Push depth into linked standards. Add `Platforms/` appendices when iOS, Android, or public API work begins.

---

## Governance (required)

Documentation is the authoritative source for ArtPraxis.

For **every** implementation:

1. Read this file.  
2. Read [Governance](./GOVERNANCE.md).  
3. Use [Glossary](./GLOSSARY.md) terms.  
4. Identify relevant domain docs and follow them.  
5. If a standard is missing → **propose and document it, then implement**.  
6. If docs and code disagree → **surface the conflict**; do not silently pick a side.  
7. Ship documentation updates **in the same change** as new patterns.

No new UI pattern, interaction, lesson flow, prompt pattern, or branding decision may exist without being reflected in `/docs`.

---

## What ArtPraxis is

ArtPraxis turns a **reference** into a **medium-aware, stage-by-stage painting lesson**—the feeling of learning beside a professional instructor at a drafting table.

It is **not** a social feed, LMS, course marketplace, or image toy.

**Core promise:** Upload a reference → choose medium and level → receive a visual lesson that teaches observation, materials, and progressive technique without encouraging exact copying.

Terminology for reference / master / stage plates: [Glossary](./GLOSSARY.md).

See also: [Product Spec](./PRODUCT_SPEC.md), [Architecture](./ARCHITECTURE.md).

---

## Product mission

Recreate the feeling of learning beside a professional artist.

The application should disappear. The instructor should remain.

> Build the world's most natural digital painting instructor — not merely “the best art learning platform.”

Authoritative philosophy: [Atelier Design Manifesto](./design/atelier-design-manifesto.md.txt), [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md).

---

## Product philosophy (summary)

| Domain | Rule |
|--------|------|
| Learning | Teach observation and understanding; never exact copying |
| Product | Elegant, calm, premium, timeless — never childish or gimmicky |
| UX | Reduce cognitive load; keep learners painting; one decision at a time |
| Images | Composition locked; professional progression; realistic paint behavior |
| Writing | Warm, clear, supportive — never patronizing or corporate |

---

## Documentation structure

```text
docs/
  START_HERE.md                 ← you are here
  GOVERNANCE.md                 Binding implementation rules
  GLOSSARY.md                   Canonical terms
  DECISION_LOG.md               Institutional decisions
  DOCUMENTATION_QUALITY.md      Health scores & quality bar
  GAP_ANALYSIS.md
  DOCUMENTATION_ROADMAP.md
  DESIGN_REVIEW_CHECKLIST.md
  ENGINEERING_CHECKLIST.md

  Product/
    ArtPraxis Principles.md
    Platform Strategy.md        Web → mobile → API → agents

  brand/                        Brand Bible, Logo, Color, Motion
  design/                       Atelier UX, components, reviews
  Curriculum/ · academy/        Teaching source libraries
  references/                   Books, brand package, REFERENCE_LIBRARY.md

  Lesson · Image · Prompt · Writing · Accessibility · Curriculum Standards
  PRODUCT_SPEC.md · ARCHITECTURE.md
```

Prefer `.md` canonical files when both `.md` and `.md.txt` exist. Do not delete stubs; they point forward.

---

## Reading order

### For AI assistants (required before code or design changes)

1. **START_HERE** (this file)  
2. **[Governance](./GOVERNANCE.md)**  
3. **[Glossary](./GLOSSARY.md)**  
4. **[ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)**  
5. **[Decision Log](./DECISION_LOG.md)**  
6. Domain docs for the task (Lesson / Image / Brand / Architecture / …)  
7. **[Platform Strategy](./Product/Platform%20Strategy.md)** if the change might be cross-surface  

### For designers

Governance → Principles → Manifesto → Component Principles → Brand → Design Review Checklist  

### For engineers

Governance → Architecture → Product Spec → Engineering Checklist → domain standards  

### For curriculum authors

Principles → Lesson Standards → Curriculum Standards → Image Standards → academy/ + Reference Library  

---

## Document authority tiers

| Tier | Role | Examples |
|------|------|----------|
| **Authoritative** | Binding | Governance, Principles, Glossary, Lesson/Image/Brand standards, Decision Log |
| **Implementation guides** | How to apply | Architecture, Prompt Engineering, Component Principles, Checklists |
| **Historical / living notes** | Context | Design reviews, UI Audit stubs |
| **Source libraries** | Research | `academy/`, `references/` PDFs |

Conflicts: **Decision Log** (settled product) → **Governance / Principles / Glossary** → domain standard.

---

## Platforms

Standards apply across **web, mobile, desktop, marketing, email, community, enterprise, APIs, and AI agents**.

Do not write lesson or brand rules that only make sense for a single web SPA.

See [Platform Strategy](./Product/Platform%20Strategy.md).

---

## Documentation rules

1. Docs are the operating system — features follow docs.  
2. Promote durable rules from code comments into `/docs`.  
3. Cross-link: Purpose, Related Documents, Depends On, Used By, Last Reviewed, Future Improvements.  
4. Preserve institutional knowledge in the Decision Log.  
5. Improve and link; do not casually overwrite rich documents.  
6. Use Glossary terms; do not invent synonyms for image roles.  
7. Package screenshots are visual references — never live UI assets.  

---

## Definition of Done (documentation-aware)

- [ ] [Governance](./GOVERNANCE.md) workflow followed  
- [ ] [Glossary](./GLOSSARY.md) terminology used  
- [ ] Domain standard checked  
- [ ] Checklists answered ([Design](./DESIGN_REVIEW_CHECKLIST.md) / [Engineering](./ENGINEERING_CHECKLIST.md))  
- [ ] No conflict with Decision Log  
- [ ] Docs updated in the **same change** if a new pattern was introduced  
- [ ] `tsc` / lint / tests as required  

---

## Major document map

### Operating system

| Document | Path |
|----------|------|
| Governance | [GOVERNANCE.md](./GOVERNANCE.md) |
| Glossary | [GLOSSARY.md](./GLOSSARY.md) |
| Quality & health | [DOCUMENTATION_QUALITY.md](./DOCUMENTATION_QUALITY.md) |
| Decision Log | [DECISION_LOG.md](./DECISION_LOG.md) |

### Product & philosophy

| Document | Path |
|----------|------|
| Principles | [Product/ArtPraxis Principles.md](./Product/ArtPraxis%20Principles.md) |
| Platform Strategy | [Product/Platform Strategy.md](./Product/Platform%20Strategy.md) |
| Product Spec | [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) |
| Atelier Manifesto | [design/atelier-design-manifesto.md.txt](./design/atelier-design-manifesto.md.txt) |

### Brand

| Document | Path |
|----------|------|
| Brand Bible | [brand/Brand Bible.md](./brand/Brand%20Bible.md) |
| Logo Standards | [brand/Logo Standards.md](./brand/Logo%20Standards.md) |
| Color / Motion | [brand/Color System.md](./brand/Color%20System.md), [Motion Standards](./brand/Motion%20Standards.md) |
| Approved package | [references/branding/logo/…](./references/branding/logo/artpraxis-approved-logo-package.png.png) |

### UX / curriculum / images / engineering

| Domain | Start at |
|--------|----------|
| UI | [component-principles.md](./design/component-principles.md) → [UI Patterns](./design/ui-patterns.md) → [DESIGN_REVIEW_CHECKLIST](./DESIGN_REVIEW_CHECKLIST.md) |
| Lessons | [Lesson Standards.md](./Lesson%20Standards.md) |
| Images | [Image Generation Standards.md](./Image%20Generation%20Standards.md) |
| Prompts | [Prompt Engineering Standards.md](./Prompt%20Engineering%20Standards.md) |
| Curriculum | [Curriculum Standards.md](./Curriculum%20Standards.md) |
| Engineering | [ARCHITECTURE.md](./ARCHITECTURE.md) → [ENGINEERING_CHECKLIST](./ENGINEERING_CHECKLIST.md) |
| References | [REFERENCE_LIBRARY.md](./references/REFERENCE_LIBRARY.md) |

---

## AI onboarding (self-serve)

1. Read START_HERE, Governance, Glossary, Principles, Decision Log.  
2. Open only domain standards for your task.  
3. Prefer existing patterns over new metaphors.  
4. If docs are silent: **doc update + Decision Log entry**, then implement.  
5. Never reverse Decision Log entries without a new decision.  
6. Never treat approximation brand SVGs as approved final art.  
7. Write platform-neutral standards unless documenting a surface-specific appendix.  

---

## Constraints for contributors

Do **not** use documentation tasks as an excuse to redesign UI, change lesson logic, change image generation, rename routes, or delete documentation.
