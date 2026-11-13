import { Suspense } from "react";
import { LessonCreator } from "@/components/studio/LessonCreator";

export default function NewLessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonCreator />
    </Suspense>
  );
}
