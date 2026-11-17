import { donTeofiloElevations, type ElevationSet } from "./elevations";
import { formatSeasons, type SeasonSet } from "./seasons";
import type { ISODate, Text } from "./types";

/** A point in diagram user units. */
export type Point = readonly [number, number];
export type Box = { x: number; y: number; w: number; h: number };
export type DiagramNode = { id: string; name: Text; role: Text; box: Box };
export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  /** "dashed" marks a path that exists but carries no authority (the redirect). */
  style: "solid" | "dashed";
  points: readonly Point[];
};
export type DiagramStep = {
  edge: string;
  /** Where the step number sits along the edge, 0..1. */
  at: number;
  label: Text;
  code?: string;
};
export type SystemDiagram = {
  title: Text;
  viewBox: { w: number; h: number };
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  steps: readonly DiagramStep[];
};
export type Metric =
  | { kind: "change"; from: number; to: number; approximate: boolean; label: Text }
  /** asOf: the figure is a snapshot taken on the case's metricsAsOf date. */
  | { kind: "count"; value: number; label: Text; asOf?: boolean };
export type Annotation = {
  /** Anchor, as a percentage of the image. It must point at something visible in that image. */
  x: number;
  y: number;
  /** Rail row above the image: 0 is closest to the image. */
  row: 0 | 1;
  align: "start" | "center" | "end";
  label: Text;
};
/** The drawing each project leads with, built from that project's real logic:
    system: Solution's architecture diagram; elevation: Don Teófilo's plans drawn from millimeters;
    seasons: FORMAT's Season selector. */
export type ProjectVisual =
  | { kind: "system"; diagram: SystemDiagram }
  | { kind: "elevation"; elevations: ElevationSet }
  | { kind: "seasons"; seasons: SeasonSet };

export function visualTitle(visual: ProjectVisual): Text {
  switch (visual.kind) {
    case "system": return visual.diagram.title;
    case "elevation": return visual.elevations.title;
    case "seasons": return visual.seasons.title;
  }
}

export type CaseVisuals = {
  slug: string;
  /** Flat field colour of the project. Text on it is always black, so it must reach 4.5:1 against #000. */
  accent: string;
  /** Date the snapshot figures were taken, stored once and formatted per locale. */
  metricsAsOf?: ISODate;
  /** src of the mobile screenshot the home poster overlaps; without it, the case's first mobile capture. */
  posterMobile?: string;
  visual?: ProjectVisual;
  metrics: readonly Metric[];
  annotations: Readonly<Record<string, readonly Annotation[]>>;
};

// Pure helpers live apart so Client Components can import them without this data; re-exported here.
export { diagramType, describeDiagram } from "./describe-diagram";
export { formatCount } from "@/lib/format-count";

const t = (es: string, en: string): Text => ({ es, en });

