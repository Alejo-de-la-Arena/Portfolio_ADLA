import { dictionary as d } from "@/content/dictionary";
import { locales, type Locale } from "@/content/types";
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}
// Workaround vercel/next.js#100596: notFound() en segmentos dinámicos devuelve un body vacío (sin lang ni texto). Quitar cuando Next lo corrija; ver docs/decisiones-next.md.
function content(locale: Locale) {
  return `<h1>${escapeHtml(d.notFoundTitle[locale])}</h1><p>${escapeHtml(d.notFoundDescription[locale])}</p><a href="/${locale}">${escapeHtml(d.backHome[locale])}</a>`;
}
function document(lang: Locale, body: string) {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(d.notFoundTitle[lang])}</title><link rel="stylesheet" href="/error-document.css"><link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin></head><body><main>${body}</main></body></html>`;
}
// Fixed documents, computed once when the Proxy module loads, never rendered per request.
export const notFoundDocuments = Object.fromEntries(locales.map((locale) => [locale, document(locale, content(locale))])) as Record<Locale, string>;
// Addresses without a valid locale: bilingual, primary lang es, like app/global-not-found.tsx.
// Served from Proxy because Vercel answers a rewrite to the prerendered /_not-found with 200 (see docs/decisiones-next.md).
export const globalNotFoundDocument = document("es", locales.map((locale) => `<section lang="${locale}">${content(locale)}</section>`).join(""));
