import type { Employment, ProjectEntry } from "./types";

export const employments: readonly Employment[] = [{
  employer: "Zetenta",
  period: { start: "2025-04", end: "2025-10" },
  relationship: { es: "Relación de dependencia", en: "Employment" },
}];

export const projectEntries: readonly ProjectEntry[] = [
  {
    "slug": "manantial",
    "name": {
      "es": "Manantial",
      "en": "Manantial"
    },
    "client": "Manantial",
    "role": {
      "es": "Desarrollo completo WordPress",
      "en": "Full WordPress development"
    },
    "stack": [
      "WordPress",
      "Gutenberg",
      "ACF",
      "PHP",
      "JavaScript",
      "Sass"
    ],
    "summary": {
      "es": "Manantial tenía su contenido dentro del sitio de otra organización, sin una web propia. En Zetenta, desarrollé íntegramente su sitio de más de 45 páginas con WordPress, Gutenberg y ACF. Hoy el equipo edita todas las páginas sin tocar código.",
      "en": "Manantial’s content lived on another organization’s website, without a site of its own. At Zetenta, I developed its entire website of more than 45 pages using WordPress, Gutenberg, and ACF. The team now edits every page without touching code."
    },
    "url": "https://www.manantialghumano.com.ar/",
    "employer": "Zetenta"
  },
  {
    "slug": "yacoub",
    "name": {
      "es": "Bajó de precio",
      "en": "Price reductions"
    },
    "client": "Yacoub",
    "role": {
      "es": "Front-End + PHP",
      "en": "Front-End + PHP"
    },
    "stack": [
      "WordPress",
      "PHP",
      "JavaScript"
    ],
    "summary": {
      "es": "Desarrollé un backend PHP para consumir una API externa basada en Excel y normalizar los datos antes de renderizarlos en el servidor.",
      "en": "I developed a PHP backend to consume an external Excel-based API and normalize its data before server rendering."
    },
    "url": "https://yacoub.com.ar/bajo-de-precio/",
    "employer": "Zetenta"
  },
  {
    "slug": "madero-walk",
    "name": {
      "es": "Corporativos",
      "en": "Corporate events"
    },
    "client": "Madero Walk",
    "role": {
      "es": "Front-End (Elementor)",
      "en": "Front-End (Elementor)"
    },
    "stack": [
      "WordPress",
      "Elementor",
      "HTML",
      "CSS",
      "JavaScript"
    ],
    "summary": {
      "es": "Implementé landings por segmento en Elementor y componentes específicos con HTML, CSS y JavaScript.",
      "en": "I implemented segment-specific Elementor landing pages and custom HTML, CSS, and JavaScript components."
    },
    "url": "https://maderowalk.com/corporativos-madero-walk/",
    "employer": "Zetenta"
  },
  {
    "slug": "exagon-impact",
    "name": {
      "es": "Exagon Impact",
      "en": "Exagon Impact"
    },
    "client": "Exagon Impact",
    "role": {
      "es": "WordPress Developer",
      "en": "WordPress Developer"
    },
    "stack": [
      "WordPress",
      "PHP",
      "JavaScript",
      "Sass"
    ],
    "summary": {
      "es": "Creé la sección de portfolio, actualicé la home y desarrollé el bloque “Conocé al equipo”.",
      "en": "I created the portfolio section, updated the homepage, and developed the “Meet the team” block."
    },
    "url": "https://exagonimpact.com/portfolio/",
    "employer": "Zetenta"
  },
  {
    "slug": "aeroclub",
    "name": {
      "es": "Aeroclub Capitán Sarmiento",
      "en": "Aeroclub Capitán Sarmiento"
    },
    "client": "Aeroclub Capitán Sarmiento",
    "role": {
      "es": "Web Performance",
      "en": "Web Performance"
    },
    "stack": [
      "Performance",
      "WordPress",
      "CSS",
      "Lazy loading"
    ],
    "summary": {
      "es": "Audité la carga del sitio y trabajé sobre imágenes, lazy loading, CSS crítico y fuentes.",
      "en": "I audited site loading and worked on images, lazy loading, critical CSS, and fonts."
    },
    "url": "https://aeroclubcapitansarmiento.com/",
    "employer": "Zetenta"
  },
  {
    "slug": "zetenta-site",
    "name": {
      "es": "Zetenta.com",
      "en": "Zetenta.com"
    },
    "client": "Zetenta",
    "role": {
      "es": "Front-End Developer",
      "en": "Front-End Developer"
    },
    "stack": [
      "WordPress",
      "PHP",
      "JavaScript",
      "Sass"
    ],
    "summary": {
      "es": "Construí dos landings de servicios y contribuí al portfolio del sitio de Zetenta.",
      "en": "I built two service landing pages and contributed to Zetenta’s portfolio."
    },
    "url": "https://www.zetenta.com/web/es/service/desarrollo-web-ecommerce/",
    "employer": "Zetenta"
  },
  {
    "slug": "go-building",
    "name": {
      "es": "Go Building",
      "en": "Go Building"
    },
    "client": "Go Building",
    "role": {
      "es": "Front-End + integración CRM",
      "en": "Front-End + CRM integration"
    },
    "stack": [
      "WordPress",
      "JavaScript",
      "Kommo CRM",
      "HTML",
      "CSS"
    ],
    "summary": {
      "es": "Desarrollé dos landings e integré sus formularios con Kommo CRM.",
      "en": "I developed two landing pages and integrated their forms with Kommo CRM."
    },
    "url": "https://go-building.com/",
    "employer": "Zetenta"
  },
  {
    "slug": "espacio-boa",
    "name": {
      "es": "Espacio BOA",
      "en": "Espacio BOA"
    },
    "client": "Espacio BOA",
    "period": {
      "start": "2025-09",
      "end": "2025-11"
    },
    "role": {
      "es": "Full-Stack Developer",
      "en": "Full-Stack Developer"
    },
    "stack": [
      "Next.js",
      "TypeScript",
      "Supabase",
      "Tailwind",
      "Resend"
    ],
    "summary": {
      "es": "En BOA, las actividades del centro holístico se descubrían leyendo un calendario colgado en el café. Desarrollé una plataforma que reúne ambos espacios, publica la agenda y permite inscribirse con anticipación. Hoy funciona en producción y uno de los dueños administra las actividades desde el panel.",
      "en": "At BOA, discovering the holistic center’s activities meant reading a calendar on the café wall. I built a platform that brings both spaces together, publishes the schedule, and supports advance registration. It’s now live, with one of the owners managing activities through the dashboard."
    },
    "url": "https://espacioboa.com/"
  },
  {
    "slug": "renova-tu-cocina",
    "name": {
      "es": "Renová Tu Cocina",
      "en": "Renová Tu Cocina"
    },
    "client": "Renová Tu Cocina",
    "period": {
      "start": "2026-03",
      "end": "2026-03"
    },
    "role": {
      "es": "Full-Stack Developer",
      "en": "Full-Stack Developer"
    },
    "stack": [
      "Next.js 15",
      "Supabase",
      "PostgreSQL",
      "Server Actions",
      "Vercel"
    ],
    "summary": {
      "es": "Desarrollé en un mes el portfolio de obras y su panel de gestión con Next.js y Supabase. Los formularios preparan consultas por WhatsApp con el contexto del proyecto.",
      "en": "I developed the project portfolio and management dashboard in one month using Next.js and Supabase. Forms prepare WhatsApp inquiries with project context."
    },
    "url": "https://www.renovatucocina.com.ar"
  },
  {
    "slug": "mdvproyectos",
    "name": {
      "es": "MDVproyectos",
      "en": "MDVproyectos"
    },
    "client": "MDVproyectos",
    "period": {
      "start": "2024-11",
      "end": "2025-04"
    },
    "role": {
      "es": "Desarrollador WordPress",
      "en": "WordPress Developer"
    },
    "stack": [
      "WordPress",
      "SEO",
      "Performance"
    ],
    "summary": {
      "es": "Trabajé sobre el sitio WordPress existente y desarrollé landings para campañas. Organicé las mejoras en entregas cortas para revisar cada cambio dentro del sitio en uso.",
      "en": "I worked on the existing WordPress site and developed campaign landing pages. I organized improvements into small deliveries to review each change within the running site."
    },
    "url": "https://mdvproyectos.com.ar/"
  },
  {
    "slug": "fefe-bakes",
    "name": {
      "es": "Fefe Bakes",
      "en": "Fefe Bakes"
    },
    "client": "Fefe Bakes",
    "period": {
      "start": "2024-10",
      "end": "2024-12"
    },
    "role": {
      "es": "Full-Stack Developer",
      "en": "Full-Stack Developer"
    },
    "stack": [
      "React",
      "Redux",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Sequelize"
    ],
    "summary": {
      "es": "Desarrollé el frontend de la tienda con React y un backend Node.js/Express conectado a PostgreSQL. Separé interfaz y persistencia para mantener las responsabilidades de cada parte del sistema.",
      "en": "I developed the store frontend with React and a Node.js/Express backend connected to PostgreSQL. I separated the interface from persistence to keep each part’s responsibilities distinct."
    },
    "url": "https://fefebakes.com/"
  },
  {
    "slug": "kyriazis",
    "name": {
      "es": "Laura Kyriazis Law Group",
      "en": "Laura Kyriazis Law Group"
    },
    "client": "Laura Kyriazis Law Group",
    "period": {
      "start": "2024-04",
      "end": "2026-08"
    },
    "role": {
      "es": "Desarrollo web",
      "en": "Web development"
    },
    "stack": ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "next-intl", "Resend"],
    "summary": {
      "es": "Mi primer trabajo profesional, en abril de 2024: el sitio de un estudio de planificación patrimonial en San Francisco. La primera versión estaba en Framer y se dio de baja por la suscripción; en 2026 la reconstruí en Next.js, con versión en inglés y español, para que no dependa de un tercero.",
      "en": "My first professional project, in April 2024: the website for an estate planning firm in San Francisco. The first version was built in Framer and went offline over the subscription; in 2026 I rebuilt it in Next.js, in English and Spanish, so it no longer depends on a third party."
    },
    "url": "https://kyriazislawyer.com"
  }
];
