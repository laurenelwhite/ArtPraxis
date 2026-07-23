import Image from "next/image";
import {
  parseMaterialLabel,
  resolveMaterialImage,
  type MaterialCategoryId,
} from "@/lib/material-images";

export type MaterialCardModel = {
  id: string;
  item: string;
  purpose: string;
  required: boolean;
  imageUrl?: string | null;
  specification?: string | null;
  quantity?: string | null;
  substitution?: string | null;
  category: MaterialCategoryId;
  /** Optional paint swatch for palette colors */
  swatchHex?: string;
};

export function MaterialCard({ material }: { material: MaterialCardModel }) {
  const { name, specification } = parseMaterialLabel(
    material.item,
    material.specification,
  );
  const resolved = resolveMaterialImage({
    item: material.item,
    purpose: material.purpose,
    required: material.required,
    imageUrl: material.imageUrl,
    categoryHint: material.category === "optional" ? undefined : material.category,
  });

  const isSvg = resolved.src.endsWith(".svg");
  const alt = specification ? `${name}, ${specification}` : name;

  return (
    <article className="material-card">
      <div className="material-card-media">
        {isSvg ? (
          // Local editorial SVGs — native <img> preserves vector fidelity and fixed dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved.src}
            alt={alt}
            width={480}
            height={480}
            className="material-card-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Image
            src={resolved.src}
            alt={alt}
            width={480}
            height={480}
            className="material-card-image"
            sizes="(max-width: 560px) 50vw, (max-width: 960px) 33vw, 240px"
          />
        )}
        {material.swatchHex && (
          <span
            className="material-card-swatch"
            style={{ background: material.swatchHex }}
            role="img"
            aria-label={`Color swatch for ${name}`}
          />
        )}
      </div>

      <div className="material-card-body">
        <div className="material-card-topline">
          <h3 className="material-card-name">{name}</h3>
          <span
            className={
              material.required
                ? "material-card-status is-required"
                : "material-card-status"
            }
          >
            {material.required ? "Required" : "Optional"}
          </span>
        </div>

        {specification && (
          <p className="material-card-spec">{specification}</p>
        )}

        {material.purpose.trim() && (
          <p className="material-card-purpose">{material.purpose}</p>
        )}

        <dl className="material-card-meta">
          {material.quantity?.trim() && (
            <div>
              <dt>Qty</dt>
              <dd>{material.quantity}</dd>
            </div>
          )}
          {material.substitution?.trim() && (
            <div>
              <dt>Substitute</dt>
              <dd>{material.substitution}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
