import Link from "next/link";
import { locales, type Locale } from "@/content/types";
import { dictionary as d } from "@/content/dictionary";
export function LanguageSelector({ locale, suffix = "" }: { locale: Locale; suffix?: string }) {
  return <nav aria-label={d.languages[locale]}>{locales.map((language) =>
    <Link key={language} href={`/${language}${suffix}`} hrefLang={language} lang={language}
      aria-current={language === locale ? "page" : undefined}>
      {language === "es" ? d.spanish[locale] : d.english[locale]}
    </Link>
  )}</nav>;
}
