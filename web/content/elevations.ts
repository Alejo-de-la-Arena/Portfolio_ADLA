import type { Text } from "./types";

/* Front elevations of Don Teófilo's catalog, ported from the client's site (src/data/alzados.js).
   Same data, same units: real millimeters, origin at the top left, y grows downwards like SVG.
   Nothing is drawn by hand: lib/elevation-geometry.ts computes the scale for the space available.

   Changes from the original, from the review of that code:
   - Module types are a closed union. An unknown type used to be skipped silently (tipos[m.tipo]?.(m));
     here it throws while tracing, and validateElevation reports it, so a test fails.
   - The data is validated: modules inside the piece, partial widths adding up to the total,
     positive leaf and drawer counts. */

type Box = { x: number; y: number; ancho: number; alto: number };

export type ElevationModule =
  /** Outline of a carcass. */
  | ({ tipo: "caja" } & Box)
  /** Filled strips. */
  | ({ tipo: "mesada" } & Box)
  | ({ tipo: "zocalo" } & Box)
  /** Desk top or floating shelf. */
  | ({ tipo: "tabla" } & Box)
  /** Horizontal line at y (top box, separations). */
  | { tipo: "division"; x: number; y: number; ancho: number }
  | ({ tipo: "puertas-batientes"; hojas: number; tirador: "vertical" | "horizontal"; abre?: "abajo" } & Box)
  /** solape: overlap between leaves, dashed because it sits behind. */
  | ({ tipo: "puertas-corredizas"; hojas: number; solape: number } & Box)
  | ({ tipo: "cajones"; n: number } & Box)
  /** Hidden behind the doors, so dashed. */
  | ({ tipo: "estantes"; n: number } & Box)
  /** Under the worktop, so dashed. grifo draws the tap above. */
  | ({ tipo: "bacha"; grifo?: boolean } & Box);

export type ModuleType = ElevationModule["tipo"];

/** Every type the tracer knows. validateElevation checks data against it at runtime. */
export const moduleTypes = ["caja", "mesada", "zocalo", "tabla", "division", "puertas-batientes",
  "puertas-corredizas", "cajones", "estantes", "bacha"] as const satisfies readonly ModuleType[];

export type Elevation = {
  id: string;
  /** What the drawing shows, for the title block. Generic, never a real product. */
  name: Text;
  /** Overall sizes: the width dimension (bottom) and the height dimension (right). */
  ancho: number;
  alto: number;
  /** Width of each module along the front; they add up to ancho. */
  parciales?: readonly number[];
  modulos: readonly ElevationModule[];
};

export type ElevationSet = { title: Text; items: readonly Elevation[] };

const t = (es: string, en: string): Text => ({ es, en });

