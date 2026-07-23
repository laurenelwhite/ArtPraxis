import type { StageIconKind } from "@/lib/stage-icons";

/** Inline SVG artwork for non-photo stage progress icons (transparent bg). */
export function StageIconArtwork({
  kind,
  className,
}: {
  kind: StageIconKind;
  className?: string;
}) {
  switch (kind) {
    case "pencil":
      return <PencilIcon className={className} />;
    case "values":
      return <ValuesIcon className={className} />;
    case "droplet":
      return <DropletIcon className={className} />;
    case "brush":
      return <BrushIcon className={className} />;
    case "refine-placeholder":
      return <RefinePlaceholderIcon className={className} />;
    case "finish-placeholder":
      return <FinishPlaceholderIcon className={className} />;
  }
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      {/* Graphite pencil — no paper/desk */}
      <defs>
        <linearGradient id="spi-pencil-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="45%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="spi-pencil-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e7c9a0" />
          <stop offset="100%" stopColor="#c4a574" />
        </linearGradient>
      </defs>
      <g transform="rotate(-38 18 18)">
        <rect x="15.2" y="4" width="5.6" height="20" rx="0.8" fill="url(#spi-pencil-body)" />
        <rect x="15.2" y="4" width="1.4" height="20" fill="#d1d5db" opacity="0.55" />
        <polygon points="15.2,24 20.8,24 18,31.2" fill="url(#spi-pencil-wood)" />
        <polygon points="16.4,27.6 19.6,27.6 18,31.2" fill="#374151" />
        <rect x="15.6" y="4.4" width="4.8" height="2.2" rx="0.4" fill="#1f2937" />
      </g>
    </svg>
  );
}

function ValuesIcon({ className }: { className?: string }) {
  // Painted tonal swatches — not a generic grid
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="10" cy="12" rx="7.2" ry="6.4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.6" />
      <ellipse cx="22" cy="10.5" rx="7.5" ry="6.6" fill="#9ca3af" opacity="0.95" />
      <ellipse cx="14" cy="22" rx="7.4" ry="6.5" fill="#6b7280" />
      <ellipse cx="26" cy="23" rx="7" ry="6.2" fill="#1f2937" />
      <ellipse cx="18" cy="16.5" rx="5.2" ry="4.6" fill="#d1d5db" opacity="0.85" />
    </svg>
  );
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="spi-drop" x1="0.3" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M18 4.5C18 4.5 8.5 16.2 8.5 22.2a9.5 9.5 0 0 0 19 0C27.5 16.2 18 4.5 18 4.5z"
        fill="url(#spi-drop)"
        stroke="#2563eb"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <ellipse cx="14.5" cy="18" rx="2.4" ry="3.6" fill="#fff" opacity="0.45" />
    </svg>
  );
}

function BrushIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="spi-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15" />
          <stop offset="35%" stopColor="#3b82f6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="spi-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      {/* Wet blue stroke */}
      <path
        d="M4.5 27.5c4.2-1.2 8.8-3.8 12.2-4.2 3.6-.4 7.2.6 10.8 1.4 1.4.3 2.8.4 4 .2"
        fill="none"
        stroke="url(#spi-stroke)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Round brush */}
      <g transform="rotate(-52 18 14)">
        <rect x="16.4" y="2" width="3.2" height="14" rx="1.2" fill="url(#spi-handle)" />
        <rect x="15.6" y="15.2" width="4.8" height="3.2" rx="0.6" fill="#cbd5e1" />
        <path
          d="M15.2 18.4c0 4.2 1.4 8.2 2.8 10.6.4-.2 1.2-.8 1.6-2.2.6 1.8 1.4 2.6 2 .8 1.2-2.2 2.4-5.8 2.4-9.2H15.2z"
          fill="#1e293b"
        />
        <path
          d="M16.2 18.6c.4 3.6 1.2 6.8 2 8.8"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

function RefinePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="18" cy="18" r="14" fill="#f1f5f9" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="#cbd5e1" strokeWidth="1" />
      <path
        d="M11 22c2-4 5-7 9-8 2.5 2 4 5 4.5 8"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="22.5" cy="12.5" r="2.2" fill="#64748b" opacity="0.5" />
    </svg>
  );
}

function FinishPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="18" cy="18" r="14" fill="#eef2ff" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="#c7d2fe" strokeWidth="1" />
      <path
        d="M12 19.5l3.2 3.2L24.5 13"
        fill="none"
        stroke="#6366f1"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tiny fine-detail brush mark for the refinement thumbnail corner. */
export function RefineBrushOverlay({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 18.5c3-1 6-3.2 9.5-3.6"
        fill="none"
        stroke="#1e3a8a"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14.2 6.2l3.6 3.6-6.4 6.4-3.6-3.6z"
        fill="#64748b"
        fillOpacity="0.55"
      />
      <path d="M17.8 5.4l1.8 1.8-1.6 1.6-1.8-1.8z" fill="#334155" fillOpacity="0.5" />
    </svg>
  );
}
