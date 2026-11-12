import type { Text } from "./types";

// Home copy supplied by Alejo on 2026-11-12. The name is not translated, so it is stored once.
export const profile = {
  name: "Alejo de la Arena",
  headline: {
    es: "Desarrollador full-stack. Construyo aplicaciones web que operan negocios reales — React, TypeScript, Supabase. Hoy profundizando en Go y sistemas con IA.",
    en: "Full-stack developer building production web apps — React, TypeScript, Supabase. Currently going deeper into Go and AI systems.",
  },
  availability: {
    es: "Buenos Aires · UTC−3 · Abierto a roles full-stack remotos o híbridos.",
    en: "Buenos Aires · UTC−3 · Open to remote or hybrid full-stack roles.",
  },
  contact: {
    email: "alejodelaarenaa@gmail.com",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/alejo-de-la-arena/" },
      { label: "GitHub", href: "https://github.com/Alejo-de-la-Arena" },
    ],
  },
} as const satisfies {
  name: string; headline: Text; availability: Text;
  contact: { email: string; links: readonly { label: string; href: string }[] };
};
