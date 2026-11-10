import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { contentPaths } from "@/lib/routes";
import { dictionary as d } from "@/content/dictionary";
import { locales } from "@/content/types";
describe("proxy", () => {
  it.each([["en-US,en;q=0.8", "en"], ["es;q=0.2,en;q=0.9", "en"], ["es-AR", "es"], ["fr", "es"]])("negocia %s", (header, locale) => {
    const response = proxy(new NextRequest("http://localhost:3000/?source=test", { headers: { "accept-language": header } }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/" + locale + "?source=test");
    expect(response.headers.get("vary")).toBe("Accept-Language");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each(contentPaths)("deja pasar %s", (path) => {
    expect(proxy(new NextRequest("http://localhost:3000" + path)).headers.get("x-middleware-next")).toBe("1");
  });
  it.each(locales)("404 estático en %s", async (locale) => {
    const response = proxy(new NextRequest("http://localhost:3000/" + locale + "/work/missing"));
    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html).toContain('lang="' + locale + '"');
    expect(html).toContain(d.notFoundTitle[locale]);
    expect(html).toContain("noindex");
  });
  it.each(["/fr", "/missing/deep", "/fonts/no-existe.woff2", "/favicon-missing.ico"])("404 global de %s", (path) => {
    expect(proxy(new NextRequest("http://localhost:3000" + path)).headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/_not-found");
  });
});

it.each(["/fonts/no-existe.woff2", "/favicon-missing.ico", "/es/no-existe", "/fr"])("matcher intercepts %s", (url) => {
  expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
});
it.each(["/favicon.ico", "/icon.svg", "/fonts/hanken-grotesk-latin.woff2", "/fonts/jetbrains-mono-latin.woff2", "/error-document.css"])("matcher serves existing asset %s", (url) => {
  expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
});
