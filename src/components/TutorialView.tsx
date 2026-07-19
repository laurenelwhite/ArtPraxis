"use client";

import { useMemo, useState } from "react";
import type { Tutorial } from "@/lib/tutorial-schema";

type OverlayMode = "composition" | "values" | "temperature" | "none";

const regionColors: Record<string, string> = {
  "major-shape": "rgba(78,94,129,.28)", shadow: "rgba(38,32,45,.42)",
  midtone: "rgba(180,139,84,.28)", highlight: "rgba(255,242,169,.42)",
  warm: "rgba(210,89,54,.28)", cool: "rgba(60,126,168,.28)"
};

function showRegion(type: string, mode: OverlayMode) {
  if (mode === "composition") return type === "major-shape";
  if (mode === "values") return ["shadow", "midtone", "highlight"].includes(type);
  if (mode === "temperature") return ["warm", "cool"].includes(type);
  return false;
}

export function TutorialView({ tutorial, imageUrl }: { tutorial: Tutorial; imageUrl: string }) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("composition");
  const [activeStep, setActiveStep] = useState(0);
  const step = tutorial.steps[activeStep];
  const palette = useMemo(() => new Map(tutorial.palette.map(c => [c.name, c])), [tutorial.palette]);

  return <article className="visual-tutorial">
    <section className="card">
      <div className="eyebrow">{tutorial.difficulty} · about {tutorial.estimatedMinutes} minutes</div>
      <h2 className="tutorial-title">{tutorial.title}</h2>
      <p className="meta">{tutorial.overview}</p>
    </section>

    <section className="card">
      <div className="section-heading">
        <div><div className="eyebrow">Visual analysis</div><h3>See the structure before the details</h3></div>
        <div className="overlay-tabs">
          {([['composition','Shapes'],['values','Values'],['temperature','Warm / cool'],['none','Original']] as const).map(([v,l]) =>
            <button key={v} className={overlayMode===v?'overlay-tab active':'overlay-tab'} onClick={()=>setOverlayMode(v)}>{l}</button>)}
        </div>
      </div>

      <div className="annotated-image">
        <img src={imageUrl} alt="Uploaded reference" />
        {overlayMode !== "none" && <svg className="analysis-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          {tutorial.visualGuides.regions.filter(r=>showRegion(r.type,overlayMode)).map((r,i)=><g key={i}>
            <rect x={r.x} y={r.y} width={r.width} height={r.height} rx="1.5" fill={regionColors[r.type]} stroke="white" strokeWidth=".45" vectorEffect="non-scaling-stroke" />
            <text x={r.x+1.5} y={r.y+4} className="overlay-label">{r.label}</text>
          </g>)}
          {overlayMode === "composition" && <>
            <circle cx={tutorial.visualGuides.focalPoint.x} cy={tutorial.visualGuides.focalPoint.y} r="3.2" fill="none" stroke="white" strokeWidth=".75" vectorEffect="non-scaling-stroke" />
            <text x={tutorial.visualGuides.focalPoint.x+4} y={tutorial.visualGuides.focalPoint.y} className="overlay-label">{tutorial.visualGuides.focalPoint.label}</text>
          </>}
        </svg>}
        {step.focusBox && <div className="step-focus-box" style={{left:`${step.focusBox.x}%`,top:`${step.focusBox.y}%`,width:`${step.focusBox.width}%`,height:`${step.focusBox.height}%`}}><span>Step {step.order}</span></div>}
      </div>
    </section>

    <section className="value-grid">
      <div className="card value-card light-value"><div className="value-chip">1</div><h3>Lights</h3><p>{tutorial.valueMap.lights}</p></div>
      <div className="card value-card mid-value"><div className="value-chip">2</div><h3>Midtones</h3><p>{tutorial.valueMap.midtones}</p></div>
      <div className="card value-card dark-value"><div className="value-chip">3</div><h3>Darks</h3><p>{tutorial.valueMap.darks}</p></div>
    </section>

    <div className="status"><strong>Squint test:</strong> {tutorial.valueMap.squintTest}</div>

    <section className="card">
      <div className="eyebrow">Limited palette</div><h3>Mix with intention</h3>
      <div className="visual-palette">{tutorial.palette.map(c=><div className="mix-card" key={c.name}>
        <div className="mix-swatch" style={{background:c.hex}} />
        <div><strong>{c.name}</strong><p className="mix-role">{c.role}</p><p className="meta"><strong>{c.ratio}</strong> · {c.mixingNote}</p></div>
      </div>)}</div>
    </section>

    <section className="card">
      <div className="eyebrow">Visual walkthrough</div><h3>Build the image in layers</h3>
      <div className="process-timeline">{tutorial.steps.map((s,i)=><button key={s.order} className={i===activeStep?'timeline-step active':'timeline-step'} onClick={()=>setActiveStep(i)}><span>{s.order}</span><small>{s.title}</small></button>)}</div>
      <div className="active-step-card">
        <div><div className="eyebrow">Step {step.order} · {step.estimatedMinutes} min</div><h3>{step.title}</h3><p className="step-objective">{step.objective}</p><p>{step.instruction}</p>
          <div className="cue-card"><strong>Look for</strong><p>{step.visualCue}</p></div>
          <div className="step-notes"><p><strong>Technique:</strong> {step.technique}</p><p><strong>Checkpoint:</strong> {step.checkpoint}</p><p><strong>Avoid:</strong> {step.commonMistake}</p></div>
        </div>
        <div>
          <div className="mini-reference"><img src={imageUrl} alt="" />{step.focusBox && <div className="mini-focus" style={{left:`${step.focusBox.x}%`,top:`${step.focusBox.y}%`,width:`${step.focusBox.width}%`,height:`${step.focusBox.height}%`}} />}</div>
          <div className="eyebrow">Colors for this step</div><div className="step-colors">{step.paletteNames.map(n=>{const c=palette.get(n);return c?<div className="step-color" key={n}><span style={{background:c.hex}} />{n}</div>:null})}</div>
        </div>
      </div>
      <div className="step-navigation"><button className="secondary" disabled={activeStep===0} onClick={()=>setActiveStep(v=>v-1)}>Previous</button><span className="meta">{activeStep+1} of {tutorial.steps.length}</span><button className="primary" disabled={activeStep===tutorial.steps.length-1} onClick={()=>setActiveStep(v=>v+1)}>Next step</button></div>
    </section>
  </article>;
}
