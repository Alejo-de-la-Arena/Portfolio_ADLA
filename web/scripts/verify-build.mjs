import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { contentSuffixes, contentPaths } from "../lib/routes.ts";
import { locales } from "../content/types.ts";
import { dictionary as d } from "../content/dictionary.ts";

const manifest = JSON.parse(await readFile(new URL("../.next/prerender-manifest.json", import.meta.url), "utf8"));
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const site = process.env.SITE_URL ?? "http://localhost:3000";
assert.equal(contentPaths.length, locales.length * contentSuffixes.length);
const tags = (html, name) => [...html.matchAll(new RegExp("<" + name + "\\b[^>]*>", "g"))].map(([tag]) =>
  Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), value])));

for (const locale of locales) {
  for (const suffix of contentSuffixes) {
    const path = "/" + locale + suffix;
    assert.ok(contentPaths.includes(path));
    assert.ok(manifest.routes[path], "Missing static route: " + path);
    assert.equal(manifest.routes[path].compute, "static", "Dynamic compute: " + path); assert.equal(manifest.routes[path].response, "complete", "Incomplete prerender: " + path);
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.equal(tags(html, "html")[0]?.lang, locale);
    const links = tags(html, "link");
    assert.ok(links.some((link) => link.rel === "canonical" && link.href === new URL(path, site).href), "Canonical: " + path);
    for (const language of [...locales, "x-default"]) {
      const target = "/" + (language === "x-default" ? "es" : language) + suffix;
      assert.ok(links.some((link) => link.rel === "alternate" && link.hreflang === language && link.href === new URL(target, site).href), "hreflang " + language + ": " + path);
    }
    const meta = tags(html, "meta");
    for (const property of ["og:title", "og:description", "og:type", "og:url", "og:locale"]) {
      assert.ok(meta.some((tag) => tag.property === property && tag.content), "Missing " + property);
    }
    assert.ok(tags(html, "a").some((a) => a["aria-current"] === "page" && a.hreflang === locale));
    if (suffix.startsWith("/work/")) {
      assert.match(html, /<h2[ >]/); assert.match(html, /<ul[ >]/);
      assert.match(html, /<strong[ >]/); assert.match(html, /<time /);
    }
    console.log("STATIC + 200 + lang + canonical + hreflang + OG: " + path);
  }
}
for (const [language, target] of [["en-US", "/en"], ["es-AR", "/es"], ["es;q=0.2,en;q=0.9", "/en"], ["fr", "/es"]]) {
  const response = await fetch(base + "/?source=check", { headers: { "Accept-Language": language }, redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), base).pathname, target);
  assert.equal(new URL(response.headers.get("location"), base).search, "?source=check");
}
for (const [path, locale] of [
  ...locales.flatMap((locale) => [["/" + locale + "/missing/deep", locale], ["/" + locale + "/work/missing", locale], ["/" + locale + "/404", locale]]),
  ["/fr", "es"], ["/missing/deep", "es"], ["/fonts/no-existe.woff2", "es"], ["/es/no-existe", "es"],
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 404, path);
  const html = await response.text();
  assert.equal(tags(html, "html")[0]?.lang, locale, path);
  assert.ok(html.includes(d.notFoundTitle[locale]), "404 translation: " + path);
  assert.ok(tags(html, "meta").some((tag) => tag.name === "robots" && tag.content.includes("noindex")), path);
  console.log("404 + lang + translation + noindex: " + path);
}
for (const [path, type] of [["/favicon.ico", "image/"], ["/icon.svg", "image/svg+xml"]]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get("content-type")?.startsWith(type), path);
  assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  console.log("200 + image + nonempty: " + path);
}
console.log("Build verification passed.");
