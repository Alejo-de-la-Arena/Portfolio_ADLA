import { dictionary as d } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "", d.siteTitle[locale], d.description[locale]);
}
export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return <><h1>{d.siteTitle[locale]}</h1><p>{d.placeholder[locale]}</p><LanguageSelector locale={locale} /></>;
}
