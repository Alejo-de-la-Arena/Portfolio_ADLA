import type { CSSProperties } from "react";
import Link from "next/link";
import { findCaseVisuals } from "@/content/case-visuals";
import type { CaseStudy, Locale } from "@/content/types";
import { SystemDiagram } from "@/components/system-diagram";
import styles from "./case-index.module.css";

/** Numbered case studies (by their content order) with summary; a project shows its animated diagram
    thumbnail, in its own accent, once content/case-visuals.ts has a diagram for it. */
export function CaseIndex({ studies, locale, headingLevel = 3 }: { studies: readonly CaseStudy[]; locale: Locale; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <ol className={styles.index}>
    {[...studies].sort((a, b) => a.order - b.order).map((study) => {
      const visuals = findCaseVisuals(study.slug);
      const drawing = visuals?.diagram;
      return <li key={study.slug} className={drawing ? styles.withDrawing : undefined}
        style={visuals ? { "--field": visuals.accent } as CSSProperties : undefined}>
        <span className={styles.order} aria-hidden="true">{study.order}</span>
        <Heading className={styles.title}><Link href={`/${locale}/work/${study.slug}`}>{study.title[locale]}</Link></Heading>
        <p className={styles.summary}>{study.summary[locale]}</p>
        {drawing && <SystemDiagram diagram={drawing} locale={locale} variant="thumbnail" className={styles.thumbnail} />}
      </li>;
    })}
  </ol>;
}
