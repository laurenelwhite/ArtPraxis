import type { ReactNode } from "react";

/** Shared viewport for side-by-side reference and target images. */
export function ComparisonFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `cmp-frame ${className}` : "cmp-frame"}>
      <div className="cmp-frame-inner">{children}</div>
    </div>
  );
}
