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
    <div className="ap-state ap-state--placeholder card coming-soon">
      <div className="ap-state-icon coming-soon-badge" aria-hidden="true">
        <Icon name={icon} size={20} />
      </div>
      <p className="ap-state-kicker">Coming soon</p>
      <h1 className="ap-state-title dashboard-title">{title}</h1>
      <p className="ap-state-body meta">{description}</p>
    </div>
  );
}
