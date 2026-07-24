/**
 * Page title for Studio home — not an app header.
 * Primary Create / Studio navigation lives only in AppHeader.
 */
export function DashboardHeader({ displayName }: { displayName: string }) {
  return (
    <div className="studio-masthead page-masthead">
      <div className="studio-masthead-text">
        <p className="eyebrow">The Studio</p>
        <h1 className="display">Good to see you, {displayName}.</h1>
      </div>
    </div>
  );
}
