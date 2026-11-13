import Link from "next/link";
import { Icon } from "@/components/Icon";

export function EmptyState() {
  return (
    <div className="ap-state ap-state--empty empty-state">
      <span className="ap-state-icon empty-mark" aria-hidden="true">
        <Icon name="brush" size={22} />
      </span>
      <h2 className="ap-state-title empty-title">Your next artwork begins with a reference.</h2>
      <p className="ap-state-body empty-copy">
        Upload an image and choose watercolor, acrylic, oil, pastel, charcoal,
        pencil, or pen. ArtPraxis will build a saved, stage-by-stage lesson in
        composition, value, color, edges, and the techniques of your medium.
      </p>
      <Link href="/studio/new" className="btn-solid btn-lg btn-branded">
        <Icon name="plus" size={18} />
        Create your first lesson
      </Link>
    </div>
  );
}
