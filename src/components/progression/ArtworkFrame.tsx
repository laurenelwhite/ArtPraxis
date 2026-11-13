import type { ReactNode } from "react";

export type ArtworkVariant = "reference" | "painting" | "sketch" | "default";

/**
 * Museum matte + fillet around artwork. Presentation only —
 * does not crop or alter image pixels.
 */
export function ArtworkFrame({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: ArtworkVariant;
  className?: string;
}) {
  const classes = [
    "artwork-frame",
    `artwork-frame--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="artwork-frame-mat">
        <div className="artwork-frame-fillet">
          <div className="artwork-frame-stage">{children}</div>
        </div>
      </div>
    </div>
  );
}
