# Motion Standards

## Purpose

Define calm, atelier-like motion — emerge, don’t pop.

## Related Documents

- [Atelier Design Manifesto](../design/atelier-design-manifesto.md.txt)
- [Motion guidelines (short)](../design/motion-guidelines.md.txt)
- [references/branding/motion/](../references/branding/motion/motion%20philosophy.txt)
- [Design Review Checklist](../DESIGN_REVIEW_CHECKLIST.md)

## Depends On

[ArtPraxis Principles](../Product/ArtPraxis%20Principles.md)

## Used By

UI animations, brand splash, loading marks.

## Last Reviewed

2026-07-23

## Future Improvements

Expand timing tokens and per-component recipes.

---

## Defaults

- Fade + slight rise (`Y 8px → 0`), opacity `0 → 1`  
- Duration **250–350ms**  
- Easing **ease-out**  
- Optional scale `0.98 → 1`  

## Rules

- Paper reveal, not software update  
- Respect `prefers-reduced-motion`  
- Loading brand mark: paint line reveal — not a spinner  
- Never bounce, elastic overshoot, or attention-seeking loops on lesson chrome  
