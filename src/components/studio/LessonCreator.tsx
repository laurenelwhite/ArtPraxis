"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { attachLessonImage, createLesson } from "@/lib/lessons";
import { ensureProgression, orchestrateProgression, pickSizeForRatio, ratioForFile } from "@/lib/progression-images";
import { MEDIA, MEDIUM_LABEL, parseMedium } from "@/lib/media";
import { track } from "@/lib/analytics";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { AppImage } from "@/components/ui/AppImage";
import { Icon } from "@/components/Icon";
import { getLessonPreview } from "@/lib/lesson-preview";
import { LessonLoadingView } from "@/components/studio/LessonLoadingView";
import { getCreatorPipeline, getMediumLanguage } from "@/lib/medium-language";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

function dataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Map existing status strings to the creator checklist (presentation only). */
function creatorStepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("opening") || s.includes("building your studio")) return 3;
  if (s.includes("preparing your studio") || s.includes("preparing stage")) return 2;
  if (s.includes("saving")) return 1;
  return 0;
}

function validateImageFile(next: File | null): string | null {
  if (!next) return "Choose an image file to continue.";
  if (!ACCEPTED_TYPES.has(next.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }
  if (next.size > MAX_BYTES) {
    return "Keep the reference under 10 MB.";
  }
  return null;
}

export function LessonCreator() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  // Deep link from the Day 0 welcome email, e.g. /studio/new?medium=charcoal.
  // Invalid values are ignored; a valid value preselects the medium.
  // Captured once at mount so a later manual change is never overwritten.
  const deepLinkMedium = parseMedium(searchParams.get("medium"));
  const [emailMedium] = useState<Medium | null>(deepLinkMedium);

  const [file, setFile] = useState<File | null>(null);
  const [medium, setMedium] = useState<Medium>(deepLinkMedium ?? "watercolor");
  const [skill, setSkill] = useState("beginner");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const lessonPreview = useMemo(() => getLessonPreview(medium, skill), [medium, skill]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    setPreviewReady(false);
  }, [preview]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current || !emailMedium) return;
    trackedRef.current = true;
    track("welcome_medium_selected", {
      medium: emailMedium,
      campaign: searchParams.get("utm_campaign") || "day_0_welcome",
      content: searchParams.get("utm_content") || `${emailMedium}_banner`,
    });
  }, [emailMedium, searchParams]);

  async function generate() {
    if (!file || !user) return;
    try {
      setBusy(true);
      setError("");
      setStatus("Analyzing composition, light, color, and technique…");

      const response = await fetch("/api/generate-tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: await dataUrl(file), medium, skillLevel: skill }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Generation failed");
      const tutorial = result.tutorial as Tutorial;

      setStatus("Saving your lesson…");
      const lessonId = await createLesson(user.uid, { medium, skillLevel: skill, tutorial });

      const object = ref(storage, `users/${user.uid}/projects/${lessonId}/${file.name}`);
      await uploadBytes(object, file, { contentType: file.type });
      const referenceUrl = await getDownloadURL(object);
      await attachLessonImage(user.uid, lessonId, referenceUrl);

      try {
        setStatus("Preparing your studio…");
        const size = pickSizeForRatio(await ratioForFile(file));
        await ensureProgression(user.uid, lessonId, tutorial, medium, referenceUrl, size);
        console.warn(JSON.stringify({
          scope: "LessonCreator",
          event: "generation_request_started",
          projectId: lessonId,
        }));
        void orchestrateProgression({
          uid: user.uid,
          projectId: lessonId,
          tutorial,
          medium,
          referenceImageUrl: referenceUrl,
          size,
        }).catch((e) => console.error("[LessonCreator] orchestrateProgression failed", e));
      } catch (genError) {
        console.error("Could not initialize the stage progression", genError);
      }

      setStatus("Opening your studio…");
      router.push(`/studio/lessons/${lessonId}`);
    } catch (e) {
      setBusy(false);
      setStatus("");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function onFileChange(next: File | null) {
    const validationError = validateImageFile(next);
    if (validationError) {
      setFile(null);
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(next);
    setError("");
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragging(false);
    const next = e.dataTransfer.files?.[0] ?? null;
    onFileChange(next);
  }

  if (busy) {
    const lang = getMediumLanguage(medium);
    return (
      <div
        className="creator creator--atelier creator--generating"
        data-lesson-medium={medium}
      >
        <LessonLoadingView
          mode="creating"
          medium={medium}
          skillLevel={skill}
          referenceUrl={preview || null}
          pipeline={getCreatorPipeline(medium)}
          activeStepIndex={creatorStepIndex(status)}
          eyebrow="Beginning your lesson"
          headline={lang.preparationHeading}
          detail={lang.preparationDescription(
            skill === "intermediate" || skill === "advanced" ? skill : "beginner",
          )}
          estimate="Usually 12–45 seconds"
        />
      </div>
    );
  }

  const filled = Boolean(preview);

  return (
    <div className="creator creator--atelier" data-lesson-medium={medium}>
      <header className="creator-header page-masthead">
        <div className="creator-header-copy">
          <p className="eyebrow">New lesson</p>
          <h1 className="dashboard-title creator-title">Choose your reference</h1>
          <p className="meta creator-lead">
            {emailMedium
              ? `Upload a photograph or artwork. ArtPraxis will turn it into a personalized ${MEDIUM_LABEL[emailMedium].toLowerCase()} atelier lesson.`
              : "Upload a photograph or artwork. ArtPraxis will turn it into a personalized atelier lesson."}
          </p>
        </div>
      </header>

      <div className="creator-layout">
        <section className="creator-stage" aria-label="Reference and lesson settings">
          <div
            className={[
              "creator-upload",
              filled ? "is-filled" : "is-empty",
              dragging ? "is-dragging" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              id="creator-reference-input"
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={filled ? "creator-ref-label" : "creator-empty-hint"}
              aria-label="Upload a reference photo"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />

            {/* Stable frame — same structure for empty and uploaded states */}
            <div
              className={[
                "creator-frame",
                filled && !previewReady ? "is-decoding" : null,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {filled ? (
                <figure className="creator-preview-frame">
                  <AppImage
                    src={preview}
                    alt="Selected reference photo"
                    width={1600}
                    height={1200}
                    sizes="(max-width: 900px) 100vw, 640px"
                    className="creator-preview-img"
                    unoptimized
                    onLoad={() => setPreviewReady(true)}
                    onError={() => setPreviewReady(true)}
                  />
                </figure>
              ) : (
                <label
                  className="creator-empty"
                  htmlFor="creator-reference-input"
                >
                  <span className="creator-empty-icon" aria-hidden="true">
                    <Icon name="image" size={22} />
                  </span>
                  <span className="creator-empty-title">Upload a reference</span>
                  <span className="creator-empty-support" id="creator-empty-hint">
                    Choose a photograph or artwork to begin.
                  </span>
                  <span className="creator-browse">Browse files</span>
                  <span className="creator-empty-drop">or drop an image here</span>
                </label>
              )}
            </div>

            {filled ? (
              <div className="creator-upload-meta">
                <p className="creator-ref-label" id="creator-ref-label">Reference photo</p>
                <button
                  type="button"
                  className="creator-change-image"
                  onClick={openPicker}
                >
                  Change image
                </button>
              </div>
            ) : null}
          </div>

          <div className="creator-prepare">
            <header className="creator-prepare-head">
              <p className="eyebrow">About this lesson</p>
              <p className="creator-prepare-lead">
                Choose a medium, then generate. Optional settings stay tucked away.
              </p>
            </header>

            <div className="creator-fields">
              <label className="creator-field" htmlFor="creator-medium">
                Medium
                <select
                  id="creator-medium"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value as Medium)}
                >
                  {MEDIA.map((m) => (
                    <option key={m} value={m}>{MEDIUM_LABEL[m]}</option>
                  ))}
                </select>
              </label>
            </div>

            <details className="creator-advanced">
              <summary>More options</summary>
              <label className="creator-field" htmlFor="creator-skill">
                Experience
                <select
                  id="creator-skill"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </details>

            {error ? <p className="status error" role="alert">{error}</p> : null}

            <button
              type="button"
              className="primary creator-submit"
              disabled={!file || busy}
              onClick={generate}
            >
              Generate lesson
            </button>
          </div>
        </section>

        <aside className="creator-plan" aria-label="Lesson preview">
          <p className="creator-plan-eyebrow">Your lesson plan</p>
          <h2 className="creator-plan-title">What you&apos;ll practice</h2>
          <p className="creator-plan-summary">{lessonPreview.summary}</p>

          <dl className="creator-plan-meta">
            <div>
              <dt>Difficulty</dt>
              <dd>{lessonPreview.difficulty}</dd>
            </div>
            <div>
              <dt>Estimated time</dt>
              <dd>{lessonPreview.duration}</dd>
            </div>
          </dl>

          <div className="creator-plan-techniques">
            <p className="creator-plan-techniques-label">Likely techniques</p>
            <ul>
              {lessonPreview.techniques.map((technique) => (
                <li key={technique}>{technique}</li>
              ))}
            </ul>
          </div>

          <p className="creator-plan-note">
            Exact demos are tailored after we study your reference. This preview
            reflects your medium and experience level.
          </p>
        </aside>
      </div>
    </div>
  );
}
