import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";
import { dictionary as d } from "@/content/dictionary";
import { textFont, codeFont } from "@/lib/fonts";
import { metadataBase } from "@/lib/metadata";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase, title: d.notFoundTitle.es, description: d.notFoundDescription.es,
  robots: { index: false, follow: false },
};
export default function GlobalNotFound() {
  return <html lang="es" className={`${textFont.variable} ${codeFont.variable}`}><body><main>
    <section lang="es"><NotFoundContent locale="es" /></section>
    <section lang="en"><NotFoundContent locale="en" /></section>
  </main></body></html>;
}
