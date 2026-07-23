import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "public", "materials");
fs.mkdirSync(dir, { recursive: true });

function wrap(inner, label) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 240 240" role="img" aria-label="${label}">
  <rect width="240" height="240" fill="#FAFAF8"/>
  <rect x="12" y="12" width="216" height="216" rx="10" fill="#FCFCFA" stroke="#DDDAD4" stroke-width="1"/>
  ${inner}
</svg>
`;
}

const assets = {
  "round-brush": wrap(
    `<g fill="none" stroke="#171717" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M118 42 L122 150"/>
      <path d="M110 150 L130 150 L128 178 Q120 198 112 178 Z" fill="#E8E4DC" stroke="#171717"/>
      <path d="M114 42 L126 42 L124 52 L116 52 Z" fill="#A35F38" stroke="#171717"/>
    </g>`,
    "Round brush",
  ),
  "flat-brush": wrap(
    `<g fill="none" stroke="#171717" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M120 40 L120 138"/>
      <rect x="102" y="138" width="36" height="48" rx="3" fill="#E8E4DC"/>
      <path d="M108 40 L132 40 L130 52 L110 52 Z" fill="#A35F38"/>
    </g>`,
    "Flat brush",
  ),
  "mop-brush": wrap(
    `<g fill="none" stroke="#171717" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M120 38 L120 128"/>
      <path d="M96 128 Q120 198 144 128 Z" fill="#E8E4DC"/>
      <path d="M112 38 L128 38 L126 50 L114 50 Z" fill="#A35F38"/>
      <path d="M104 150 Q120 168 136 150" stroke="#66635F" stroke-width="1.4"/>
    </g>`,
    "Mop brush",
  ),
  "detail-brush": wrap(
    `<g fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M120 36 L120 165"/>
      <path d="M116 165 L124 165 L122 198 L118 198 Z" fill="#E8E4DC"/>
      <path d="M115 36 L125 36 L124 46 L116 46 Z" fill="#A35F38"/>
    </g>`,
    "Detail brush",
  ),
  "watercolor-paper": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="58" y="48" width="124" height="144" rx="4" fill="#F4F1EA"/>
      <path d="M70 78 H170 M70 98 H160 M70 118 H168 M70 138 H150 M70 158 H162" stroke="#DDDAD4" stroke-width="1.4"/>
      <circle cx="168" cy="64" r="3" fill="#75806B" stroke="none"/>
    </g>`,
    "Watercolor paper",
  ),
  canvas: wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="52" y="52" width="136" height="136" rx="3" fill="#EFEBE3"/>
      <rect x="64" y="64" width="112" height="112" fill="#F7F4EE" stroke="#C9C3B8"/>
      <path d="M52 52 L64 64 M188 52 L176 64 M52 188 L64 176 M188 188 L176 176" stroke="#A35F38" stroke-width="1.4"/>
    </g>`,
    "Canvas",
  ),
  "watercolor-tube": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="98" y="54" width="44" height="18" rx="2" fill="#DDDAD4"/>
      <rect x="92" y="72" width="56" height="100" rx="6" fill="#F1E7DF"/>
      <rect x="92" y="148" width="56" height="28" rx="4" fill="#A35F38"/>
      <path d="M110 78 H130" stroke="#66635F" stroke-width="1.3"/>
    </g>`,
    "Paint tube",
  ),
  "mixing-palette": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="120" cy="124" rx="70" ry="52" fill="#F4F1EA"/>
      <circle cx="92" cy="112" r="10" fill="#E8D5C4"/>
      <circle cx="120" cy="104" r="10" fill="#D5DFE8"/>
      <circle cx="148" cy="112" r="10" fill="#D9E3D4"/>
      <circle cx="108" cy="136" r="10" fill="#E4D8C8"/>
      <circle cx="136" cy="136" r="10" fill="#D8CFC4"/>
      <circle cx="168" cy="148" r="8" fill="#FAFAF8" stroke="#171717"/>
    </g>`,
    "Mixing palette",
  ),
  pencil: wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M70 150 L150 70" stroke-width="10" stroke="#E8D5C4"/>
      <path d="M70 150 L150 70" stroke-width="2.2"/>
      <path d="M150 70 L168 78 L160 88 Z" fill="#F4F1EA"/>
      <path d="M70 150 L58 162" stroke-width="3" stroke="#A35F38"/>
      <path d="M130 90 L140 80" stroke="#66635F" stroke-width="1.3"/>
    </g>`,
    "Pencil",
  ),
  eraser: wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M78 128 L118 78 L162 108 L122 158 Z" fill="#E8E4DC"/>
      <path d="M96 118 L136 88" stroke="#66635F" stroke-width="1.3"/>
      <path d="M88 138 Q100 150 118 146" stroke="#A35F38" stroke-width="1.5"/>
    </g>`,
    "Eraser",
  ),
  "water-container": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M84 78 H156 L148 176 H92 Z" fill="#E8EEF4"/>
      <path d="M78 78 H162" stroke-width="2.2"/>
      <path d="M96 120 H144" stroke="#315B8A" stroke-width="1.4" opacity="0.55"/>
      <path d="M100 140 H140" stroke="#315B8A" stroke-width="1.4" opacity="0.35"/>
    </g>`,
    "Water container",
  ),
  "paper-towel": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="70" y="78" width="100" height="84" rx="6" fill="#F7F4EE"/>
      <path d="M86 100 H154 M86 118 H148 M86 136 H152" stroke="#DDDAD4" stroke-width="1.4"/>
      <path d="M170 86 Q186 120 168 158" stroke="#A35F38" stroke-width="1.5"/>
    </g>`,
    "Paper towel",
  ),
  "masking-tape": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="120" cy="120" r="52" fill="#EFE6D6"/>
      <circle cx="120" cy="120" r="22" fill="#FAFAF8"/>
      <path d="M120 68 A52 52 0 0 1 168 140" stroke="#A35F38" stroke-width="6"/>
    </g>`,
    "Masking tape",
  ),
  "generic-supply": wrap(
    `<g fill="none" stroke="#171717" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="70" y="78" width="100" height="84" rx="8" fill="#F4F1EA"/>
      <path d="M90 110 H150 M90 128 H138" stroke="#66635F" stroke-width="1.5"/>
      <circle cx="156" cy="96" r="5" fill="#75806B" stroke="none"/>
    </g>`,
    "Art supply",
  ),
};

for (const [name, svg] of Object.entries(assets)) {
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
}

console.log(`Wrote ${Object.keys(assets).length} material illustrations to ${dir}`);
