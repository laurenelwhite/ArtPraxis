# Design Review Checklist

## Purpose

Gate UI/UX changes before ship. Answer every question honestly. If multiple answers are “no,” revise before merge.

## Related Documents

- [Governance](./GOVERNANCE.md)
- [Glossary](./GLOSSARY.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Atelier Design Manifesto](./design/atelier-design-manifesto.md.txt)
- [Component Principles](./design/component-principles.md)
- [UI Checklist](./design/ui-checklist.md.txt)
- [Motion Standards](./brand/Motion%20Standards.md)
- [Lesson Standards](./Lesson%20Standards.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)
- [Accessibility](./Accessibility.md)
- [Decision Log](./DECISION_LOG.md)
- [Platform Strategy](./Product/Platform%20Strategy.md)

## Depends On

[Governance](./GOVERNANCE.md), [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)

## Used By

Designers, engineers, AI assistants reviewing UI PRs.

## Last Reviewed

2026-07-23

## Future Improvements

Add screenshot attachment convention per PR.

---

## Standards alignment

- [ ] [Governance](./GOVERNANCE.md) followed; new patterns documented in-change?  
- [ ] [Glossary](./GLOSSARY.md) terminology (reference / master / Value Map / …)?  
- [ ] Follows Brand Bible / logo rules (no improvised marks)?  
- [ ] Follows UI / Component Principles?  
- [ ] Follows Motion Standards (emerge, don’t pop)?  
- [ ] Follows Lesson Standards (if lesson surface)?  
- [ ] Follows Image Standards (if showing generated art)?  
- [ ] Follows Accessibility expectations?  
- [ ] Compatible with Decision Log?  
- [ ] Platform-safe (not web-only assumptions unless documented)?  

## Atelier quality

- [ ] Does this reduce friction?  
- [ ] Does this improve clarity?  
- [ ] Is the painting (or primary artwork) still dominant?  
- [ ] One primary action?  
- [ ] No duplicate navigation or status?  
- [ ] Borders/shadows earned — not decorative?  
- [ ] Would this exist in an atelier workbook?  
- [ ] Does this feel like a teacher — not software chrome?  

## Peer bar

- [ ] Would Apple ship this?  
- [ ] Would Linear ship this?  
- [ ] Would Notion ship this?  
- [ ] Would Adobe Fresco feel comfortable beside this?  
- [ ] Does this feel premium?  

## Generation & regen (if applicable)

- [ ] Loading hierarchy clear — no duplicated headings?  
- [ ] Wait expectation stated (≈1–2 min for master)?  
- [ ] Progress alive without fake %?  
- [ ] Tabs do not imply unfinished sections are ready?  
- [ ] Regeneration keeps prior candidate visible?  
- [ ] Duplicate regen requests impossible?  
- [ ] Sidebar logo uses dedicated `sidebar` variant (brush fully visible)?  

## Density

- [ ] Could whitespace solve this?  
- [ ] Could typography solve this?  
- [ ] Fewer than three visual emphasis levels?  

## Copy

- [ ] Instructor language (not “Generating / Processing / Rendering”)?  
- [ ] Warm, clear, never patronizing?  

---

If unchecked items are intentional, record a [Decision Log](./DECISION_LOG.md) entry.
