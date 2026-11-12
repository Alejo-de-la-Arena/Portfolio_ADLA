import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/case-studies";
import { caseVisuals, describeDiagram, diagramType, formatCount, type CaseVisuals, type SystemDiagram } from "@/content/case-visuals";
import { profile } from "@/content/profile";
import { spreadMarkers } from "@/components/annotated-image";
import { dateValue, formatDate } from "@/lib/dates";
import { locales, type CaseStudy, type Locale } from "@/content/types";

const fullText = (study: CaseStudy, locale: Locale) => [study.title[locale], study.summary[locale], ...study.sections.flatMap(section =>
  section.blocks.flatMap(block => (block.type === "paragraph" ? [block] : block.items).flatMap(item =>
    item.segments.map(segment => segment.type === "code" ? segment.value : segment.type === "text" ? segment.value[locale] : segment.label[locale]))))].join(" ");

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

it("cada case study tiene su tema visual y no sobran temas", () => {
  expect(caseVisuals.map(v => v.slug).sort()).toEqual(caseStudies.map(s => s.slug).sort());
});

describe.each(caseVisuals)("visuales de $slug", (visuals: CaseVisuals) => {
  const study = caseStudies.find(item => item.slug === visuals.slug)!;

  it("el acento admite texto negro (AA 4.5:1) y sirve como trazo sobre negro en oscuro", () => {
    expect(contrast(visuals.accent, "#000000")).toBeGreaterThanOrEqual(4.5);
  });

  it.each(locales)("cada cifra y su fecha de corte aparecen literalmente en el texto (%s)", locale => {
    const text = fullText(study, locale);
    for (const metric of visuals.metrics) {
      if (metric.kind === "count") {
        expect(text).toContain(formatCount(metric.value, locale));
        if (metric.asOf) {
          expect(visuals.metricsAsOf, "asOf requires metricsAsOf").toBeDefined();
          expect(text).toContain(formatDate(visuals.metricsAsOf!, locale));
        }
      } else {
        const tilde = metric.approximate ? "~" : "";
        expect(text).toContain(tilde + formatCount(metric.from, locale));
        expect(text).toContain(tilde + formatCount(metric.to, locale));
      }
    }
  });

  it("la fecha de corte es un ISODate de calendario real", () => {
    if (visuals.metricsAsOf) expect(Number.isFinite(dateValue(visuals.metricsAsOf))).toBe(true);
  });

  it("las anotaciones apuntan a imágenes del case study y dentro de la captura, con texto ES/EN", () => {
    const sources = [study.cover, ...study.gallery].map(image => image.src);
    for (const [src, items] of Object.entries(visuals.annotations)) {
      expect(sources).toContain(src);
      for (const item of items) {
        expect(item.x).toBeGreaterThanOrEqual(0); expect(item.x).toBeLessThanOrEqual(100);
        expect(item.y).toBeGreaterThanOrEqual(0); expect(item.y).toBeLessThanOrEqual(100);
        for (const locale of locales) expect(item.label[locale].trim()).not.toBe("");
      }
    }
  });
});

const diagrams = caseVisuals.filter(v => v.diagram).map(v => ({ slug: v.slug, diagram: v.diagram! as SystemDiagram, study: caseStudies.find(s => s.slug === v.slug)! }));

