import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatSeasons, seasonShapeName, type Season } from "@/content/seasons";
import { describeSeasons } from "@/content/describe-visuals";
import { contrastRatio, getSeasonColors, INK, MIN_SMALL_TEXT_CONTRAST, PAPER, readableOn, readableTextOn, seasonAccentVars, validateSeason } from "@/lib/season-theme";
import { filledShapePath } from "@/lib/season-shape-path";
import { locales } from "@/content/types";

const [origin, ascent, pulse, jungle] = formatSeasons.items;

describe("Seasons de FORMAT", () => {
  it("están ordenadas por número de edición, sin repetir", () => {
    expect(formatSeasons.items.map((s) => s.numero)).toEqual(["001", "002", "003", "004"]);
    expect(new Set(formatSeasons.items.map((s) => s.slug)).size).toBe(formatSeasons.items.length);
  });

  it("usan exactamente el color principal confirmado y nada más", () => {
    expect(formatSeasons.items.map((s) => [s.nombre, s.colores])).toEqual([
      ["ORIGIN", ["#051FE6"]],
      ["ASCENT", ["#7B3FE4"]],
      ["PULSE", ["#E5233B"]],
      ["JUNGLE", ["#0F8A34"]],
    ]);
  });

  it("todas las fechas son viernes", () => {
    for (const season of formatSeasons.items) {
      for (const date of season.fechas) expect(new Date(`${date}T00:00:00Z`).getUTCDay()).toBe(5);
    }
  });

  it("ECLIPSE no está: no tiene paleta definida", () => {
    expect(formatSeasons.items.some((s) => s.slug === "eclipse")).toBe(false);
  });
});

describe.each(formatSeasons.items)("Season $nombre", (season: Season) => {
  it("los datos son válidos", () => {
    expect(validateSeason(season)).toEqual([]);
  });

  it("el texto sobre los acentos es el de más contraste, papel o tinta", () => {
    const vars = seasonAccentVars(season);
    for (const [bg, fg] of [["--accent-1", "--on-accent-1"], ["--accent-2", "--on-accent-2"]] as const) {
      const other = vars[fg] === INK ? PAPER : INK;
      expect(contrastRatio(vars[fg], vars[bg])).toBeGreaterThanOrEqual(contrastRatio(other, vars[bg]));
    }
  });

  it("la línea de detalle se lee sobre el papel (3:1) o cae al principal", () => {
    const vars = seasonAccentVars(season);
    expect(vars["--line"] === season.colores[0] || contrastRatio(vars["--line"], PAPER) >= 3).toBe(true);
  });

  it("los demás puestos de la paleta repiten el principal", () => {
    expect(getSeasonColors(season)).toEqual(Array(5).fill(season.colores[0]));
  });

  it("el texto sobre el principal llega al menos a 3:1", () => {
    expect(contrastRatio(readableTextOn(season.colores[0]), season.colores[0])).toBeGreaterThanOrEqual(3);
  });

  it("el texto chico (etiqueta de viernes, logo sobre el relleno) llega a 4,5:1", () => {
    const vars = seasonAccentVars(season);
    expect(contrastRatio(vars["--small-text"], vars["--small-bg"])).toBeGreaterThanOrEqual(MIN_SMALL_TEXT_CONTRAST);
  });

  it("tiene nombre de forma en ES y EN", () => {
    for (const locale of locales) expect(seasonShapeName[season.forma][locale].trim()).not.toBe("");
  });
});

describe("texto chico de la tarjeta", () => {
  const css = readFileSync(new URL("../components/season-selector.module.css", import.meta.url), "utf8");
  /** Declarations of a rule, found by its exact selector. */
  const rule = (selector: string) => {
    const at = css.indexOf(`\n${selector} {`);
    return at < 0 ? "" : css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  };

  it.each([".badge", '.logo[data-on="fill"] > span'])("%s usa tinta sobre papel", (selector) => {
    expect(rule(selector)).toMatch(/(^|;)\s*background:\s*var\(--small-bg\)/);
    expect(rule(selector)).toMatch(/(^|;)\s*color:\s*var\(--small-text\)/);
  });
});

describe("lógica de contraste del sitio de FORMAT", () => {
  // The cases the client's code documents in its comments.
  it("sobre el verde de Jungle o el rojo de Pulse gana la tinta; sobre el azul de Origin o el violeta de Ascent, el papel", () => {
    expect(readableTextOn(jungle.colores[0])).toBe(INK);
    expect(readableTextOn(pulse.colores[0])).toBe(INK);
    expect(readableTextOn(origin.colores[0])).toBe(PAPER);
    expect(readableTextOn(ascent.colores[0])).toBe(PAPER);
  });

  it("el verde ácido de Jungle no contrasta sobre papel y cae al principal", () => {
    expect(contrastRatio("#3DFF5C", PAPER)).toBeLessThan(1.3);
    expect(readableOn(PAPER, "#3DFF5C", jungle.colores[0])).toBe(jungle.colores[0]);
  });

  it("completa los colores faltantes con el principal", () => {
    expect(getSeasonColors({ ...pulse, colores: ["#E5233B", "#8B0F1D"] })).toEqual(["#E5233B", "#8B0F1D", "#E5233B", "#E5233B", "#E5233B"]);
  });

  it("cuadrado y triángulo salen iguales que en el sitio de FORMAT (getShapePath sin seed)", () => {
    expect(filledShapePath("square")).toBe("M 8.87 10.90 L 64.39 10.63 L 64.40 59.83 L 8.60 59.88 Z");
    expect(filledShapePath("triangle")).toBe("M 36.15 8.10 L 63.69 63.48 L 8.09 61.66 Z");
  });

  it("detecta colores mal escritos", () => {
    expect(validateSeason({ ...pulse, colores: ["E5233B"] })).not.toEqual([]);
  });
});

it.each(locales)("la descripción nombra cada Season, su forma, sus colores y el texto sobre el acento (%s)", locale => {
  const text = describeSeasons(formatSeasons, locale);
  expect(text).toContain(String(formatSeasons.items.length));
  for (const season of formatSeasons.items) {
    expect(text).toContain(season.nombre);
    expect(text).toContain(seasonShapeName[season.forma][locale]);
    for (const color of season.colores) expect(text).toContain(color);
  }
  // Origin and Ascent read in paper, Pulse and Jungle in ink, in that order.
  const onAccent = { es: ["papel", "tinta"], en: ["paper", "ink"] }[locale];
  const items = text.split(/(?=ORIGIN|ASCENT|PULSE|JUNGLE)/).slice(1);
  expect(items.map((item) => item.trim().split(" ").at(-1)?.replace(/\.$/, ""))).toEqual([onAccent[0], onAccent[0], onAccent[1], onAccent[1]]);
});
