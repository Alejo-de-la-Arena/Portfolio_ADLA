import type { Season } from "@/content/seasons";

/* Season colour logic, ported from the client's site: lib/color-contrast.ts, lib/season-colors.ts and
   lib/theme.ts. Same constants, same rules; only the module boundaries changed. */

/** Paper grey and ink of FORMAT's system (--color-paper / --color-ink). */
export const PAPER = "#C8D0D2";
export const INK = "#111111";

/** Minimum contrast for lines and graphic elements (WCAG 1.4.11). */
export const MIN_GRAPHIC_CONTRAST = 3;

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
    colour (role 4) when it reads on paper, else the main one: the readableOn rule. */
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
    "--line": readableOn(PAPER, c4, c1),
  };
}

/** A season's hex values must be #RRGGBB, between 1 and 5 of them. */
export function validateSeason(season: Season): string[] {
  const errors: string[] = [];
  if (season.colores.length < 1 || season.colores.length > 5) errors.push(`${season.slug}: entre 1 y 5 colores`);
  for (const color of season.colores) if (!/^#[0-9A-F]{6}$/i.test(color)) errors.push(`${season.slug}: color no válido ${color}`);
  if (season.fechas[0] !== season.fechaInicio || season.fechas.at(-1) !== season.fechaFin) errors.push(`${season.slug}: fechas fuera del rango`);
  return errors;
}
