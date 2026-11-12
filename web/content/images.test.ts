import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/case-studies";
import { validateCaseStudies } from "@/content/validate";
import type { WorkImage } from "@/content/types";

// Read the actual PNG/WebP headers, independently of the declared content dimensions.
const require = createRequire(import.meta.url);
const { imageSize } = require("next/dist/compiled/image-size") as {
  imageSize: (input: Buffer) => { width?: number; height?: number };
};

describe("capturas reales", () => {
  for (const study of caseStudies) {
    it(study.slug + " tiene cover y captura desktop", () => {
      expect(study.cover).toBeDefined();
      expect([study.cover, ...study.gallery].some(image => image.variant === "desktop")).toBe(true);
    });
    it.each([study.cover, ...study.gallery])("$src existe con dimensiones y alt ES/EN", async image => {
      const bytes = await readFile(path.join(process.cwd(), "public", image.src));
      const actual = imageSize(bytes);
      expect({ width: image.width, height: image.height }).toEqual({ width: actual.width, height: actual.height });
      expect(image.alt.es.trim()).not.toBe("");
      expect(image.alt.en.trim()).not.toBe("");
    });
  }
  it("rechaza cover, desktop o traducciones ausentes", () => {
    const study = caseStudies[0];
    expect(validateCaseStudies([{ ...study, cover: undefined as unknown as WorkImage }])).toContain("Cover ausente: " + study.slug);
    expect(validateCaseStudies([{ ...study, cover: { ...study.cover, variant: "mobile" } }])).toContain("Captura desktop ausente: " + study.slug);
    expect(validateCaseStudies([{ ...study, cover: { ...study.cover, alt: { es: "", en: "" } } }])).toContain("Texto vacío: " + study.slug + "/es");
  });
});
