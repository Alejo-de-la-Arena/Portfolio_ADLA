import type { ProjectVisual as Visual } from "@/content/case-visuals";
import type { Locale } from "@/content/types";
import { SystemDiagram } from "./system-diagram";
import { ElevationPlan } from "./elevation-plan";
import { SeasonSelector } from "./season-selector";

/** Server Component: picks the project's visual by kind. Only the chosen one is a Client Component. */
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
