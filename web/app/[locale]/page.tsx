import Link from "next/link";
import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { caseStudies } from "@/content/case-studies";
import { employments, projectEntries } from "@/content/projects";
import { profile } from "@/content/profile";
import { requireLocale } from "@/lib/routing";
import { pageMetadata } from "@/lib/metadata";
import { LanguageSelector } from "@/components/language-selector";
import { CasePoster } from "@/components/case-poster";
import { CopyButton } from "@/components/copy-button";
import s from "./home.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return pageMetadata(locale, "", profile.name + d.titleSeparator[locale] + d.siteTitle[locale], profile.headline[locale]);
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  const featured = caseStudies.filter((study) => study.featured).sort((a, b) => a.order - b.order);
  const groups = [
    { label: d.independentWork[locale], entries: projectEntries.filter((entry) => !entry.employer) },
    ...employments.map(({ employer }) => ({
      label: d.atEmployer[locale].replace("{employer}", employer),
      entries: projectEntries.filter((entry) => entry.employer === employer),
    })),
  ].filter((group) => group.entries.length > 0);

  return <>
    <section className={s.hero} aria-labelledby="hero-title">
      {/* Sized in container units so the name spans exactly the available width at any size. */}
      <div className={s.nameFit}><h1 id="hero-title" className={s.name}>{profile.name}</h1></div>
      <div className={s.intro}>
        <p className={s.headline}>{profile.headline[locale]}</p>
        <div className={s.reach}>
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
        </div>
      </div>
    </section>

    <section className={s.featured} aria-labelledby="featured-title">
      <h2 id="featured-title" className={s.sectionTitle}>{d.featured[locale]}</h2>
      {featured.map((study, index) => <CasePoster key={study.slug} study={study} locale={locale} preload={index === 0} />)}
    </section>

    <section className={s.other} aria-labelledby="other-title">
      <h2 id="other-title" className={s.sectionTitle}>{d.otherWork[locale]}</h2>
      {groups.map((group) => <div key={group.label} className={s.group}>
        <h3 className={s.groupLabel}>{group.label}</h3>
        <ul className={s.names}>{group.entries.map((entry) => <li key={entry.slug}>{entry.name[locale]}</li>)}</ul>
      </div>)}
      <p className={s.allWork}><Link href={`/${locale}/work`}>{d.allWork[locale]}</Link></p>
    </section>
    <footer className="site-footer"><LanguageSelector locale={locale} /></footer>
  </>;
}
