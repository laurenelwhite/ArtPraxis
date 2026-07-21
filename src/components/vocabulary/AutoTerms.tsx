import { Fragment } from "react";
import { matchTerms } from "@/lib/vocabulary";
import { Term } from "@/components/vocabulary/Term";

// Renders prose with the first occurrence of each known art term made tappable.
// Used on lesson explanations, goals, and instructor feedback so vocabulary is
// introduced in context rather than as a separate glossary.
export function AutoTerms({ text, max }: { text: string; max?: number }) {
  const segments = matchTerms(text, max);
  return (
    <>
      {segments.map((seg, i) =>
        seg.termId ? (
          <Term key={i} id={seg.termId}>
            {seg.text}
          </Term>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}
