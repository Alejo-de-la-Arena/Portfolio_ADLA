import type { Text } from "./types";
export const dictionary = {
  siteTitle: { es: "Portfolio de Alejo", en: "Alejo’s portfolio" },
  description: { es: "Portfolio full-stack en construcción.", en: "Full-stack portfolio under construction." },
  home: { es: "Inicio", en: "Home" },
  work: { es: "Proyectos", en: "Work" },
  placeholder: { es: "Próximamente: contenido del portfolio.", en: "Coming soon: portfolio content." },
  navigation: { es: "Navegación principal", en: "Main navigation" },
  languages: { es: "Idiomas", en: "Languages" },
  present: { es: "Actualidad", en: "Present" },
  stack: { es: "Tecnologías", en: "Technologies" },
  links: { es: "Enlaces", en: "Links" },
  highlights: { es: "Resultados destacados", en: "Highlights" },
  spanish: { es: "Español", en: "Español" },
  english: { es: "English", en: "English" },
  periodSeparator: { es: " — ", en: " — " },
  titleSeparator: { es: " | ", en: " | " },
  notFoundTitle: { es: "Página no encontrada", en: "Page not found" },
  notFoundDescription: { es: "La dirección solicitada no existe.", en: "The requested address does not exist." },
  backHome: { es: "Volver al inicio", en: "Back to home" },
} satisfies Record<string, Text>;

export const formatting = { leadSeparator: { es: " ", en: " " } } satisfies Record<string, Text>;
