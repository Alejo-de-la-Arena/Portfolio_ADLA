import type { MetadataRoute } from "next";
import { metadataBase } from "@/lib/metadata";
import { contentSuffixes } from "@/lib/routes";
import { locales } from "@/content/types";
// Misma fuente que Proxy y verify:build. Sin lastModified: no hay una fecha real por página que publicar.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, metadataBase).href;
  return locales.flatMap((locale) => contentSuffixes.map((suffix) => ({
    url: url("/" + locale + suffix),
    alternates: { languages: { es: url("/es" + suffix), en: url("/en" + suffix), "x-default": url("/es" + suffix) } },
  })));
}
