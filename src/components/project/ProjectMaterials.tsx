"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tutorial } from "@/lib/tutorial-schema";
import {
  MATERIAL_CATEGORY_ORDER,
  classifyMaterialCategory,
  parseMaterialLabel,
  resolveMaterialImage,
  type MaterialCategoryId,
} from "@/lib/material-images";

type FilterId = "all" | "essential" | "optional" | "ready";

type WorkbenchItem = {
  id: string;
  kind: "material" | "paint";
  name: string;
  purpose: string;
  required: boolean;
  specification?: string;
  quantity?: string;
  substitution?: string;
  category: MaterialCategoryId;
  swatchHex?: string;
  role?: string;
  mixingNote?: string;
  ratio?: string;
  imageSrc?: string;
};

type PaletteRole = "core" | "accent" | "neutral" | "light" | "other";

const WORKBENCH_LABELS: Record<MaterialCategoryId, string> = {
  surface: "Surface",
  "drawing-setup": "Drawing tools",
  paints: "Core colors",
  brushes: "Blending and tools",
  optional: "Finishing & optional",
};

const WORKBENCH_ORDER: MaterialCategoryId[] = [
  "surface",
  "drawing-setup",
  "paints",
  "brushes",
  "optional",
];

function classifyPaletteRole(role: string): PaletteRole {
  const t = role.toLowerCase();
  if (/\b(light|highlight|white|tint)\b/.test(t)) return "light";
  if (/\b(neutral|gray|grey|black|umber|payne)\b/.test(t)) return "neutral";
  if (/\b(accent|spark|pop|warm accent|cool accent)\b/.test(t)) return "accent";
  if (/\b(core|base|body|dominant|main|local)\b/.test(t)) return "core";
  return "other";
}

function buildItems(tutorial: Tutorial): WorkbenchItem[] {
  const items: WorkbenchItem[] = [];

  for (const color of tutorial.palette) {
    items.push({
      id: `paint-${color.name}`,
      kind: "paint",
      name: color.name,
      purpose: color.role,
      required: true,
      specification: color.ratio.trim() || undefined,
      category: "paints",
      swatchHex: color.hex,
      role: color.role,
      mixingNote: color.mixingNote,
      ratio: color.ratio,
    });
  }

  for (const material of tutorial.materials) {
    const category = classifyMaterialCategory(material.item, material.required);
    const { name, specification } = parseMaterialLabel(
      material.item,
      material.specification,
    );
    const resolved = resolveMaterialImage({
      item: material.item,
      purpose: material.purpose,
      required: material.required,
      imageUrl: material.imageUrl,
      categoryHint: category === "optional" ? undefined : category,
    });
    items.push({
      id: `mat-${material.item}`,
      kind: "material",
      name,
      purpose: material.purpose,
      required: material.required,
      specification: specification || undefined,
      quantity: material.quantity ?? undefined,
      substitution: material.substitution ?? undefined,
      category,
      imageSrc: resolved.src,
    });
  }

  return items;
}

