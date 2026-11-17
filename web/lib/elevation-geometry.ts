import type { Elevation, ElevationModule } from "@/content/elevations";

/* Elevation drawing in the container's real pixels, ported from the client's site
   (src/components/productos/Alzado.jsx and src/components/primitives/cotaGeometry.js).
   The mm → px scale is computed for the space available, so strokes, ticks and labels never
   distort. Each module type is a pure function that returns strokes { d, g }; g is the group of the
   drawing sequence: outline → modules → details (+ hidden, dashed) → dimensions.
   Adaptations: TypeScript, an exhaustive switch that throws on an unknown type, and dimension labels
   in JetBrains Mono at 13 px (the portfolio's legibility floor) instead of 10.5 px sans. */

export type StrokeGroup = "contorno" | "modulos" | "detalles" | "oculto";
export type Stroke = { g: StrokeGroup; d: string };

/** Thickness of a row of dimensions (px). */
export const COTA_T = 24;
/** From the drawing to the first dimension row. */
const COTA_GAP = 12;
/** Between the partial row and the overall one. */
const ROW_GAP = 4;
/** Air between a label and each line segment. */
export const LABEL_PAD = 8;
/** Label size in px; JetBrains Mono advances 0.6 em per character, measured on the font. */
export const LABEL_SIZE = 13;
const CHAR_W = LABEL_SIZE * 0.6;
export const labelWidth = (text: string) => text.length * CHAR_W;

/** Half the diagonal of the 45° tick (9 px long). */
const TICK = 9 / 2 / Math.SQRT2;

const r = (v: number) => Math.round(v * 2) / 2;

export class UnknownModuleError extends Error {
  constructor(tipo: string) {
    super(`Tipo de módulo desconocido: «${tipo}»`);
    this.name = "UnknownModuleError";
  }
}

