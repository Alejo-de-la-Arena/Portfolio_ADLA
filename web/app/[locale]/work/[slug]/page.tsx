import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { findCaseVisuals, visualTitle } from "@/content/case-visuals";
import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/routing";
import { pairScreenshots } from "@/lib/screenshots";
import { LanguageSelector } from "@/components/language-selector";
import { ProjectVisual } from "@/components/project-visual";
import { AnnotatedImage } from "@/components/annotated-image";
import { CaseSections, MetricValue } from "@/components/case-parts";
import s from "./case.module.css";

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}
async function resolveStudy(params: PageProps<"/[locale]/work/[slug]">["params"]) {
  const route = await params;
  const locale = requireLocale(route.locale);
  const study = findCaseStudy(route.slug);
  if (!study) notFound();
  return { study, locale };
}
export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { study, locale } = await resolveStudy(params);
  return pageMetadata(locale, "/work/" + study.slug, study.title[locale] + d.titleSeparator[locale] + d.siteTitle[locale], study.summary[locale]);
}

export default async function CaseStudyPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { study, locale } = await resolveStudy(params);
  const visuals = findCaseVisuals(study.slug);
  const metrics = visuals?.metrics ?? [];
  const [change, ...counts] = metrics;
  const asOf = visuals?.metricsAsOf ? ui.asOf[locale].replace("{date}", formatDate(visuals.metricsAsOf, locale)) : null;
  // Every screenshot of the case study, in content order, each desktop with its mobile pair beside it;
  // callouts come from case-visuals.ts by src.
  const screenshots = [study.cover, ...study.gallery];
  const shotRows = pairScreenshots(screenshots);
  const annotations = (src: string) => visuals?.annotations[src] ?? [];
  // The case keeps its summary for cards (home, listing); here the numbers band does that job.
  const [firstSections, laterSections] = [study.sections.slice(0, 2), study.sections.slice(2)];
  const theme = visuals ? { "--field": visuals.accent } as CSSProperties : undefined;

  return <article className={s.case} style={theme} aria-labelledby="case-title">
    <header className={s.field}>
      <h1 id="case-title" className={s.title}>{study.title[locale]}</h1>
      <p className={s.meta}>
        <span>{study.roleLine[locale]}</span>
        <span><time dateTime={study.period.start}>{formatDate(study.period.start, locale)}</time>{d.periodSeparator[locale]}
          {study.period.end ? <time dateTime={study.period.end}>{formatDate(study.period.end, locale)}</time> : d.present[locale]}</span>
        <span>{d[study.status][locale]}</span>
      </p>
    </header>

    {metrics.length > 0 && <section className={s.numbers} aria-labelledby="numbers-title">
      <h2 id="numbers-title" className="visually-hidden">{ui.metricsHeading[locale]}</h2>
      <dl className={s.numberList}>
        {change && <div className={change.kind === "change" ? s.changeMetric : s.countMetric}>
          <dt className={s.numberLabel}>{change.label[locale]}</dt>
          <dd className={change.kind === "change" ? s.changeValue : s.countValue}><MetricValue metric={change} locale={locale} arrowClassName={s.arrow} /></dd>
        </div>}
        {counts.map((metric, i) => <div key={i} className={s.countMetric}>
          <dt className={s.numberLabel}>{metric.label[locale]}{metric.kind === "count" && metric.asOf && asOf && <> <span className={s.numberNote}>{asOf}</span></>}</dt>
          <dd className={s.countValue}><MetricValue metric={metric} locale={locale} /></dd>
        </div>)}
      </dl>
    </section>}

    {visuals?.visual && <section className={s.flow} aria-labelledby="flow-title">
      <h2 id="flow-title" className="visually-hidden">{visualTitle(visuals.visual)[locale]}</h2>
      <ProjectVisual visual={visuals.visual} locale={locale} variant="full" />
    </section>}

    <div className={s.column}>
      <section className={s.section}>
        <h2 className={s.sectionHeading}>{ui.atAGlance[locale]}</h2>
        <ul className={s.highlights}>{study.highlights.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
        <ul className={s.stack} aria-label={d.stack[locale]}>{study.stack.map((item) => <li key={item}>{item}</li>)}</ul>
        {study.links.length > 0 && <ul className={s.links} aria-label={d.links[locale]}>
          {study.links.map((link) => <li key={link.href}><a href={link.href}>{link.label[locale]}</a></li>)}
        </ul>}
      </section>
      <CaseSections sections={firstSections} locale={locale} level={2}
        classes={{ section: s.section, heading: s.sectionHeading, list: s.list }} />
    </div>

    {screenshots.length > 0 && <section className={s.screens} aria-labelledby="screens-title">
      <h2 id="screens-title" className={s.sectionHeading}>{d.gallery[locale]}</h2>
      <div className={s.screenGrid}>
        {shotRows.map(({ desktop, mobile }) => <div key={(desktop ?? mobile)?.src} className={s.shotRow}>
          {desktop && <AnnotatedImage image={desktop} annotations={annotations(desktop.src)}
            locale={locale} sizes={mobile ? "(max-width: 1024px) 94vw, 1000px" : "(max-width: 1440px) 94vw, 1360px"} />}
          {mobile && <AnnotatedImage image={mobile} annotations={annotations(mobile.src)} className={s.phoneShot}
            locale={locale} sizes="(max-width: 1024px) 92vw, 384px" />}
        </div>)}
      </div>
    </section>}

    {laterSections.length > 0 && <div className={s.column}>
      <CaseSections sections={laterSections} locale={locale} level={2}
        classes={{ section: s.section, heading: s.sectionHeading, list: s.list }} />
    </div>}

    <footer className="site-footer"><LanguageSelector locale={locale} suffix={"/work/" + study.slug} /></footer>
  </article>;
}
