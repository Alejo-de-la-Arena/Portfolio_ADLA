import { describe, expect, it } from "vitest";
import type { WorkImage } from "@/content/types";
import { pairScreenshots } from "./screenshots";

const shot = (src: string, variant: WorkImage["variant"]): WorkImage =>
  ({ src, variant, width: 1, height: 1, alt: { es: src, en: src } });

describe("pairScreenshots", () => {
  it("une cada mobile con el desktop anterior y respeta el orden", () => {
    const rows = pairScreenshots([shot("p", "desktop"), shot("pm", "mobile"), shot("c", "desktop"), shot("cm", "mobile"), shot("pay", "desktop")]);
    expect(rows.map((row) => [row.desktop?.src, row.mobile?.src])).toEqual([["p", "pm"], ["c", "cm"], ["pay", undefined]]);
  });
  it("un mobile sin desktop previo o un segundo mobile van en su propia fila", () => {
    const rows = pairScreenshots([shot("m1", "mobile"), shot("d", "desktop"), shot("m2", "mobile"), shot("m3", "mobile")]);
    expect(rows.map((row) => [row.desktop?.src, row.mobile?.src])).toEqual([[undefined, "m1"], ["d", "m2"], [undefined, "m3"]]);
  });
});
