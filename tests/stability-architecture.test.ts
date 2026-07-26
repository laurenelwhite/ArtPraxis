import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("studio and lesson architecture stability", () => {
  it("keeps a single authoritative lesson path through LessonView", () => {
    const page = read("app/(app)/studio/lessons/[id]/page.tsx");
    assert.match(page, /LessonView/);
    assert.doesNotMatch(page, /ProjectReference|StudioShell|StageProcessRail/);
  });

  it("renders primary lesson tabs once in LessonView", () => {
    const view = read("components/studio/LessonView.tsx");
    assert.match(view, /Overview/);
    assert.match(view, /Studio Reference/);
    assert.match(view, /Materials/);
    assert.match(view, /Progress/);
    assert.equal((view.match(/\{ id: "overview"/g) || []).length, 1);
    assert.doesNotMatch(view, /Notes/);
    assert.doesNotMatch(view, /focus mode|FocusMode/i);
  });

  it("uses continuous StudyMode only (no dual Study/Paint chrome)", () => {
    const experience = read("components/studio/LessonExperience.tsx");
    assert.match(experience, /StudyMode/);
    assert.doesNotMatch(experience, /PaintMode|mode-switch|setMode\(/);
  });

  it("renders StageScrollNav once per StudyMode and keeps ProcessRail removed", () => {
    const study = read("components/progression/StudyMode.tsx");
    assert.match(study, /from "@\/components\/progression\/StageScrollNav"/);
    assert.equal((study.match(/<StageScrollNav[\s>]/g) || []).length, 1);
    assert.doesNotMatch(study, /StageProcessRail/);
  });

  it("opens latest and recent projects directly to the lesson route", () => {
    const lead = read("components/dashboard/LeadProject.tsx");
    const card = read("components/dashboard/LessonCard.tsx");
    assert.match(lead, /\/studio\/lessons\/\$\{lesson\.id\}/);
    assert.match(card, /\/studio\/lessons\/\$\{lesson\.id\}/);
    assert.doesNotMatch(lead, /Open lesson/);
  });

  it("exposes one Overview primary CTA and defers status edits to Progress", () => {
    const overview = read("components/project/ProjectOverview.tsx");
    assert.match(overview, /Begin lesson|Resume lesson|Review lesson/);
    assert.doesNotMatch(overview, /onStartPractice|status-control|status-option/);
    assert.match(overview, /Progress tab/);
  });

  it("keeps ProgressUpload as the single interactive completion control", () => {
    const progress = read("components/progression/ProgressUpload.tsx");
    const ribbon = read("components/progression/AtelierRibbon.tsx");
    assert.match(progress, /onStatusChange/);
    assert.doesNotMatch(ribbon, /onClick=\{\(\) => onStatusChange/);
  });

  it("does not resurrect obsolete shell aliases", () => {
    assert.throws(() => read("components/project/ProjectReference.tsx"));
    assert.throws(() => read("components/studio/StudioShell.tsx"));
    assert.throws(() => read("components/progression/StageProcessRail.tsx"));
  });
});

describe("lesson chrome CSS", () => {
  it("keeps stage nav and tabs in document flow (no sticky stack)", () => {
    const css = read("app/globals.css");
    const shell = read("app/globals-app-shell.css");
    assert.match(css, /Lesson chrome — single non-sticky stage nav/);
    assert.match(shell, /Do not re-sticky here/);
    assert.doesNotMatch(css, /Forensic cleanup/);
  });
});
