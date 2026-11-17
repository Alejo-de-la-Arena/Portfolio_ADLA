import { visualUi as ui } from "./dictionary";
import type { SystemDiagram } from "./case-visuals";
import type { Locale } from "./types";

/* Kept apart from case-visuals.ts, which holds every project's data: the diagram's Client Component
   imports from here, so its chunk does not carry the other projects' visuals. */

/** Text sizes in diagram units. The drawing is never rendered below ~0.97 scale (352px wide for a
    360-unit viewBox), so 13.5 units stays at or above 13 CSS px on a 390px phone. */
export const diagramType = { name: 15, role: 13.5, badge: 13.5, badgeRadius: 13 } as const;

/** A stable text alternative for the drawing: every connection, who talks to whom, in order.
    Generated from the same data the SVG draws, so the two cannot drift apart. */
export function describeDiagram(diagram: SystemDiagram, locale: Locale): string {
  const name = (id: string) => diagram.nodes.find((node) => node.id === id)?.name[locale] ?? id;
  const steps = diagram.steps.map((step, index) => {
    const edge = diagram.edges.find((item) => item.id === step.edge);
    const from = edge ? name(edge.from) : "", to = edge ? name(edge.to) : "";
    return ui.describeStep[locale].replace("{n}", String(index + 1)).replace("{from}", from).replace("{to}", to)
      .replace("{label}", step.label[locale] + (step.code ? " " + step.code : ""));
  });
  return [ui.describeIntro[locale].replace("{title}", diagram.title[locale]).replace("{total}", String(diagram.steps.length)), ...steps].join(" ");
}
