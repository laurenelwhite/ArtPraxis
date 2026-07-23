"use client";

import type { SVGProps } from "react";

type PaintbrushMarkProps = {
  className?: string;
  /** @deprecated Tip color is baked into the approved asset */
  paintColor?: string;
} & Omit<SVGProps<SVGSVGElement>, "color">;

/**
 * Approved brush detail for loading/reveal moments.
 * Renders the brand asset — do not substitute a generic icon.
 */
export function PaintbrushMark({
  className,
  paintColor: _paintColor,
  width = 72,
  height = 28,
  ...props
}: PaintbrushMarkProps) {
  void _paintColor;
  void props;
  return (
    // Brand SVG mark — keep native <img> so the approved vector asset is not optimized away.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/brush-reveal.svg"
      alt=""
      className={["paintbrush-mark", className].filter(Boolean).join(" ")}
      width={typeof width === "number" ? width : 72}
      height={typeof height === "number" ? height : 28}
      decoding="async"
      draggable={false}
      aria-hidden="true"
      style={{ width: "auto", height: "auto", maxWidth: "100%", objectFit: "contain" }}
    />
  );
}
