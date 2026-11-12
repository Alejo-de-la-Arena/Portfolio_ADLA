import Link from "next/link";
import { dictionary as d } from "@/content/dictionary";
import type { Locale } from "@/content/types";
export function NotFoundContent({ locale }: { locale: Locale }) {
  return <div className="plain-page"><h1>{d.notFoundTitle[locale]}</h1><p>{d.notFoundDescription[locale]}</p>
    <Link href={`/${locale}`}>{d.backHome[locale]}</Link></div>;
}
