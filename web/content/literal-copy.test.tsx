import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { caseStudies } from "@/content/case-studies";
import { locales } from "@/content/types";
import hashes from "@/content/fixtures/legacy-case-hashes.json";
import { TextContent } from "@/components/rich-text";

// Digests taken from the original source, before converting strings to inline segments.
// They protect titles, metadata, highlights, headings, paragraphs, bullets and bold leads.
it.each(caseStudies)("$slug conserva textos literales ES/EN del portfolio anterior", study => {
  for (const locale of locales) {
    const value = [study.title[locale], study.roleLine[locale], study.highlights.map(item => item[locale]), study.sections.map(section => [
      section.heading[locale], section.blocks.map(block => {
        const items = block.type === "paragraph" ? [block] : block.items;
        const texts = items.map(item => item.segments.map(segment => segment.type === "code" ? segment.value : segment.type === "text" ? segment.value[locale] : segment.label[locale]).join(""));
        return block.type === "paragraph" ? ["paragraph", texts[0]] : ["bullets", block.items.map((item, index) => [item.lead?.[locale] ?? null, texts[index]])];
      }),
    ])];
    expect(createHash("sha256").update(JSON.stringify(value)).digest("hex")).toBe((hashes as Record<string, { es: string; en: string }>)[study.slug][locale]);
  }
});

it("renderiza texto, código y enlaces con escape HTML y traducciones", () => {
  const html = renderToStaticMarkup(<TextContent locale="en" item={{
    lead: { es: "Ejemplo", en: "Example" },
    segments: [
      { type: "text", value: { es: "Ver ", en: "See " } },
      { type: "code", value: "purchase_<orderId>" },
      { type: "link", label: { es: "Documentación", en: "Documentation" }, href: "https://example.com/docs" },
    ],
  }} />);
  expect(html).toContain("<strong>Example</strong>");
  expect(html).toContain("<code>purchase_&lt;orderId&gt;</code>");
  expect(html).toContain('<a href="https://example.com/docs">Documentation</a>');
  expect(html).toContain("See ");
});