export function ProjectMaterials({
  tutorial,
  highlightId = null,
  onHighlightConsumed,
}: {
  tutorial: Tutorial | null;
  highlightId?: string | null;
  onHighlightConsumed?: () => void;
}) {
  const items = useMemo(
    () => (tutorial ? buildItems(tutorial) : []),
    [tutorial],
  );

  const [readyIds, setReadyIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<FilterId>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WORKBENCH_ORDER.map((id) => [id, true])),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMixes, setShowMixes] = useState(true);

  useEffect(() => {
    if (!highlightId) return;
    setSelectedId(highlightId);
    const item = items.find((i) => i.id === highlightId);
    if (item) {
      setExpanded((prev) => ({ ...prev, [item.category]: true }));
      requestAnimationFrame(() => {
        document.getElementById(`material-${highlightId}`)?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      });
    }
    onHighlightConsumed?.();
  }, [highlightId, items, onHighlightConsumed]);

  if (!tutorial || items.length === 0) {
    return (
      <div className="card materials-empty">
        <p className="meta">No materials were listed for this lesson.</p>
      </div>
    );
  }

  const palette = items.filter((i) => i.kind === "paint");
  const supplies = items.filter((i) => i.kind === "material");

  const filtered = (list: WorkbenchItem[]) =>
    list.filter((item) => {
      if (filter === "essential") return item.required;
      if (filter === "optional") return !item.required;
      if (filter === "ready") return readyIds.has(item.id);
      return true;
    });

  const readyCount = items.filter((i) => readyIds.has(i.id)).length;

  const toggleReady = (id: string) => {
    setReadyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groups = WORKBENCH_ORDER.map((id) => ({
    id,
    label: WORKBENCH_LABELS[id],
    items: filtered(supplies.filter((s) => s.category === id)),
  })).filter((g) => g.items.length > 0);

  // Paints also appear in paints category grouping when mixed into supplies path;
  // palette section is dedicated visual treatment.
  const leftover = filtered(
    supplies.filter((s) => !MATERIAL_CATEGORY_ORDER.includes(s.category)),
  );

  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="materials-workbench">
      <header className="materials-workbench-header">
        <div>
          <p className="eyebrow">Materials</p>
          <h2 className="materials-workbench-title">Your atelier setup</h2>
          <p className="materials-workbench-lead">
            Gather what you need, mark items ready as you go. Checklist stays on
            this device for this session — it does not sync to the cloud.
          </p>
        </div>
        <p className="materials-ready-summary" aria-live="polite">
          <strong>{readyCount}</strong> of {items.length} materials ready
        </p>
      </header>

      <div className="materials-filters" role="toolbar" aria-label="Filter materials">
        {(
          [
            ["all", "All"],
            ["essential", "Essential"],
            ["optional", "Optional"],
            ["ready", "Already have"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "materials-filter is-active" : "materials-filter"}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {palette.length > 0 && (
        <section className="palette-atelier" aria-labelledby="palette-atelier-title">
          <div className="palette-atelier-head">
            <div>
              <h3 id="palette-atelier-title" className="palette-atelier-title">
                Color palette
              </h3>
              <p className="palette-atelier-lead">
                Pigment chips for this lesson. Select a swatch for mixing notes.
              </p>
            </div>
            <label className="palette-mix-toggle">
              <input
                type="checkbox"
                checked={showMixes}
                onChange={(e) => setShowMixes(e.target.checked)}
              />
              Show mixes
            </label>
          </div>

          <ul className="palette-legend" aria-label="Palette legend">
            <li><span className="palette-legend-dot is-core" /> Core</li>
            <li><span className="palette-legend-dot is-accent" /> Accent</li>
            <li><span className="palette-legend-dot is-neutral" /> Neutral</li>
            <li><span className="palette-legend-dot is-light" /> Light</li>
          </ul>

          <ul className="palette-chip-grid">
            {filtered(palette).map((color) => {
              const role = classifyPaletteRole(color.role || "");
              const isSelected = selectedId === color.id;
              const isReady = readyIds.has(color.id);
              return (
                <li key={color.id}>
                  <button
                    type="button"
                    id={`material-${color.id}`}
                    className={[
                      "palette-chip",
                      isSelected ? "is-selected" : null,
                      isReady ? "is-ready" : null,
                      `role-${role}`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isSelected}
                    onClick={() =>
                      setSelectedId((cur) => (cur === color.id ? null : color.id))
                    }
                  >
                    <span
                      className="palette-chip-daub"
                      style={{ background: color.swatchHex }}
                      aria-hidden="true"
                    />
                    <span className="palette-chip-meta">
                      <span className="palette-chip-name">{color.name}</span>
                      <span className="palette-chip-role">{color.role}</span>
                      {showMixes && color.mixingNote?.trim() ? (
                        <span className="palette-chip-mix">{color.mixingNote}</span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={isReady ? "palette-ready-btn is-on" : "palette-ready-btn"}
                    aria-pressed={isReady}
                    onClick={() => toggleReady(color.id)}
                  >
                    {isReady ? "Ready" : "Mark ready"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {selected?.kind === "paint" && (
        <aside className="palette-detail" aria-live="polite">
          <h4 className="palette-detail-title">{selected.name}</h4>
          <p className="palette-detail-body">{selected.purpose}</p>
          {selected.mixingNote?.trim() ? (
            <p className="palette-detail-mix">
              <span className="palette-detail-kicker">Suggested mix</span>
              {selected.mixingNote}
              {selected.ratio?.trim() ? ` · ${selected.ratio}` : ""}
            </p>
          ) : null}
        </aside>
      )}

      {groups.map((group) => (
        <section
          key={group.id}
          className="workbench-section"
          aria-labelledby={`workbench-${group.id}`}
        >
          <button
            type="button"
            className="workbench-section-toggle"
            id={`workbench-${group.id}`}
            aria-expanded={expanded[group.id] !== false}
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [group.id]: !(prev[group.id] !== false),
              }))
            }
          >
            <span>{group.label}</span>
            <span className="workbench-section-count">{group.items.length}</span>
          </button>

          {expanded[group.id] !== false && (
            <ul className="workbench-list">
              {group.items.map((item) => {
                const isReady = readyIds.has(item.id);
                const isSelected = selectedId === item.id;
                return (
                  <li key={item.id}>
                    <article
                      id={`material-${item.id}`}
                      className={[
                        "workbench-item",
                        isSelected ? "is-selected" : null,
                        isReady ? "is-ready" : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <button
                        type="button"
                        className="workbench-item-main"
                        onClick={() =>
                          setSelectedId((cur) => (cur === item.id ? null : item.id))
                        }
                      >
                        <span className="workbench-item-mark" aria-hidden="true">
                          {item.imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageSrc} alt="" width={40} height={40} />
                          ) : (
                            <span className="workbench-item-fallback" />
                          )}
                        </span>
                        <span className="workbench-item-copy">
                          <span className="workbench-item-name">{item.name}</span>
                          {item.purpose.trim() ? (
                            <span className="workbench-item-purpose">{item.purpose}</span>
                          ) : null}
                          {isSelected && item.substitution?.trim() ? (
                            <span className="workbench-item-note">
                              Substitute: {item.substitution}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={
                            item.required
                              ? "workbench-item-tag is-required"
                              : "workbench-item-tag"
                          }
                        >
                          {item.required ? "Essential" : "Optional"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={isReady ? "workbench-ready is-on" : "workbench-ready"}
                        aria-pressed={isReady}
                        onClick={() => toggleReady(item.id)}
                      >
                        {isReady ? "Ready" : "Mark ready"}
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      {leftover.length > 0 && (
        <ul className="workbench-list">
          {leftover.map((item) => (
            <li key={item.id}>
              <article className="workbench-item">
                <div className="workbench-item-copy">
                  <span className="workbench-item-name">{item.name}</span>
                  <span className="workbench-item-purpose">{item.purpose}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
