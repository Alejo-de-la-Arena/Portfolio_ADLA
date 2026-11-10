import type { CaseStudy } from "./types";

export const caseStudies: readonly CaseStudy[] = [{
  slug: "example-project",
  title: { es: "Proyecto de ejemplo", en: "Example project" },
  roleLine: { es: "Desarrollador full-stack — placeholder", en: "Full-stack developer — placeholder" },
  period: { start: "2026-01", end: null },
  stack: ["React", "TypeScript", "Supabase"],
  links: [{ label: { es: "Enlace de ejemplo", en: "Example link" }, href: "https://example.com" }],
  highlights: [{ es: "Resultado pendiente de documentar.", en: "Outcome to be documented." }],
  sections: [{
    heading: { es: "Contexto", en: "Context" },
    blocks: [
      { type: "paragraph", lead: { es: "Problema:", en: "Problem:" }, text: { es: "Texto de ejemplo para reemplazar por el contexto real.", en: "Placeholder text to replace with the actual context." } },
      { type: "paragraph", text: { es: "Acá irá el alcance del proyecto.", en: "The project scope will go here." } },
    ],
  }, {
    heading: { es: "Implementación", en: "Implementation" },
    blocks: [{ type: "bullets", items: [
      { lead: { es: "Decisión:", en: "Decision:" }, text: { es: "Explicar una decisión técnica.", en: "Explain a technical decision." } },
      { text: { es: "Agregar una lección aprendida.", en: "Add a lesson learned." } },
    ] }],
  }],
}];

export function findCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
