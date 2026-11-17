import type { ISODate, Text } from "./types";

/* FORMAT Seasons, copied from the client's repository: supabase/seeds/0019_pulse.sql and
   supabase/seeds/0021_jungle.sql (slug, numero, nombre, forma, colores, fecha_inicio, fecha_fin,
   the Friday dates and intro_text). Only Seasons with their real colours in the repo are here: Origin
   and Ascent appear there without a confirmed palette, so they are left out rather than guessed. */

/** The shapes of these Seasons. The client's Forma union has more; only what is drawn here is ported. */
export type SeasonShape = "double-circle" | "double-diamond";

export type Season = {
  slug: string;
  /** Edition number, as stored. */
  numero: string;
  nombre: string;
  forma: SeasonShape;
  /** Up to 5 hex, in role order: 1 main, 2 secondary, 3 glows, 4 detail lines, 5 highlight. */
  colores: readonly string[];
  fechaInicio: ISODate;
  fechaFin: ISODate;
  /** Every Friday of the Season; the first one is the opening (Experience). */
  fechas: readonly ISODate[];
  /** The Season's welcome line, brand copy in English on the client's site in both languages. */
  intro: string;
};

export type SeasonSet = { title: Text; items: readonly Season[] };

export const seasonShapeName: Record<SeasonShape, Text> = {
  "double-circle": { es: "doble círculo", en: "double circle" },
  // As the Jungle seed describes it: «Rombo con doble línea».
  "double-diamond": { es: "rombo con doble línea", en: "double-line diamond" },
};

export const formatSeasons: SeasonSet = {
  title: { es: "Seasons de FORMAT", en: "FORMAT Seasons" },
  items: [
    {
      slug: "pulse",
      numero: "003",
      nombre: "PULSE",
      forma: "double-circle",
      colores: ["#E5233B", "#8B0F1D", "#FF6B6B", "#FFD1D1", "#FFFFFF"],
      fechaInicio: "2026-10-09",
      fechaFin: "2026-10-30",
      fechas: ["2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30"],
      intro: "FEEL THE CONNECTION",
    },
    {
      slug: "jungle",
      numero: "004",
      nombre: "JUNGLE",
      forma: "double-diamond",
      colores: ["#0F8A34", "#0A3D1F", "#3DFF5C", "#C6F7A8", "#FFFFFF"],
      fechaInicio: "2026-11-06",
      fechaFin: "2026-11-27",
      fechas: ["2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27"],
      intro: "LET IT GROW.",
    },
  ],
};
