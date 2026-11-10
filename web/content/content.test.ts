import { describe, expect, it } from "vitest";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { dictionary, formatting } from "@/content/dictionary";
import { isValidDate, validateCaseStudies, validateTranslations } from "@/content/validate";
import { formatDate } from "@/lib/dates";
import { requireLocale } from "@/lib/routing";
describe("contenido", () => {
  it("valida contenido y diccionarios", () => {
    expect(validateCaseStudies(caseStudies)).toEqual([]);
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
