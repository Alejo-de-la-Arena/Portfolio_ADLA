"use client";

import { useId, useRef } from "react";
import { visualUi as ui } from "@/content/dictionary";
import { formatCount } from "@/content/case-visuals";
import { describeElevations, formatMm } from "@/content/describe-visuals";
import type { ElevationSet } from "@/content/elevations";
import type { Locale } from "@/content/types";
import { layoutElevation } from "@/lib/elevation-geometry";
import { useCycle } from "./use-cycle";
import { useElementSize } from "./use-element-size";
import { CycleButton } from "./cycle-button";
import styles from "./elevation-plan.module.css";

/** Server and first-render size of the drawing box. The box keeps a 4:3 aspect ratio in CSS, so the
    drawing scales correctly from this viewBox until the real size is measured, and without JavaScript. */
const NOMINAL = { width: 352, height: 264 };
const TIMING = { enter: 1900, hold: 2600, exit: 450 };

type Props = {
  set: ElevationSet;
  locale: Locale;
  /** full: drawing, elevation buttons and legend. thumbnail: drawing, pause and the current title block. */
  variant?: "full" | "thumbnail";
  className?: string;
};

/** Don Teófilo: the plan drawn from millimeters. Each elevation is laid out in the box's real pixels
    (lib/elevation-geometry.ts, the client's code ported) and drawn group by group, then the next one. */
export function ElevationPlan({ set, locale, variant = "full", className }: Props) {
  const { state, select, toggle, rootRef } = useCycle(set.items.length, TIMING);
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(boxRef, NOMINAL);
  const baseId = useId();
  const item = set.items[state.index];
  const geo = layoutElevation(item, width, height, (mm) => formatCount(mm, locale));
  const size = `${formatCount(item.ancho, locale)} × ${formatCount(item.alto, locale)} mm`;
  const titleId = `${baseId}-title`, descriptionId = `${baseId}-description`;
  const status = ui.planOf[locale].replace("{n}", String(state.index + 1)).replace("{total}", String(set.items.length));

  const drawing = <div ref={boxRef} className={styles.box}>
    {geo && <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-labelledby={titleId} aria-describedby={descriptionId} data-phase={state.phase}>
      <title id={titleId}>{`${item.name[locale]}, ${formatMm(item.ancho, locale)} × ${formatMm(item.alto, locale)}`}</title>
      {/* A new run remounts the scene, which restarts the CSS drawing sequence. */}
      <g key={state.run}>
        {geo.strokes.map((stroke, i) => <path key={i} d={stroke.d} className={styles[stroke.g]}
          pathLength={stroke.g === "oculto" ? undefined : 1} />)}
        {geo.ext.map((d, i) => <path key={`e${i}`} d={d} className={styles.ext} />)}
        {[...geo.partials, geo.width, geo.height].map((cota, i) => <g key={`c${i}`}>
          {cota.segments.map((d, j) => <path key={j} d={d} className={styles.cota} pathLength={1} />)}
          {cota.marks.map((d, j) => <path key={`m${j}`} d={d} className={styles.mark} />)}
        </g>)}
        {geo.partials.map((cota, i) => cota.text && <text key={`t${i}`} x={cota.label.x} y={cota.label.y} className={styles.label}>{cota.text}</text>)}
        <text x={geo.width.label.x} y={geo.width.label.y} className={styles.label}>{geo.width.text}</text>
        <text transform={`translate(${geo.height.label.x} ${geo.height.label.y}) rotate(90)`} className={styles.label}>{geo.height.text}</text>
      </g>
    </svg>}
  </div>;

  const description = <p id={descriptionId} className="visually-hidden">{describeElevations(set, locale)}</p>;
  const titleBlock = <p className={styles.titleBlock} aria-hidden="true">
    <span className={styles.blockName}>{item.name[locale]}</span>
    <span className={styles.blockSize}>{size}</span>
  </p>;
  const playButton = <CycleButton playing={state.playing} locale={locale} onClick={toggle} />;
  const legend = <p className={styles.legend}>{ui.planLegend[locale]}</p>;

  if (variant === "thumbnail") {
    return <figure ref={rootRef} className={`${styles.root} ${styles.thumbnail} ${className ?? ""}`}>
      {drawing}
      {description}
      <figcaption className={styles.thumbCaption}>
        <div className={styles.thumbRow}>{playButton}{titleBlock}</div>
        {legend}
      </figcaption>
    </figure>;
  }

  return <figure ref={rootRef} className={`${styles.root} ${className ?? ""}`}>
    <div className={styles.layout}>
      <div className={styles.canvas}>{drawing}{description}{titleBlock}</div>
      <figcaption className={styles.panel}>
        <div className={styles.controls}>
          {playButton}
          <p className={styles.status} aria-live={state.playing ? "off" : "polite"}>{status}</p>
        </div>
        <ul className={styles.choices} aria-label={ui.chooseElevation[locale]}>
          {set.items.map((elevation, index) => <li key={elevation.id}>
            <button type="button" aria-pressed={index === state.index} onClick={() => select(index)}>
              <span className={styles.choiceName}>{elevation.name[locale]}</span>
              <span className={styles.choiceSize}>{formatCount(elevation.ancho, locale)} × {formatCount(elevation.alto, locale)} mm</span>
            </button>
          </li>)}
        </ul>
        {legend}
      </figcaption>
    </div>
  </figure>;
}
