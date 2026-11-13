import type { ReactNode } from "react";
import {
  ArtworkFrame,
  type ArtworkVariant,
} from "@/components/progression/ArtworkFrame";

/** Shared museum viewport for side-by-side reference and target images. */
export function ComparisonFrame({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: ArtworkVariant;
}) {
  return (
    <ArtworkFrame variant={variant} className={className ? `cmp-frame ${className}` : "cmp-frame"}>
      <div className="cmp-frame-inner">{children}</div>
    </ArtworkFrame>
  );
}
