import type { StageIconKind } from "@/lib/stage-icons";

/** Process icons for the stage rail — distinct symbols, never photo thumbnails. */
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
    case "value-map":
      return <ValueMapIcon className={className} />;
    case "droplet":
      return <DropletIcon className={className} />;
    case "swatches":
      return <SwatchesIcon className={className} />;
    case "refine":
      return <RefineIcon className={className} />;
    case "finished":
      return <FinishedIcon className={className} />;
  }
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M14.1 4.2l5.7 5.7-11.2 11.2H2.9v-5.7L14.1 4.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12.4 5.9l5.7 5.7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.9 18.4l3.2.9.9 3.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ValueMapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.8a8.2 8.2 0 0 1 0 16.4V3.8z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5C12 3.5 5.8 11.2 5.8 15a6.2 6.2 0 0 0 12.4 0C18.2 11.2 12 3.5 12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 14.2c.4 1.6 1.4 2.6 2.6 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function SwatchesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3.5" y="10" width="7.5" height="9" rx="1.2" fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8.2" y="6.5" width="7.5" height="9" rx="1.2" fill="currentColor" opacity="0.45" stroke="currentColor" strokeWidth="1.2" />
      <rect x="13" y="3.5" width="7.5" height="9" rx="1.2" fill="currentColor" opacity="0.7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RefineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M15.2 4.2l4.6 4.6-9.8 9.8H5.4v-4.6L15.2 4.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13.6 5.8l4.6 4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.2 19.5h6.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.8 3.4l1.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FinishedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="4" y="4.5" width="16" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.2 12.2l2.6 2.6 5-5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Kept for any legacy refine-overlay callers; unused by the process rail. */
export function RefineBrushOverlay({ className }: { className?: string }) {
  return <RefineIcon className={className} />;
}
