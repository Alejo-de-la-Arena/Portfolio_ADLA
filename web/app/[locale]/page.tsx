import { dictionary as d } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
import { CaseStudyList } from "@/components/case-study-list";
import { caseStudies } from "@/content/case-studies";
export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "", d.siteTitle[locale], d.description[locale]);
}
export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return <><h1>{d.siteTitle[locale]}</h1><p>{d.placeholder[locale]}</p>
    <section><h2>{d.featured[locale]}</h2><CaseStudyList studies={caseStudies.filter(study => study.featured)} locale={locale} /></section>
    <LanguageSelector locale={locale} /></>;
}
