import type { Locale } from "@/content/types";

/** Grouping is forced so ES shows 1.086 like the case study text (Intl skips it for four digits in es). */
export function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { useGrouping: "always" }).format(value);
}
