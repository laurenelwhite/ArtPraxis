"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import {
  attachLessonImage,
  attachLessonTutorial,
  createLessonShell,
  markLessonGenerationError,
  persistLessonCreationAssets,
} from "@/lib/lessons";
import { ensureProgression, pickSizeForRatio, ratioForFile } from "@/lib/progression-images";
import { MEDIA, MEDIUM_LABEL, parseMedium } from "@/lib/media";
import { track } from "@/lib/analytics";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { AppImage } from "@/components/ui/AppImage";
import { Icon } from "@/components/Icon";
import { getLessonPreview } from "@/lib/lesson-preview";
import { LessonLoadingView } from "@/components/studio/LessonLoadingView";
import { getMediumLanguage } from "@/lib/medium-language";
import {
  CREATOR_WAIT_PIPELINE,
  creatorGenerationTimingLog,
  creatorStepIndex,
  type CreatorGenerationTimings,
} from "@/lib/lesson-creation";

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
    const startedAt = Date.now();
    let lessonId: string | null = null;
    let selectedOutputImageSize: string | null = null;
    const failedBranches: string[] = [];
    const timings: CreatorGenerationTimings = {
      shellCreationMs: 0,
      fileToDataUrlMs: 0,
      tutorialApiMs: 0,
      referenceUploadMs: 0,
      tutorialPersistMs: 0,
      referenceAttachMs: 0,
      progressionInitMs: 0,
      totalCreatorMs: 0,
    };

    const logTiming = () => {
      timings.totalCreatorMs = Date.now() - startedAt;
      console.warn(JSON.stringify(creatorGenerationTimingLog({
        projectId: lessonId,
        medium,
        skillLevel: skill,
        fileBytes: file.size,
        selectedOutputImageSize,
        failedBranches,
        timings,
      })));
    };

    try {
      setBusy(true);
      setError("");
      setStatus("Studying your reference…");

      const dataUrlPromise = (async () => {
        const t = Date.now();
        const url = await dataUrl(file);
        timings.fileToDataUrlMs = Date.now() - t;
        return url;
      })();
      const ratioPromise = ratioForFile(file);

      const tutorialPromise = (async () => {
        const imageDataUrl = await dataUrlPromise;
        const t = Date.now();
        try {
          const response = await fetch("/api/generate-tutorial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl, medium, skillLevel: skill }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Generation failed");
          return result.tutorial as Tutorial;
        } catch (error) {
          failedBranches.push("tutorial");
          throw error;
        } finally {
          timings.tutorialApiMs = Date.now() - t;
        }
      })();

      try {
        const t = Date.now();
        lessonId = await createLessonShell(user.uid, { medium, skillLevel: skill });
        timings.shellCreationMs = Date.now() - t;
      } catch (error) {
        failedBranches.push("shell");
        throw error;
      }

      const projectId = lessonId;
      if (!projectId) throw new Error("Could not create lesson");

      setStatus("Preparing your studio…");

      const uploadPromise = (async () => {
        const t = Date.now();
        try {
          const object = ref(storage, `users/${user.uid}/projects/${projectId}/${file.name}`);
          await uploadBytes(object, file, { contentType: file.type });
          return await getDownloadURL(object);
        } catch (error) {
          failedBranches.push("referenceUpload");
          throw error;
        } finally {
          timings.referenceUploadMs = Date.now() - t;
        }
      })();

      const [tutorialResult, uploadResult] = await Promise.allSettled([
        tutorialPromise,
        uploadPromise,
      ]);

      if (tutorialResult.status !== "fulfilled" || uploadResult.status !== "fulfilled") {
        if (tutorialResult.status === "fulfilled") {
          try {
            const t = Date.now();
            await attachLessonTutorial(user.uid, projectId, tutorialResult.value);
            timings.tutorialPersistMs = Date.now() - t;
          } catch (persistError) {
            failedBranches.push("tutorialPersist");
            console.error(JSON.stringify({
              scope: "LessonCreator",
              event: "creator_partial_persist_failed",
              branch: "tutorial",
              projectId: lessonId,
              message: persistError instanceof Error ? persistError.message : String(persistError),
              t: Date.now(),
            }));
          }
        }
        if (uploadResult.status === "fulfilled") {
          try {
            const t = Date.now();
            await attachLessonImage(user.uid, projectId, uploadResult.value, "error");
            timings.referenceAttachMs = Date.now() - t;
          } catch (persistError) {
            failedBranches.push("referenceAttach");
            console.error(JSON.stringify({
              scope: "LessonCreator",
              event: "creator_partial_persist_failed",
              branch: "referenceUpload",
              projectId: lessonId,
              message: persistError instanceof Error ? persistError.message : String(persistError),
              t: Date.now(),
            }));
          }
        } else if (tutorialResult.status === "fulfilled") {
          try {
            await markLessonGenerationError(user.uid, projectId);
          } catch {
            /* keep generating rather than lose the shell */
          }
        }

        const firstError =
          tutorialResult.status === "rejected"
            ? tutorialResult.reason
            : uploadResult.status === "rejected"
              ? uploadResult.reason
              : new Error("Lesson creation failed");
        throw firstError instanceof Error ? firstError : new Error(String(firstError));
      }

      const tutorial = tutorialResult.value;
      const referenceUrl = uploadResult.value;

      setStatus("Building your lesson…");
      try {
        const persistMs = await persistLessonCreationAssets(user.uid, projectId, {
          tutorial,
          imageUrl: referenceUrl,
        });
        timings.tutorialPersistMs = persistMs.tutorialPersistMs;
        timings.referenceAttachMs = persistMs.referenceAttachMs;
      } catch (error) {
        failedBranches.push("persistAssets");
        try {
          await markLessonGenerationError(user.uid, projectId);
        } catch {
          /* keep generating rather than lose the shell */
        }
        throw error;
      }

      try {
        setStatus("Opening your studio…");
        const size = pickSizeForRatio(await ratioPromise);
        selectedOutputImageSize = size;
        const t = Date.now();
        await ensureProgression(user.uid, projectId, tutorial, medium, referenceUrl, size);
        timings.progressionInitMs = Date.now() - t;
        console.warn(JSON.stringify({
          scope: "LessonCreator",
          event: "progression_seeded",
          projectId,
        }));
        // LessonView owns orchestration after navigation. Starting it here races the
        // lesson-route lease and can leave the UI stuck on a skipped_lease error.
      } catch (genError) {
        console.error("Could not initialize the stage progression", genError);
      }

      logTiming();
      router.push(`/studio/lessons/${projectId}`);
    } catch (e) {
      logTiming();
      if (lessonId) {
        try {
          await markLessonGenerationError(user.uid, lessonId);
        } catch {
          /* preserve the generating shell rather than delete it */
        }
      }
      console.error(JSON.stringify({
        scope: "LessonCreator",
        event: "creator_generation_failed",
        projectId: lessonId,
        failedBranches,
        message: e instanceof Error ? e.message : String(e),
        t: Date.now(),
      }));
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

  function onPrepareSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void generate();
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
          pipeline={[...CREATOR_WAIT_PIPELINE]}
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
  const canSubmit = Boolean(file) && !busy;
  const headingId = "creator-heading";
  const errorId = "creator-error";
  const submitHintId = "creator-submit-hint";

  return (
    <div className="creator creator--atelier" data-lesson-medium={medium}>
      <header className="creator-header page-masthead">
        <div className="creator-header-copy">
          <h1 id={headingId} className="dashboard-title creator-title">Choose your reference</h1>
          <p className="meta creator-lead">
            {emailMedium
              ? `Upload a photograph or artwork. ArtPraxis will turn it into a personalized ${MEDIUM_LABEL[emailMedium].toLowerCase()} atelier lesson.`
              : "Upload a photograph or artwork. ArtPraxis will turn it into a personalized atelier lesson."}
          </p>
        </div>
      </header>

      <div className="creator-layout">
        <section className="creator-stage" aria-labelledby={headingId}>
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
            aria-label="Reference image workspace"
            data-dragging={dragging ? "true" : "false"}
          >
            <input
              ref={fileInputRef}
              id="creator-reference-input"
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={
                filled
                  ? "creator-ref-label"
                  : "creator-empty-hint creator-empty-formats"
              }
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
                    alt="Selected reference preview"
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
                  <span className="creator-empty-drop" id="creator-empty-formats">
                    JPEG, PNG, or WebP · under 10 MB
                  </span>
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

          <form className="creator-prepare" onSubmit={onPrepareSubmit} noValidate>
            <header className="creator-prepare-head">
              <h2 className="creator-prepare-title">Lesson settings</h2>
              <p className="creator-prepare-lead">
                Choose a medium, then create your lesson. Experience level stays optional.
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

            {error ? (
              <p id={errorId} className="creator-error ap-state-error-inline" role="alert">
                {error}
              </p>
            ) : null}

            {!canSubmit ? (
              <p id={submitHintId} className="creator-submit-hint">
                Add a reference image to create your lesson.
              </p>
            ) : null}

            <button
              type="submit"
              className="ap-button-primary btn-branded creator-submit"
              disabled={!canSubmit}
              aria-describedby={[
                !canSubmit ? submitHintId : null,
                error ? errorId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined}
            >
              Create lesson
            </button>
          </form>
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
