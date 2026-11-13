"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { AppImage } from "@/components/ui/AppImage";

type Sample = {
  hex: string;
  x: number;
  y: number;
};

export function ReferenceColorSampler({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [sample, setSample] = useState<Sample | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setUnavailable(false);
    setSample(null);
    setLocked(false);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !context) return;
      const scale = Math.min(1, 1600 / image.naturalWidth);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setReady(true);
    };
    image.onerror = () => {
      if (!cancelled) setUnavailable(true);
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  function readColor(
    event: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>,
  ) {
    if (!ready || locked) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(canvas.width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)),
    );
    const y = Math.max(
      0,
      Math.min(canvas.height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)),
    );
    try {
      const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
      const hex = `#${[red, green, blue]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`;
      setSample({
        hex,
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      });
    } catch {
      setUnavailable(true);
    }
  }

  if (unavailable) {
    return (
      <AppImage
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        sizes={sizes}
        className={className}
      />
    );
  }

  return (
    <div className="reference-color-sampler">
      <canvas
        ref={canvasRef}
        className={[className, "reference-color-sampler-canvas"].filter(Boolean).join(" ")}
        onPointerMove={readColor}
        onPointerLeave={() => {
          if (!locked) setSample(null);
        }}
        onClick={(event) => {
          if (locked) {
            setLocked(false);
            return;
          }
          readColor(event);
          setLocked(true);
        }}
        aria-label={`${alt}. Hover to sample a color; click to pin it.`}
        role="img"
      />
      {sample ? (
        <output
          className="reference-color-sampler-readout"
          style={{ left: `${sample.x}%`, top: `${sample.y}%` }}
          aria-live="polite"
        >
          <span
            className="reference-color-sampler-swatch"
            style={{ backgroundColor: sample.hex }}
            aria-hidden="true"
          />
          <strong>{sample.hex}</strong>
          <span>{locked ? "Pinned" : "Click to pin"}</span>
        </output>
      ) : null}
      <p className="reference-color-sampler-hint">
        <span className="reference-color-sampler-drop" aria-hidden="true" />
        Hover to identify a color · click to pin the hex
      </p>
    </div>
  );
}
