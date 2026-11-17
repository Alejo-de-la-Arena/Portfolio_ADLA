import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatSeasons, seasonShapeName, type Season } from "@/content/seasons";
import { describeSeasonParts, describeSeasons } from "@/content/describe-seasons";
import { contrastRatio, getSeasonColors, INK, MIN_GRAPHIC_CONTRAST, MIN_SMALL_TEXT_CONTRAST, PAPER, readableOn, readableTextOn, seasonAccentVars, SHAPE_OUTLINE, validateSeason } from "@/lib/season-theme";
import { filledShapePath } from "@/lib/season-shape-path";
import { dateValue } from "@/lib/dates";
import { locales } from "@/content/types";
import { SeasonSticker } from "@/components/season-sticker";
import { SeasonSelector } from "@/components/season-selector";

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

  it("todas las fechas son reales y son viernes", () => {
    for (const season of formatSeasons.items) {
      for (const date of season.fechas) {
        // dateValue rejects dates that new Date() would roll over (2026-02-30 → March 2).
        const value = dateValue(date);
        expect(Number.isFinite(value), date).toBe(true);
        expect(new Date(value).getUTCDay(), date).toBe(5);
      }
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

  it("la línea de detalle llega a 3:1 sobre el papel", () => {
    expect(contrastRatio(seasonAccentVars(season)["--line"], PAPER)).toBeGreaterThanOrEqual(MIN_GRAPHIC_CONTRAST);
  });

  it("la forma tiene en todo su borde un contorno que llega a 3:1 sobre el papel", () => {
    expect(contrastRatio(SHAPE_OUTLINE, PAPER)).toBeGreaterThanOrEqual(MIN_GRAPHIC_CONTRAST);
    const svg = renderToStaticMarkup(createElement(SeasonSticker, { forma: season.forma, rotate: 0 }));
    const tags = [...svg.matchAll(/<(?:g|path|circle)\b[^>]*>/g)].map((m) => m[0]);
    // Accent fills carry an ink stroke painted under the fill.
    const fills = tags.filter((tag) => tag.includes('fill="currentColor"'));
    for (const tag of fills) {
      expect(tag).toContain(`stroke="${SHAPE_OUTLINE}"`);
      expect(tag).toContain('paint-order="stroke"');
    }
    // Accent lines sit on the same geometry in ink, wider: right before them, with identical content.
    const lines = [...svg.matchAll(/<g stroke="currentColor" stroke-width="([\d.]+)">(.*?)<\/g>/g)];
    for (const [, width, inner] of lines) {
      const contour = svg.match(new RegExp(`<g data-contour="" stroke="${SHAPE_OUTLINE}" stroke-width="([\\d.]+)">(.*?)</g><g stroke="currentColor" stroke-width="${width}">`));
      expect(contour?.[2]).toBe(inner);
      expect(Number(contour?.[1])).toBeGreaterThan(Number(width));
    }
    expect(fills.length + lines.length).toBeGreaterThan(0);
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

describe("validación de fechas de una Season", () => {
  const errors = (changes: Partial<Season>) => validateSeason({ ...pulse, ...changes });

  it("rechaza fechas que no existen en el calendario", () => {
    expect(errors({ fechas: ["2026-10-09", "2026-10-16", "2026-02-30", "2026-10-30"] })).toContain("pulse: fecha no válida 2026-02-30");
    expect(errors({ fechaFin: "2026-10-32", fechas: ["2026-10-09", "2026-10-32"] })).toContain("pulse: fecha de fin no válida 2026-10-32");
  });

  it("rechaza fechas fuera del rango de la Season", () => {
    expect(errors({ fechas: ["2026-10-09", "2026-11-06", "2026-10-30"] })).toContain("pulse: 2026-11-06 fuera del rango");
  });

  it("rechaza fechas fuera de orden o repetidas", () => {
    expect(errors({ fechas: ["2026-10-09", "2026-10-23", "2026-10-16", "2026-10-30"] })).toContain("pulse: 2026-10-16 fuera de orden");
    expect(errors({ fechas: ["2026-10-09", "2026-10-16", "2026-10-16", "2026-10-30"] })).toContain("pulse: 2026-10-16 fuera de orden");
  });

  it("rechaza un rango invertido", () => {
    expect(errors({ fechaInicio: "2026-10-30", fechaFin: "2026-10-09", fechas: ["2026-10-30", "2026-10-09"] })).toContain("pulse: rango invertido");
  });
});

describe("frases de marca (intro)", () => {
  it.each(locales)("van sin traducir y con lang=\"en\" en la tarjeta y en la descripción (%s)", (locale) => {
    expect(formatSeasons.introLang).toBe("en");
    const html = renderToStaticMarkup(createElement(SeasonSelector, { set: formatSeasons, locale }));
    // Server render shows the first Season on the card; every intro is in the description.
    expect(html).toContain(`lang="en">${origin.intro}</p>`);
    for (const season of formatSeasons.items) expect(html).toContain(`<span lang="en">${season.intro}</span>`);
    const marked = describeSeasonParts(formatSeasons, locale).filter((part) => part.lang);
    expect(marked).toEqual(formatSeasons.items.map((season) => ({ text: season.intro, lang: "en" })));
  });
});

it.each(locales)("la descripción nombra cada Season, su forma, sus colores, su frase y el texto sobre el acento (%s)", locale => {
  const text = describeSeasons(formatSeasons, locale);
  expect(text).toContain(String(formatSeasons.items.length));
  expect(text).not.toContain("{");
  // One item per Season, split where each one starts ("ORIGIN, Season 001"), not inside an intro.
  const items = text.split(/(?=\b(?:ORIGIN|ASCENT|PULSE|JUNGLE), Season )/).slice(1);
  expect(items).toHaveLength(formatSeasons.items.length);
  formatSeasons.items.forEach((season, i) => {
    expect(items[i].startsWith(season.nombre)).toBe(true);
    expect(items[i]).toContain(seasonShapeName[season.forma][locale]);
    expect(items[i]).toContain(season.intro);
    for (const color of season.colores) expect(items[i]).toContain(color);
  });
  // Origin and Ascent read in paper, Pulse and Jungle in ink, in that order.
  const onAccent = { es: ["papel", "tinta"], en: ["paper", "ink"] }[locale];
  expect(items.map((item) => item.trim().split(" ").at(-1)?.replace(/\.$/, ""))).toEqual([onAccent[0], onAccent[0], onAccent[1], onAccent[1]]);
});
