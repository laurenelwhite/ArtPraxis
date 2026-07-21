import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

export function ComingSoon({
  title,
  description,
  icon = "sparkles",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <div className="card coming-soon">
      <div className="coming-soon-badge"><Icon name={icon} size={26} /></div>
      <p className="eyebrow">Coming soon</p>
      <h1 className="dashboard-title">{title}</h1>
      <p className="meta">{description}</p>
      <Link href="/studio" className="secondary"><Icon name="arrow-left" size={17} />Back to dashboard</Link>
    </div>
  );
}