// Copied from alzados.js (Cocinas, Placards, Diseño integral) without changing a single measure.
export const donTeofiloElevations: ElevationSet = {
  title: t("Alzados del catálogo de Don Teófilo", "Front elevations from Don Teófilo’s catalog"),
  items: [
    {
      id: "cocina",
      name: t("Cocina con alacena y bajo mesada", "Kitchen with wall and base cabinets"),
      ancho: 3200,
      alto: 2200,
      parciales: [600, 800, 600, 1200],
      modulos: [
        // Wall cabinet
        { tipo: "caja", x: 0, y: 0, ancho: 3200, alto: 700 },
        { tipo: "puertas-batientes", x: 0, y: 0, ancho: 800, alto: 700, hojas: 2, tirador: "vertical", abre: "abajo" },
        { tipo: "puertas-batientes", x: 800, y: 0, ancho: 600, alto: 700, hojas: 1, tirador: "vertical", abre: "abajo" },
        { tipo: "puertas-batientes", x: 1400, y: 0, ancho: 1000, alto: 700, hojas: 2, tirador: "vertical", abre: "abajo" },
        { tipo: "puertas-batientes", x: 2400, y: 0, ancho: 800, alto: 700, hojas: 2, tirador: "vertical", abre: "abajo" },
        // Base cabinet: worktop 900 above the floor
        { tipo: "mesada", x: 0, y: 1300, ancho: 3200, alto: 40 },
        { tipo: "caja", x: 0, y: 1340, ancho: 3200, alto: 760 },
        { tipo: "cajones", x: 0, y: 1340, ancho: 600, alto: 760, n: 3 },
        { tipo: "puertas-batientes", x: 600, y: 1340, ancho: 800, alto: 760, hojas: 2, tirador: "vertical" },
        { tipo: "bacha", x: 750, y: 1340, ancho: 500, alto: 200, grifo: true },
        { tipo: "puertas-batientes", x: 1400, y: 1340, ancho: 600, alto: 760, hojas: 1, tirador: "vertical" },
        { tipo: "puertas-batientes", x: 2000, y: 1340, ancho: 1200, alto: 760, hojas: 2, tirador: "vertical" },
        { tipo: "zocalo", x: 0, y: 2100, ancho: 3200, alto: 100 },
      ],
    },
    {
      id: "placard",
      name: t("Placard corredizo de 3 puertas", "Three-door sliding wardrobe"),
      ancho: 2400,
      alto: 2600,
      parciales: [800, 800, 800],
      modulos: [
        { tipo: "caja", x: 0, y: 0, ancho: 2400, alto: 2600 },
        { tipo: "puertas-batientes", x: 0, y: 0, ancho: 2400, alto: 500, hojas: 3, tirador: "horizontal" },
        { tipo: "division", x: 0, y: 500, ancho: 2400 },
        { tipo: "puertas-corredizas", x: 0, y: 500, ancho: 2400, alto: 2000, hojas: 3, solape: 40 },
        { tipo: "zocalo", x: 0, y: 2500, ancho: 2400, alto: 100 },
      ],
    },
    {
      id: "integral",
      name: t("Placard y escritorio integrados", "Built-in wardrobe and desk"),
      ancho: 3600,
      alto: 2600,
      parciales: [1800, 1800],
      modulos: [
        // Two-door wardrobe
        { tipo: "caja", x: 0, y: 0, ancho: 1800, alto: 2600 },
        { tipo: "estantes", x: 0, y: 0, ancho: 1800, alto: 2500, n: 4 },
        { tipo: "puertas-batientes", x: 0, y: 0, ancho: 1800, alto: 2500, hojas: 2, tirador: "vertical" },
        { tipo: "zocalo", x: 0, y: 2500, ancho: 1800, alto: 100 },
        // Desk 750 above the floor, with a drawer unit and a floating shelf
        { tipo: "tabla", x: 1800, y: 1100, ancho: 1500, alto: 30 },
        { tipo: "tabla", x: 1800, y: 1820, ancho: 1800, alto: 30 },
        { tipo: "caja", x: 3150, y: 1850, ancho: 450, alto: 750 },
        { tipo: "cajones", x: 3150, y: 1850, ancho: 450, alto: 750, n: 3 },
      ],
    },
  ],
};

const isCount = (value: unknown) => Number.isInteger(value) && (value as number) > 0;

/** Every problem in one elevation, as readable messages. An empty list means the data can be drawn. */
export function validateElevation(elevation: Elevation): string[] {
  const errors: string[] = [];
  const where = (index: number) => `${elevation.id} › módulo ${index}`;
  if (!isCount(elevation.ancho) || !isCount(elevation.alto)) errors.push(`${elevation.id}: ancho y alto deben ser milímetros enteros positivos`);
  if (elevation.parciales) {
    if (elevation.parciales.some((p) => !isCount(p))) errors.push(`${elevation.id}: parciales deben ser positivos`);
    const sum = elevation.parciales.reduce((a, b) => a + b, 0);
    if (sum !== elevation.ancho) errors.push(`${elevation.id}: parciales suman ${sum}, no ${elevation.ancho}`);
  }
  if (elevation.modulos.length === 0) errors.push(`${elevation.id}: sin módulos`);
  elevation.modulos.forEach((mod, index) => {
    if (!(moduleTypes as readonly string[]).includes(mod.tipo)) {
      errors.push(`${where(index)}: tipo desconocido «${String(mod.tipo)}»`);
      return;
    }
    const alto = "alto" in mod ? mod.alto : 0;
    const numbers = [mod.x, mod.y, mod.ancho, alto];
    if (numbers.some((n) => !Number.isFinite(n) || n < 0) || mod.ancho <= 0 || ("alto" in mod && alto <= 0)) {
      errors.push(`${where(index)} (${mod.tipo}): medidas no válidas`);
    }
    if (mod.x + mod.ancho > elevation.ancho || mod.y + alto > elevation.alto) {
      errors.push(`${where(index)} (${mod.tipo}): sale del contorno de ${elevation.ancho} × ${elevation.alto}`);
    }
    if ((mod.tipo === "puertas-batientes" || mod.tipo === "puertas-corredizas") && !isCount(mod.hojas)) {
      errors.push(`${where(index)}: hojas debe ser un entero positivo`);
    }
    if ((mod.tipo === "cajones" || mod.tipo === "estantes") && !isCount(mod.n)) {
      errors.push(`${where(index)}: n debe ser un entero positivo`);
    }
    if (mod.tipo === "puertas-corredizas" && (mod.solape < 0 || mod.solape * 2 >= mod.ancho / mod.hojas)) {
      errors.push(`${where(index)}: el solape no entra en las hojas`);
    }
  });
  return errors;
}
