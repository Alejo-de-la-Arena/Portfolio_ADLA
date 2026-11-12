import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { caseStudies } from "@/content/case-studies";
import { profile } from "@/content/profile";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
import { CaseIndex } from "@/components/case-index";
import { CopyButton } from "@/components/copy-button";
import s from "./home.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "", profile.name + d.titleSeparator[locale] + d.siteTitle[locale], profile.headline[locale]);
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return <>
    <section className={s.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className={s.name}>{profile.name}</h1>
      <p className={s.headline}>{profile.headline[locale]}</p>
      <p className={s.availability}>{profile.availability[locale]}</p>
      <section id="contact" className={s.contact} aria-labelledby="contact-title" tabIndex={-1}>
        <h2 id="contact-title" className="visually-hidden">{ui.contact[locale]}</h2>
        <ul className={s.contactList}>
          <li className={s.emailItem}>
            <a href={`mailto:${profile.contact.email}`} className={s.email}>{profile.contact.email}</a>
            <CopyButton value={profile.contact.email} locale={locale} className={s.copy} />
          </li>
          {profile.contact.links.map((link) => <li key={link.href}><a href={link.href} className={s.profileLink}>{link.label}</a></li>)}
        </ul>
      </section>
      <h2 className={s.indexTitle}>{d.featured[locale]}</h2>
      <CaseIndex studies={caseStudies.filter((study) => study.featured)} locale={locale} />
    </section>
    <footer className="site-footer"><LanguageSelector locale={locale} /></footer>
  </>;
}
