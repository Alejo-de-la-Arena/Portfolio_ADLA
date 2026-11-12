import localFont from "next/font/local";

// Display faces for the design previews. They live outside public/ so they are only served
// through next/font (/_next/static/media) and the Proxy matcher stays unchanged.
export const plateFont = localFont({
  src: "../assets/fonts/archivo-latin.woff2", weight: "100 900", style: "normal",
  variable: "--font-archivo", display: "swap", fallback: [], adjustFontFallback: false,
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});
export const posterFont = localFont({
  src: "../assets/fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal",
  variable: "--font-bricolage", display: "swap", fallback: [], adjustFontFallback: false,
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});
