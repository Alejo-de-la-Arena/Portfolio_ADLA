import { NextResponse, type NextRequest } from "next/server";
import { preferredLocale, isLocale } from "@/lib/locale";
import { contentPaths } from "@/lib/routes";
import { notFoundDocuments } from "@/lib/not-found-document";
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.pathname === "/") {
    url.pathname = "/" + preferredLocale(request.headers.get("accept-language"));
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Vary", "Accept-Language");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const locale = url.pathname.split("/")[1];
  if (isLocale(locale)) {
    if (contentPaths.includes(url.pathname)) return NextResponse.next();
    // Workaround vercel/next.js#100596: notFound() en segmentos dinámicos devuelve un body vacío (sin lang ni texto). Quitar cuando Next lo corrija; ver docs/decisiones-next.md.
    return new NextResponse(notFoundDocuments[locale], {
      status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }
  url.pathname = "/_not-found";
  return NextResponse.rewrite(url);
}
// Only existing public files bypass Proxy; never exclude all /fonts/ or file extensions.
// robots.txt, sitemap.xml, íconos y opengraph-image necesitan su propia excepción cuando se agreguen.
// Matcher must be a literal so Next can analyze it at build time.
export const config = {
  matcher: ["/((?!_next/|fonts/(?:hanken-grotesk-latin\\.woff2|jetbrains-mono-latin\\.woff2|Hanken-Grotesk-OFL\\.txt|JetBrains-Mono-OFL\\.txt|README\\.md)$|error-document\\.css$|favicon\\.ico$|icon\\.svg$).*)"],
};
