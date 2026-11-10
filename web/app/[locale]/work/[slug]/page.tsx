import type { Metadata } from "next";
import { LanguageSelector } from "@/components/language-selector";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";
import { caseStudies, findCaseStudy } from "@/content/case-studies";
import { dictionary as d, formatting } from "@/content/dictionary";
import type { Locale, RichText } from "@/content/types";
import { requireLocale } from "@/lib/routing";

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
  return pageMetadata(locale, "/work/" + study.slug, study.title[locale] + d.titleSeparator[locale] + d.siteTitle[locale], study.roleLine[locale]);
}
function TextContent({ item, locale }: { item: RichText; locale: Locale }) {
  return <>{item.lead && <><strong>{item.lead[locale]}</strong>{formatting.leadSeparator[locale]}</>}{item.text[locale]}</>;
}
export default async function CaseStudyPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { study, locale } = await resolveStudy(params);
  return <article>
    <header><h1>{study.title[locale]}</h1><p>{study.roleLine[locale]}</p>
      <p><time dateTime={study.period.start}>{formatDate(study.period.start, locale)}</time>{d.periodSeparator[locale]}
        {study.period.end ? <time dateTime={study.period.end}>{formatDate(study.period.end, locale)}</time> : d.present[locale]}</p>
    </header>
    <section><h2>{d.stack[locale]}</h2><ul className="data">{study.stack.map((item, i) => <li key={i}>{item}</li>)}</ul></section>
    <section><h2>{d.links[locale]}</h2><ul>{study.links.map((link, i) => <li key={i}><a href={link.href}>{link.label[locale]}</a></li>)}</ul></section>
    <section><h2>{d.highlights[locale]}</h2><ul>{study.highlights.map((item, i) => <li key={i}>{item[locale]}</li>)}</ul></section>
    {study.sections.map((section, i) => <section key={i}><h2>{section.heading[locale]}</h2>
      {section.blocks.map((block, j) => block.type === "paragraph"
        ? <p key={j}><TextContent item={block} locale={locale} /></p>
        : <ul key={j}>{block.items.map((item, k) => <li key={k}><TextContent item={item} locale={locale} /></li>)}</ul>)}
    </section>)}
    <LanguageSelector locale={locale} suffix={"/work/" + study.slug} />
  </article>;
}
