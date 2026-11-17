/* Filled Season shapes, ported from the client's site: SHAPE_PATHS, POLY_VERTICES, JITTER_AMOUNT,
   jitterPoints and straightPath in components/shapePaths.ts, hashSeed and mulberry32 in lib/rng.ts.
   Only the shapes drawn here (Origin's square, Ascent's triangle) are ported. viewBox 0 0 72 72. */

export type FilledShape = "square" | "triangle";

type Point = { x: number; y: number };

/** Ideal vertices of each shape, before jitter. The triangle has its vertex up. */
const VERTICES: Record<FilledShape, readonly Point[]> = {
  square: [{ x: 10, y: 10 }, { x: 62, y: 10 }, { x: 62, y: 62 }, { x: 10, y: 62 }],
  triangle: [{ x: 36, y: 8 }, { x: 64, y: 62 }, { x: 8, y: 62 }],
};

/** Maximum jitter per shape, in viewBox units: small on purpose, a recognisable silhouette. */
const JITTER: Record<FilledShape, number> = { square: 2.4, triangle: 2 };

/** FNV-1a: string → stable uint32. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small deterministic generator; same seed, same sequence on server and client. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The shape's path with the client's slight, deterministic hand-made jitter. Without a seed, the fixed
    jitter of the shape (the client's default, seed = shape). */
export function filledShapePath(forma: FilledShape, seed: string = forma): string {
  const rng = mulberry32(hashSeed(`${forma}:${seed}`));
  const amount = JITTER[forma];
  const [first, ...rest] = VERTICES[forma].map((p) => ({
    x: p.x + (rng() * 2 - 1) * amount,
    y: p.y + (rng() * 2 - 1) * amount,
  }));
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ` + rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
}
