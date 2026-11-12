import { visualUi as ui } from "@/content/dictionary";
import { formatCount, type Metric } from "@/content/case-visuals";
import type { CaseStudy, Locale } from "@/content/types";
import { TextContent } from "@/components/rich-text";

type SectionClasses = { section?: string; heading?: string; body?: string; paragraph?: string; list?: string; lead?: string };

/** The case study sections, untouched, with class hooks for each visual direction. */
export function CaseSections({ sections, locale, classes = {}, level = 3 }: {
  sections: CaseStudy["sections"]; locale: Locale; classes?: SectionClasses; level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return <>{sections.map((section, i) => <section key={i} className={classes.section}>
    <Heading className={classes.heading}>{section.heading[locale]}</Heading>
    <div className={classes.body}>
      {section.blocks.map((block, j) => block.type === "paragraph"
        ? <p key={j} className={classes.paragraph}><TextContent item={block} locale={locale} /></p>
        : <ul key={j} className={classes.list}>{block.items.map((item, k) => <li key={k}><TextContent item={item} locale={locale} /></li>)}</ul>)}
    </div>
  </section>)}</>;
}

/** Visual figure plus a sentence for assistive technology, so "~80 → ~300" is never read as symbols. */
export function MetricValue({ metric, locale, className, arrowClassName }: {
  metric: Metric; locale: Locale; className?: string; arrowClassName?: string;
}) {
  if (metric.kind === "count") {
    return <span className={className}>{formatCount(metric.value, locale)}</span>;
  }
  const tilde = metric.approximate ? "~" : "";
  const spoken = metric.approximate
    ? `${ui.approximately[locale]} ${formatCount(metric.from, locale)} ${ui.to[locale]} ${formatCount(metric.to, locale)}`
    : `${formatCount(metric.from, locale)} ${ui.to[locale]} ${formatCount(metric.to, locale)}`;
  return <span className={className}>
    <span aria-hidden="true">{tilde}{formatCount(metric.from, locale)}<span className={arrowClassName}>→</span>{tilde}{formatCount(metric.to, locale)}</span>
    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>{spoken}</span>
  </span>;
}
