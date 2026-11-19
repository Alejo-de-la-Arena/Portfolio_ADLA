import type { Metadata } from "next";
import { dictionary as d } from "@/content/dictionary";
import { profile } from "@/content/profile";
import { ogImagePath } from "@/lib/routes";
import type { Locale } from "@/content/types";
export const metadataBase = new URL(process.env.SITE_URL ?? "http://localhost:3000");
if (!["http:", "https:"].includes(metadataBase.protocol) || metadataBase.pathname !== "/" || metadataBase.search || metadataBase.hash) {
  throw new Error("SITE_URL must be an HTTP(S) origin without a path, query or hash");
}
export const ogImageSize = { width: 1200, height: 630 };
export function pageMetadata(locale: Locale, suffix: string, title: string, description: string): Metadata {
  const path = "/" + locale + suffix;
  return {
    metadataBase, title, description,
    alternates: {
      canonical: path,
      languages: { es: "/es" + suffix, en: "/en" + suffix, "x-default": "/es" + suffix },
    },
    openGraph: {
      type: "website", url: path, title, description, siteName: profile.name,
      locale: locale === "es" ? "es_AR" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_AR",
      images: [{ url: ogImagePath(locale), ...ogImageSize, type: "image/png", alt: d.ogImageAlt[locale] }],
    },
    // The card is app/[locale]/opengraph-image.tsx; X falls back to og:image.
    twitter: { card: "summary_large_image" },
  };
}
