import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";
export function requireLocale(value: string) {
  if (!isLocale(value)) notFound();
  return value;
}
