import Link from "next/link";
import { dictionary as d } from "@/content/dictionary";
import type { CaseStudy, Locale } from "@/content/types";
import { WorkImage } from "@/components/work-image";

export function CaseStudyList({ studies, locale }: { studies: readonly CaseStudy[]; locale: Locale }) {
  return <ul>{[...studies].sort((a, b) => a.order - b.order).map(study => <li key={study.slug}>
    <article>
      <h3><Link href={`/${locale}/work/${study.slug}`}>{study.title[locale]}</Link></h3>
      <p>{d[study.status][locale]}</p>
      <WorkImage image={study.cover} locale={locale} />
      <p>{study.summary[locale]}</p>
    </article>
  </li>)}</ul>;
}
