import type { SVGProps } from "react";

type BrushStrokeProps = {
  color?: string;
  className?: string;
  decorative?: boolean;
} & Omit<SVGProps<SVGSVGElement>, "color">;

/**
 * Approved navy brushstroke asset (secondary motif).
 * Prefer ArtPraxisLogo / ArtPraxisLoadingMark for brand moments.
 */
export function BrushStroke({
  className,
  decorative = true,
  color: _color,
  ...props
}: BrushStrokeProps) {
  void _color;
  void props;
  return (
    // Brand SVG stroke — keep native <img> so Next does not re-encode or crop the motif.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/brush-stroke-navy.svg"
      alt=""
      className={["brush-stroke", className].filter(Boolean).join(" ")}
      width={240}
      height={18}
      decoding="async"
      draggable={false}
      aria-hidden={decorative ? true : undefined}
      style={{ width: "auto", maxWidth: "100%", height: "auto", objectFit: "contain" }}
    />
  );
}
