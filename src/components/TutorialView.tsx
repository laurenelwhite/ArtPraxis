"use client";

import { useMemo, useState } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { conceptsForLesson } from "@/lib/vocabulary";
import { Term } from "@/components/vocabulary/Term";

type OverlayMode = "composition" | "values" | "temperature" | "none";

const regionColors: Record<string, string> = {
  "major-shape": "rgba(57,80,140,.24)", shadow: "rgba(38,32,45,.42)",
  midtone: "rgba(166,95,54,.24)", highlight: "rgba(255,242,169,.42)",
  warm: "rgba(166,95,54,.3)", cool: "rgba(57,80,140,.3)"
};

function showRegion(type: string, mode: OverlayMode) {
  if (mode === "composition") return type === "major-shape";
  if (mode === "values") return ["shadow", "midtone", "highlight"].includes(type);
  if (mode === "temperature") return ["warm", "cool"].includes(type);
  return false;
}

export function TutorialView({ tutorial, imageUrl, medium = "watercolor", showCover = true }: { tutorial: Tutorial; imageUrl: string; medium?: Medium; showCover?: boolean }) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("composition");
  const [activeStep, setActiveStep] = useState(0);
  const step = tutorial.steps[activeStep];
  const palette = useMemo(() => new Map(tutorial.palette.map(c => [c.name, c])), [tutorial.palette]);
  // A restrained set of concepts this lesson actually emphasizes — the dense
  // reference prose below stays unlinked so it reads cleanly.
  const concepts = useMemo(() => conceptsForLesson(tutorial, medium), [tutorial, medium]);

  return (
    <article className="atelier">
      {showCover && (
        <>
          <header className="atelier-cover">
            <p className="atelier-kicker">{tutorial.difficulty} · about {tutorial.estimatedMinutes} minutes</p>
            <h2 className="atelier-title">{tutorial.title}</h2>
            <p className="atelier-lead">{tutorial.overview}</p>
          </header>

          <hr className="atelier-rule" />
        </>
      )}

      {concepts.length > 0 && (
        <aside className="study-concepts" aria-label="Concepts in this study">
          <p className="study-concepts-label">Concepts in this study</p>
          <ul className="study-concepts-list">
            {concepts.map((c) => (
              <li key={c.id}><Term id={c.id} /></li>
            ))}
          </ul>
          <p className="study-concepts-hint">Tap a concept for a quick definition — and where you practice it.</p>
        </aside>
      )}

      <section className="atelier-spread">
        <div className="spread-head">
          <span className="chapter-index">Chapter I</span>
          <h3 className="spread-title">See the structure before the details</h3>
        </div>
        <div className="spread-body plate-layout">
          <figure className="plate">
            <div className="overlay-tabs">
              {([['composition', 'Shapes'], ['values', 'Values'], ['temperature', 'Warm / cool'], ['none', 'Original']] as const).map(([v, l]) =>
                <button key={v} type="button" aria-pressed={overlayMode === v} className={overlayMode === v ? 'overlay-tab active' : 'overlay-tab'} onClick={() => setOverlayMode(v)}>{l}</button>)}
            </div>
            <div className="annotated-image">
              <img src={imageUrl} alt="Uploaded reference" />
              {overlayMode !== "none" && <svg className="analysis-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                {tutorial.visualGuides.regions.filter(r => showRegion(r.type, overlayMode)).map((r, i) => <g key={i}>
                  <rect x={r.x} y={r.y} width={r.width} height={r.height} rx="1.5" fill={regionColors[r.type]} stroke="white" strokeWidth=".45" vectorEffect="non-scaling-stroke" />
                  <text x={r.x + 1.5} y={r.y + 4} className="overlay-label">{r.label}</text>
                </g>)}
                {overlayMode === "composition" && <>
                  <circle cx={tutorial.visualGuides.focalPoint.x} cy={tutorial.visualGuides.focalPoint.y} r="3.2" fill="none" stroke="white" strokeWidth=".75" vectorEffect="non-scaling-stroke" />
                  <text x={tutorial.visualGuides.focalPoint.x + 4} y={tutorial.visualGuides.focalPoint.y} className="overlay-label">{tutorial.visualGuides.focalPoint.label}</text>
                </>}
              </svg>}
              {step.focusBox && <div className="step-focus-box" style={{ left: `${step.focusBox.x}%`, top: `${step.focusBox.y}%`, width: `${step.focusBox.width}%`, height: `${step.focusBox.height}%` }}><span>Step {step.order}</span></div>}
            </div>
            <figcaption className="plate-caption">Toggle the overlays to study shape, value, and temperature in turn.</figcaption>
          </figure>

          <aside className="margin-notes">
            <div className="margin-note"><span className="note-label">Focal point</span><p>{tutorial.composition.focalPoint}</p></div>
            <div className="margin-note"><span className="note-label">Light direction</span><p>{tutorial.composition.lightDirection}</p></div>
            <div className="margin-note"><span className="note-label">Value plan</span><p>{tutorial.composition.valuePlan}</p></div>
            <div className="margin-note"><span className="note-label">Major shapes</span>
              <ul className="note-list">{tutorial.composition.majorShapes.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </aside>
        </div>
      </section>

      <hr className="atelier-rule" />

      <section className="atelier-spread">
        <div className="spread-head">
          <span className="chapter-index">Chapter II</span>
          <h3 className="spread-title">Read the values first</h3>
        </div>
        <div className="value-plates">
          <div className="value-plate light-value"><span className="value-numeral">1</span><h4>Lights</h4><p>{tutorial.valueMap.lights}</p></div>
          <div className="value-plate mid-value"><span className="value-numeral">2</span><h4>Midtones</h4><p>{tutorial.valueMap.midtones}</p></div>
          <div className="value-plate dark-value"><span className="value-numeral">3</span><h4>Darks</h4><p>{tutorial.valueMap.darks}</p></div>
        </div>
        <blockquote className="atelier-quote"><span className="quote-label">The squint test</span>{tutorial.valueMap.squintTest}</blockquote>
      </section>

      <hr className="atelier-rule" />

      <section className="atelier-spread">
        <div className="spread-head">
          <span className="chapter-index">Chapter III</span>
          <h3 className="spread-title">Mix with a limited palette</h3>
        </div>
        <div className="palette-plates">{tutorial.palette.map(c => <div className="pigment" key={c.name}>
          <div className="pigment-swatch" style={{ background: c.hex }} />
          <div className="pigment-body"><strong>{c.name}</strong><p className="pigment-role">{c.role}</p><p className="pigment-note"><strong>{c.ratio}</strong> · {c.mixingNote}</p></div>
        </div>)}</div>
        {tutorial.creativeChoices.length > 0 && (
          <div className="protips">
            <span className="note-label">Pro tips from the studio</span>
            <ul className="protip-list">{tutorial.creativeChoices.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}
      </section>

      <hr className="atelier-rule" />

      <section className="atelier-spread">
        <div className="spread-head">
          <span className="chapter-index">Chapter IV</span>
          <h3 className="spread-title">Build the painting in layers</h3>
        </div>

        <div className="process-timeline">{tutorial.steps.map((s, i) => <button key={s.order} type="button" className={i === activeStep ? 'timeline-step active' : 'timeline-step'} onClick={() => setActiveStep(i)}><span>{s.order}</span><small>{s.title}</small></button>)}</div>

        <div className="lesson-page">
          <div className="page-main">
            <div className="page-step-head">
              <span className="step-numeral">{step.order}</span>
              <div><p className="step-kicker">Step {step.order} · {step.estimatedMinutes} min</p><h4 className="page-step-title">{step.title}</h4></div>
            </div>
            <p className="step-lead">{step.objective}</p>
            <p className="step-body">{step.instruction}</p>

            <div className="field-note look-for"><span className="field-label">Look for</span><p>{step.visualCue}</p></div>
            <div className="field-note pro-tip"><span className="field-label">Pro tip · technique</span><p>{step.technique}</p></div>
            <div className="field-note checkpoint"><span className="field-label">Checkpoint</span><p>{step.checkpoint}</p></div>
            <div className="field-note mistake"><span className="field-label">Common mistake</span><p>{step.commonMistake}</p></div>
          </div>

          <aside className="page-side">
            <div className="mini-reference"><img src={imageUrl} alt="" />{step.focusBox && <div className="mini-focus" style={{ left: `${step.focusBox.x}%`, top: `${step.focusBox.y}%`, width: `${step.focusBox.width}%`, height: `${step.focusBox.height}%` }} />}</div>
            {step.paletteNames.length > 0 && <>
              <span className="note-label">Colors for this step</span>
              <div className="step-colors">{step.paletteNames.map(n => { const c = palette.get(n); return c ? <div className="step-color" key={n}><span style={{ background: c.hex }} />{n}</div> : null; })}</div>
            </>}
          </aside>
        </div>

        <div className="step-navigation">
          <button className="secondary" disabled={activeStep === 0} onClick={() => setActiveStep(v => v - 1)}>Previous</button>
          <span className="meta">{activeStep + 1} of {tutorial.steps.length}</span>
          <button className="primary" disabled={activeStep === tutorial.steps.length - 1} onClick={() => setActiveStep(v => v + 1)}>Next step</button>
        </div>
      </section>
    </article>
  );
}
