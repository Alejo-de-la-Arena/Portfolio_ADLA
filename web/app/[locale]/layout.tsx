import Link from "next/link";
import { locales } from "@/content/types";
import { dictionary as d, visualUi as ui } from "@/content/dictionary";
import { requireLocale } from "@/lib/routing";
import { textFont, codeFont, displayFont } from "@/lib/fonts";
import { metadataBase } from "@/lib/metadata";
import { LocaleProvider } from "@/components/locale-context";
import "../globals.css";

export const ensureStatic = "navigation";
export const metadata = { metadataBase };
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  return <html lang={locale} className={`${textFont.variable} ${codeFont.variable} ${displayFont.variable}`}><body>
    <LocaleProvider locale={locale}>
      <header className="site-header"><nav aria-label={d.navigation[locale]}>
        <Link href={`/${locale}`}>{d.home[locale]}</Link>
        <Link href={`/${locale}/work`}>{d.work[locale]}</Link>
        {/* Contact details live on the home, right under the availability line. */}
        <Link href={`/${locale}#contact`}>{ui.contact[locale]}</Link>
      </nav></header>
      <main>{children}</main>
    </LocaleProvider>
  </body></html>;
}
