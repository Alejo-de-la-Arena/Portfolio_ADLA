import type { Season } from "@/content/seasons";
import { dateValue } from "@/lib/dates";

/* Season colour logic, ported from the client's site: lib/color-contrast.ts, lib/season-colors.ts and
   lib/theme.ts. Same constants, same rules; only the module boundaries changed, plus the ink fallback
   of lineOn and the shape contour, which are ours. */

/** Paper grey and ink of FORMAT's system (--color-paper / --color-ink). */
export const PAPER = "#C8D0D2";
export const INK = "#111111";

/** Minimum contrast for lines and graphic elements (WCAG 1.4.11). */
export const MIN_GRAPHIC_CONTRAST = 3;

/** Minimum contrast for small text (WCAG 1.4.3). */
export const MIN_SMALL_TEXT_CONTRAST = 4.5;

/** Contour of every shape drawn in the accent. PULSE and JUNGLE reach only ~2.9:1 on paper, so the
    accent alone does not meet 1.4.11; a fine ink edge does (12:1) without touching the brand colours. */
export const SHAPE_OUTLINE = INK;

/** Small text (the Fridays badge, the logo on a solid shape) is always ink on paper: no Season's main
    colour reaches 4.5:1 with both, so only large text sits on the accent. */
export const SMALL_TEXT = { color: INK, background: PAPER } as const;

/** #RGB → #RRGGBB; alpha (#RRGGBBAA) is ignored. */
function expand(hex: string): string {
  return /^#[0-9a-f]{3}$/i.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
}

function luminance(hex: string): number {
  const full = expand(hex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Colour for text or lines on a background: the preferred one if it contrasts enough, otherwise the
    Season's main colour. */
export function readableOn(background: string, preferred: string, principal: string): string {
  return contrastRatio(preferred, background) >= MIN_GRAPHIC_CONTRAST ? preferred : principal;
}

/** Colour for a line that must reach 3:1 on the background: the readableOn rule, and ink when not even
    the main colour reaches it (PULSE and JUNGLE on paper). */
export function lineOn(background: string, preferred: string, principal: string): string {
  const color = readableOn(background, preferred, principal);
  return contrastRatio(color, background) >= MIN_GRAPHIC_CONTRAST ? color : INK;
}

/** TEXT colour on an accent background: paper or ink, whichever contrasts more. */
export function readableTextOn(background: string): typeof PAPER | typeof INK {
  return contrastRatio(INK, background) >= contrastRatio(PAPER, background) ? INK : PAPER;
}

/** The 5 colours in role order, missing ones filled with the main colour. */
export function getSeasonColors(season: Season): [string, string, string, string, string] {
  const principal = season.colores[0];
  return [0, 1, 2, 3, 4].map((i) => season.colores[i] ?? principal) as [string, string, string, string, string];
}

/** The Season as CSS custom properties, as the client's site sets them on <body>. --line is the detail
    colour (role 4) when it reads on paper, else the main one (readableOn), else ink (lineOn). */
export function seasonAccentVars(season: Season): Record<`--${string}`, string> {
  const [c1, c2, c3, c4, c5] = getSeasonColors(season);
  return {
    "--accent-1": c1,
    "--accent-2": c2,
    "--accent-3": c3,
    "--accent-4": c4,
    "--accent-5": c5,
    // Text on accent blocks: paper or ink by contrast.
    "--on-accent-1": readableTextOn(c1),
    "--on-accent-2": readableTextOn(c2),
    "--line": lineOn(PAPER, c4, c1),
    // Small text: ink on paper in every Season.
    "--small-text": SMALL_TEXT.color,
    "--small-bg": SMALL_TEXT.background,
  };
}

/** Hex values must be #RRGGBB, between 1 and 5 of them. Dates go through the ISODate calendar check
    (dateValue): each one real, inside the Season's range and after the previous one; the first and the
    last are the start and the end. */
export function validateSeason(season: Season): string[] {
  const errors: string[] = [];
  if (season.colores.length < 1 || season.colores.length > 5) errors.push(`${season.slug}: entre 1 y 5 colores`);
  for (const color of season.colores) if (!/^#[0-9A-F]{6}$/i.test(color)) errors.push(`${season.slug}: color no válido ${color}`);

  const start = dateValue(season.fechaInicio);
  const end = dateValue(season.fechaFin);
  if (!Number.isFinite(start)) errors.push(`${season.slug}: fecha de inicio no válida ${season.fechaInicio}`);
  if (!Number.isFinite(end)) errors.push(`${season.slug}: fecha de fin no válida ${season.fechaFin}`);
  if (start > end) errors.push(`${season.slug}: rango invertido`);
  if (season.fechas[0] !== season.fechaInicio || season.fechas.at(-1) !== season.fechaFin) {
    errors.push(`${season.slug}: la primera y la última fecha no son el inicio y el fin`);
  }
  let previous = -Infinity;
  for (const date of season.fechas) {
    const value = dateValue(date);
    if (!Number.isFinite(value)) { errors.push(`${season.slug}: fecha no válida ${date}`); continue; }
    if (value < start || value > end) errors.push(`${season.slug}: ${date} fuera del rango`);
    if (value <= previous) errors.push(`${season.slug}: ${date} fuera de orden`);
    previous = value;
  }
  return errors;
}
