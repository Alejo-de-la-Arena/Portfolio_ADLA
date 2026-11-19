import type { MetadataRoute } from "next";
import { metadataBase } from "@/lib/metadata";
// Todo el sitio es público. Las direcciones de error ya llevan noindex; no hace falta Disallow.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", metadataBase).href };
}