describe.each(diagrams)("diagrama de $slug", ({ diagram, study }) => {
  const segs = diagram.edges.flatMap(edge => edge.points.slice(1).map((point, i) => ({ edge: edge.id, a: edge.points[i], b: point })));
  const box = (id: string) => diagram.nodes.find(node => node.id === id)!.box;

  it("aristas y pasos referencian nodos y aristas existentes", () => {
    const nodes = new Set(diagram.nodes.map(node => node.id)), edges = new Set(diagram.edges.map(edge => edge.id));
    expect(nodes.size).toBe(diagram.nodes.length);
    expect(edges.size).toBe(diagram.edges.length);
    for (const edge of diagram.edges) expect(nodes.has(edge.from) && nodes.has(edge.to) && edge.points.length >= 2).toBe(true);
    for (const step of diagram.steps) { expect(edges.has(step.edge)).toBe(true); expect(step.at).toBeGreaterThan(0); expect(step.at).toBeLessThan(1); }
  });

  it("los códigos del diagrama existen en el texto del case study", () => {
    for (const step of diagram.steps.filter(item => item.code)) expect(fullText(study, "en")).toContain(step.code);
  });

  it("cada arista empieza y termina sobre el borde de sus nodos", () => {
    for (const edge of diagram.edges) {
      for (const [id, [x, y]] of [[edge.from, edge.points[0]], [edge.to, edge.points[edge.points.length - 1]]] as const) {
        const b = box(id);
        const onX = (x === b.x || x === b.x + b.w) && y >= b.y && y <= b.y + b.h;
        const onY = (y === b.y || y === b.y + b.h) && x >= b.x && x <= b.x + b.w;
        expect(onX || onY, `${edge.id} ${id}`).toBe(true);
      }
    }
  });

  // "Que se pueda seguir el flujo con el dedo."
  describe("trazado legible", () => {
    const between = (v: number, p: number, q: number) => v >= Math.min(p, q) && v <= Math.max(p, q);
    const touches = (s1: typeof segs[number], s2: typeof segs[number]) => {
      const h1 = s1.a[1] === s1.b[1], h2 = s2.a[1] === s2.b[1];
      if (h1 === h2) {
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
      for (const seg of segs) for (const node of diagram.nodes) {
        const b = node.box;
        for (let k = 1; k < 40; k++) {
          const x = seg.a[0] + (seg.b[0] - seg.a[0]) * k / 40, y = seg.a[1] + (seg.b[1] - seg.a[1]) * k / 40;
          expect(x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h, `${seg.edge} atraviesa ${node.id}`).toBe(false);
        }
      }
    });
    it("los números de paso no se pisan entre sí ni con otras conexiones o nodos", () => {
      const r = diagramType.badgeRadius;
      const at = (edgeId: string, f: number) => {
        const pts = diagram.edges.find(edge => edge.id === edgeId)!.points;
        const lengths = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
        let left = lengths.reduce((a, b) => a + b, 0) * f;
        for (const [i, len] of lengths.entries()) {
          if (left <= len) return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * left / len, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * left / len];
          left -= len;
        }
        return [...pts[pts.length - 1]];
      };
      const badges = diagram.steps.map(step => ({ edge: step.edge, c: at(step.edge, step.at) }));
      for (const [i, b1] of badges.entries()) for (const b2 of badges.slice(i + 1)) {
        expect(Math.hypot(b1.c[0] - b2.c[0], b1.c[1] - b2.c[1]), "badges").toBeGreaterThan(2 * r + 4);
      }
      for (const badge of badges) for (const seg of segs.filter(item => item.edge !== badge.edge)) {
        const x = Math.max(Math.min(badge.c[0], Math.max(seg.a[0], seg.b[0])), Math.min(seg.a[0], seg.b[0]));
        const y = Math.max(Math.min(badge.c[1], Math.max(seg.a[1], seg.b[1])), Math.min(seg.a[1], seg.b[1]));
        expect(Math.hypot(badge.c[0] - x, badge.c[1] - y), `badge on ${badge.edge} vs ${seg.edge}`).toBeGreaterThan(r + 4);
      }
      for (const badge of badges) for (const node of diagram.nodes) {
        const b = node.box;
        const x = Math.max(b.x, Math.min(badge.c[0], b.x + b.w)), y = Math.max(b.y, Math.min(badge.c[1], b.y + b.h));
        expect(Math.hypot(badge.c[0] - x, badge.c[1] - y), `badge on ${badge.edge} vs ${node.id}`).toBeGreaterThan(r + 4);
      }
    });
    it.each(locales)("los roles entran en su nodo al tamaño mínimo legible (%s)", locale => {
      // JetBrains Mono advances 0.6em per character; 12 units of left padding plus 6 of right margin.
      for (const node of diagram.nodes) expect(node.role[locale].length * 0.6 * diagramType.role + 18, node.id).toBeLessThanOrEqual(node.box.w);
    });
  });

  it.each(locales)("la descripción accesible nombra cada conexión en orden (%s)", locale => {
    const text = describeDiagram(diagram, locale);
    let cursor = 0;
    for (const [index, step] of diagram.steps.entries()) {
      const edge = diagram.edges.find(item => item.id === step.edge)!;
      const position = text.indexOf(step.label[locale], cursor);
      expect(position, `step ${index + 1}`).toBeGreaterThan(cursor - 1);
      const sentence = text.slice(cursor, position);
      expect(sentence).toContain(String(index + 1));
      expect(sentence).toContain(diagram.nodes.find(node => node.id === edge.from)!.name[locale]);
      expect(sentence).toContain(diagram.nodes.find(node => node.id === edge.to)!.name[locale]);
      cursor = position + step.label[locale].length;
    }
    expect(text.startsWith(diagram.title[locale])).toBe(true);
  });

  it("textos visibles en ES y EN", () => {
    const texts = [diagram.title, ...diagram.nodes.flatMap(node => [node.name, node.role]), ...diagram.steps.map(step => step.label)];
    for (const text of texts) for (const locale of locales) expect(text[locale].trim()).not.toBe("");
  });
});

it("las métricas tienen etiquetas ES/EN", () => {
  for (const metric of caseVisuals.flatMap(v => v.metrics)) for (const locale of locales) expect(metric.label[locale].trim()).not.toBe("");
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
