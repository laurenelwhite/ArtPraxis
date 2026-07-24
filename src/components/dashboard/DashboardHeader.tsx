import Link from "next/link";
import { Icon } from "@/components/Icon";

export function DashboardHeader({ displayName }: { displayName: string }) {
  return (
    <header className="studio-masthead">
      <div className="studio-masthead-text">
        <p className="eyebrow">The Studio</p>
        <h1 className="display">Good to see you, {displayName}.</h1>
      </div>
      <Link href="/studio/new" className="btn-solid btn-lg btn-branded"><Icon name="plus" size={18} />Create a lesson</Link>
    </header>
  );
}
