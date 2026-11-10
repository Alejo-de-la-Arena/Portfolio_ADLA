import { dictionary as d } from "@/content/dictionary";
import { locales, type Locale } from "@/content/types";
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}
// Workaround vercel/next.js#100596: notFound() en segmentos dinámicos devuelve un body vacío (sin lang ni texto). Quitar cuando Next lo corrija; ver docs/decisiones-next.md.
function document(locale: Locale) {
  const title = escapeHtml(d.notFoundTitle[locale]);
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><link rel="stylesheet" href="/error-document.css"><link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin></head><body><main><h1>${title}</h1><p>${escapeHtml(d.notFoundDescription[locale])}</p><a href="/${locale}">${escapeHtml(d.backHome[locale])}</a></main></body></html>`;
}
// Two fixed documents, computed once when the Proxy module loads, never rendered per request.
export const notFoundDocuments = Object.fromEntries(locales.map((locale) => [locale, document(locale)])) as Record<Locale, string>;
