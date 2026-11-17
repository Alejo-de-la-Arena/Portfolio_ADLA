import type { ReactNode } from "react";
import type { SeasonShape } from "@/content/seasons";
import { PAPER, SHAPE_OUTLINE } from "@/lib/season-theme";
import { filledShapePath } from "@/lib/season-shape-path";

/* The Season's shape as a sticker, ported from the client's site: components/ShapeSticker.tsx,
   DoubleCircle.tsx, DoubleDiamond.tsx, JunglePlants.tsx and shapePaths.ts. Like the original, square
   and triangle are solid stickers with the logo on the fill (here ink on a paper chip, for 4.5:1);
   double-line shapes are an outline with the logo on an ink band.
   Drawn in currentColor, so the card's --accent-1 colours it, with a fine ink contour (SHAPE_OUTLINE)
   around every accent mark so the shape reaches 3:1 on paper in every Season. */

const isDoubleLine = (forma: SeasonShape): forma is "double-circle" | "double-diamond" =>
  forma === "double-circle" || forma === "double-diamond";

/** Diamond (square on its point) with rounded, neon-like corners. h = half diagonal, cut = how much
    each corner is trimmed along the sides. */
export function roundedDiamondPath(cx: number, cy: number, h: number, cut: number): string {
  const v = [[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]];
  const t = cut / Math.hypot(h, h);
  const lerp = (a: number[], b: number[]) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const f = (p: number[]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  let d = `M${f(lerp(v[0], v[1]))}`;
  for (let i = 1; i <= 4; i++) {
    const curr = v[i % 4];
    d += ` L${f(lerp(curr, v[i - 1]))} Q${f(curr)} ${f(lerp(curr, v[(i + 1) % 4]))}`;
  }
  return `${d} Z`;
}

/** Inner line of Jungle's diamond at 0.88 of the outer one. */
const DOUBLE_DIAMOND_INNER = 0.88;
const OUTER = 46;
const DIAMOND_PATHS = [OUTER, OUTER * DOUBLE_DIAMOND_INNER].map((h) => roundedDiamondPath(50, 50, h, h * 0.12));

/** Botanical cutouts in the same ink as the Season's outline. Root at (0, 0), growing upwards. */
function PlantSprig({ variant, scale }: { variant: number; scale: number }) {
  const fern = variant % 3 === 1;
  const tropical = variant % 3 === 2;
  return <g fill="currentColor" {...filledEdge(scale)}>
    <path d="M-.7 1 C-3-14 5-29 1-43 L2-43 C7-28-1-13 .7 1Z" />
    {(fern ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3]).map((i) => {
      const y = -8 - i * (fern ? 5 : 8);
      const x = i < 2 ? 0 : 2;
      const length = fern ? 13 - i : tropical ? 18 - i * 2 : 13 - i;
      return <g key={i} transform={`translate(${x} ${y})`}>
        <path d={`M0 0 Q${-length} 0 ${-length} -9 Q-3 -12 0 0Z`} />
        <path d={`M0 -2 Q${length + 2} -3 ${length} -13 Q2 -12 0 -2Z`} />
        {tropical && <path d={`M-3 -3 L${-length + 2} -7 M3 -5 L${length - 2} -10`} stroke={PAPER} strokeWidth=".8" />}
      </g>;
    })}
    <path d="M2-36 Q-5-44 1-51 Q9-44 2-36Z" />
  </g>;
}

/** Width of the double lines, and of the ink contour on each side of anything drawn in the accent
    (about 2 px at the card's sizes). The contour is what reaches 3:1 on paper for PULSE and JUNGLE. */
const LINE = 3;
const EDGE = 0.7;

/** Ink edge for solid accent shapes: a stroke painted under the fill, so EDGE shows outside it. Its
    width is in the shape's own units; scale undoes the transform the shape is drawn under. */
const filledEdge = (scale = 1) =>
  ({ stroke: SHAPE_OUTLINE, strokeWidth: (2 * EDGE) / scale, strokeLinejoin: "round", paintOrder: "stroke" }) as const;

/** An accent line with an ink contour: the same geometry in ink, 2 × EDGE wider, underneath. */
function CasedLines({ children }: { children: ReactNode }) {
  return <>
    <g data-contour="" stroke={SHAPE_OUTLINE} strokeWidth={LINE + 2 * EDGE}>{children}</g>
    <g stroke="currentColor" strokeWidth={LINE}>{children}</g>
  </>;
}

function Outline({ forma }: { forma: SeasonShape }) {
  if (!isDoubleLine(forma)) {
    // viewBox 72 drawn at the size of the 100 ones: its units are 100/72 larger.
    return <svg viewBox="0 0 72 72" aria-hidden="true">
      <path d={filledShapePath(forma)} fill="currentColor" {...filledEdge(100 / 72)} />
    </svg>;
  }
  if (forma === "double-circle") {
    return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <CasedLines>
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="42" />
      </CasedLines>
    </svg>;
  }
  return <svg viewBox="0 0 100 100" fill="none" strokeLinejoin="round" aria-hidden="true">
    <CasedLines>{DIAMOND_PATHS.map((d) => <path key={d} d={d} />)}</CasedLines>
    <g transform="translate(73 29) rotate(38) scale(.48)"><PlantSprig variant={2} scale={0.48} /></g>
    <g transform="translate(24 73) rotate(-126) scale(.4)"><PlantSprig variant={1} scale={0.4} /></g>
  </svg>;
}

/** Sticker with the logo inside, upright while the shape rotates: on a paper chip over the fill for
    solid shapes, paper text on an ink band for double-line ones. */
export function SeasonSticker({ forma, rotate, className, logoClassName }: {
  forma: SeasonShape; rotate: number; className?: string; logoClassName?: string;
}) {
  return <div className={className} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden="true">
    <Outline forma={forma} />
    <span className={logoClassName} data-on={isDoubleLine(forma) ? "band" : "fill"}
      style={{ transform: `rotate(${-rotate}deg)` }}><span>Format</span></span>
  </div>;
}
