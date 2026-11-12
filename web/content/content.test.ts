import { describe, expect, it } from "vitest";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { employments, projectEntries } from "@/content/projects";
import type { ProjectEntry } from "@/content/types";
import { dictionary, formatting } from "@/content/dictionary";
import { isValidDate, validateCaseStudies, validateEmployments, validateProjects, validateTranslations, validateLinks } from "@/content/validate";
import { formatDate } from "@/lib/dates";
import { requireLocale } from "@/lib/routing";
describe("contenido", () => {
  it("valida contenido y diccionarios", () => {
    expect(validateProjects(caseStudies, projectEntries)).toEqual([]);
    expect(validateEmployments(employments)).toEqual([]);
    expect(validateTranslations(dictionary)).toEqual([]);
    for (const token of Object.values(formatting)) {
      expect(token.es.length).toBeGreaterThan(0);
      expect(token.en.length).toBeGreaterThan(0);
    }
  });
  it.each([{ es: "Hola" }, { en: "Hello" }, { es: " ", en: "Hello" }, { es: "Hola", en: "" }])("rechaza traducción incompleta: %j", (value) => {
    expect(validateTranslations({ text: value }).length).toBeGreaterThan(0);
  });
  it("valida leads opcionales", () => {
    expect(validateTranslations({ text: { es: "A", en: "B" }, lead: { es: "", en: "Lead" } })).toHaveLength(1);
  });
  it("permite omitir el período solo con empleador", () => {
    const base = projectEntries[0];
    expect(validateProjects([], [{ ...base, employer: "Zetenta", period: undefined }])).toEqual([]);
    // @ts-expect-error An independent project must declare a period; also verify malformed runtime data.
    const missing: ProjectEntry = { ...base, employer: undefined, period: undefined };
    expect(validateProjects([], [missing])).toContain("Período ausente sin empleador: " + base.slug);
    expect(validateProjects([], [{ ...base, employer: " ", period: undefined }])).toContain("Período ausente sin empleador: " + base.slug);
    expect(validateProjects([], [{ ...base, employer: undefined, period: { start: "2024-04", end: "2026-08" } }])).toEqual([]);
    expect(validateProjects([], [{ ...base, period: { start: "2025-02-29" } }])).toContain("Fecha inválida: " + base.slug);
    expect(validateProjects([], [{ ...base, period: { start: "2025-10", end: "2025-04" } }])).toContain("Rango invertido: " + base.slug);
  });
  it("conserva un solo período de empleo para los siete proyectos de Zetenta", () => {
    expect(employments).toEqual([{
      employer: "Zetenta", period: { start: "2025-04", end: "2025-10" },
      relationship: { es: "Relación de dependencia", en: "Employment" },
    }]);
    const entries = projectEntries.filter(entry => entry.employer === "Zetenta");
    expect(entries).toHaveLength(7);
    expect(entries.every(entry => entry.period === undefined)).toBe(true);
    expect(projectEntries.every(entry => !entry.employer || employments.some(job => job.employer === entry.employer))).toBe(true);
    expect(validateEmployments([{ ...employments[0], period: { start: "2025-02-29", end: null } }])).toContain("Fecha inválida: Zetenta");
    expect(validateEmployments([{ ...employments[0], period: { start: "2025-10", end: "2025-04" } }])).toContain("Rango invertido: Zetenta");
  });
  it.each(["2026-02-30", "2025-02-29", "2026-13", "2026-00", "2026-2", "01/01/2026", ""])("rechaza fecha %s", (value) => expect(isValidDate(value)).toBe(false));
  it.each(["2024-02-29", "2026-01", "2026-12-31"])("acepta fecha %s", (value) => expect(isValidDate(value)).toBe(true));
  it("rechaza rangos invertidos con precisiones mixtas", () => {
    expect(validateCaseStudies([{ ...caseStudies[0], period: { start: "2026-02-02", end: "2026-02" } }])).toContain("Rango invertido: " + caseStudies[0].slug);
  });
  it("acepta fechas iguales y end null", () => {
    expect(validateCaseStudies([{ ...caseStudies[0], period: { start: "2026-02", end: "2026-02-01" } }])).toEqual([]);
    expect(validateCaseStudies(caseStudies)).toEqual([]);
  });
  it("slug único global e independiente del idioma", () => {
    expect(validateCaseStudies([caseStudies[0], caseStudies[0]]).filter((error) => error.includes("duplicado"))).toHaveLength(1);
    expect(findCaseStudy(caseStudies[0].slug)).toBe(caseStudies[0]);
    expect(findCaseStudy("missing")).toBeUndefined();
    expect(validateProjects(caseStudies, [{ ...projectEntries[0], slug: caseStudies[0].slug }])).toContain("Slug duplicado: " + caseStudies[0].slug);
    expect(validateProjects(caseStudies, [projectEntries[0], projectEntries[0]])).toContain("Slug duplicado: " + projectEntries[0].slug);
  });
  it.each(["invalid", "/relative", "javascript:alert(1)", "https://", "mailto:a@b.com"])("rechaza link %s", href => {
    expect(validateLinks({ segments: [{ type: "link", href }] })).toHaveLength(1);
  });
  it("incluye solo los trabajos pedidos", () => {
    expect(caseStudies.map(study => study.slug)).toEqual(["solution", "don-teofilo-amoblamientos", "format"]);
    expect(caseStudies.map(study => study.status)).toEqual(["archived", "live", "ongoing"]);
    expect(projectEntries).toHaveLength(12);
    expect(projectEntries.filter(entry => entry.employer === "Zetenta")).toHaveLength(7);
    expect(projectEntries.map(entry => entry.slug)).not.toEqual(expect.arrayContaining(["job-match-bot", "vyzon"]));
  });
  it("formatea meses y días en UTC sin inventar día visible", () => {
    expect(formatDate("2026-01", "es")).toBe("enero de 2026");
    expect(formatDate("2026-01", "en")).toBe("January 2026");
    expect(formatDate("2026-01-01", "en")).toBe("January 1, 2026");
    expect(formatDate("2026-01-01", "es")).toBe("1 de enero de 2026");
  });
  it("locale inválido usa la señal 404 del router", () => {
    expect(() => requireLocale("fr")).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(requireLocale("es")).toBe("es");
  });
});
