"use client";
import { useLocale } from "@/components/locale-context";
import { NotFoundContent } from "@/components/not-found-content";
export default function NotFound() {
  return <NotFoundContent locale={useLocale()} />;
}
