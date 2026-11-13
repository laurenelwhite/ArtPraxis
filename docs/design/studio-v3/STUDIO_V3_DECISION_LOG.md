# Studio v3 — Decision Log

**Purpose:** Permanent record of Studio v3 design and product decisions. Every material choice gets a dated entry with rationale, alternatives, status, and affected surfaces.

**Status:** Active log (entries remain Pending design review until marked approved)

**Last updated:** 2026-08-03

---

## Entry template

```
### D-XXX — Short title
- **Date:** YYYY-MM-DD
- **Decision:** …
- **Rationale:** …
- **Alternatives considered:** …
- **Status:** proposed | approved | rejected | superseded
- **Affected screens:** …
- **Affected components:** …
- **Supersedes / superseded by:** …
```

---

## Decisions

### D-001 — Establish repository design source of truth for Studio v3
- **Date:** 2026-08-03
- **Decision:** Create `docs/design/studio-v3/` (core specs, screen stubs, decision log) and `docs/design/research/` stubs as the permanent home for Studio v3 design work. Unresolved content is marked “Pending design review.” Research informs original pedagogical principles only; no copyrighted book text or illustrations are copied into the repo.
- **Rationale:** Chat history is not durable. Design, implementation, and QA must share one in-repo contract before further Studio v3 implementation.
- **Alternatives considered:** Continue deciding in chat only; put specs only in an external design tool without repo mirrors.
- **Status:** proposed
- **Affected screens:** All listed Studio v3 screens (01–15)
- **Affected components:** Documentation structure only in this pass; no new product implementation
- **Supersedes / superseded by:** —

### D-002 — Preserve continuous lesson-document checkpoint as current lesson baseline
- **Date:** 2026-08-03
- **Decision:** Keep the continuous Plan-to-Finish lesson-document implementation (checkpoint commit on `feature/stability-ui-cleanup`) as the current lesson baseline. Studio v3 may extend or replace it only through subsequent logged decisions.
- **Rationale:** Avoid discarding completed lesson-document and visual art-direction work while beginning Studio v3 design.
- **Alternatives considered:** Revert to pre–lesson-document UI; redesign lesson screens from a blank slate without preserving the checkpoint.
- **Status:** proposed
- **Affected screens:** 03 Lesson plan through 11 Finish; related shell and navigation
- **Affected components:** Lesson plan/observe/color sections, Study Mode continuous document, stage nav, lesson shell, lesson CSS
- **Supersedes / superseded by:** —

---

## Status legend

| Status | Meaning |
|---|---|
| proposed | Recorded; awaiting design-owner approval |
| approved | Binding for implementation |
| rejected | Considered and not adopted |
| superseded | Replaced by a later decision |