// Diagram built only from what the Solution case study text states; see docs/design-direction.md.
// Accents: Solution from its UI cyan; Don Teófilo from its walnut, lifted to oak; FORMAT is its brand violet.
export const caseVisuals: readonly CaseVisuals[] = [
  {
    slug: "solution",
    accent: "#35D3EA",
    metricsAsOf: "2026-09-14",
    posterMobile: "/work/solution/checkout-mobile.webp",
    visual: { kind: "system", diagram: {
      title: t("Arquitectura de pagos, envíos y atribución de Solution", "Solution’s payments, shipping and attribution architecture"),
      viewBox: { w: 360, h: 568 },
      nodes: [
        { id: "browser", name: t("Navegador", "Browser"), role: t("SPA React + pixel", "React SPA + pixel"), box: { x: 96, y: 16, w: 168, h: 72 } },
        { id: "api", name: t("API", "API"), role: t("Node/Express", "Node/Express"), box: { x: 16, y: 320, w: 328, h: 80 } },
        { id: "db", name: t("Supabase", "Supabase"), role: t("Postgres", "Postgres"), box: { x: 16, y: 480, w: 148, h: 72 } },
        { id: "mp", name: t("Mercado Pago", "Mercado Pago"), role: t("única pasarela", "sole provider"), box: { x: 16, y: 168, w: 144, h: 72 } },
        { id: "correo", name: t("Correo Argentino", "Correo Argentino"), role: t("envíos", "shipping"), box: { x: 196, y: 480, w: 148, h: 72 } },
        { id: "meta", name: t("Meta", "Meta"), role: t("Conversions API", "Conversions API"), box: { x: 200, y: 168, w: 144, h: 72 } },
      ],
      edges: [
        { id: "browser-api", from: "browser", to: "api", style: "solid", points: [[180, 88], [180, 320]] },
        { id: "api-correo", from: "api", to: "correo", style: "solid", points: [[270, 400], [270, 480]] },
        { id: "api-mp", from: "api", to: "mp", style: "solid", points: [[60, 320], [60, 240]] },
        { id: "mp-browser", from: "mp", to: "browser", style: "dashed", points: [[80, 168], [80, 52], [96, 52]] },
        { id: "mp-api", from: "mp", to: "api", style: "solid", points: [[120, 240], [120, 320]] },
        { id: "api-db", from: "api", to: "db", style: "solid", points: [[90, 400], [90, 480]] },
        { id: "api-meta", from: "api", to: "meta", style: "solid", points: [[270, 320], [270, 240]] },
        { id: "browser-meta", from: "browser", to: "meta", style: "solid", points: [[264, 52], [280, 52], [280, 168]] },
      ],
      steps: [
        { edge: "browser-api", at: 0.5, label: t("Checkout: el navegador crea el pedido en la API.", "Checkout: the browser creates the order through the API.") },
        { edge: "api-correo", at: 0.3, label: t("Cotización de envío en vivo con Correo Argentino.", "Live shipping quote from Correo Argentino.") },
        { edge: "api-mp", at: 0.7, label: t("Checkout con Mercado Pago.", "Mercado Pago checkout.") },
        { edge: "mp-browser", at: 0.5, label: t("Redirección a la URL de «éxito»: no marca el pedido como pagado.", "Redirect to the “success” URL: it doesn’t mark the order as paid.") },
        { edge: "mp-api", at: 0.4, label: t("Webhook validado con firma HMAC.", "Webhook verified with an HMAC signature.") },
        { edge: "api-mp", at: 0.3, label: t("El servidor consulta el pago y verifica que corresponda al pedido.", "The server asks for the payment and checks it belongs to the order.") },
        { edge: "api-db", at: 0.5, label: t("Recién ahí confirma el pedido.", "Only then is the order confirmed.") },
        { edge: "api-correo", at: 0.75, label: t("Crear el envío: solo se reintentan errores de red, con backoff.", "Create the shipment: only network errors are retried, with backoff.") },
        { edge: "api-meta", at: 0.5, label: t("Conversions API desde el servidor, con datos hasheados.", "Conversions API from the server, with hashed data."), code: "purchase_<orderId>" },
        { edge: "browser-meta", at: 0.6, label: t("El pixel envía el mismo ID: Meta cuenta la venta una vez.", "The pixel sends the same ID: Meta counts the sale once."), code: "purchase_<orderId>" },
      ],
    } },
    metrics: [
      { kind: "change", from: 80, to: 300, approximate: true, label: t("pedidos por mes", "orders a month") },
      { kind: "count", value: 1086, label: t("pedidos procesados", "orders processed"), asOf: true },
      { kind: "count", value: 1006, label: t("compradores únicos", "unique buyers") },
    ],
    // Each label names something visible in that exact image. Add new screenshots to the case study's
    // gallery (content/case-studies.ts) and their callouts here, keyed by the same src.
    annotations: {
      // Anchors measured on the source pixels: x/y = pixel / image size.
      // Product video's play control (265, 1098 of 2518×1214): R2 decision.
      "/work/solution/product-desktop.webp": [
        { x: 10.5, y: 90.4, row: 0, align: "start", label: t("Video servido desde Cloudflare R2", "Video served from Cloudflare R2") },
      ],
      // Play control (32, 730 of 582×1034).
      "/work/solution/product-mobile.webp": [
        { x: 5.5, y: 70.6, row: 0, align: "start", label: t("Video servido desde Cloudflare R2", "Video served from Cloudflare R2") },
      ],
      // Truck icon of «Envío a todo el país · Correo Argentino» (2035, 1158 of 2528×1208).
      "/work/solution/checkout-desktop.webp": [
        { x: 80.5, y: 95.9, row: 0, align: "end", label: t("Envíos con Correo Argentino", "Shipping via Correo Argentino") },
      ],
      // Icon of «Vas a continuar en Mercado Pago» (128, 412 of 1456×762): payment confirmed by the server, not the redirect.
      "/work/solution/payment-desktop.webp": [
        { x: 8.8, y: 54.1, row: 0, align: "start", label: t("Redirección a Checkout Pro: la compra se confirma por webhook, no por la vuelta", "Redirect to Checkout Pro: the purchase is confirmed by webhook, not by the return") },
      ],
    },
  },
  { slug: "don-teofilo-amoblamientos", accent: "#CF9A63", visual: { kind: "elevation", elevations: donTeofiloElevations }, metrics: [], annotations: {} },
  { slug: "format", accent: "#9777DA", visual: { kind: "seasons", seasons: formatSeasons }, metrics: [], annotations: {} },
];

export function findCaseVisuals(slug: string) {
  return caseVisuals.find((visuals) => visuals.slug === slug);
}
