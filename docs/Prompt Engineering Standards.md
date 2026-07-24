# Prompt Engineering Standards

## Purpose

Govern how we write and change prompts for master paintings and stage plates so outputs stay composition-locked and pedagogically correct.

## Related Documents

- [Image Generation Standards](./Image%20Generation%20Standards.md)
- [Lesson Standards](./Lesson%20Standards.md)
- [ArtPraxis Principles](./Product/ArtPraxis%20Principles.md)
- Implementation: `src/lib/stage-image-prompts.ts`, master pipeline modules

## Depends On

[Image Generation Standards](./Image%20Generation%20Standards.md)

## Used By

Engineers and AI assistants editing generation prompts.

## Last Reviewed

2026-07-23

## Future Improvements

Publish full prompt templates and negative-prompt library; diff protocol for prompt PRs.

---

## Rules

1. **Composition lock** is non-negotiable — say it explicitly every time.  
2. Prefer **minimal edit** language for stages after Sketch.  
3. Encode **must avoid** lists (text, crop drift, opaque coverage, etc.).  
4. Stage intent must match [Image Generation Standards](./Image%20Generation%20Standards.md).  
5. Do not change models/providers in the same PR as unrelated UI work.  
6. Any durable prompt rule → update Image Generation Standards + Decision Log if product-facing.  

## Change protocol

1. Read Image Generation Standards for the stage.  
2. Edit code prompts.  
3. Generate fixtures / manual samples.  
4. Run QA checklist in Image Generation Standards.  
5. Update docs if behavior changed.  

## Anti-patterns

- Prompting “make it beautiful” without stage constraints  
- Allowing subject invention  
- Asking for labels/text in-frame  
- Collapsing all stages into finished look  
