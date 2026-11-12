import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { findCaseVisuals } from "@/content/case-visuals";
import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { profile } from "@/content/profile";
import { requireLocale } from "@/lib/routing";
import { formatDate } from "@/lib/dates";
import { posterFont } from "@/lib/preview-fonts";
import { SystemDiagram } from "@/components/system-diagram";
import { AnnotatedImage } from "@/components/annotated-image";
import { CaseSections, MetricValue } from "@/components/case-parts";
import { LanguageSelector } from "@/components/language-selector";
import { CopyButton } from "@/components/copy-button";
import s from "./b.module.css";

export const metadata: Metadata = { title: "Preview B", robots: { index: false, follow: false } };

export default async function PreviewB({ params }: PageProps<"/[locale]/preview/b">) {
  const locale = requireLocale((await params).locale);
  const study = findCaseStudy("solution");
  const visuals = findCaseVisuals("solution");
  if (!study || !visuals) notFound();
  const featured = [...caseStudies.filter((item) => item.featured)].sort((a, b) => a.order - b.order);
  // Every screenshot of the case study, in content order: new gallery images appear here on their own,
  // with callouts if case-visuals.ts has any for their src.
  const screenshots = [study.cover, ...study.gallery];
  const wideShots = screenshots.filter((image) => image.variant === "desktop");
  const phoneShots = screenshots.filter((image) => image.variant === "mobile");
  const [change, ...counts] = visuals.metrics;
  const accent = {
    "--accent-light": visuals.accent.light, "--accent-dark": visuals.accent.dark, "--field": visuals.accent.field,
  } as CSSProperties;

  return <div className={`${s.root} ${posterFont.variable}`} style={accent}>
    {/* The shared layout's header is hidden on this preview; this nav adds Contact without touching real routes. */}
    <header className={s.siteHeader}>
      <nav aria-label={d.navigation[locale]} className={s.nav}>
        <Link href={`/${locale}`}>{d.home[locale]}</Link>
        <Link href={`/${locale}/work`}>{d.work[locale]}</Link>
        <a href="#contact">{ui.contact[locale]}</a>
      </nav>
    </header>
    <p className={s.notice}>{ui.previewNotice[locale]}</p>

    <section className={s.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className={s.siteTitle}>{profile.name}</h1>
      <p className={s.headline}>{profile.headline[locale]}</p>
      <p className={s.availability}>{profile.availability[locale]}</p>
      <section id="contact" className={s.contact} aria-labelledby="contact-title" tabIndex={-1}>
        <h2 id="contact-title" className={s.visuallyHidden}>{ui.contact[locale]}</h2>
        <ul className={s.contactList}>
          <li className={s.emailItem}>
            <a href={`mailto:${profile.contact.email}`} className={s.email}>{profile.contact.email}</a>
            <CopyButton value={profile.contact.email} locale={locale} className={s.copy} />
          </li>
          {profile.contact.links.map((link) => <li key={link.href}><a href={link.href} className={s.profileLink}>{link.label}</a></li>)}
        </ul>
      </section>
      <h2 className={s.indexTitle}>{d.featured[locale]}</h2>
      <ol className={s.index}>
        {featured.map((item) => {
          // A project shows its diagram thumbnail once case-visuals.ts has one for it.
          const drawing = findCaseVisuals(item.slug)?.diagram;
          return <li key={item.slug} className={drawing ? s.indexLead : undefined}>
            <span className={s.indexOrder} aria-hidden="true">{item.order}</span>
            <Link href={`/${locale}/work/${item.slug}`} className={s.indexLink}>{item.title[locale]}</Link>
            <p className={s.indexSummary}>{item.summary[locale]}</p>
            {drawing && <SystemDiagram diagram={drawing} locale={locale}
              layouts="tall" listPlacement="below" variant="thumbnail" className={s.thumbnail} />}
          </li>;
        })}
      </ol>
    </section>

    <article className={s.case} aria-labelledby="case-title">
      <header className={s.field}>
        <h2 id="case-title" className={s.caseTitle}>{study.title[locale]}</h2>
        <p className={s.fieldMeta}>
          <span>{study.roleLine[locale]}</span>
          <span><time dateTime={study.period.start}>{formatDate(study.period.start, locale)}</time>{d.periodSeparator[locale]}
            {study.period.end ? <time dateTime={study.period.end}>{formatDate(study.period.end, locale)}</time> : d.present[locale]}</span>
          <span>{d[study.status][locale]}</span>
        </p>
      </header>

      <section className={s.numbers} aria-labelledby="numbers-title">
        <h3 id="numbers-title" className={s.visuallyHidden}>{ui.metricsHeading[locale]}</h3>
        <dl className={s.numberList}>
          {change && <div className={s.changeMetric}>
            <dt className={s.numberLabel}>{change.label[locale]}</dt>
            <dd className={s.changeValue}><MetricValue metric={change} locale={locale} arrowClassName={s.arrow} /></dd>
          </div>}
          {counts.map((metric, i) => <div key={i} className={s.countMetric}>
            <dt className={s.numberLabel}>{metric.label[locale]}{metric.kind === "count" && metric.note && <> <span className={s.numberNote}>{metric.note[locale]}</span></>}</dt>
            <dd className={s.countValue}><MetricValue metric={metric} locale={locale} /></dd>
          </div>)}
        </dl>
      </section>

      <section className={s.flow} aria-label={visuals.diagram.title[locale]}>
        <SystemDiagram diagram={visuals.diagram} locale={locale} layouts="tall" listPlacement="beside" />
      </section>

      <div className={s.column}>
        {/* The summary stays on home and listing cards; here the numbers band does that job. */}
        <section className={s.section}>
          <h3 className={s.sectionHeading}>{ui.atAGlance[locale]}</h3>
          <ul className={s.highlights}>{study.highlights.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul>
          <ul className={s.stack} aria-label={d.stack[locale]}>{study.stack.map((item) => <li key={item}>{item}</li>)}</ul>
          {study.links.length > 0 && <ul className={s.links} aria-label={d.links[locale]}>
            {study.links.map((link) => <li key={link.href}><a href={link.href}>{link.label[locale]}</a></li>)}
          </ul>}
        </section>
        <CaseSections sections={study.sections.slice(0, 2)} locale={locale}
          classes={{ section: s.section, heading: s.sectionHeading, list: s.list }} />
      </div>

      <section className={s.screens} aria-labelledby="screens-title">
        <h3 id="screens-title" className={s.sectionHeading}>{d.gallery[locale]}</h3>
        <div className={s.screenGrid}>
          {wideShots.length > 0 && <div className={s.wideShots}>
            {wideShots.map((image) => <AnnotatedImage key={image.src} image={image} annotations={visuals.annotations[image.src] ?? []}
              locale={locale} sizes="(max-width: 1100px) 94vw, 1000px" />)}
          </div>}
          {phoneShots.length > 0 && <div className={s.phoneShots}>
            {phoneShots.map((image) => <AnnotatedImage key={image.src} image={image} annotations={visuals.annotations[image.src] ?? []}
              locale={locale} sizes="(max-width: 900px) 92vw, 384px" />)}
          </div>}
        </div>
      </section>

      <div className={s.column}>
        <CaseSections sections={study.sections.slice(2)} locale={locale}
          classes={{ section: s.section, heading: s.sectionHeading, list: s.list }} />
      </div>
    </article>

    <footer className={s.footer}><LanguageSelector locale={locale} suffix="/preview/b" /></footer>
  </div>;
}
