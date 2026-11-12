import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/case-studies";
import { caseVisuals, formatCount } from "@/content/case-visuals";
import { profile } from "@/content/profile";
import { spreadMarkers } from "@/components/annotated-image";
import { locales, type CaseStudy, type Locale } from "@/content/types";

const fullText = (study: CaseStudy, locale: Locale) => [study.title[locale], study.summary[locale], ...study.sections.flatMap(section =>
  section.blocks.flatMap(block => (block.type === "paragraph" ? [block] : block.items).flatMap(item =>
    item.segments.map(segment => segment.type === "code" ? segment.value : segment.type === "text" ? segment.value[locale] : segment.label[locale]))))].join(" ");

describe.each(caseVisuals)("visuales de $slug", visuals => {
  const study = caseStudies.find(item => item.slug === visuals.slug);
  it("corresponden a un case study existente", () => expect(study).toBeDefined());

  it.each(locales)("cada cifra aparece literalmente en el texto (%s)", locale => {
    const text = fullText(study!, locale);
    for (const metric of visuals.metrics) {
      if (metric.kind === "count") expect(text).toContain(formatCount(metric.value, locale));
      else {
        const tilde = metric.approximate ? "~" : "";
        expect(text).toContain(tilde + formatCount(metric.from, locale));
        expect(text).toContain(tilde + formatCount(metric.to, locale));
      }
    }
  });

  it("los códigos del diagrama existen en el texto del case study", () => {
    for (const step of visuals.diagram.steps.filter(item => item.code)) {
      expect(fullText(study!, "en")).toContain(step.code);
    }
  });

  it("aristas y pasos referencian nodos y aristas existentes, con ambos trazados", () => {
    const nodes = new Set(visuals.diagram.nodes.map(node => node.id));
    const edges = new Set(visuals.diagram.edges.map(edge => edge.id));
    expect(nodes.size).toBe(visuals.diagram.nodes.length);
    expect(edges.size).toBe(visuals.diagram.edges.length);
    for (const edge of visuals.diagram.edges) {
      expect(nodes.has(edge.from) && nodes.has(edge.to)).toBe(true);
      expect(edge.points.wide.length).toBeGreaterThanOrEqual(2);
      expect(edge.points.tall.length).toBeGreaterThanOrEqual(2);
    }
    for (const step of visuals.diagram.steps) {
      expect(edges.has(step.edge)).toBe(true);
      expect(step.at).toBeGreaterThan(0);
      expect(step.at).toBeLessThan(1);
    }
  });

  it("cada arista empieza y termina sobre el borde de sus nodos", () => {
    for (const layout of ["wide", "tall"] as const) {
      for (const edge of visuals.diagram.edges) {
        const points = edge.points[layout];
        for (const [id, [x, y]] of [[edge.from, points[0]], [edge.to, points[points.length - 1]]] as const) {
          const box = visuals.diagram.nodes.find(node => node.id === id)!.box[layout];
          const onX = (x === box.x || x === box.x + box.w) && y >= box.y && y <= box.y + box.h;
          const onY = (y === box.y || y === box.y + box.h) && x >= box.x && x <= box.x + box.w;
          expect(onX || onY, `${layout} ${edge.id} ${id}`).toBe(true);
        }
      }
    }
  });

  // "Que se pueda seguir el flujo con el dedo": the tall layout (preview B and every phone) must be
  // drawable without lifting the finger at a crossing, overlap or node.
  describe("trazado vertical legible", () => {
    const layout = "tall" as const;
    const segs = visuals.diagram.edges.flatMap(edge => edge.points[layout].slice(1).map((point, i) =>
      ({ edge: edge.id, a: edge.points[layout][i], b: point })));
    const between = (v: number, p: number, q: number) => v >= Math.min(p, q) && v <= Math.max(p, q);
    const touches = (s1: typeof segs[number], s2: typeof segs[number]) => {
      const h1 = s1.a[1] === s1.b[1], h2 = s2.a[1] === s2.b[1];
      if (h1 === h2) {
        // Parallel: they meet only if collinear and their ranges overlap.
        const axis = h1 ? 1 : 0, along = h1 ? 0 : 1;
        return s1.a[axis] === s2.a[axis] && Math.max(Math.min(s1.a[along], s1.b[along]), Math.min(s2.a[along], s2.b[along]))
          <= Math.min(Math.max(s1.a[along], s1.b[along]), Math.max(s2.a[along], s2.b[along]));
      }
      const [h, v] = h1 ? [s1, s2] : [s2, s1];
      return between(v.a[0], h.a[0], h.b[0]) && between(h.a[1], v.a[1], v.b[1]);
    };
    it("todas las rutas son ortogonales", () => {
      for (const seg of segs) expect(seg.a[0] === seg.b[0] || seg.a[1] === seg.b[1], seg.edge).toBe(true);
    });
    it("ninguna conexión cruza, toca ni se superpone con otra", () => {
      for (const [i, s1] of segs.entries()) for (const s2 of segs.slice(i + 1)) {
        if (s1.edge !== s2.edge) expect(touches(s1, s2), `${s1.edge} × ${s2.edge}`).toBe(false);
      }
    });
    it("ninguna conexión atraviesa un nodo", () => {
      for (const seg of segs) for (const node of visuals.diagram.nodes) {
        const box = node.box[layout];
        const inside = (x: number, y: number) => x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h;
        const steps = 40;
        for (let k = 1; k < steps; k++) {
          const x = seg.a[0] + (seg.b[0] - seg.a[0]) * k / steps, y = seg.a[1] + (seg.b[1] - seg.a[1]) * k / steps;
          expect(inside(x, y), `${seg.edge} atraviesa ${node.id}`).toBe(false);
        }
      }
    });
    it("los números de paso no se pisan entre sí ni con otras conexiones", () => {
      const r = 10;
      const at = (edgeId: string, f: number) => {
        const pts = visuals.diagram.edges.find(edge => edge.id === edgeId)!.points[layout];
        const lengths = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
        let left = lengths.reduce((a, b) => a + b, 0) * f;
        for (const [i, len] of lengths.entries()) {
          if (left <= len) return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * left / len, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * left / len];
          left -= len;
        }
        return pts[pts.length - 1];
      };
      const badges = visuals.diagram.steps.map(step => ({ edge: step.edge, c: at(step.edge, step.at) }));
      for (const [i, b1] of badges.entries()) for (const b2 of badges.slice(i + 1)) {
        expect(Math.hypot(b1.c[0] - b2.c[0], b1.c[1] - b2.c[1]), "badges").toBeGreaterThan(2 * r + 4);
      }
      for (const badge of badges) for (const seg of segs.filter(item => item.edge !== badge.edge)) {
        const x = Math.max(Math.min(badge.c[0], Math.max(seg.a[0], seg.b[0])), Math.min(seg.a[0], seg.b[0]));
        const y = Math.max(Math.min(badge.c[1], Math.max(seg.a[1], seg.b[1])), Math.min(seg.a[1], seg.b[1]));
        expect(Math.hypot(badge.c[0] - x, badge.c[1] - y), `badge on ${badge.edge} vs ${seg.edge}`).toBeGreaterThan(r + 4);
      }
      for (const badge of badges) for (const node of visuals.diagram.nodes) {
        const box = node.box[layout];
        const x = Math.max(box.x, Math.min(badge.c[0], box.x + box.w)), y = Math.max(box.y, Math.min(badge.c[1], box.y + box.h));
        expect(Math.hypot(badge.c[0] - x, badge.c[1] - y), `badge on ${badge.edge} vs ${node.id}`).toBeGreaterThan(r + 4);
      }
    });
  });

  it("textos visibles en ES y EN", () => {
    const texts = [visuals.diagram.title, ...visuals.diagram.nodes.flatMap(node => [node.name, node.role]),
      ...visuals.diagram.steps.map(step => step.label), ...visuals.metrics.map(metric => metric.label),
      ...Object.values(visuals.annotations).flat().map(item => item.label)];
    for (const text of texts) for (const locale of locales) expect(text[locale].trim()).not.toBe("");
  });

  it("las anotaciones apuntan a imágenes del case study y dentro de la captura", () => {
    const sources = [study!.cover, ...study!.gallery].map(image => image.src);
    for (const [src, items] of Object.entries(visuals.annotations)) {
      expect(sources).toContain(src);
      for (const item of items) {
        expect(item.x).toBeGreaterThanOrEqual(0); expect(item.x).toBeLessThanOrEqual(100);
        expect(item.y).toBeGreaterThanOrEqual(0); expect(item.y).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("perfil de la home", () => {
  it("conserva el texto literal entregado", () => {
    expect(profile.name).toBe("Alejo de la Arena");
    expect(profile.headline.es).toBe("Desarrollador full-stack. Construyo aplicaciones web que operan negocios reales — React, TypeScript, Supabase. Hoy profundizando en Go y sistemas con IA.");
    expect(profile.headline.en).toBe("Full-stack developer building production web apps — React, TypeScript, Supabase. Currently going deeper into Go and AI systems.");
    expect(profile.availability.es).toBe("Buenos Aires · UTC−3 · Abierto a roles full-stack remotos o híbridos.");
    expect(profile.availability.en).toBe("Buenos Aires · UTC−3 · Open to remote or hybrid full-stack roles.");
    expect(profile.contact.email).toBe("alejodelaarenaa@gmail.com");
    expect(profile.contact.links).toEqual([
      { label: "LinkedIn", href: "https://www.linkedin.com/in/alejo-de-la-arena/" },
      { label: "GitHub", href: "https://github.com/Alejo-de-la-Arena" },
    ]);
  });
});

describe("marcadores compactos de capturas", () => {
  it("separa anclas cercanas y respeta los bordes", () => {
    for (const xs of [[84.5, 88.4], [41.4, 92.7], [99, 98, 97], [1, 2], [50]]) {
      const placed = spreadMarkers(xs);
      const sorted = [...placed].sort((a, b) => a - b);
      for (let k = 1; k < sorted.length; k++) expect(sorted[k] - sorted[k - 1]).toBeGreaterThanOrEqual(12 - 1e-9);
      for (const x of placed) { expect(x).toBeGreaterThanOrEqual(5); expect(x).toBeLessThanOrEqual(95); }
    }
  });
});
