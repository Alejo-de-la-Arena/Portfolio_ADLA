import { caseStudies } from "@/content/case-studies";
import { employments, projectEntries } from "@/content/projects";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/dates";
import { CaseIndex } from "@/components/case-index";
import { ProjectList } from "@/components/project-list";
import { dictionary as d } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
import s from "./work.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "/work", d.work[locale] + d.titleSeparator[locale] + d.siteTitle[locale], profile.headline[locale]);
}
export default async function Work({ params }: PageProps<"/[locale]/work">) {
  const locale = requireLocale((await params).locale);
  return <>
    <div className={s.page}>
      <h1 className={s.title}>{d.work[locale]}</h1>
      <section className={s.cases} aria-labelledby="cases-title">
        <h2 id="cases-title" className={s.groupTitle}>{d.caseStudies[locale]}</h2>
        <CaseIndex studies={caseStudies} locale={locale} />
      </section>
      {/* Plain markup on purpose: content tests read these sections literally; styles come from .groups. */}
      <div className={s.groups}>
        <section><h2>{d.otherWork[locale]}</h2><ProjectList entries={projectEntries.filter(entry => !entry.employer)} locale={locale} /></section>
        {employments.map(({ employer, period, relationship }) => <section key={employer}><h2>{employer}</h2>
          <p><time dateTime={period.start}>{formatDate(period.start, locale)}</time>{d.periodSeparator[locale]}
            {period.end === null ? d.present[locale] : <time dateTime={period.end}>{formatDate(period.end, locale)}</time>}
          </p>
          <p>{relationship[locale]}</p>
          <ProjectList entries={projectEntries.filter(entry => entry.employer === employer)} locale={locale} />
        </section>)}
      </div>
    </div>
    <footer className="site-footer"><LanguageSelector locale={locale} suffix="/work" /></footer>
  </>;
}
