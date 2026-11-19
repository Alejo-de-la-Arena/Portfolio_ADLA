import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { dictionary as d } from "@/content/dictionary";
import { profile } from "@/content/profile";
import { metadataBase, ogImageSize } from "@/lib/metadata";
import { requireLocale } from "@/lib/routing";
import { ogImageId } from "@/lib/routes";

// One card per locale. pageMetadata points every page to it: a page that declares its own openGraph would
// otherwise drop the image the file convention adds at this segment. Static TTF instances of the site fonts
// (scripts/instance-og-fonts.py): ImageResponse reads neither WOFF2 nor variable axes.
const font = (file: string) => readFile(join(process.cwd(), "assets/og-fonts", file));
const [display, text, mono] = await Promise.all([
  font("bricolage-grotesque-800-75.ttf"), font("hanken-grotesk-500.ttf"), font("jetbrains-mono-400.ttf"),
]);
export const size = ogImageSize;
const contentType = "image/png";
// Same colours as globals.css: pure black and white, the cyan field with black text (11.7:1).
const ink = "#000000", paper = "#FFFFFF", field = "#35D3EA";

// Locales come from the layout's generateStaticParams. Next's loader calls this twice: with {} while it
// only enumerates ids for static generation, and with { locale } when it resolves the page metadata and
// the image. Only the second one needs the alt text, so the id is returned on its own in the first.
export async function generateImageMetadata({ params }: { params: Promise<{ locale?: string }> | { locale?: string } }) {
  const { locale } = await params;
  if (locale === undefined) return [{ id: ogImageId, size, contentType }];
  return [{ id: ogImageId, alt: d.ogImageAlt[requireLocale(locale)], size, contentType }];
}
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: paper, color: ink }}>
      <div style={{ display: "flex", flexDirection: "column", padding: "48px 56px 36px", borderBottom: `2px solid ${ink}` }}>
        <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 24 }}>{metadataBase.host}</div>
        <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 208, lineHeight: 0.9, letterSpacing: "-0.015em", marginTop: 28 }}>{profile.name}</div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "flex-end", background: field, padding: "36px 56px 48px" }}>
        <div style={{ display: "flex", fontFamily: "Hanken Grotesk", fontSize: 36, lineHeight: 1.3 }}>{profile.headline[locale]}</div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: display, weight: 800, style: "normal" },
        { name: "Hanken Grotesk", data: text, weight: 500, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
