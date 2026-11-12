import localFont from "next/font/local";
export const textFont = localFont({
  src: "../public/fonts/hanken-grotesk-latin.woff2", weight: "100 900", style: "normal",
  variable: "--font-hanken", display: "swap", fallback: [], adjustFontFallback: false,
});
export const codeFont = localFont({
  src: "../public/fonts/jetbrains-mono-latin.woff2", weight: "100 800", style: "normal",
  variable: "--font-jetbrains", display: "swap", fallback: [], adjustFontFallback: false,
});
// Display face for large type (names, titles, figures). Lives outside public/: next/font serves it from
// /_next/static/media, so the Proxy matcher stays unchanged. See docs/design-direction.md.
export const displayFont = localFont({
  src: "../assets/fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal",
  variable: "--font-bricolage", display: "swap", fallback: [], adjustFontFallback: false,
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});
