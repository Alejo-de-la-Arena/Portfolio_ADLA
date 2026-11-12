import type { CSSProperties } from "react";
import Image from "next/image";
import { visualUi as ui } from "@/content/dictionary";
import type { Annotation } from "@/content/case-visuals";
import type { Locale, WorkImage } from "@/content/types";
import styles from "./annotated-image.module.css";

const key = (index: number) => String.fromCharCode(65 + index);

/** Spreads compact markers along the rail so nearby anchors never stack (gap and bounds in % of width). */
export function spreadMarkers(xs: readonly number[], gap = 12, min = 5, max = 95): number[] {
  const order = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const placed = order.map(({ x }) => Math.min(max, Math.max(min, x)));
  for (let k = 1; k < placed.length; k++) placed[k] = Math.max(placed[k], placed[k - 1] + gap);
  const overflow = placed.length ? placed[placed.length - 1] - max : 0;
  if (overflow > 0) {
    for (let k = placed.length - 1; k >= 0; k--) {
      placed[k] = k === placed.length - 1 ? max : Math.min(placed[k], placed[k + 1] - gap);
    }
  }
  const result = new Array<number>(xs.length);
  order.forEach(({ i }, k) => { result[i] = Math.max(min, placed[k]); });
  return result;
}

/** A screenshot with design-doc callouts: hairline leaders to mono labels in a rail above the image.
    In narrow containers the labels become lettered markers in a rail, still tied to their anchor by a
    leader, with a legend below at reading size. */
export function AnnotatedImage({ image, annotations, locale, sizes, className }: {
  image: WorkImage; annotations: readonly Annotation[]; locale: Locale; sizes: string; className?: string;
}) {
  const rows = annotations.length === 0 ? 0 : annotations.some((item) => item.row === 1) ? 2 : 1;
  const markers = spreadMarkers(annotations.map((item) => item.x));
  return <figure className={`${styles.root} ${className ?? ""}`} data-variant={image.variant} data-annotated={annotations.length > 0}
    style={{ "--rows": rows } as CSSProperties}>
    <div className={styles.frame}>
      <Image src={image.src} alt={image.alt[locale]} width={image.width} height={image.height} sizes={sizes} className={styles.image} />
      {annotations.map((item, index) => <span key={index} aria-hidden="true" className={styles.callout} data-align={item.align}
        style={{ "--x": item.x + "%", "--y": item.y + "%", "--row": item.row } as CSSProperties}>
        <span className={styles.leader} />
        <span className={styles.inLeader} />
        <span className={styles.dot} />
        <span className={styles.label}>{item.label[locale]}</span>
      </span>)}
      {annotations.length > 0 && <div className={styles.compactRail} aria-hidden="true">
        <svg className={styles.compactLines} viewBox="0 0 100 100" preserveAspectRatio="none">
          {annotations.map((item, index) => <line key={index} x1={markers[index]} y1="0" x2={item.x} y2="100" vectorEffect="non-scaling-stroke" />)}
        </svg>
        {annotations.map((_, index) => <span key={index} className={styles.marker} style={{ left: markers[index] + "%" }}>{key(index)}</span>)}
      </div>}
    </div>
    {annotations.length > 0 && <figcaption className={styles.legend}>
      <span className={styles.legendHeading}>{ui.annotationsHeading[locale]}</span>
      <ol>{annotations.map((item, index) => <li key={index}><span className={styles.legendKey} aria-hidden="true">{key(index)}</span>{item.label[locale]}</li>)}</ol>
    </figcaption>}
  </figure>;
}