export function trace(elevation: Elevation, S: number, ox: number, oy: number): Stroke[] {
  const X = (mm: number) => r(ox + mm * S);
  const Y = (mm: number) => r(oy + mm * S);
  const out: Stroke[] = [];
  const push = (g: StrokeGroup, d: string) => out.push({ g, d });
  const rect = (x: number, y: number, w: number, h: number, inset = 0) =>
    `M ${X(x) + inset} ${Y(y) + inset} H ${X(x + w) - inset} V ${Y(y + h) - inset} H ${X(x) + inset} Z`;
  const line = (x1: number, y1: number, x2: number, y2: number) => `M ${X(x1)} ${Y(y1)} L ${X(x2)} ${Y(y2)}`;
  /** Gap between adjoining fronts (px): leaves read as separate pieces. */
  const INSET = 1.5;

  const draw = (m: ElevationModule) => {
    switch (m.tipo) {
      case "caja":
      case "mesada":
        return push("contorno", rect(m.x, m.y, m.ancho, m.alto));
      case "zocalo":
        return push("modulos", rect(m.x, m.y, m.ancho, m.alto, INSET));
      case "tabla":
        return push("modulos", rect(m.x, m.y, m.ancho, m.alto));
      case "division":
        return push("modulos", line(m.x, m.y, m.x + m.ancho, m.y));

      case "puertas-batientes": {
        const w = m.ancho / m.hojas;
        for (let i = 0; i < m.hojas; i++) {
          const x = m.x + i * w;
          push("modulos", rect(x, m.y, w, m.alto, INSET));
          // Leaves open towards the middle of the module: the handle goes on the meeting side.
          const handleRight = m.hojas === 1 || i < m.hojas / 2;
          const edge = handleRight ? x + w - 45 : x + 45;
          if (m.tirador === "horizontal") {
            const length = Math.min(160, w * 0.3);
            const cx = x + w / 2;
            push("detalles", line(cx - length / 2, m.y + m.alto - 60, cx + length / 2, m.y + m.alto - 60));
          } else {
            const length = Math.min(160, m.alto * 0.22);
            let y0 = m.y + 60; // base cabinet: at the top
            if (m.abre === "abajo") y0 = m.y + m.alto - 60 - length; // wall cabinet: at the bottom
            else if (m.alto > 1200) y0 = m.y + m.alto * 0.45 - length / 2; // wardrobe: at hand height
            push("detalles", line(edge, y0, edge, y0 + length));
          }
          // Opening symbol (elevation convention): the apex is on the hinge side.
          const hinge = handleRight ? x : x + w;
          const free = handleRight ? x + w : x;
          push("oculto", `M ${X(free)} ${Y(m.y)} L ${X(hinge)} ${Y(m.y + m.alto / 2)} L ${X(free)} ${Y(m.y + m.alto)}`);
        }
        return;
      }

      case "puertas-corredizas": {
        const s = m.solape;
        const w = (m.ancho + s * (m.hojas - 1)) / m.hojas;
        for (let i = 0; i < m.hojas; i++) {
          const x = m.x + i * (w - s);
          const front = i % 2 === 0;
          if (front) {
            push("modulos", rect(x, m.y, w, m.alto, INSET));
          } else {
            // The back leaf: its edges are covered by the front ones, so dashed.
            const a = i > 0 ? x + s : x;
            const b = i < m.hojas - 1 ? x + w - s : x + w;
            push("modulos", line(a, m.y + 4, b, m.y + 4));
            push("modulos", line(a, m.y + m.alto - 4, b, m.y + m.alto - 4));
            if (i > 0) push("oculto", line(x, m.y + 4, x, m.y + m.alto - 4));
            if (i < m.hojas - 1) push("oculto", line(x + w, m.y + 4, x + w, m.y + m.alto - 4));
          }
          // Recessed handle: a long slot on the visible side.
          const tx = front ? (i === 0 ? x + w - s - 50 : x + s + 50) : x + w / 2;
          const length = m.alto * 0.32;
          push("detalles", line(tx, m.y + m.alto * 0.4, tx, m.y + m.alto * 0.4 + length));
        }
        // Sliding direction over the middle leaf.
        const cx = m.x + m.ancho / 2;
        const cy = m.y + m.alto * 0.2;
        const a = Math.min(220, w * 0.3);
        const p = 40;
        push("detalles",
          `M ${X(cx - a)} ${Y(cy)} L ${X(cx + a)} ${Y(cy)} M ${X(cx - a + p)} ${Y(cy - p * 0.7)} L ${X(cx - a)} ${Y(cy)} L ${X(cx - a + p)} ${Y(cy + p * 0.7)} M ${X(cx + a - p)} ${Y(cy - p * 0.7)} L ${X(cx + a)} ${Y(cy)} L ${X(cx + a - p)} ${Y(cy + p * 0.7)}`);
        return;
      }

      case "cajones": {
        const h = m.alto / m.n;
        for (let i = 0; i < m.n; i++) {
          const y = m.y + i * h;
          push("modulos", rect(m.x, y, m.ancho, h, INSET));
          const length = Math.min(200, m.ancho * 0.35);
          const cx = m.x + m.ancho / 2;
          push("detalles", line(cx - length / 2, y + Math.min(80, h * 0.3), cx + length / 2, y + Math.min(80, h * 0.3)));
        }
        return;
      }

      case "estantes":
        for (let k = 1; k <= m.n; k++) {
          const y = m.y + (m.alto * k) / (m.n + 1);
          push("oculto", line(m.x + 18, y, m.x + m.ancho - 18, y));
        }
        return;

      case "bacha": {
        // Under the worktop: not visible, so dashed.
        const { x, y, ancho: w, alto: h } = m;
        push("oculto",
          `M ${X(x)} ${Y(y)} L ${X(x)} ${Y(y + h * 0.5)} Q ${X(x)} ${Y(y + h)} ${X(x + w / 2)} ${Y(y + h)} Q ${X(x + w)} ${Y(y + h)} ${X(x + w)} ${Y(y + h * 0.5)} L ${X(x + w)} ${Y(y)}`);
        if (m.grifo) {
          const cx = x + w / 2;
          const top = y - 40; // top face of the worktop
          push("detalles",
            `M ${X(cx - 30)} ${Y(top)} L ${X(cx - 30)} ${Y(top - 230)} Q ${X(cx - 30)} ${Y(top - 300)} ${X(cx + 40)} ${Y(top - 300)} L ${X(cx + 150)} ${Y(top - 300)} L ${X(cx + 150)} ${Y(top - 250)}`);
        }
        return;
      }

      default: {
        const unknown: never = m;
        throw new UnknownModuleError(String((unknown as { tipo?: unknown }).tipo));
      }
    }
  };

  elevation.modulos.forEach(draw);
  return out;
}

/* ---------- dimension lines ---------- */

export type Cota = { segments: string[]; marks: string[]; label: { x: number; y: number } };

/** A dimension line built along abstract axes (a along it, c across it) and mapped to the screen as
    origin + a·u + c·v. Segments start at the edge of the label gap, so they draw outwards from it. */
