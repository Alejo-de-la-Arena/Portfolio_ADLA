import { describe, expect, it } from "vitest";
import { donTeofiloElevations, moduleTypes, validateElevation, type Elevation, type ElevationModule } from "@/content/elevations";
import { describeElevation, describeElevations } from "@/content/describe-visuals";
import { formatCount } from "@/content/case-visuals";
import { LABEL_PAD, labelWidth, layoutElevation, trace, UnknownModuleError } from "@/lib/elevation-geometry";
import { locales } from "@/content/types";

const items = donTeofiloElevations.items;
const mm = (n: number) => formatCount(n, "es");
/** Every number pair in a path, as points. */
const points = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])] as const);

describe.each(items)("alzado $id", (elevation: Elevation) => {
  it("los datos son válidos", () => {
    expect(validateElevation(elevation)).toEqual([]);
  });

  it("usa solo tipos de módulo conocidos", () => {
    for (const item of elevation.modulos) expect(moduleTypes).toContain(item.tipo);
  });

  it.each([[352, 352], [576, 576], [300, 300], [560, 420]])("se dibuja dentro de una caja de %ipx × %ipx", (w, h) => {
    const geo = layoutElevation(elevation, w, h, mm)!;
    expect(geo).not.toBeNull();
    const all = [...geo.strokes.map(s => s.d), ...geo.ext, ...[...geo.partials, geo.width, geo.height].flatMap(c => [...c.segments, ...c.marks])];
    for (const d of all) for (const [x, y] of points(d)) {
      expect(x).toBeGreaterThanOrEqual(-6); expect(x).toBeLessThanOrEqual(w + 6);
      expect(y).toBeGreaterThanOrEqual(-6); expect(y).toBeLessThanOrEqual(h + 6);
    }
  });

  it("la escala es uniforme y la cota total entra con su número", () => {
    const geo = layoutElevation(elevation, 352, 352, mm)!;
    expect(geo.scale).toBeGreaterThan(0);
    // Overall lines measure exactly the piece at the computed scale; their labels fit with air.
    const length = (d: string) => { const [[x0, y0], [x1, y1]] = points(d); return Math.hypot(x1 - x0, y1 - y0); };
    const widthPx = geo.width.segments.reduce((sum, d) => sum + length(d), 0) + labelWidth(geo.width.text) + LABEL_PAD * 2;
    expect(Math.abs(widthPx - elevation.ancho * geo.scale)).toBeLessThan(2);
    expect(labelWidth(geo.height.text) + LABEL_PAD * 2).toBeLessThanOrEqual(elevation.alto * geo.scale);
  });

  it("dibuja aristas ocultas punteadas y todos los grupos de la secuencia", () => {
    const groups = new Set(trace(elevation, 0.1, 0, 0).map(s => s.g));
    expect(groups).toContain("contorno");
    expect(groups).toContain("modulos");
    expect(groups).toContain("detalles");
    expect(groups).toContain("oculto");
  });

  it.each(locales)("tiene nombre y descripción con sus medidas reales (%s)", locale => {
    expect(elevation.name[locale].trim()).not.toBe("");
    const text = describeElevation(elevation, locale);
    expect(text).toContain(elevation.name[locale]);
    expect(text).toContain(`${formatCount(elevation.ancho, locale)} mm`);
    expect(text).toContain(`${formatCount(elevation.alto, locale)} mm`);
    for (const p of elevation.parciales ?? []) expect(text).toContain(`${formatCount(p, locale)} mm`);
  });
});

describe("tipos desconocidos y datos inválidos", () => {
  const base = items[0];
  const forged = { ...base, modulos: [...base.modulos, { tipo: "repisa", x: 0, y: 0, ancho: 100, alto: 100 } as unknown as ElevationModule] };

  it("un tipo de módulo desconocido falla al trazar en vez de ignorarse", () => {
    expect(() => trace(forged, 0.1, 0, 0)).toThrow(UnknownModuleError);
    expect(() => trace(forged, 0.1, 0, 0)).toThrow("repisa");
  });

  it("la validación lo informa", () => {
    expect(validateElevation(forged).join(" ")).toContain("tipo desconocido «repisa»");
  });

  it("detecta parciales que no suman, módulos fuera del contorno y conteos no válidos", () => {
    const bad: Elevation = {
      ...base, parciales: [600, 600],
      modulos: [
        { tipo: "caja", x: 3000, y: 0, ancho: 400, alto: 700 },
        { tipo: "cajones", x: 0, y: 0, ancho: 600, alto: 700, n: 0 },
        { tipo: "puertas-batientes", x: 0, y: 0, ancho: 600, alto: 700, hojas: 1.5, tirador: "vertical" },
      ],
    };
    const errors = validateElevation(bad).join("\n");
    expect(errors).toContain("parciales suman 1200");
    expect(errors).toContain("sale del contorno");
    expect(errors).toContain("n debe ser");
    expect(errors).toContain("hojas debe ser");
  });
});

it.each(locales)("la descripción del conjunto nombra todos los alzados (%s)", locale => {
  const text = describeElevations(donTeofiloElevations, locale);
  expect(text.startsWith(donTeofiloElevations.title[locale])).toBe(true);
  for (const item of items) expect(text).toContain(item.name[locale]);
});

it("separa los miles como el texto del case study", () => {
  expect(describeElevation(items[0], "es")).toContain("3.200 mm");
  expect(describeElevation(items[0], "en")).toContain("3,200 mm");
});
