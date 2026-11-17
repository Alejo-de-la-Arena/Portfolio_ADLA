import { formatCount } from "@/lib/format-count";
import type { Locale } from "./types";

/* Text alternatives for the project visuals, generated from the same data they draw, so the text and
   the drawing cannot drift apart. Referenced from each SVG with aria-describedby. Shared helpers here;
   each visual has its own module (describe-elevations, describe-seasons, describe-diagram), so a
   visual's chunk carries only its own description. */

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g,(_, key: string) => String(values[key] ?? `{${key}}`));
export const list = (items: string[], locale: Locale) => new Intl.ListFormat(locale, { type: "conjunction" }).format(items);
export const formatMm = (mm: number, locale: Locale) => `${formatCount(mm, locale)} mm`;

/** A run of the description; lang marks text in another language than the page (brand quotes). */
export type DescriptionPart = { text: string; lang?: string };
