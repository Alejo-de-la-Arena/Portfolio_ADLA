"use client";

import { useEffect, useId, useReducer, useRef, useState } from "react";
import { visualUi as ui } from "@/content/dictionary";
import { describeDiagram, diagramType, type Point, type SystemDiagram as Diagram } from "@/content/case-visuals";
import type { Locale } from "@/content/types";
import { initialWalkthrough, walkthroughReducer } from "./walkthrough";
import styles from "./system-diagram.module.css";

const TRAVEL_MS = 1300;
const HOLD_MS = 1300;
const OVERVIEW_MS = 2600;
const motionQuery = "(prefers-reduced-motion: reduce)";

type Props = {
  diagram: Diagram;
  locale: Locale;
  /** full: drawing, controls and step list. thumbnail: animated drawing with pause and the current step as text. */
  variant?: "full" | "thumbnail";
  /** Where the step list goes relative to the drawing (full variant). */
  listPlacement?: "below" | "beside";
  className?: string;
};

function pointAt(points: readonly Point[], fraction: number): Point {
  const parts = points.slice(1).map((point, i) => ({ a: points[i], b: point, length: Math.hypot(point[0] - points[i][0], point[1] - points[i][1]) }));
  let remaining = parts.reduce((sum, part) => sum + part.length, 0) * Math.min(1, Math.max(0, fraction));
  for (const { a, b, length } of parts) {
    if (remaining <= length) {
      const k = length === 0 ? 0 : remaining / length;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    remaining -= length;
  }
  return points[points.length - 1];
}
function arrowHead(points: readonly Point[]) {
  const [x1, y1] = points[points.length - 1];
  const [x0, y0] = points[points.length - 2];
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const corner = (offset: number): Point => [x1 - 9 * Math.cos(angle + offset), y1 - 9 * Math.sin(angle + offset)];
  return [[x1, y1], corner(0.45), corner(-0.45)].map((p) => p.join(",")).join(" ");
}

export function SystemDiagram({ diagram, locale, variant = "full", listPlacement = "below", className }: Props) {
  const [{ step, playing }, dispatch] = useReducer(walkthroughReducer, initialWalkthrough);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);
  const rootRef = useRef<HTMLElement>(null);
  const packetRef = useRef<SVGCircleElement>(null);
  const baseId = useId();
  const total = diagram.steps.length;

  // Start the first time the drawing is on screen (never with reduced motion); stop ticking off screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !started.current && !window.matchMedia(motionQuery).matches) {
        started.current = true;
        dispatch({ type: "start" });
      }
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // If reduced motion turns on while the walkthrough runs, stop and show the whole system.
  useEffect(() => {
    const query = window.matchMedia(motionQuery);
    const onChange = () => { if (query.matches) dispatch({ type: "reducedMotion" }); };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const packet = packetRef.current;
    const edge = step === null ? undefined : diagram.edges.find((item) => item.id === diagram.steps[step].edge);
    const place = (fraction: number) => {
      if (!packet) return;
      if (!edge) { packet.setAttribute("visibility", "hidden"); return; }
      const [x, y] = pointAt(edge.points, fraction);
      packet.setAttribute("cx", String(x));
      packet.setAttribute("cy", String(y));
      packet.setAttribute("visibility", "visible");
    };
    if (!playing || !visible) { place(1); return; }
    const travel = window.matchMedia(motionQuery).matches ? 0 : TRAVEL_MS;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      place(travel === 0 ? 1 : elapsed / travel);
      if (elapsed >= (step === null ? OVERVIEW_MS : travel + HOLD_MS)) { dispatch({ type: "advance", total }); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, playing, visible, diagram, total]);

  const activeEdge = step === null ? null : diagram.steps[step].edge;
  const activeEdgeData = diagram.edges.find((edge) => edge.id === activeEdge);
  const edgeState = (id: string) => step === null ? "all" : id === activeEdge ? "active"
    : diagram.steps.slice(0, step).some((item) => item.edge === id) ? "done" : "idle";
  const nodeState = (id: string) => step === null ? "all"
    : activeEdgeData && (activeEdgeData.from === id || activeEdgeData.to === id) ? "active" : "idle";
  const stepState = (index: number) => step === null ? "all" : index === step ? "active" : index < step ? "done" : "idle";
  const status = step === null ? ui.allSteps[locale]
    : ui.stepOf[locale].replace("{n}", String(step + 1)).replace("{total}", String(total));
  const titleId = `${baseId}-title`, descriptionId = `${baseId}-description`;
  const { w, h } = diagram.viewBox;

  const drawing = <svg className={styles.svg} viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <title id={titleId}>{diagram.title[locale]}</title>
    {diagram.edges.map((edge) => <g key={edge.id} className={styles.edge} data-state={edgeState(edge.id)} data-style={edge.style}>
      <polyline points={edge.points.map((p) => p.join(",")).join(" ")} />
      <polygon points={arrowHead(edge.points)} />
    </g>)}
    {diagram.nodes.map((node) => <g key={node.id} className={styles.node} data-state={nodeState(node.id)}>
      <rect x={node.box.x} y={node.box.y} width={node.box.w} height={node.box.h} />
      <text className={styles.nodeName} x={node.box.x + 12} y={node.box.y + node.box.h / 2 - 3} fontSize={diagramType.name}>{node.name[locale]}</text>
      <text className={styles.nodeRole} x={node.box.x + 12} y={node.box.y + node.box.h / 2 + diagramType.role + 2} fontSize={diagramType.role}>{node.role[locale]}</text>
    </g>)}
    {diagram.steps.map((item, index) => {
      const edge = diagram.edges.find((candidate) => candidate.id === item.edge);
      if (!edge) return null;
      const [x, y] = pointAt(edge.points, item.at);
      return <g key={index} className={styles.badge} data-state={stepState(index)}>
        <circle cx={x} cy={y} r={diagramType.badgeRadius} />
        <text x={x} y={y} fontSize={diagramType.badge} dy="0.36em">{index + 1}</text>
      </g>;
    })}
    <circle ref={packetRef} className={styles.packet} r={6} cx="0" cy="0" visibility="hidden" aria-hidden="true" />
  </svg>;

  const description = <p id={descriptionId} className={styles.description}>{describeDiagram(diagram, locale)}</p>;
  const playButton = <button type="button" className={styles.control} onClick={() => dispatch({ type: "toggle" })}
    aria-label={playing ? ui.pause[locale] : ui.play[locale]}>
    <svg viewBox="0 0 16 16" aria-hidden="true">{playing
      ? <><rect x="3.5" y="3" width="3" height="10" /><rect x="9.5" y="3" width="3" height="10" /></>
      : <polygon points="4,2.5 13.5,8 4,13.5" />}</svg>
  </button>;

  if (variant === "thumbnail") {
    return <figure ref={rootRef} className={`${styles.root} ${styles.thumbnail} ${className ?? ""}`}>
      {drawing}
      {description}
      <figcaption className={styles.thumbCaption}>
        {playButton}
        <p className={styles.thumbStep} aria-hidden="true">
          <span className={styles.stepNumber}>{step === null ? "" : step + 1}</span>
          <span>{step === null ? diagram.title[locale] : diagram.steps[step].label[locale]}</span>
        </p>
      </figcaption>
    </figure>;
  }

  return <figure ref={rootRef} className={`${styles.root} ${className ?? ""}`} data-list={listPlacement}>
    <div className={styles.layout}>
      <div className={styles.canvas}>{drawing}{description}</div>
      <figcaption className={styles.panel}>
        <div className={styles.controls}>
          {playButton}
          <button type="button" className={styles.control} aria-label={ui.previous[locale]} onClick={() => dispatch({ type: "previous", total })}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="11,2.5 3.5,8 11,13.5" /></svg>
          </button>
          <button type="button" className={styles.control} aria-label={ui.next[locale]} onClick={() => dispatch({ type: "next", total })}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5,2.5 12.5,8 5,13.5" /></svg>
          </button>
          <button type="button" className={styles.overview} onClick={() => dispatch({ type: "go", step: null })} aria-pressed={step === null}>
            {ui.showAll[locale]}
          </button>
          <p className={styles.status} aria-live={playing ? "off" : "polite"}>{status}</p>
        </div>
        <p className={styles.stepsHeading} id={`${baseId}-steps`}>{ui.stepsHeading[locale]}</p>
        <ol className={styles.steps} aria-labelledby={`${baseId}-steps`}>
          {diagram.steps.map((item, index) => <li key={index} data-state={stepState(index)}>
            <button type="button" onClick={() => dispatch({ type: "go", step: index })} aria-current={index === step ? "step" : undefined}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepText}>{item.label[locale]}{item.code && <> <code>{item.code}</code></>}</span>
            </button>
          </li>)}
        </ol>
      </figcaption>
    </div>
  </figure>;
}
