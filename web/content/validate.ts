import { locales, type CaseStudy } from "@/content/types";
import { dateValue } from "@/lib/dates";

export function validateTranslations(value: unknown, path = "content"): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => validateTranslations(item, path + "[" + index + "]"));
  if (value === null || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if ("es" in record || "en" in record) {
    return locales.flatMap((locale) => typeof record[locale] !== "string" || !record[locale].trim() ? [path + "." + locale + ": traducción vacía o ausente"] : []);
  }
  return Object.entries(record).flatMap(([key, item]) => validateTranslations(item, path + "." + key));
}
export function isValidDate(value: string): boolean {
  return Number.isFinite(dateValue(value));
}
export function validateCaseStudies(studies: readonly CaseStudy[]): string[] {
  const errors = validateTranslations(studies);
  const slugs = new Set<string>();
  for (const study of studies) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(study.slug)) errors.push("Slug inválido: " + study.slug);
    if (slugs.has(study.slug)) errors.push("Slug duplicado: " + study.slug);
    slugs.add(study.slug);
    const start = dateValue(study.period.start);
    const end = study.period.end === null ? null : dateValue(study.period.end);
    if (!Number.isFinite(start) || (end !== null && !Number.isFinite(end))) errors.push("Fecha inválida: " + study.slug);
    if (end !== null && start > end) errors.push("Rango invertido: " + study.slug);
    if (study.stack.some((item) => !item.trim())) errors.push("Stack vacío: " + study.slug);
    // Explicitly visit every visible text, including malformed empty translation objects.
    const texts = [study.title, study.roleLine, ...study.highlights, ...study.links.map((link) => link.label)];
    for (const section of study.sections) {
      texts.push(section.heading);
      for (const block of section.blocks) {
        for (const item of block.type === "paragraph" ? [block] : block.items) {
          texts.push(item.text);
          if (item.lead !== undefined) texts.push(item.lead);
        }
      }
    }
    for (const text of texts) {
      for (const locale of locales) if (typeof text?.[locale] !== "string" || !text[locale].trim()) errors.push("Texto vacío: " + study.slug + "/" + locale);
    }
  }
  return errors;
}
