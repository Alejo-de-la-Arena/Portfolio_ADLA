import Link from "next/link";
import { caseStudies } from "@/content/case-studies";
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
  return <><h1>{d.work[locale]}</h1><ul>{caseStudies.map((study) =>
    <li key={study.slug}><Link href={`/${locale}/work/${study.slug}`}>{study.title[locale]}</Link><p>{study.roleLine[locale]}</p></li>
  )}</ul><LanguageSelector locale={locale} suffix="/work" /></>;
}
