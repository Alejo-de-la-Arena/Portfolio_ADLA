import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { findCaseVisuals } from "@/content/case-visuals";
import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { formatDate } from "@/lib/dates";
import { plateFont } from "@/lib/preview-fonts";
import { SystemDiagram } from "@/components/system-diagram";
import { AnnotatedImage } from "@/components/annotated-image";
import { CaseSections, MetricValue } from "@/components/case-parts";
import { LanguageSelector } from "@/components/language-selector";
import s from "./a.module.css";

export const metadata: Metadata = { title: "Preview A", robots: { index: false, follow: false } };

export default async function PreviewA({ params }: PageProps<"/[locale]/preview/a">) {
  const locale = requireLocale((await params).locale);
  const study = findCaseStudy("solution");
  const visuals = findCaseVisuals("solution");
  if (!study || !visuals) notFound();
  const featured = [...caseStudies.filter((item) => item.featured)].sort((a, b) => a.order - b.order);
  const [desktopShot, mobileShot] = [study.cover, ...study.gallery];
  const accent = { "--accent-light": visuals.accent.light, "--accent-dark": visuals.accent.dark } as CSSProperties;

  return <div className={`${s.root} ${plateFont.variable}`} style={accent}>
    <p className={s.notice}>{ui.previewNotice[locale]}</p>

    <section className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroText}>
        <h1 id="hero-title" className={s.siteTitle}>{d.siteTitle[locale]}</h1>
        <p className={s.heroLead}>{d.description[locale]}</p>
        <h2 className={s.indexTitle}>{d.featured[locale]}</h2>
        <ol className={s.index}>
          {featured.map((item) => <li key={item.slug}>
            <span className={s.docNumber}>{item.slug}</span>
            <Link href={`/${locale}/work/${item.slug}`} className={s.indexLink}>{item.title[locale]}</Link>
            <time className={s.indexYear} dateTime={item.period.start}>{item.period.start.slice(0, 4)}</time>
          </li>)}
        </ol>
      </div>
      <Link href="#case" className={s.heroSheet} aria-label={`${ui.readCase[locale]}: ${study.title[locale]}`}>
        <SystemDiagram diagram={visuals.diagram} locale={locale} layouts="responsive" listPlacement="below" grid variant="still" />
      </Link>
    </section>

    <article id="case" className={s.case} aria-labelledby="case-title">
      <header className={s.titleBlock}>
        <h2 id="case-title" className={s.caseTitle}>{study.title[locale]}</h2>
        <dl className={s.meta}>
          <div><dt>{ui.document[locale]}</dt><dd>{study.slug}</dd></div>
          <div><dt>{ui.role[locale]}</dt><dd>{study.roleLine[locale]}</dd></div>
          <div><dt>{ui.period[locale]}</dt><dd>
            <time dateTime={study.period.start}>{formatDate(study.period.start, locale)}</time>{d.periodSeparator[locale]}
            {study.period.end ? <time dateTime={study.period.end}>{formatDate(study.period.end, locale)}</time> : d.present[locale]}
          </dd></div>
          <div><dt>{ui.status[locale]}</dt><dd>{d[study.status][locale]}</dd></div>
        </dl>
      </header>

      <div className={s.sheet}>
        <SystemDiagram diagram={visuals.diagram} locale={locale} layouts="responsive" listPlacement="below" grid />
      </div>

      <section className={s.metrics} aria-labelledby="metrics-title">
        <h3 id="metrics-title" className={s.visuallyHidden}>{ui.metricsHeading[locale]}</h3>
        <dl className={s.metricList}>
          {visuals.metrics.map((metric, i) => <div key={i} className={s.metric}>
            <dt className={s.metricLabel}>{metric.label[locale]}{metric.kind === "count" && metric.note && <span className={s.metricNote}>{metric.note[locale]}</span>}</dt>
            <dd className={s.metricValue}><MetricValue metric={metric} locale={locale} arrowClassName={s.metricArrow} /></dd>
          </div>)}
        </dl>
      </section>

      <div className={s.body}>
        <p className={s.summary}>{study.summary[locale]}</p>
        <section className={s.facts}>
          <div>
            <h3 className={s.factsHeading}>{d.highlights[locale]}</h3>
            <ul className={s.highlightList}>{study.highlights.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
          </div>
          <div>
            <h3 className={s.factsHeading}>{d.stack[locale]}</h3>
            <ul className={s.stackList}>{study.stack.map((item) => <li key={item}>{item}</li>)}</ul>
            {study.links.length > 0 && <>
              <h3 className={s.factsHeading}>{d.links[locale]}</h3>
              <ul className={s.linkList}>{study.links.map((link) => <li key={link.href}><a href={link.href}>{link.label[locale]}</a></li>)}</ul>
            </>}
          </div>
        </section>

        <CaseSections sections={study.sections.slice(0, 2)} locale={locale}
          classes={{ section: s.section, heading: s.sectionHeading, body: s.sectionBody, list: s.list }} />

        <section className={s.screens} aria-labelledby="screens-title">
          <h3 id="screens-title" className={s.sectionHeading}>{d.gallery[locale]}</h3>
          <div className={s.screenGrid}>
            <AnnotatedImage image={desktopShot} annotations={visuals.annotations[desktopShot.src] ?? []} locale={locale}
              sizes="(max-width: 900px) 92vw, 820px" className={s.annotated} />
            {mobileShot && <AnnotatedImage image={mobileShot} annotations={visuals.annotations[mobileShot.src] ?? []} locale={locale}
              sizes="(max-width: 900px) 80vw, 320px" className={`${s.annotated} ${s.annotatedMobile}`} />}
          </div>
        </section>

        <CaseSections sections={study.sections.slice(2)} locale={locale}
          classes={{ section: s.section, heading: s.sectionHeading, body: s.sectionBody, list: s.list }} />
      </div>
    </article>

    <footer className={s.footer}><LanguageSelector locale={locale} suffix="/preview/a" /></footer>
  </div>;
}
