# Glossary

## Purpose

Canonical terminology for ArtPraxis. Use these terms in documentation, UI copy, prompts, and code comments unless a Decision Log entry defines an exception.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Governance](./GOVERNANCE.md)
- [Lesson Standards](./Lesson%20Standards.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)
- [Writing Style Guide](./Writing%20Style%20Guide.md)

## Depends On

[Governance](./GOVERNANCE.md)

## Used By

All documentation and product surfaces.

## Last Reviewed

2026-07-23

## Future Improvements

Add medium-specific vocabulary appendix; sync with in-app Term component IDs.

---

## Image roles (do not mix)

| Term | Meaning | Avoid calling it |
|------|---------|------------------|
| **Reference** | The learner’s uploaded photo (or approved photo input) | “Target,” “finished,” “master” |
| **Master** / **target painting** | Validated finished painting produced for the lesson (composition lock) | “Reference” |
| **Stage plate** / **demonstration** | The stage-specific teaching image (Sketch → Finished) | “Random AI image” |
| **Finished stage** | The sixth process step; shows the master as **inspiration** | “Mandatory copy target” |
| **Inspiration for your final piece** | Preferred UI framing of the master for learners | “What you’re working toward” (deprecated) |

**Rule:** Learners interpret; they do not exact-copy. See [Decision Log](./DECISION_LOG.md).

---

## Lesson process (canonical labels)

| Stage ID | UI / docs label | One-line purpose |
|----------|-----------------|------------------|
| `pencil-sketch` | **Sketch** | Lock placement and proportion |
| `value-study` | **Value Map** | Map light and dark shapes |
| `first-wash` | **First Wash** | Lay the lightest transparent color |
| `second-wash` | **Build Color** | Strengthen main color relationships |
| `refinement` | **Refine** | Selective edges and contrast |
| `finished` | **Finished** | Review the completed painting |

**Prefer “Value Map”** in UI and docs — not “grayscale photo,” not casual “value study” unless explaining the concept.

---

## Product surfaces

| Term | Meaning |
|------|---------|
| **Atelier** | The lesson experience as a digital drafting table |
| **Study** | Read / observe the lesson |
| **Paint** | Work stage by stage at the desk |
| **Studio** | Authenticated home for projects |
| **Atelier Ribbon** | Compact, expandable progress control |
| **Process rail** | Six-step stage navigator |

---

## Generation & status (instructor language)

| Prefer (user-facing) | Avoid |
|----------------------|--------|
| Preparing your next demonstration | Generating… |
| Mixing the next wash | Processing… |
| Preparing the value map | Rendering… |
| Opening your studio | Loading pipeline… |

Internal engineering may say “generation” in code and Architecture docs; **user-facing copy must not**.

---

## Brand

| Term | Meaning |
|------|---------|
| **Primary logo** | Full lockup for splash / marketing |
| **Navigation logo** | Dedicated compact lockup for nav |
| **Loading mark** | Brush painting a blue line |
| **Icon / mark** | Favicon / app icon (A + stroke + brush when final art lands) |
| **Approved package** | Visual source of truth under `docs/references/branding/logo/` |

---

## Platforms (neutral)

Prefer **surface** or **client** over assuming “the website” alone:

- Web app  
- Marketing site  
- iOS / Android / desktop clients (future)  
- Email  
- API / agents  

See [Platform Strategy](./Product/Platform%20Strategy.md).
