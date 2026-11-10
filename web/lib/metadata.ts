import type { Metadata } from "next";
import { dictionary as d } from "@/content/dictionary";
import type { Locale } from "@/content/types";
export const metadataBase = new URL(process.env.SITE_URL ?? "http://localhost:3000");
if (!["http:", "https:"].includes(metadataBase.protocol) || metadataBase.pathname !== "/" || metadataBase.search || metadataBase.hash) {
  throw new Error("SITE_URL must be an HTTP(S) origin without a path, query or hash");
}
export function pageMetadata(locale: Locale, suffix: string, title: string, description: string): Metadata {
  const path = "/" + locale + suffix;
  return {
    metadataBase, title, description,
    alternates: {
      canonical: path,
      languages: { es: "/es" + suffix, en: "/en" + suffix, "x-default": "/es" + suffix },
    },
    openGraph: {
      type: "website", url: path, title, description, siteName: d.siteTitle[locale],
      locale: locale === "es" ? "es_AR" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_AR",
    },
  };
}
