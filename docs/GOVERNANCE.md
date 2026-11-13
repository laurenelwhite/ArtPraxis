# Documentation Governance

## Purpose

Make `/docs` the authoritative operating system for ArtPraxis. No product work proceeds outside these rules.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Glossary](./GLOSSARY.md)
- [Decision Log](./DECISION_LOG.md)
- [Engineering Checklist](./ENGINEERING_CHECKLIST.md)
- [Design Review Checklist](./DESIGN_REVIEW_CHECKLIST.md)
- [Platform Strategy](./Product/Platform%20Strategy.md)

## Depends On

[START_HERE](./START_HERE.md)

## Used By

Every engineer, designer, curriculum author, and AI assistant before implementing changes.

## Last Reviewed

2026-07-23

## Future Improvements

Add PR template checklist that links here; enforce via CI later if needed.

---

## Binding rules

1. **Documentation is authoritative.** Never implement product features that contradict established documentation.
2. **Conflicts must be explicit.** If documentation and implementation disagree, **identify the conflict** — do not silently choose one side.
3. **Docs ship with code.** If a feature introduces a new pattern, update the appropriate documentation **in the same change**. Documentation is part of implementation, not an optional follow-up.
4. **No undocumented patterns.** No new UI pattern, interaction, lesson flow, prompt pattern, or branding decision may exist without being reflected in `/docs`.
5. **Missing standards block invention.** If a standard is missing: propose it → document it → then implement it.
6. **Settled decisions stick.** Do not reverse a [Decision Log](./DECISION_LOG.md) entry without a new dated decision.

---

## Required workflow (every implementation)

```text
1. Read START_HERE.md
2. Read GOVERNANCE.md (this file)
3. Consult GLOSSARY.md for terminology
4. Identify all relevant domain documents
5. Follow existing standards
6. If a standard is missing → propose + document first
7. Implement
8. Update docs / Decision Log as needed
9. Run Design and/or Engineering checklists
```

---

## Conflict protocol

When docs and code disagree:

| Step | Action |
|------|--------|
| 1 | Name both sides clearly (doc path + code path) |
| 2 | Check [Decision Log](./DECISION_LOG.md) and [Principles](./Product/ArtPraxis%20Principles.md) |
| 3 | Prefer **documented intent** unless the doc is clearly stale |
| 4 | If intent is unclear, **stop and record** a Decision Log proposal — do not guess in code |
| 5 | Resolve by updating **either** docs **or** code (or both) in one coherent change |

---

## What must be documented when changed

| Change type | Update at least |
|-------------|-----------------|
| UI / interaction pattern | Component Principles, Design Review notes, Decision Log if durable |
| Lesson flow / stage copy | Lesson Standards, Writing Style Guide |
| Prompt / generation behavior | Image Generation Standards, Prompt Engineering Standards |
| Brand / logo | Logo Standards, Brand Bible, public/brand README |
| Architecture / data | Architecture, Engineering Checklist notes |
| New platform surface | Platform Strategy + domain docs |

---

## AI assistants

Before writing code:

1. Follow this governance file.  
2. Prefer proposing a doc patch over inventing silent behavior.  
3. Use [Glossary](./GLOSSARY.md) terms exactly.  
4. Never treat temporary brand SVGs or outdated UI copy as “the standard” when docs say otherwise.
