import type { ISODate, Text } from "./types";

/* FORMAT Seasons, in edition order. Number, shape, slug and intro_text come from the client's repository:
   lib/season-sequence.ts and README (Origin square 001, Ascent triangle 002), supabase/migrations/0017
   (Ascent's intro), supabase/seeds/0019_pulse.sql and 0021_jungle.sql. Origin's and Ascent's dates and
   Origin's intro were created from the admin panel and confirmed by the client from there.
   Colours: only the main colour of each Season, confirmed by the client from the admin panel; it wins
   over any palette in the repository. The other roles repeat it, as getSeasonColors does. */

/** The shapes of these Seasons. The client's Forma union has more; only what is drawn here is ported. */
export type SeasonShape = "square" | "triangle" | "double-circle" | "double-diamond";

export type Season = {
  slug: string;
  /** Edition number, as stored. */
  numero: string;
  nombre: string;
  forma: SeasonShape;
  /** Up to 5 hex, in role order: 1 main, 2 secondary, 3 glows, 4 detail lines, 5 highlight. Missing
      roles repeat the main one. */
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
  square: { es: "cuadrado", en: "square" },
  // Vertex up, as the client's README specifies for Ascent.
  triangle: { es: "triángulo", en: "triangle" },
  "double-circle": { es: "doble círculo", en: "double circle" },
  // As the Jungle seed describes it: «Rombo con doble línea».
  "double-diamond": { es: "rombo con doble línea", en: "double-line diamond" },
};

export const formatSeasons: SeasonSet = {
  title: { es: "Seasons de FORMAT", en: "FORMAT Seasons" },
  items: [
    {
      slug: "origin",
      numero: "001",
      nombre: "ORIGIN",
      forma: "square",
      colores: ["#051FE6"],
      fechaInicio: "2026-08-07",
      fechaFin: "2026-09-04",
      fechas: ["2026-08-07", "2026-08-14", "2026-08-21", "2026-08-28", "2026-09-04"],
      intro: "FIND THE ORIGIN",
    },
    {
      slug: "ascent",
      numero: "002",
      nombre: "ASCENT",
      forma: "triangle",
      colores: ["#7B3FE4"],
      fechaInicio: "2026-09-11",
      fechaFin: "2026-10-02",
      fechas: ["2026-09-11", "2026-09-18", "2026-09-25", "2026-10-02"],
      intro: "THE ENERGY RISES.",
    },
    {
      slug: "pulse",
      numero: "003",
      nombre: "PULSE",
      forma: "double-circle",
      colores: ["#E5233B"],
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
      colores: ["#0F8A34"],
      fechaInicio: "2026-11-06",
      fechaFin: "2026-11-27",
      fechas: ["2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27"],
      intro: "LET IT GROW.",
    },
  ],
};
