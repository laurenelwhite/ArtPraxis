import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  creatorFailureMessage,
  GENERATION_UNAVAILABLE_MESSAGE,
  LESSON_SAVED_RETRY_MESSAGE,
  persistentLessonWritesAllowed,
  preflightUserMessage,
} from "../src/lib/generation-preflight";
import { runNewLessonAttempt } from "../src/lib/lesson-creation-flow";
import {
  tutorialGenerationAvailable,
  tutorialModelConfigured,
} from "../src/lib/server/generation-availability";

const configured = {
  OPENAI_API_KEY: "present",
  GEN_QUOTA_TUTORIALS_PER_DAY: "2",
  GEN_QUOTA_IMAGES_PER_DAY: "0",
  GEN_QUOTA_MAX_CONCURRENT: "1",
};

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), "src", relativePath), "utf8");
}

describe("tutorial generation availability", () => {
  it("is unavailable when the model credential is missing or blank", () => {
    assert.equal(tutorialModelConfigured({ OPENAI_API_KEY: undefined }), false);
    assert.equal(tutorialModelConfigured({ OPENAI_API_KEY: "   " }), false);
    assert.equal(
      tutorialGenerationAvailable({ ...configured, OPENAI_API_KEY: undefined }),
      false,
    );
    assert.equal(
      tutorialGenerationAvailable({ ...configured, OPENAI_API_KEY: "   " }),
      false,
    );
  });

  it("is unavailable when the tutorial quota or concurrency cap is zero", () => {
    assert.equal(
      tutorialGenerationAvailable({ ...configured, GEN_QUOTA_TUTORIALS_PER_DAY: "0" }),
      false,
    );
    assert.equal(
      tutorialGenerationAvailable({ ...configured, GEN_QUOTA_MAX_CONCURRENT: "0" }),
      false,
    );
    assert.equal(tutorialGenerationAvailable({ OPENAI_API_KEY: "present" }), false);
  });

  it("stays available when only the image quota is zero", () => {
    assert.equal(tutorialGenerationAvailable(configured), true);
  });
});

describe("preflight messages", () => {
  it("uses the local-photo sentence for a disabled studio before any write", () => {
    assert.equal(persistentLessonWritesAllowed({ available: false }), false);
    assert.equal(persistentLessonWritesAllowed({ available: true }), true);
    assert.equal(persistentLessonWritesAllowed(null), false);
    assert.equal(
      preflightUserMessage(true, { available: false }),
      GENERATION_UNAVAILABLE_MESSAGE,
    );
  });

  it("drops an internal credential name from a failed check", () => {
    const message = preflightUserMessage(false, {
      error: "OPENAI_API_KEY is not configured.",
    });
    assert.equal(message.includes("OPENAI_API_KEY"), false);
    assert.equal(message.includes("still only on this device"), true);
  });

  it("keeps a public sign-in error without claiming generation is off", () => {
    assert.equal(
      preflightUserMessage(false, { error: "Sign in to continue." }),
      "Sign in to continue.",
    );
  });
});

describe("lesson creation after the availability check", () => {
  it("makes no shell, upload, or tutorial call when generation is unavailable", async () => {
    const calls: string[] = [];
    const result = await runNewLessonAttempt({
      preflight: async () => ({ httpOk: true, body: { available: false } }),
      createShell: async () => {
        calls.push("shell");
        return "lesson";
      },
      uploadReference: async () => {
        calls.push("upload");
        return "url";
      },
      requestTutorial: async () => {
        calls.push("tutorial");
        return { title: "Lesson" };
      },
    });
    assert.deepEqual(calls, []);
    assert.equal(result.kind, "blocked");
    if (result.kind !== "blocked") return;
    assert.equal(result.message, GENERATION_UNAVAILABLE_MESSAGE);
    assert.equal(result.uploadStarted, false);
    assert.equal(result.lessonId, null);
  });

  it("starts the tutorial request while the shell is still unfinished", async () => {
    let releaseShell: (id: string) => void = () => {};
    const shell = new Promise<string>((resolve) => {
      releaseShell = resolve;
    });
    let tutorialStarted = false;
    let uploadCalled = false;
    const pending = runNewLessonAttempt({
      preflight: async () => ({ httpOk: true, body: { available: true } }),
      createShell: () => shell,
      requestTutorial: async () => {
        tutorialStarted = true;
        return { title: "Lesson" };
      },
      uploadReference: async () => {
        uploadCalled = true;
        return "url";
      },
    });

    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(tutorialStarted, true);
    assert.equal(uploadCalled, false);

    releaseShell("lesson-1");
    const result = await pending;
    assert.equal(result.kind, "ready");
    assert.equal(uploadCalled, true);
    if (result.kind === "ready") assert.equal(result.lessonId, "lesson-1");
  });

  it("keeps a saved lesson when generation fails after the upload starts", async () => {
    const result = await runNewLessonAttempt({
      preflight: async () => ({ httpOk: true, body: { available: true } }),
      createShell: async () => "lesson-1",
      requestTutorial: async () => {
        throw new Error("Lesson writing is unavailable right now.");
      },
      uploadReference: async (id) => `https://storage.example/${id}.jpg`,
    });
    assert.equal(result.kind, "failed");
    if (result.kind !== "failed") return;
    assert.equal(result.lessonId, "lesson-1");
    assert.equal(result.uploadStarted, true);
    assert.equal(result.imageUrl, "https://storage.example/lesson-1.jpg");
    const message = creatorFailureMessage({
      uploadStarted: result.uploadStarted,
      lessonCreated: Boolean(result.lessonId),
      error: result.error,
    });
    assert.equal(message, LESSON_SAVED_RETRY_MESSAGE);
    assert.equal(message.includes("still only on this device"), false);
    assert.equal(message.includes("OPENAI_API_KEY"), false);
  });

  it("does not claim the photo stayed local when a credential name leaks after a save", () => {
    const message = creatorFailureMessage({
      uploadStarted: true,
      lessonCreated: true,
      error: new Error("OPENAI_API_KEY is not configured."),
    });
    assert.equal(message, LESSON_SAVED_RETRY_MESSAGE);
    assert.equal(message.includes("OPENAI_API_KEY"), false);
    assert.equal(message.includes("still only on this device"), false);
  });

  it("keeps a quota explanation after a lesson exists", () => {
    const quota = "You've reached today's generation limit. Please try again tomorrow.";
    const message = creatorFailureMessage({
      uploadStarted: true,
      lessonCreated: true,
      error: new Error(quota),
    });
    assert.equal(message, quota);
    assert.equal(message.includes("still only on this device"), false);
  });
});

describe("creator wiring", () => {
  it("asks whether generation is available before the shell or upload", () => {
    const creator = read("components/studio/LessonCreator.tsx");
    const flow = read("lib/lesson-creation-flow.ts");
    const preflight = creator.indexOf("/api/generation-availability");
    const shell = creator.indexOf("await createLessonShell");
    const upload = creator.indexOf("await uploadBytes");
    assert.ok(preflight !== -1 && preflight < shell && preflight < upload);
    assert.ok(flow.indexOf("deps.preflight") < flow.indexOf("deps.createShell"));
    assert.ok(flow.indexOf("uploadStarted = true") < flow.indexOf("deps.uploadReference"));
    assert.match(creator, /markLessonGenerationError/);
    assert.match(creator, /creatorFailureMessage/);
    assert.doesNotMatch(creator, /OPENAI_API_KEY/);
  });
});
