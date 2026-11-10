import type { ISODate, Locale } from "@/content/types";
export function dateValue(value: string): number {
  const full = /^\d{4}-\d{2}$/.test(value) ? value + "-01" : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(full)) return NaN;
  const date = new Date(full + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === full ? date.getTime() : NaN;
}
export function formatDate(value: ISODate, locale: Locale): string {
  const date = dateValue(value);
  if (!Number.isFinite(date)) throw new Error("Invalid ISO date: " + value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long",
    ...(value.length === 10 ? { day: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}
