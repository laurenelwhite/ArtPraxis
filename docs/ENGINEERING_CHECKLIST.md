# Engineering Checklist

## Purpose

Gate engineering changes for quality, consistency, and documentation hygiene.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Governance](./GOVERNANCE.md)
- [Glossary](./GLOSSARY.md)
- [Architecture](./ARCHITECTURE.md)
- [Product Spec](./PRODUCT_SPEC.md)
- [Design Review Checklist](./DESIGN_REVIEW_CHECKLIST.md)
- [Accessibility](./Accessibility.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- [Platform Strategy](./Product/Platform%20Strategy.md)

## Depends On

[Governance](./GOVERNANCE.md), [Architecture](./ARCHITECTURE.md)

## Used By

Engineers and AI assistants before merge.

## Last Reviewed

2026-07-23

## Future Improvements

Add CI job that fails if Decision Log–sensitive areas change without doc touch.

---

## Product & docs

- [ ] [Governance](./GOVERNANCE.md) workflow followed  
- [ ] [Glossary](./GLOSSARY.md) terms used in UI copy and comments  
- [ ] Relevant `/docs` standards read (START_HERE → domain doc)  
- [ ] No conflict with [Decision Log](./DECISION_LOG.md)  
- [ ] Documentation updated **in this change** if a durable rule or pattern changed  
- [ ] Design Review Checklist completed for UI changes  

## TypeScript & quality

- [ ] `npx tsc --noEmit` passes  
- [ ] `npm run lint` passes (no new errors)  
- [ ] Tests added/updated when logic is non-trivial  
- [ ] No duplicated logic — shared helpers preferred  
- [ ] No unexplained magic numbers (name constants)  

## Accessibility

- [ ] Semantic HTML / roles where needed  
- [ ] Keyboard reachable controls  
- [ ] Labels / `aria-*` for icon-only controls  
- [ ] Contrast acceptable on ivory / navy system  
- [ ] Motion respects `prefers-reduced-motion`  

## Performance

- [ ] No unnecessary client waterfalls  
- [ ] Images sized sensibly; brand SVGs not raster-scaled oddly  
- [ ] Avoid heavy re-renders on lesson scroll  

## Responsive

- [ ] Desktop atelier (≥1100) verified when relevant  
- [ ] Tablet / mobile breakpoints verified  
- [ ] No crushed logos or unreadable type  

## Design system

- [ ] Typography uses project tokens / fonts (Cormorant + UI sans)  
- [ ] Spacing consistent with atelier whitespace goals  
- [ ] Motion matches guidelines  
- [ ] Reusable components over one-offs  
- [ ] Design tokens / CSS variables — no random hex sprawl for brand colors  

## Naming & structure

- [ ] Clear names matching domain language (stages, atelier, etc.)  
- [ ] Files in conventional folders (`components/brand`, `lib/`, …)  

## Security / data

- [ ] No secrets in client bundles  
- [ ] Firebase rules assumptions unchanged or documented  
- [ ] User content paths remain owner-scoped  

## Brand (if touching logos)

- [ ] Only `ArtPraxisLogo` / `ArtPraxisLoadingMark`  
- [ ] Approved size presets only  
- [ ] No recolor / filter on logo artwork  
