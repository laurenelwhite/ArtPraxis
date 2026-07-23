import type { Tutorial } from "@/lib/tutorial-schema";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_CATEGORY_ORDER,
  classifyMaterialCategory,
  type MaterialCategoryId,
} from "@/lib/material-images";
import {
  MaterialCard,
  type MaterialCardModel,
} from "@/components/project/MaterialCard";

function buildMaterialCards(tutorial: Tutorial): MaterialCardModel[] {
  const cards: MaterialCardModel[] = [];

  for (const color of tutorial.palette) {
    cards.push({
      id: `paint-${color.name}`,
      item: color.name,
      purpose: [color.role, color.mixingNote].filter((s) => s.trim()).join(" · "),
      required: true,
      specification: color.ratio.trim() || undefined,
      category: "paints",
      swatchHex: color.hex,
      imageUrl: undefined,
    });
  }

  for (const material of tutorial.materials) {
    const category = classifyMaterialCategory(
      material.item,
      material.required,
    );
    cards.push({
      id: `mat-${material.item}`,
      item: material.item,
      purpose: material.purpose,
      required: material.required,
      imageUrl: material.imageUrl ?? undefined,
      specification: material.specification ?? undefined,
      quantity: material.quantity ?? undefined,
      substitution: material.substitution ?? undefined,
      category,
    });
  }

  return cards;
}

function groupCards(cards: MaterialCardModel[]) {
  const groups = new Map<MaterialCategoryId, MaterialCardModel[]>();
  for (const id of MATERIAL_CATEGORY_ORDER) {
    groups.set(id, []);
  }
  for (const card of cards) {
    const list = groups.get(card.category) ?? groups.get("drawing-setup")!;
    list.push(card);
  }
  return MATERIAL_CATEGORY_ORDER
    .map((id) => ({
      id,
      label: MATERIAL_CATEGORY_LABELS[id],
      items: groups.get(id) ?? [],
    }))
    .filter((g) => g.items.length > 0);
}

export function ProjectMaterials({ tutorial }: { tutorial: Tutorial | null }) {
  if (!tutorial) {
    return (
      <div className="card">
        <p className="meta">No materials were listed for this lesson.</p>
      </div>
    );
  }

  const cards = buildMaterialCards(tutorial);
  if (cards.length === 0) {
    return (
      <div className="card">
        <p className="meta">No materials were listed for this lesson.</p>
      </div>
    );
  }

  const groups = groupCards(cards);

  return (
    <div className="project-materials">
      <header className="project-materials-header">
        <p className="eyebrow">Materials</p>
        <h2 className="project-materials-title">What you’ll need</h2>
        <p className="project-materials-lead">
          Gather these supplies before you begin. Each card shows what it is and
          why this lesson uses it.
        </p>
      </header>

      {groups.map((group) => (
        <section
          key={group.id}
          className="material-section"
          aria-labelledby={`materials-${group.id}`}
        >
          <h3 className="material-section-title" id={`materials-${group.id}`}>
            {group.label}
          </h3>
          <ul className="material-card-grid">
            {group.items.map((material) => (
              <li key={material.id}>
                <MaterialCard material={material} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
