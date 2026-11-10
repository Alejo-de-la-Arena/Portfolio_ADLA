import localFont from "next/font/local";
export const textFont = localFont({
  src: "../public/fonts/hanken-grotesk-latin.woff2", weight: "100 900", style: "normal",
  variable: "--font-hanken", display: "swap", fallback: [], adjustFontFallback: false,
});
export const codeFont = localFont({
  src: "../public/fonts/jetbrains-mono-latin.woff2", weight: "100 800", style: "normal",
  variable: "--font-jetbrains", display: "swap", fallback: [], adjustFontFallback: false,
});
