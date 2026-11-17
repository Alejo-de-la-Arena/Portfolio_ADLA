import { describe, expect, it } from "vitest";
import { formatSeasons, seasonShapeName, type Season } from "@/content/seasons";
import { describeSeasons } from "@/content/describe-visuals";
import { contrastRatio, getSeasonColors, INK, PAPER, readableOn, readableTextOn, seasonAccentVars, validateSeason } from "@/lib/season-theme";
import { locales } from "@/content/types";

const [pulse, jungle] = formatSeasons.items;

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

  it("tiene nombre de forma en ES y EN", () => {
    for (const locale of locales) expect(seasonShapeName[season.forma][locale].trim()).not.toBe("");
  });
});

describe("lógica de contraste del sitio de FORMAT", () => {
  // The cases the client's code documents in its comments.
  it("sobre el verde de Jungle o el rojo de Pulse gana la tinta; sobre el azul de Origin, el papel", () => {
    expect(readableTextOn(jungle.colores[0])).toBe(INK);
    expect(readableTextOn(pulse.colores[0])).toBe(INK);
    expect(readableTextOn("#1E38F5")).toBe(PAPER);
  });

  it("el verde ácido de Jungle no contrasta sobre papel y cae al principal", () => {
    expect(contrastRatio("#3DFF5C", PAPER)).toBeLessThan(1.3);
    expect(readableOn(PAPER, "#3DFF5C", jungle.colores[0])).toBe(jungle.colores[0]);
  });

  it("completa los colores faltantes con el principal", () => {
    expect(getSeasonColors({ ...pulse, colores: ["#E5233B", "#8B0F1D"] })).toEqual(["#E5233B", "#8B0F1D", "#E5233B", "#E5233B", "#E5233B"]);
  });

  it("detecta colores mal escritos", () => {
    expect(validateSeason({ ...pulse, colores: ["E5233B"] })).not.toEqual([]);
  });
});

it.each(locales)("la descripción nombra cada Season, su forma y todos sus colores (%s)", locale => {
  const text = describeSeasons(formatSeasons, locale);
  for (const season of formatSeasons.items) {
    expect(text).toContain(season.nombre);
    expect(text).toContain(seasonShapeName[season.forma][locale]);
    for (const color of season.colores) expect(text).toContain(color);
  }
});
