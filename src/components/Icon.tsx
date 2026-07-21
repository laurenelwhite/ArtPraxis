import type { SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "plus"
  | "sparkles"
  | "clock"
  | "calendar"
  | "heart"
  | "search"
  | "image"
  | "folder"
  | "star"
  | "message"
  | "arrow-left"
  | "logout"
  | "brush";

const paths: Record<IconName, React.ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>),
  plus: (<><path d="M12 5v14" /><path d="M5 12h14" /></>),
  sparkles: (<><path d="M12 3l1.6 4.6L18 9.2l-4.4 1.6L12 15.4l-1.6-4.6L6 9.2l4.4-1.6z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  calendar: (<><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></>),
  heart: (<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 2.8 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.2 0 4.8 3.3 3.2 6.4C19 15.6 12 20 12 20z" />),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5L5 20" /></>),
  folder: (<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  star: (<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" />),
  message: (<path d="M21 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.8-4.1A7.5 7.5 0 1 1 21 11.5z" />),
  "arrow-left": (<><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>),
  logout: (<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h11" /></>),
  brush: (<><path d="M14.5 3.5l6 6-7.8 7.8a3 3 0 0 1-1.6.8l-4.6.8.8-4.6a3 3 0 0 1 .8-1.6z" /><path d="M6.5 15.5c-1.6.4-2.5 1.8-2.8 3.9 2.1-.3 3.5-1.2 3.9-2.8" /></>),
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
