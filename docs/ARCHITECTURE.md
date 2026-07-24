# Architecture

## Purpose

Describe the ArtPraxis technical architecture at a high level for engineers and AI assistants.

## Related Documents

- [START_HERE](./START_HERE.md)
- [Product Spec](./PRODUCT_SPEC.md)
- [Engineering Checklist](./ENGINEERING_CHECKLIST.md)
- [Image Generation Standards](./Image%20Generation%20Standards.md)

## Depends On

[Product Spec](./PRODUCT_SPEC.md)

## Used By

Engineering implementation and reviews.

## Last Reviewed

2026-07-23

## Future Improvements

Document lesson UI state machine, generation orchestration, and Storage upload-first path.

---

The browser uses Firebase Authentication, Firestore, and Storage. A Next.js server route calls OpenAI so the API key never reaches the browser. OpenAI output is parsed with Zod before it is returned or saved.

Documents live at `users/{uid}/projects/{projectId}`. Images live at `users/{uid}/projects/{projectId}/{filename}`. Firebase rules restrict both to the owning authenticated user.

The MVP sends a base64 image to the server route. Before scale, upload first and have an authenticated server retrieve the object from Storage.
