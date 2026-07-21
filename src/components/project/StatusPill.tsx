import { projectStatusLabels, type ProjectStatus } from "@/lib/lessons";

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={`status-pill ${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {projectStatusLabels[status]}
    </span>
  );
}
