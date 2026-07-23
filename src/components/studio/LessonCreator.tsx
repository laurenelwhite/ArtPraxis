"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { Icon } from "@/components/Icon";
import { attachLessonImage, createLesson } from "@/lib/lessons";
import { ensureProgression, orchestrateProgression, pickSizeForRatio, ratioForFile } from "@/lib/progression-images";
import { MEDIA, MEDIUM_HEADING, MEDIUM_LABEL, parseMedium } from "@/lib/media";
import { track } from "@/lib/analytics";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { AppImage } from "@/components/ui/AppImage";
import { getLessonPreview } from "@/lib/lesson-preview";
import {
  CREATOR_PIPELINE,
  LessonLoadingView,
} from "@/components/studio/LessonLoadingView";

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
  if (s.includes("building your studio") || s.includes("opening")) return 3;
  if (s.includes("preparing stage") || s.includes("demonstration")) return 2;
  if (s.includes("saving")) return 1;
  return 0;
}

export function LessonCreator() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deep link from the Day 0 welcome email, e.g. /studio/new?medium=charcoal.
  // Invalid values are ignored; a valid value preselects the medium and drives
  // a medium-specific heading. Captured once at mount so a later manual change
  // to the dropdown is never overwritten.
  const deepLinkMedium = parseMedium(searchParams.get("medium"));
  const [emailMedium] = useState<Medium | null>(deepLinkMedium);

  const [file, setFile] = useState<File | null>(null);
  const [medium, setMedium] = useState<Medium>(deepLinkMedium ?? "watercolor");
  const [skill, setSkill] = useState("beginner");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const lessonPreview = useMemo(() => getLessonPreview(medium, skill), [medium, skill]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Record which welcome-email banner drove the visit, without storing any
  // personal data. Fires once, only when arriving via a valid medium link.
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

      // Two-image progression: create the target-image doc now (all stages
      // pending). Generation is driven from the lesson page as resumable, per-
      // item requests, so it survives navigation, refresh, and timeouts and can
      // report visible progress. Never let this block or fail lesson creation.
      try {
        setStatus("Preparing stage demonstrations…");
        const size = pickSizeForRatio(await ratioForFile(file));
        await ensureProgression(user.uid, lessonId, tutorial, medium, referenceUrl, size);
        // Kick off master/target generation immediately — do not wait for navigation
        // or image-proxy. In-flight guard dedupes with LessonView on arrival.
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

      setStatus("Building your studio…");
      router.push(`/studio/lessons/${lessonId}`);
    } catch (e) {
      setBusy(false);
      setStatus("");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function onFileChange(next: File | null) {
    setFile(next);
    setError("");
  }

  if (busy) {
    return (
      <div
        className="creator creator--atelier creator--generating"
        data-lesson-medium={medium}
      >
        <LessonLoadingView
          mode="creating"
          referenceUrl={preview || null}
          pipeline={CREATOR_PIPELINE}
          activeStepIndex={creatorStepIndex(status)}
          eyebrow="Beginning your lesson"
          headline="Preparing your atelier"
          detail="We're studying your reference and assembling a guided, stage-by-stage painting lesson."
          estimate="Usually takes under a minute."
        />
      </div>
    );
  }

  return (
    <div className="creator creator--atelier" data-lesson-medium={medium}>
      <header className="creator-header">
        <div className="creator-header-copy">
          <p className="eyebrow">New lesson</p>
          <h1 className="dashboard-title creator-title">
            {emailMedium ? MEDIUM_HEADING[emailMedium] : "Choose your reference"}
          </h1>
          <p className="meta creator-lead">
            Upload a reference to begin a professionally guided atelier lesson —
            stage by stage, from observation to finish.
          </p>
        </div>
        <Link href="/studio" className="creator-back">
          <Icon name="arrow-left" size={16} />
          Dashboard
        </Link>
      </header>

      <div className="creator-layout">
        <section className="creator-stage" aria-label="Reference and lesson settings">
          <div className={preview ? "creator-upload is-filled" : "creator-upload"}>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />

            {preview ? (
              <>
                <figure className="creator-preview-frame">
                  <AppImage
                    src={preview}
                    alt="Selected reference"
                    width={1600}
                    height={1200}
                    sizes="(max-width: 900px) 100vw, 720px"
                    className="creator-preview-img"
                    unoptimized
                  />
                </figure>
                <div className="creator-upload-actions">
                  <button
                    type="button"
                    className="creator-change-image"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change image
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="creator-drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="creator-drop-title">Upload a reference</span>
                <span className="creator-drop-hint">JPEG, PNG, or WebP · up to 10 MB</span>
              </button>
            )}
          </div>

          <div className="creator-fields">
            <label className="creator-field">
              Medium
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as Medium)}
              >
                {MEDIA.map((m) => (
                  <option key={m} value={m}>{MEDIUM_LABEL[m]}</option>
                ))}
              </select>
            </label>
            <label className="creator-field">
              Experience
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>

          {error ? <p className="status error" role="alert">{error}</p> : null}

          <button
            type="button"
            className="primary creator-submit"
            disabled={!file || busy}
            onClick={generate}
          >
            Begin your lesson
          </button>
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
