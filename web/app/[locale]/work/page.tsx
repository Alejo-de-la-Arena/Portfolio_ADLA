import { caseStudies } from "@/content/case-studies";
import { employments, projectEntries } from "@/content/projects";
import { formatDate } from "@/lib/dates";
import { CaseStudyList } from "@/components/case-study-list";
import { ProjectList } from "@/components/project-list";
import { dictionary as d } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
export async function generateMetadata({ params }: PageProps<"/[locale]/work">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "/work", d.work[locale] + d.titleSeparator[locale] + d.siteTitle[locale], d.description[locale]);
}
export default async function Work({ params }: PageProps<"/[locale]/work">) {
  const locale = requireLocale((await params).locale);
  return <><h1>{d.work[locale]}</h1>
    <section><h2>{d.caseStudies[locale]}</h2><CaseStudyList studies={caseStudies} locale={locale} /></section>
    <section><h2>{d.otherWork[locale]}</h2><ProjectList entries={projectEntries.filter(entry => !entry.employer)} locale={locale} /></section>
    {employments.map(({ employer, period, relationship }) => <section key={employer}><h2>{employer}</h2>
      <p><time dateTime={period.start}>{formatDate(period.start, locale)}</time>{d.periodSeparator[locale]}
        {period.end === null ? d.present[locale] : <time dateTime={period.end}>{formatDate(period.end, locale)}</time>}
      </p>
      <p>{relationship[locale]}</p>
      <ProjectList entries={projectEntries.filter(entry => entry.employer === employer)} locale={locale} />
    </section>)}
    <LanguageSelector locale={locale} suffix="/work" /></>;
}
