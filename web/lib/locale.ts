import { locales, type Locale } from "../content/types";
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
export function preferredLocale(header: string | null): Locale {
  const preferences = (header ?? "").split(",").map((entry, index) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(";");
    const quality = parameters.map((value) => value.trim()).find((value) => value.startsWith("q="));
    const q = quality === undefined ? 1 : Number(quality.slice(2));
    return { language: tag.split("-")[0], q, index };
  }).filter(({ q }) => Number.isFinite(q) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { language } of preferences) {
    if (isLocale(language)) return language;
    if (language === "*") return "es";
  }
  return "es";
}
