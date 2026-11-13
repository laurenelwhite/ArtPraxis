"use client";

import { useParams } from "next/navigation";
import { LessonView } from "@/components/studio/LessonView";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  return <LessonView id={params.id} />;
}
