import type { Locale, Text } from "./types";

/** A point in diagram user units. */
export type Point = readonly [number, number];
export type DiagramLayoutName = "wide" | "tall";
export type Box = { x: number; y: number; w: number; h: number };
export type DiagramNode = {
  id: string;
  name: Text;
  role: Text;
  box: Record<DiagramLayoutName, Box>;
};
export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  /** "dashed" marks a path that exists but carries no authority (the redirect). */
  style: "solid" | "dashed";
  points: Record<DiagramLayoutName, readonly Point[]>;
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
  viewBox: Record<DiagramLayoutName, { w: number; h: number }>;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  steps: readonly DiagramStep[];
};
export type Metric =
  | { kind: "change"; from: number; to: number; approximate: boolean; label: Text }
  | { kind: "count"; value: number; label: Text; note?: Text };
export type Annotation = {
  /** Anchor, as a percentage of the image. */
  x: number;
  y: number;
  /** Rail row above the image: 0 is closest to the image. */
  row: 0 | 1;
  align: "start" | "center" | "end";
  label: Text;
};
export type CaseVisuals = {
  slug: string;
  accent: { light: string; dark: string; field: string };
  diagram: SystemDiagram;
  metrics: readonly Metric[];
  annotations: Readonly<Record<string, readonly Annotation[]>>;
};

const t = (es: string, en: string): Text => ({ es, en });

