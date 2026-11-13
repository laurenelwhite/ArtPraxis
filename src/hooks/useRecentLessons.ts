"use client";

import { useEffect, useState } from "react";
import { getRecentLessons, type LessonSummary } from "@/lib/lessons";

export function useRecentLessons(uid: string | undefined, max = 12) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) {
      setLessons([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getRecentLessons(uid, max)
      .then((result) => {
        if (!active) return;
        setLessons(result);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load your lessons.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [uid, max]);

  return { lessons, loading, error };
}
