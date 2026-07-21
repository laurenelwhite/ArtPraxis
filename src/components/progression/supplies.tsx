import type { WetLevel } from "@/lib/progression";

// Restrained, original supply silhouettes. Monochrome (currentColor), sized by
// the caller. Each object teaches or orients — none are decorative clutter.

type IconProps = { size?: number; className?: string };

export function BrushIcon({ size = 26, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="10.6" y="2" width="2.8" height="9" rx="1.4" />
      <rect x="9.3" y="10.2" width="5.4" height="3.2" rx="0.8" opacity="0.55" />
      <path d="M9.6 13.2h4.8l-1.05 6.4a1.35 1.35 0 0 1-2.7 0z" />
    </svg>
  );
}

export function PencilIcon({ size = 26, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M16.7 4.2a1.7 1.7 0 0 1 2.4 0l0.7 0.7a1.7 1.7 0 0 1 0 2.4L8.9 18.2l-4 1.3 1.3-4z" />
      <path d="M4.9 19.5l1.3-4 2.7 2.7z" opacity="0.55" />
    </svg>
  );
}

function Droplet({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" className={filled ? "wet-drop filled" : "wet-drop"} aria-hidden="true" focusable="false">
      <path
        d="M12 3s-6.5 7.4-6.5 11.6a6.5 6.5 0 0 0 13 0C18.5 10.4 12 3 12 3z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

const WET_ORDER: WetLevel[] = ["dry", "damp", "moist", "wet", "very-wet"];
const WET_LABEL: Record<WetLevel, string> = {
  dry: "Dry",
  damp: "Damp",
  moist: "Moist",
  wet: "Wet",
  "very-wet": "Very wet",
};

// A four-step wetness gauge (damp → very wet); "dry" fills none.
export function WetnessScale({ level }: { level: WetLevel }) {
  const idx = WET_ORDER.indexOf(level);
  return (
    <div className="wet-scale" role="img" aria-label={`Water: ${WET_LABEL[level]}`}>
      <span className="wet-track" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <Droplet key={step} filled={idx >= step} />
        ))}
      </span>
      <span className="wet-level">{WET_LABEL[level]}</span>
    </div>
  );
}
