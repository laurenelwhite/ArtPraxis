import type { Tutorial } from "@/lib/tutorial-schema";

export function ProjectMaterials({ tutorial }: { tutorial: Tutorial | null }) {
  if (!tutorial || tutorial.materials.length === 0) {
    return <div className="card"><p className="meta">No materials were listed for this lesson.</p></div>;
  }

  return (
    <div className="project-materials">
      <p className="eyebrow">Materials</p>
      <ul className="materials-list">
        {tutorial.materials.map((material) => (
          <li key={material.item} className="material-row">
            <div>
              <strong>{material.item}</strong>
              <p className="meta">{material.purpose}</p>
            </div>
            <span className={material.required ? "tag required" : "tag"}>
              {material.required ? "Required" : "Optional"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