// Built only from what the Solution case study text states; see docs/design-direction.md.
export const caseVisuals: readonly CaseVisuals[] = [{
  slug: "solution",
  accent: { light: "#00707F", dark: "#35D3EA", field: "#35D3EA" },
  diagram: {
    title: t("Arquitectura de pagos, envíos y atribución de Solution", "Solution’s payments, shipping and attribution architecture"),
    viewBox: { wide: { w: 1200, h: 560 }, tall: { w: 360, h: 568 } },
    nodes: [
      { id: "browser", name: t("Navegador", "Browser"), role: t("SPA React + pixel", "React SPA + pixel"),
        box: { wide: { x: 40, y: 235, w: 180, h: 90 }, tall: { x: 106, y: 16, w: 148, h: 72 } } },
      { id: "api", name: t("API", "API"), role: t("Node/Express", "Node/Express"),
        box: { wide: { x: 470, y: 235, w: 180, h: 90 }, tall: { x: 16, y: 320, w: 328, h: 80 } } },
      { id: "db", name: t("Supabase", "Supabase"), role: t("Postgres", "Postgres"),
        box: { wide: { x: 470, y: 410, w: 180, h: 80 }, tall: { x: 16, y: 480, w: 148, h: 72 } } },
      { id: "mp", name: t("Mercado Pago", "Mercado Pago"), role: t("única pasarela", "sole provider"),
        box: { wide: { x: 920, y: 60, w: 240, h: 90 }, tall: { x: 16, y: 168, w: 148, h: 72 } } },
      { id: "correo", name: t("Correo Argentino", "Correo Argentino"), role: t("envíos", "shipping"),
        box: { wide: { x: 920, y: 235, w: 240, h: 90 }, tall: { x: 196, y: 480, w: 148, h: 72 } } },
      { id: "meta", name: t("Meta", "Meta"), role: t("Conversions API", "Conversions API"),
        box: { wide: { x: 920, y: 410, w: 240, h: 90 }, tall: { x: 196, y: 168, w: 148, h: 72 } } },
    ],
    edges: [
      { id: "browser-api", from: "browser", to: "api", style: "solid",
        points: { wide: [[220, 280], [470, 280]], tall: [[180, 88], [180, 320]] } },
      { id: "api-correo", from: "api", to: "correo", style: "solid",
        points: { wide: [[650, 280], [920, 280]], tall: [[270, 400], [270, 480]] } },
      { id: "api-mp", from: "api", to: "mp", style: "solid",
        points: { wide: [[545, 235], [545, 115], [920, 115]], tall: [[60, 320], [60, 240]] } },
      { id: "mp-browser", from: "mp", to: "browser", style: "dashed",
        points: { wide: [[920, 80], [130, 80], [130, 235]], tall: [[90, 168], [90, 52], [106, 52]] } },
      { id: "mp-api", from: "mp", to: "api", style: "solid",
        points: { wide: [[920, 140], [580, 140], [580, 235]], tall: [[120, 240], [120, 320]] } },
      { id: "api-db", from: "api", to: "db", style: "solid",
        points: { wide: [[560, 325], [560, 410]], tall: [[90, 400], [90, 480]] } },
      { id: "api-meta", from: "api", to: "meta", style: "solid",
        points: { wide: [[650, 310], [780, 310], [780, 455], [920, 455]], tall: [[270, 320], [270, 240]] } },
      { id: "browser-meta", from: "browser", to: "meta", style: "solid",
        points: { wide: [[130, 325], [130, 530], [1040, 530], [1040, 500]], tall: [[254, 52], [270, 52], [270, 168]] } },
    ],
    steps: [
      { edge: "browser-api", at: 0.5, label: t("Checkout: el navegador crea el pedido en la API.", "Checkout: the browser creates the order through the API.") },
      { edge: "api-correo", at: 0.35, label: t("Cotización de envío en vivo con Correo Argentino.", "Live shipping quote from Correo Argentino.") },
      { edge: "api-mp", at: 0.7, label: t("Checkout con Mercado Pago.", "Mercado Pago checkout.") },
      { edge: "mp-browser", at: 0.5, label: t("Redirección a la URL de «éxito»: no marca el pedido como pagado.", "Redirect to the “success” URL: it doesn’t mark the order as paid.") },
      { edge: "mp-api", at: 0.4, label: t("Webhook validado con firma HMAC.", "Webhook verified with an HMAC signature.") },
      { edge: "api-mp", at: 0.3, label: t("El servidor consulta el pago y verifica que corresponda al pedido.", "The server asks for the payment and checks it belongs to the order.") },
      { edge: "api-db", at: 0.5, label: t("Recién ahí confirma el pedido.", "Only then is the order confirmed.") },
      { edge: "api-correo", at: 0.7, label: t("Crear el envío: solo se reintentan errores de red, con backoff.", "Create the shipment: only network errors are retried, with backoff.") },
      { edge: "api-meta", at: 0.5, label: t("Conversions API desde el servidor, con datos hasheados.", "Conversions API from the server, with hashed data."), code: "purchase_<orderId>" },
      { edge: "browser-meta", at: 0.5, label: t("El pixel envía el mismo ID: Meta cuenta la venta una vez.", "The pixel sends the same ID: Meta counts the sale once."), code: "purchase_<orderId>" },
    ],
  },
  metrics: [
    { kind: "change", from: 80, to: 300, approximate: true, label: t("pedidos por mes", "orders a month") },
    { kind: "count", value: 1086, label: t("pedidos procesados", "orders processed"), note: t("al 14 de septiembre de 2026", "as of September 14, 2026") },
    { kind: "count", value: 1006, label: t("compradores únicos", "unique buyers") },
  ],
  // Each label names something visible in that exact image. Add new screenshots to the case study's
  // gallery (content/case-studies.ts) and their callouts here, keyed by the same src.
  annotations: {
    "/work/solution/solution-home.webp": [
      { x: 84.5, y: 2.4, row: 0, align: "end", label: t("Cuotas sin interés con Mercado Pago", "Interest-free installments with Mercado Pago") },
      { x: 88.4, y: 9, row: 1, align: "end", label: t("Carrito con contador de productos", "Cart with item count") },
    ],
    "/work/solution/solution-home-mobile.webp": [
      { x: 41.4, y: 4, row: 0, align: "center", label: t("Envío a todo el país", "Nationwide shipping") },
      { x: 92.7, y: 12.4, row: 1, align: "end", label: t("Carrito con contador", "Cart with item count") },
    ],
  },
}];

export function findCaseVisuals(slug: string) {
  return caseVisuals.find((visuals) => visuals.slug === slug);
}

/** Grouping is forced so ES shows 1.086 like the case study text (Intl skips it for four digits in es). */
export function formatCount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { useGrouping: "always" }).format(value);
}
