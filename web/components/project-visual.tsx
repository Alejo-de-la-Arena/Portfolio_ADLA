"use client";

import dynamic from "next/dynamic";
import type { ProjectVisual as Visual } from "@/content/case-visuals";
import type { Locale } from "@/content/types";

/* One dynamic import per visual kind, so each page downloads only the code of the visual it shows.
   This is a Client Component on purpose: Next 16 does not code-split a Client Component that a Server
   Component imports with next/dynamic (guides/lazy-loading.md). The props were already crossing to the
   client, so nothing new is serialized. SSR stays on: the visual is in the HTML and its chunk is
   preloaded, so there is no loading state to design. */
const SystemDiagram = dynamic(() => import("./system-diagram").then((m) => m.SystemDiagram));
const ElevationPlan = dynamic(() => import("./elevation-plan").then((m) => m.ElevationPlan));
const SeasonSelector = dynamic(() => import("./season-selector").then((m) => m.SeasonSelector));

/** Picks the project's visual by kind. */
export function ProjectVisual({ visual, locale, variant, className }: {
  visual: Visual; locale: Locale; variant: "full" | "thumbnail"; className?: string;
}) {
  switch (visual.kind) {
    case "system":
      return <SystemDiagram diagram={visual.diagram} locale={locale} variant={variant} className={className}
        listPlacement={variant === "full" ? "beside" : undefined} />;
    case "elevation":
      return <ElevationPlan set={visual.elevations} locale={locale} variant={variant} className={className} />;
    case "seasons":
      return <SeasonSelector set={visual.seasons} locale={locale} variant={variant} className={className} />;
  }
}
