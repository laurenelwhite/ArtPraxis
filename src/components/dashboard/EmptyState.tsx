import Link from "next/link";
import { Icon } from "@/components/Icon";

export function EmptyState() {
  return (
    <div className="ap-state ap-state--empty empty-state">
      <span className="ap-state-icon empty-mark" aria-hidden="true">
        <Icon name="brush" size={22} />
      </span>
      <h2 className="ap-state-title empty-title">Your first masterpiece starts here.</h2>
      <p className="ap-state-body empty-copy">
        Upload a reference image and ArtPraxis builds a personalized, stage-by-stage lesson —
        composition, values, palette, and technique for your chosen medium.
      </p>
      <Link href="/studio/new" className="btn-solid btn-lg btn-branded">
        <Icon name="plus" size={18} />
        Create your first lesson
      </Link>
    </div>
  );
}
