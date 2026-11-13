import type { Medium } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { BrushIcon, PencilIcon, WetnessScale } from "@/components/progression/supplies";

export function StageSetupStrip({
  stage,
  medium,
}: {
  stage: ProgressionStage;
  medium: Medium;
}) {
  const { paint } = stage;
  const usePencil =
    stage.id === "pencil-sketch" || medium === "pencil" || medium === "charcoal";
  const showWater =
    stage.id !== "pencil-sketch" &&
    (medium === "watercolor" || medium === "acrylic" || medium === "oil");

  return (
    <div className="stage-setup" aria-label="Setup for this stage">
      <div className="stage-setup-item">
        <span className="stage-setup-label">{usePencil ? "Tool" : "Brush"}</span>
        <div className="stage-setup-body">
          <span className="stage-setup-icon" aria-hidden="true">
            {usePencil ? <PencilIcon size={22} /> : <BrushIcon size={22} />}
          </span>
          <span className="stage-setup-value">{paint.brush}</span>
        </div>
      </div>

      <div className="stage-setup-item">
        <span className="stage-setup-label">Pressure</span>
        <span className="stage-setup-value">{paint.brushPressure}</span>
      </div>

      {showWater && (
        <div className="stage-setup-item">
          <span className="stage-setup-label">
            {medium === "watercolor" ? "Water" : "Medium"}
          </span>
          <div className="stage-setup-body stage-setup-water">
            {medium === "watercolor" && <WetnessScale level={paint.wetness} />}
            <span className="stage-setup-value">{paint.water}</span>
          </div>
        </div>
      )}

      <div className="stage-setup-item">
        <span className="stage-setup-label">Est. time</span>
        <span className="stage-setup-value">~{paint.estimatedMinutes} min</span>
      </div>
    </div>
  );
}
