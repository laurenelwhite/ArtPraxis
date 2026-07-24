# Platform Strategy

## Purpose

Keep ArtPraxis documentation and product thinking **platform-neutral** so expansion beyond the current web app does not require rewriting the operating system.

## Related Documents

- [START_HERE](../START_HERE.md)
- [Governance](../GOVERNANCE.md)
- [Product Spec](../PRODUCT_SPEC.md)
- [Architecture](../ARCHITECTURE.md)
- [ArtPraxis Principles](./ArtPraxis%20Principles.md)

## Depends On

[ArtPraxis Principles](./ArtPraxis%20Principles.md)

## Used By

Product, engineering, and docs when adding surfaces.

## Last Reviewed

2026-07-23

## Future Improvements

Add per-platform appendices (iOS HIG notes, Play policies, email CSS limits) as those projects start.

---

## Principle

**Standards are universal; implementations are per surface.**

- Learning, brand, lesson stages, image rules, and writing voice apply everywhere.  
- Layout chrome, navigation chrome, and OS conventions may differ by client.  
- Do not encode “only Next.js” assumptions into Lesson Standards or Brand Bible.

---

## Surface map (current + future)

| Surface | Status | Doc expectations |
|---------|--------|------------------|
| **Web app (Next.js)** | Current | Architecture, Engineering Checklist |
| **Marketing website** | Future / partial | Brand Bible, Writing Style, Logo Standards |
| **iOS** | Future | Platform appendix + shared Principles / Lesson / Image standards |
| **Android** | Future | Same |
| **Desktop** | Future | Same |
| **Email** | Future | Writing Style + Brand (simplified lockups) |
| **Community** | Future | New Community Standards (not yet written) |
| **Enterprise** | Future | Security, SSO, admin — new Engineering/Enterprise docs |
| **APIs** | Future | Public API Standards + Architecture expansion |
| **AI agents** | Current consumers of `/docs` | START_HERE, Governance, Glossary mandatory |

---

## What stays identical across platforms

- Six-stage lesson spine and process labels ([Glossary](../GLOSSARY.md))  
- Image composition lock and stage intents  
- Brand colors, logo variants, voice  
- Learning Principles (no exact copying)  
- Instructor language for waiting states  

## What may differ by platform

- Navigation chrome (tabs vs sidebar vs split view)  
- File upload / camera capture affordances  
- Offline / sync behavior  
- Push notifications (must still feel calm — no spam)  
- Performance budgets  

When a platform needs a new interaction pattern: **document the pattern first** ([Governance](../GOVERNANCE.md)), then implement.

---

## Anti-assumptions

Do **not** write standards that only make sense if:

- The UI is a browser SPA  
- Firebase is the only backend forever  
- “Click” is the only input (prefer **activate** / **select** in cross-platform docs)  
- Screen sizes are desktop-first only  

Prefer: **learner**, **instructor note**, **demonstration**, **project**, **stage**.

---

## When opening a new surface

1. Add a row to this table.  
2. Create `docs/Platforms/<Surface>.md` appendix if needed.  
3. Link from START_HERE map.  
4. Log durable product choices in the Decision Log.  
