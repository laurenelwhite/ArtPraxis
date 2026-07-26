"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

type Props = {
  imageUrl: string;
  children: ReactNode;
};

function toHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/**
 * Samples the original reference without changing the artwork presentation.
 * Firebase image CORS is supported; when a host blocks pixel access the
 * artwork remains usable and the control explains that sampling is unavailable.
 */
export function ReferenceColorSampler({ imageUrl, children }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [hex, setHex] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 16, y: 16 });

  useEffect(() => {
    setReady(false);
    setHex(null);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      canvasRef.current = canvas;
      setReady(true);
    };
    image.onerror = () => setReady(false);
    image.src = imageUrl;
    return () => {
      image.onload = null;
      image.onerror = null;
      canvasRef.current = null;
    };
  }, [imageUrl]);

  function sample(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || !ready || !surfaceRef.current || !canvasRef.current) return;
    const bounds = surfaceRef.current.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const yRatio = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    const canvas = canvasRef.current;
    const x = Math.min(canvas.width - 1, Math.floor(xRatio * canvas.width));
    const y = Math.min(canvas.height - 1, Math.floor(yRatio * canvas.height));
    try {
      const [red, green, blue] = canvas
        .getContext("2d", { willReadFrequently: true })!
        .getImageData(x, y, 1, 1).data;
      setHex(toHex(red, green, blue));
      setPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    } catch {
      setReady(false);
    }
  }

  async function copyHex() {
    if (hex) await navigator.clipboard?.writeText(hex);
  }

  return (
    <div
      ref={surfaceRef}
      className={[
        "reference-color-sampler",
        enabled ? "is-sampling" : null,
      ].filter(Boolean).join(" ")}
      onPointerMove={sample}
    >
      {children}
      <button
        type="button"
        className="reference-color-toggle"
        aria-pressed={enabled}
        disabled={!ready}
        onClick={() => setEnabled((value) => !value)}
        title={ready ? "Hover over the reference to identify a color" : "Color sampler is loading"}
      >
        <span className="reference-color-toggle-swatch" aria-hidden="true" />
        {enabled ? "Sampling color" : "Pick a color"}
      </button>
      {enabled && hex ? (
        <button
          type="button"
          className="reference-color-result"
          style={{ left: position.x, top: position.y }}
          onClick={copyHex}
          aria-label={`Copy sampled color ${hex}`}
          title="Copy hex value"
        >
          <span style={{ backgroundColor: hex }} aria-hidden="true" />
          {hex}
        </button>
      ) : null}
    </div>
  );
}
