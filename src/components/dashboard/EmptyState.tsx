import Link from "next/link";
import { Icon } from "@/components/Icon";

export function EmptyState() {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true"><Icon name="brush" size={30} /></span>
      <h2 className="empty-title">Your first masterpiece starts here.</h2>
      <p className="empty-copy">
        Upload a reference image and ArtPraxis builds a personalized, stage-by-stage lesson —
        composition, values, palette, and technique for your chosen medium.
      </p>
      <Link href="/studio/new" className="btn-solid btn-lg btn-branded"><Icon name="plus" size={18} />Create your first lesson</Link>
    </div>
  );
}
