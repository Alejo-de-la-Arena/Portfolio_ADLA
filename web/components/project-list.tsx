import { dictionary as d } from "@/content/dictionary";
import type { Locale, ProjectEntry } from "@/content/types";
import { formatDate } from "@/lib/dates";

export function ProjectList({ entries, locale }: { entries: readonly ProjectEntry[]; locale: Locale }) {
  return <ul>{entries.map(entry => <li key={entry.slug}><article>
    <h3>{entry.name[locale]}</h3>
    <p>{d.client[locale]}: {entry.client}</p>
    <p>{entry.role[locale]}</p>
    {entry.period && <p><time dateTime={entry.period.start}>{formatDate(entry.period.start, locale)}</time>
      {entry.period.end !== undefined && <>{d.periodSeparator[locale]}{entry.period.end === null ? d.present[locale] : <time dateTime={entry.period.end}>{formatDate(entry.period.end, locale)}</time>}</>}
    </p>}
    <p>{entry.summary[locale]}</p>
    {entry.stack.length > 0 && <ul className="data" aria-label={d.stack[locale]}>{entry.stack.map(item => <li key={item}>{item}</li>)}</ul>}
    {entry.url && <a href={entry.url}>{d.visitSite[locale]}</a>}
  </article></li>)}</ul>;
}
