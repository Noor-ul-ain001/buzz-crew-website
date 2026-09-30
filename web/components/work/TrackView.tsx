"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Records `case_study_viewed` once per page view (slug only, no visitor data). */
export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    track("case_study_viewed", { case_study: slug });
  }, [slug]);
  return null;
}
