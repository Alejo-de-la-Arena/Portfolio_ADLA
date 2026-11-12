"use client";

import { useEffect, useState } from "react";
import { visualUi as ui } from "@/content/dictionary";
import type { Locale } from "@/content/types";

/** Copies a value to the clipboard and says so in a polite live region; reports failure with a way out. */
export function CopyButton({ value, locale, className }: { value: string; locale: Locale; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 4000);
    return () => clearTimeout(timer);
  }, [status]);
  return <>
    <button type="button" className={className} onClick={async () => {
      try { await navigator.clipboard.writeText(value); setStatus("copied"); }
      catch { setStatus("failed"); }
    }}>{status === "copied" ? ui.emailCopied[locale] : ui.copyEmail[locale]}</button>
    <span role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
      {status === "copied" ? ui.emailCopied[locale] : status === "failed" ? ui.copyFailed[locale] : ""}
    </span>
    {status === "failed" && <span data-copy-failed="">{ui.copyFailed[locale]}</span>}
  </>;
}
