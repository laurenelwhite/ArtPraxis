import {
  persistentLessonWritesAllowed,
  preflightUserMessage,
} from "@/lib/generation-preflight";

export type PreflightRead = {
  httpOk: boolean;
  body: { available?: unknown; error?: unknown } | null;
};

export type NewLessonAttempt<TTutorial, TUrl> =
  | {
      kind: "blocked";
      message: string;
      lessonId: null;
      uploadStarted: false;
      tutorial: null;
      imageUrl: null;
    }
  | {
      kind: "ready";
      lessonId: string;
      uploadStarted: true;
      tutorial: TTutorial;
      imageUrl: TUrl;
    }
  | {
      kind: "failed";
      error: unknown;
      lessonId: string | null;
      uploadStarted: boolean;
      tutorial: TTutorial | null;
      imageUrl: TUrl | null;
    };

/**
 * Preflight first. Shell creation, the tutorial request, and the reference
 * upload start together only after generation is available.
 * The upload waits for the lesson id, then runs beside the tutorial request.
 */
export async function runNewLessonAttempt<TTutorial, TUrl>(deps: {
  preflight: () => Promise<PreflightRead>;
  createShell: () => Promise<string>;
  uploadReference: (lessonId: string) => Promise<TUrl>;
  requestTutorial: () => Promise<TTutorial>;
}): Promise<NewLessonAttempt<TTutorial, TUrl>> {
  const gate = await deps.preflight();
  if (!gate.httpOk || !persistentLessonWritesAllowed(gate.body)) {
    return {
      kind: "blocked",
      message: preflightUserMessage(gate.httpOk, gate.body),
      lessonId: null,
      uploadStarted: false,
      tutorial: null,
      imageUrl: null,
    };
  }

  let lessonId: string | null = null;
  let uploadStarted = false;

  const shellPromise = deps.createShell().then((id) => {
    if (!id) throw new Error("Could not create lesson");
    lessonId = id;
    return id;
  });
  const tutorialPromise = deps.requestTutorial();
  const uploadPromise = shellPromise.then((id) => {
    uploadStarted = true;
    return deps.uploadReference(id);
  });

  const [tutorialResult, uploadResult] = await Promise.allSettled([
    tutorialPromise,
    uploadPromise,
  ]);

  if (!lessonId) {
    try {
      lessonId = await shellPromise;
    } catch {
      /* shell failure is reported below */
    }
  }

  const tutorial = tutorialResult.status === "fulfilled" ? tutorialResult.value : null;
  const imageUrl = uploadResult.status === "fulfilled" ? uploadResult.value : null;

  if (
    tutorialResult.status === "fulfilled" &&
    uploadResult.status === "fulfilled" &&
    lessonId
  ) {
    return {
      kind: "ready",
      lessonId,
      uploadStarted: true,
      tutorial: tutorialResult.value,
      imageUrl: uploadResult.value,
    };
  }

  const error =
    tutorialResult.status === "rejected"
      ? tutorialResult.reason
      : uploadResult.status === "rejected"
        ? uploadResult.reason
        : new Error("Could not create lesson");

  return {
    kind: "failed",
    error,
    lessonId,
    uploadStarted,
    tutorial,
    imageUrl,
  };
}
