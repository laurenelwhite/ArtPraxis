# Architecture

## Purpose

Describe the ArtPraxis technical architecture at a high level for engineers and AI assistants.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Product Spec](./PRODUCT_SPEC.md)
- [Engineering Checklist](./ENGINEERING_CHECKLIST.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)
- [Component Architecture Improvements](./COMPONENT_ARCHITECTURE.md)

## Depends On

[Product Spec](./PRODUCT_SPEC.md)

## Used By

Engineering implementation and reviews.

## Last Reviewed

2026-07-24

## Future Improvements

Document generation orchestration and Storage upload-first path in more depth; keep component inventory in [Component Architecture Improvements](./COMPONENT_ARCHITECTURE.md).

---

The browser uses Firebase Authentication, Firestore, and Storage. A Next.js server route calls OpenAI so the API key never reaches the browser. OpenAI output is parsed with Zod before it is returned or saved.

Documents live at `users/{uid}/projects/{projectId}`. Images live at `users/{uid}/projects/{projectId}/{filename}`. Firebase rules restrict both to the owning authenticated user.

The MVP sends a base64 image to the server route. Before scale, upload first and have an authenticated server retrieve the object from Storage.

### Lesson UI component spine

`LessonView` → `LessonExperience` → `StudyMode` | `PaintMode` → shared stage primitives (`StageGuideColumn`, `StageComparison`, …). See [Component Architecture Improvements](./COMPONENT_ARCHITECTURE.md) for the current inventory, naming rules, and token guidance.