export function placeCota({ x, y, u, v, length, label }: {
  x: number; y: number; u: readonly [number, number]; v: readonly [number, number]; length: number; label: string | null;
}): Cota {
  const thickness = COTA_T;
  const mid = thickness / 2;
  const gap = label ? Math.min(labelWidth(label) + LABEL_PAD * 2, length) : 0;
  const center = length / 2;
  const map = (a: number, c: number) => `${r(x + a * u[0] + c * v[0])} ${r(y + a * u[1] + c * v[1])}`;
  const seg = (a0: number, c0: number, a1: number, c1: number) => `M ${map(a0, c0)} L ${map(a1, c1)}`;
  return {
    segments: [seg(center - gap / 2, mid, 0, mid), seg(center + gap / 2, mid, length, mid)],
    marks: [
      seg(0.5, 2, 0.5, thickness - 2),
      seg(length - 0.5, 2, length - 0.5, thickness - 2),
      ...[0, length].map((a) => seg(a - TICK, mid - TICK, a + TICK, mid + TICK)),
    ],
    label: { x: x + center * u[0] + mid * v[0], y: y + center * u[1] + mid * v[1] },
  };
}

export type ElevationLayout = {
  strokes: Stroke[];
  partials: (Cota & { text: string | null })[];
  width: Cota & { text: string };
  height: Cota & { text: string };
  /** Extension lines from the drawing to the dimension rows. */
  ext: string[];
  /** mm → px scale used. */
  scale: number;
};

/** Lays an elevation out in a w × h px box: uniform scale, centred, with room for the dimensions.
    Returns null when the box is too small to draw anything. */
export function layoutElevation(elevation: Elevation, w: number, h: number, formatMm: (mm: number) => string, withPartials = true): ElevationLayout | null {
  const partialsOn = withPartials && (elevation.parciales?.length ?? 0) > 1;
  const padB = COTA_GAP + COTA_T + (partialsOn ? COTA_T + ROW_GAP : 0);
  const padR = COTA_GAP + COTA_T;
  const S = Math.min((w - padR - 2) / elevation.ancho, (h - padB - 2) / elevation.alto);
  if (!(S > 0)) return null;
  const W = elevation.ancho * S;
  const H = elevation.alto * S;
  const ox = r((w - (W + padR)) / 2);
  const oy = r((h - (H + padB)) / 2);

  const strokes = trace(elevation, S, ox, oy);
  const partials: ElevationLayout["partials"] = [];
  const ext: string[] = [];
  const bottom = oy + H;
  const right = ox + W;
  let rowY = bottom + COTA_GAP;
  const horizontal = { u: [1, 0], v: [0, 1] } as const;

  if (partialsOn && elevation.parciales) {
    let acc = 0;
    for (const p of elevation.parciales) {
      const text = formatMm(p);
      const length = p * S;
      // A partial whose number does not fit keeps its line and loses the label, as on the client's site.
      const fits = labelWidth(text) + LABEL_PAD * 2 <= length;
      partials.push({ ...placeCota({ x: ox + acc * S, y: rowY, length, label: fits ? text : null, ...horizontal }), text: fits ? text : null });
      acc += p;
    }
    elevation.parciales.slice(0, -1).reduce((a, p) => {
      const x = r(ox + (a + p) * S);
      ext.push(`M ${x} ${r(bottom + 3)} L ${x} ${r(rowY + COTA_T / 2)}`);
      return a + p;
    }, 0);
    rowY += COTA_T + ROW_GAP;
  }

  const widthText = formatMm(elevation.ancho) + " mm";
  const heightText = formatMm(elevation.alto) + " mm";
  const width = { ...placeCota({ x: ox, y: rowY, length: W, label: widthText, ...horizontal }), text: widthText };
  const height = { ...placeCota({ x: right + COTA_GAP, y: oy, length: H, label: heightText, u: [0, 1], v: [1, 0] }), text: heightText };
  ext.push(`M ${r(ox)} ${r(bottom + 3)} L ${r(ox)} ${r(rowY + COTA_T / 2)}`);
  ext.push(`M ${r(right)} ${r(bottom + 3)} L ${r(right)} ${r(rowY + COTA_T / 2)}`);
  ext.push(`M ${r(right + 3)} ${r(oy)} L ${r(right + COTA_GAP + COTA_T / 2)} ${r(oy)}`);
  ext.push(`M ${r(right + 3)} ${r(bottom)} L ${r(right + COTA_GAP + COTA_T / 2)} ${r(bottom)}`);

  return { strokes, partials, width, height, ext, scale: S };
}
