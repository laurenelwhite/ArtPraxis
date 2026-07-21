import { Icon, type IconName } from "@/components/Icon";

export function ProjectPlaceholder({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: IconName;
}) {
  return (
    <div className="card project-placeholder">
      <div className="coming-soon-badge"><Icon name={icon} size={24} /></div>
      <p className="eyebrow">Coming soon</p>
      <h2>{title}</h2>
      <p className="meta">{description}</p>
    </div>
  );
}
