import { locales, type CaseStudy, type Employment, type ProjectEntry, type Text } from "@/content/types";
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
export function validateEmployments(employments: readonly Employment[]): string[] {
  const errors = validateTranslations(employments);
  const employers = new Set<string>();
  for (const employment of employments) {
    const { employer, period, relationship } = employment;
    if (!employer.trim() || employers.has(employer)) errors.push("Empleador vacío o duplicado: " + employer);
    employers.add(employer);
    errors.push(...validateTexts([relationship], employer));
    const start = dateValue(period.start);
    const end = period.end === null ? null : dateValue(period.end);
    if (!Number.isFinite(start) || (end !== null && !Number.isFinite(end))) errors.push("Fecha inválida: " + employer);
    if (end !== null && start > end) errors.push("Rango invertido: " + employer);
  }
  return errors;
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
    const texts = [study.title, study.roleLine, study.summary, ...study.highlights, ...study.links.map((link) => link.label)];
    const images = [study.cover, ...study.gallery];
    if (!study.cover) errors.push("Cover ausente: " + study.slug);
    if (!images.some(image => image?.variant === "desktop")) errors.push("Captura desktop ausente: " + study.slug);
    for (const image of images) if (image) {
      texts.push(image.alt);
      if (!image.src.startsWith("/work/" + study.slug + "/") || image.src.includes("..")) errors.push("Ruta de imagen inválida: " + study.slug);
      if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) errors.push("Dimensiones inválidas: " + image.src);
    }
    for (const section of study.sections) {
      texts.push(section.heading);
      for (const block of section.blocks) {
        for (const item of block.type === "paragraph" ? [block] : block.items) {
          if (!item.segments.length) errors.push("Segmentos vacíos: " + study.slug);
          for (const segment of item.segments) {
            if (segment.type === "text") texts.push(segment.value);
            else if (segment.type === "link") texts.push(segment.label);
            else if (!segment.value.trim()) errors.push("Código vacío: " + study.slug);
          }
          if (item.lead !== undefined) texts.push(item.lead);
        }
      }
    }
    errors.push(...validateTexts(texts, study.slug));
    if (!["live", "archived", "ongoing"].includes(study.status)) errors.push("Estado inválido: " + study.slug);
    if (!Number.isInteger(study.order)) errors.push("Orden inválido: " + study.slug);
  }
  errors.push(...validateLinks(studies));
  return errors;
}

function validateTexts(texts: readonly Text[], slug: string): string[] {
  return texts.flatMap(text => locales.flatMap(locale => typeof text?.[locale] !== "string" || !text[locale].trim() ? ["Texto vacío: " + slug + "/" + locale] : []));
}

export function validateLinks(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(validateLinks);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if (key !== "href" && key !== "url") return validateLinks(item);
    try {
      const url = new URL(String(item));
      if (typeof item !== "string" || !["http:", "https:"].includes(url.protocol)) return ["URL inválida: " + String(item)];
      return [];
    } catch { return ["URL inválida: " + String(item)]; }
  });
}

export function validateProjects(studies: readonly CaseStudy[], entries: readonly ProjectEntry[]): string[] {
  const errors = [...validateCaseStudies(studies), ...validateTranslations(entries), ...validateLinks(entries)];
  const slugs = new Set(studies.map(study => study.slug));
  for (const entry of entries) {
    if (slugs.has(entry.slug)) errors.push("Slug duplicado: " + entry.slug);
    slugs.add(entry.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) errors.push("Slug inválido: " + entry.slug);
    errors.push(...validateTexts([entry.name, entry.role, entry.summary], entry.slug));
    if (!entry.period && !entry.employer?.trim()) errors.push("Período ausente sin empleador: " + entry.slug);
    if (entry.period) {
      const start = dateValue(entry.period.start);
      const end = entry.period.end == null ? null : dateValue(entry.period.end);
      if (!Number.isFinite(start) || (end !== null && !Number.isFinite(end))) errors.push("Fecha inválida: " + entry.slug);
      if (end !== null && start > end) errors.push("Rango invertido: " + entry.slug);
    }
  }
  return errors;
}
