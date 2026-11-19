import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { contentSuffixes, contentPaths, workImagePaths, ogImagePath } from "../lib/routes.ts";
import { caseStudies } from "../content/case-studies.ts";
import { projectEntries } from "../content/projects.ts";
import { locales } from "../content/types.ts";
import { dictionary as d } from "../content/dictionary.ts";

const manifest = JSON.parse(await readFile(new URL("../.next/prerender-manifest.json", import.meta.url), "utf8"));
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const site = process.env.SITE_URL ?? "http://localhost:3000";
// Previews de Vercel con Deployment Protection: el secreto de "Protection Bypass for Automation" va por entorno, nunca en el repo.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const get = (path, init = {}) => fetch(base + path, { ...init, headers: { ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}), ...init.headers } });
assert.equal(contentPaths.length, locales.length * contentSuffixes.length);
const tags = (html, name) => [...html.matchAll(new RegExp("<" + name + "\\b[^>]*>", "g"))].map(([tag]) =>
  Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), value])));

for (const locale of locales) {
  for (const suffix of contentSuffixes) {
    const path = "/" + locale + suffix;
    assert.ok(contentPaths.includes(path));
    assert.ok(manifest.routes[path], "Missing static route: " + path);
    assert.equal(manifest.routes[path].compute, "static", "Dynamic compute: " + path); assert.equal(manifest.routes[path].response, "complete", "Incomplete prerender: " + path);
    const response = await get(path);
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
    const og = (property) => meta.filter((tag) => tag.property === property).map((tag) => tag.content);
    assert.deepEqual(og("og:image"), [new URL(ogImagePath(locale), site).href], "og:image: " + path);
    assert.deepEqual(og("og:image:alt"), [d.ogImageAlt[locale]], "og:image:alt: " + path);
    assert.deepEqual(og("og:site_name"), ["Alejo de la Arena"], "og:site_name: " + path);
    assert.ok(meta.some((tag) => tag.name === "twitter:card" && tag.content === "summary_large_image"), "twitter:card: " + path);
    assert.ok(tags(html, "a").some((a) => a["aria-current"] === "page" && a.hreflang === locale));
    if (suffix.startsWith("/work/")) {
      assert.match(html, /<h2[ >]/); assert.match(html, /<ul[ >]/);
      assert.match(html, /<strong[ >]/); assert.match(html, /<time /);
      const study = caseStudies.find(study => suffix === "/work/" + study.slug);
      for (const image of [study.cover, ...study.gallery]) {
        assert.ok(tags(html, "img").some(tag => tag.alt === image.alt[locale] && Number(tag.width) === image.width && Number(tag.height) === image.height), "Rendered image: " + image.src);
      }
    }
    console.log("STATIC + 200 + lang + canonical + hreflang + OG: " + path);
  }
}
for (const [language, target] of [["en-US", "/en"], ["es-AR", "/es"], ["es;q=0.2,en;q=0.9", "/en"], ["fr", "/es"]]) {
  const response = await get("/?source=check", { headers: { "Accept-Language": language }, redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), base).pathname, target);
  assert.equal(new URL(response.headers.get("location"), base).search, "?source=check");
}
for (const [path, locale] of [
  ...locales.flatMap((locale) => [["/" + locale + "/missing/deep", locale], ["/" + locale + "/work/missing", locale], ["/" + locale + "/404", locale]]),
  ...locales.flatMap(locale => projectEntries.map(entry => ["/" + locale + "/work/" + entry.slug, locale])),
  ["/work/format/missing.png", "es"],
  ["/fr", "es"], ["/missing/deep", "es"], ["/fonts/no-existe.woff2", "es"], ["/es/no-existe", "es"], ["/es/preview/b", "es"], ["/en/preview/a", "en"],
]) {
  const response = await get(path);
  assert.equal(response.status, 404, path);
  const html = await response.text();
  assert.equal(tags(html, "html")[0]?.lang, locale, path);
  assert.ok(html.includes(d.notFoundTitle[locale]), "404 translation: " + path);
  assert.ok(tags(html, "meta").some((tag) => tag.name === "robots" && tag.content.includes("noindex")), path);
  console.log("404 + lang + translation + noindex: " + path);
}
{
  const response = await get("/robots.txt");
  assert.equal(response.status, 200, "/robots.txt");
  assert.ok(response.headers.get("content-type")?.startsWith("text/plain"), "/robots.txt type");
  const robots = await response.text();
  assert.match(robots, /^User-Agent: \*$/m); assert.match(robots, /^Allow: \/$/m);
  assert.ok(robots.includes("Sitemap: " + new URL("/sitemap.xml", site).href), "robots sitemap");
  console.log("200 + text/plain + sitemap: /robots.txt");
}
{
  const response = await get("/sitemap.xml");
  assert.equal(response.status, 200, "/sitemap.xml");
  assert.ok(response.headers.get("content-type")?.startsWith("application/xml"), "/sitemap.xml type");
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  assert.deepEqual([...urls].sort(), contentPaths.map((path) => new URL(path, site).href).sort(), "sitemap locs");
  for (const suffix of contentSuffixes) {
    for (const language of [...locales, "x-default"]) {
      const href = new URL("/" + (language === "x-default" ? "es" : language) + suffix, site).href;
      assert.ok(xml.includes('hreflang="' + language + '" href="' + href + '"'), "sitemap hreflang " + language + ": " + suffix);
    }
  }
  console.log("200 + xml + " + urls.length + " URLs + hreflang: /sitemap.xml");
}
for (const locale of locales) {
  const path = ogImagePath(locale);
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get("content-type"), "image/png", path);
  const png = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(png.buffer);
  assert.deepEqual([...png.slice(1, 4)], [80, 78, 71], "PNG signature: " + path);
  assert.deepEqual([view.getUint32(16), view.getUint32(20)], [1200, 630], "PNG size: " + path);
  console.log("200 + png + 1200x630: " + path);
}
for (const [path, type] of [["/favicon.ico", "image/"], ["/icon.svg", "image/svg+xml"]]) {
  const response = await get(path);
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get("content-type")?.startsWith(type), path);
  assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  console.log("200 + image + nonempty: " + path);
}
for (const path of workImagePaths) {
  for (const imagePath of [path, "/_next/image?url=" + encodeURIComponent(path) + "&w=640&q=75"]) {
    const response = await get(imagePath);
    assert.equal(response.status, 200, imagePath);
    assert.ok(response.headers.get("content-type")?.startsWith("image/"), imagePath);
    assert.ok((await response.arrayBuffer()).byteLength > 0, imagePath);
  }
  console.log("200 + original + next/image: " + path);
}
console.log("Build verification passed.");
