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

function dataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LessonCreator() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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

      router.push(`/studio/lessons/${lessonId}`);
    } catch (e) {
      setBusy(false);
      setStatus("");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="creator">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">New lesson</p>
          <h1 className="dashboard-title">{emailMedium ? MEDIUM_HEADING[emailMedium] : "Choose your reference"}</h1>
          <p className="meta">Upload an image, pick a medium and level, and generate a visual lesson.</p>
        </div>
        <Link href="/studio" className="secondary"><Icon name="arrow-left" size={17} />Back to dashboard</Link>
      </header>

      <section className="card form creator-form">
        <label className="drop">
          {preview ? (
            <img src={preview} alt="Reference preview" />
          ) : (
            <span><b>Upload an image</b><br /><small>JPEG, PNG, or WebP up to 10 MB</small></span>
          )}
          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <label>Medium
          <select value={medium} onChange={(e) => setMedium(e.target.value as Medium)}>
            {MEDIA.map((m) => <option key={m} value={m}>{MEDIUM_LABEL[m]}</option>)}
          </select>
        </label>
        <label>Experience
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option>beginner</option>
            <option>intermediate</option>
            <option>advanced</option>
          </select>
        </label>
        {status && <p className="status">{status}</p>}
        {error && <p className="status error">{error}</p>}
        <button className="primary" disabled={!file || busy} onClick={generate}>
          {busy && <span className="spinner spinner-on-accent" />}
          {busy ? "Working…" : "Generate visual lesson"}
        </button>
      </section>
    </div>
  );
}
