"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { visualUi as ui } from "@/content/dictionary";
import type { DiagramLayoutName, Point, SystemDiagram as Diagram } from "@/content/case-visuals";
import type { Locale } from "@/content/types";
import styles from "./system-diagram.module.css";

const TRAVEL_MS = 1300;
const HOLD_MS = 1300;
const OVERVIEW_MS = 2600;

type Props = {
  diagram: Diagram;
  locale: Locale;
  /** "responsive" draws the wide layout on large containers and the tall one on small ones. */
  layouts: "responsive" | "tall";
  /** Where the step list goes relative to the drawing. */
  listPlacement: "below" | "beside";
  grid?: boolean;
  /** full: drawing, controls and step list. thumbnail: animated drawing with pause and the current
      step as text. still: overview without controls or motion. */
  variant?: "full" | "thumbnail" | "still";
  className?: string;
};

function segments(points: readonly Point[]) {
  return points.slice(1).map((point, i) => {
    const [x0, y0] = points[i];
    return { x0, y0, x1: point[0], y1: point[1], length: Math.hypot(point[0] - x0, point[1] - y0) };
  });
}
function pointAt(points: readonly Point[], fraction: number): Point {
  const parts = segments(points);
  let remaining = parts.reduce((sum, part) => sum + part.length, 0) * Math.min(1, Math.max(0, fraction));
  for (const part of parts) {
    if (remaining <= part.length) {
      const k = part.length === 0 ? 0 : remaining / part.length;
      return [part.x0 + (part.x1 - part.x0) * k, part.y0 + (part.y1 - part.y0) * k];
    }
    remaining -= part.length;
  }
  return points[points.length - 1];
}
function arrowHead(points: readonly Point[]) {
  const [x1, y1] = points[points.length - 1];
  const [x0, y0] = points[points.length - 2];
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const size = 9;
  const corner = (offset: number): Point => [x1 - size * Math.cos(angle + offset), y1 - size * Math.sin(angle + offset)];
  return [[x1, y1], corner(0.45), corner(-0.45)].map((p) => p.join(",")).join(" ");
}

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function SystemDiagram({ diagram, locale, layouts, listPlacement, grid = false, variant = "full", className }: Props) {
  const still = variant === "still";
  // null is the overview: every connection drawn, nothing highlighted. It is also the
  // server, no-JavaScript and reduced-motion rendering.
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);
  const rootRef = useRef<HTMLElement>(null);
  const packets = useRef<Partial<Record<DiagramLayoutName, SVGCircleElement | null>>>({});
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
  const baseId = useId();
  const total = diagram.steps.length;

  // Start the walkthrough the first time the drawing is on screen; stop ticking when it is not.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || still) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !started.current && !window.matchMedia(motionQuery).matches) {
        started.current = true;
        setStep(0);
        setPlaying(true);
      }
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [still]);

  useEffect(() => {
    const place = (fraction: number) => {
      for (const layout of ["wide", "tall"] as const) {
        const packet = packets.current[layout];
        if (!packet) continue;
        if (step === null) { packet.setAttribute("visibility", "hidden"); continue; }
        const edge = diagram.edges.find((item) => item.id === diagram.steps[step].edge);
        if (!edge) continue;
        const [x, y] = pointAt(edge.points[layout], fraction);
        packet.setAttribute("cx", String(x));
        packet.setAttribute("cy", String(y));
        packet.setAttribute("visibility", "visible");
      }
    };
    const travel = reduced ? 0 : TRAVEL_MS;
    if (!playing || !visible) { place(1); return; }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      place(travel === 0 ? 1 : elapsed / travel);
      const limit = step === null ? OVERVIEW_MS : travel + HOLD_MS;
      if (elapsed >= limit) {
        setStep(step === null ? 0 : step + 1 < total ? step + 1 : null);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, playing, visible, reduced, diagram, total]);

  const go = (next: number | null) => { setPlaying(false); setStep(next); };
  const activeEdge = step === null ? null : diagram.steps[step].edge;
  const activeEdgeData = diagram.edges.find((edge) => edge.id === activeEdge);
  const edgeState = (id: string) => {
    if (step === null) return "all";
    if (id === activeEdge) return "active";
    return diagram.steps.slice(0, step).some((item) => item.edge === id) ? "done" : "idle";
  };
  const nodeState = (id: string) => step === null ? "all"
    : activeEdgeData && (activeEdgeData.from === id || activeEdgeData.to === id) ? "active" : "idle";
  const stepState = (index: number) => step === null ? "all" : index === step ? "active" : index < step ? "done" : "idle";
  const status = step === null ? ui.allSteps[locale]
    : ui.stepOf[locale].replace("{n}", String(step + 1)).replace("{total}", String(total));

  const drawing = (layout: DiagramLayoutName) => {
    const view = diagram.viewBox[layout];
    const titleId = `${baseId}-${layout}-title`;
    const name = layout === "wide" ? 17 : 14;
    const role = layout === "wide" ? 12.5 : 11;
    return <svg className={`${styles.svg} ${styles[layout]}`} viewBox={`0 0 ${view.w} ${view.h}`} role="img" aria-labelledby={titleId}>
      <title id={titleId}>{diagram.title[locale]}</title>
      {grid && <>
        <defs><pattern id={`${baseId}-${layout}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" className={styles.gridDot} />
        </pattern></defs>
        <rect width={view.w} height={view.h} fill={`url(#${baseId}-${layout}-grid)`} />
      </>}
      {diagram.edges.map((edge) => <g key={edge.id} className={styles.edge} data-state={edgeState(edge.id)} data-style={edge.style}>
        <polyline points={edge.points[layout].map((p) => p.join(",")).join(" ")} />
        <polygon points={arrowHead(edge.points[layout])} />
      </g>)}
      {diagram.nodes.map((node) => {
        const box = node.box[layout];
        return <g key={node.id} className={styles.node} data-state={nodeState(node.id)}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} />
          <text className={styles.nodeName} x={box.x + 12} y={box.y + box.h / 2 - 2} fontSize={name}>{node.name[locale]}</text>
          <text className={styles.nodeRole} x={box.x + 12} y={box.y + box.h / 2 + role + 4} fontSize={role}>{node.role[locale]}</text>
        </g>;
      })}
      {diagram.steps.map((item, index) => {
        const edge = diagram.edges.find((candidate) => candidate.id === item.edge);
        if (!edge) return null;
        const [x, y] = pointAt(edge.points[layout], item.at);
        const r = layout === "wide" ? 12 : 10;
        return <g key={index} className={styles.badge} data-state={stepState(index)}>
          <circle cx={x} cy={y} r={r} />
          <text x={x} y={y} fontSize={layout === "wide" ? 12 : 10.5} dy="0.36em">{index + 1}</text>
        </g>;
      })}
      <circle ref={(element) => { packets.current[layout] = element; }} className={styles.packet}
        r={layout === "wide" ? 6 : 5} cx="0" cy="0" visibility="hidden" aria-hidden="true" />
    </svg>;
  };

  const playButton = <button type="button" className={styles.control} onClick={() => {
    if (playing) { setPlaying(false); return; }
    setStep((current) => current ?? 0);
    setPlaying(true);
  }} aria-label={playing ? ui.pause[locale] : ui.play[locale]}>
    <svg viewBox="0 0 16 16" aria-hidden="true">{playing
      ? <><rect x="3.5" y="3" width="3" height="10" /><rect x="9.5" y="3" width="3" height="10" /></>
      : <polygon points="4,2.5 13.5,8 4,13.5" />}</svg>
  </button>;

  if (variant === "thumbnail") {
    return <figure ref={rootRef} className={`${styles.root} ${styles.thumbnail} ${className ?? ""}`} data-layouts={layouts}>
      <div className={styles.canvas}>
        {layouts === "responsive" && drawing("wide")}
        {drawing("tall")}
      </div>
      <figcaption className={styles.thumbCaption}>
        {playButton}
        <p className={styles.thumbStep}>
          <span className={styles.stepNumber}>{step === null ? "" : step + 1}</span>
          <span>{step === null ? diagram.title[locale] : diagram.steps[step].label[locale]}</span>
        </p>
      </figcaption>
    </figure>;
  }

  return <figure ref={rootRef} className={`${styles.root} ${className ?? ""}`} data-layouts={layouts} data-list={listPlacement}>
    <div className={styles.layout}>
    <div className={styles.canvas}>
      {layouts === "responsive" && drawing("wide")}
      {drawing("tall")}
    </div>
    {still ? <figcaption className={styles.stillCaption}>{diagram.title[locale]}</figcaption> : <figcaption className={styles.panel}>
      <div className={styles.controls}>
        {playButton}
        <button type="button" className={styles.control} aria-label={ui.previous[locale]}
          onClick={() => go(step === null ? total - 1 : step === 0 ? null : step - 1)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="11,2.5 3.5,8 11,13.5" /></svg>
        </button>
        <button type="button" className={styles.control} aria-label={ui.next[locale]}
          onClick={() => go(step === null ? 0 : step + 1 < total ? step + 1 : null)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5,2.5 12.5,8 5,13.5" /></svg>
        </button>
        <button type="button" className={styles.overview} onClick={() => go(null)} aria-pressed={step === null}>
          {ui.showAll[locale]}
        </button>
        <p className={styles.status} aria-live={playing ? "off" : "polite"}>{status}</p>
      </div>
      <p className={styles.stepsHeading} id={`${baseId}-steps`}>{ui.stepsHeading[locale]}</p>
      <ol className={styles.steps} aria-labelledby={`${baseId}-steps`}>
        {diagram.steps.map((item, index) => <li key={index} data-state={stepState(index)}>
          <button type="button" onClick={() => go(index)} aria-current={index === step ? "step" : undefined}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <span className={styles.stepText}>{item.label[locale]}{item.code && <> <code>{item.code}</code></>}</span>
          </button>
        </li>)}
      </ol>
    </figcaption>}
    </div>
  </figure>;
}
