"use client";
import { useEffect } from "react";
import { inject } from "@vercel/analytics";

// Vercel Web Analytics without <Analytics /> from "@vercel/analytics/next": that component reads
// useSearchParams, which leaves every page as a partial prerender and breaks ensureStatic's
// "response complete". inject() adds the same script once and tracks client navigations from pushState.
// Renders nothing; outside Vercel the script path does not exist and nothing is sent.
export function VercelAnalytics() {
  useEffect(() => { inject({ framework: "next" }); }, []);
  return null;
}
