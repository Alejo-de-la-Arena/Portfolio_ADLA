import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { dictionary as d } from "@/content/dictionary";
import { findCaseVisuals } from "@/content/case-visuals";
import type { CaseStudy, Locale } from "@/content/types";
import { formatDate } from "@/lib/dates";
import { SystemDiagram } from "@/components/system-diagram";
import s from "./case-poster.module.css";

/** Home: one case study as a poster. The project's field carries order and title; its real desktop
    screenshot sits on the field's lower edge with the mobile one overlapping a corner. Beside it go the
    summary, the stack (data, so mono) and, when content/case-visuals.ts has one, the animated diagram. */
export function CasePoster({ study, locale, preload = false }: { study: CaseStudy; locale: Locale; preload?: boolean }) {
  const visuals = findCaseVisuals(study.slug);
  const images = [study.cover, ...study.gallery];
  const desktop = images.find((image) => image.variant === "desktop");
  const mobile = images.find((image) => image.variant === "mobile");
  const href = `/${locale}/work/${study.slug}`;
  const titleId = `poster-${study.slug}`;
  const { start, end } = study.period;
  const diagram = visuals?.diagram;
  const text = <>
    <p className={s.summary}>{study.summary[locale]}</p>
    <ul className={s.stack} aria-label={d.stack[locale]}>{study.stack.map((item) => <li key={item}>{item}</li>)}</ul>
    <p className={s.more}><Link href={href}>{d.readCase[locale]}</Link></p>
  </>;

  return <article className={s.poster} aria-labelledby={titleId}
    style={visuals ? { "--field": visuals.accent } as CSSProperties : undefined}>
    <div className={s.field}>
      <span className={s.order} aria-hidden="true">{study.order}</span>
      <h3 id={titleId} className={s.title}><Link href={href}>{study.title[locale]}</Link></h3>
      <p className={s.meta}>
        <span><time dateTime={start}>{formatDate(start, locale)}</time>{d.periodSeparator[locale]}
          {end === null ? d.present[locale] : <time dateTime={end}>{formatDate(end, locale)}</time>}</span>
        <span>{d[study.status][locale]}</span>
      </p>
    </div>
    <div className={s.body} data-mobile={mobile ? "" : undefined}>
      {/* A larger pointer target for the same page. The title is the accessible link, so this one is hidden
          from assistive technology and skipped by the keyboard; the full alt texts live in the case study. */}
      {desktop && <Link href={href} className={s.media} tabIndex={-1} aria-hidden="true">
        <Image src={desktop.src} alt="" width={desktop.width} height={desktop.height} className={s.desktop}
          sizes="(min-width: 64rem) 60vw, 100vw" preload={preload} />
        {mobile && <Image src={mobile.src} alt="" width={mobile.width} height={mobile.height} className={s.mobile}
          sizes="(min-width: 64rem) 14vw, 32vw" />}
      </Link>}
      {/* With a diagram, the diagram alone fills the aside and the text goes under the screenshot, so both
          columns end level. Without one, the text is the aside. */}
      <div className={diagram ? s.lead : s.aside}>{text}</div>
      {diagram && <div className={s.aside}>
        <SystemDiagram diagram={diagram} locale={locale} variant="thumbnail" className={s.diagram} />
      </div>}
    </div>
  </article>;
}
