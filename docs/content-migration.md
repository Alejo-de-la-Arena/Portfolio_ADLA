# Migración del contenido real

Fuente: portfolio anterior, https://portfolio-adla.vercel.app/, leído desde la copia local `../Portfolio-Alejo/portfolio-dev` sin modificarla.
Se leyeron `src/data/experiences.ts`, `src/data/caseStudies.ts` y `src/data/projectMedia.ts`.

Los títulos, metadatos, highlights, secciones, párrafos, bullets y leads de Solution, Don Teófilo y FORMAT se copian literalmente en ES/EN. Los hashes en `web/content/fixtures/legacy-case-hashes.json` se obtuvieron del texto original antes de segmentarlo y se verifican en tests. `purchase_<orderId>` y `*` se renderizan como código conservando los caracteres originales.
Los resúmenes de los case studies son las primeras dos oraciones literales del resumen original. Las entradas compactas conservan el resumen existente; los proyectos de Zetenta sin resumen usan la primera oración de su contribución. Manantial conserva el resumen de `caseStudies.ts`.
Se usa el stack de cada experiencia para los case studies y el de cada proyecto para las entradas compactas. Se conservan los slugs anteriores o los IDs de proyecto de Zetenta.

Las seis capturas se copiaron sin conversión desde `public/images/experiencia/`. Se midieron los archivos con Sharp y los tests verifican sus cabeceras independientemente de los datos declarados. El cover es la captura desktop y la galería adicional contiene la captura mobile; ambas forman el conjunto de capturas de cada caso.

No se incorporan Job Match Bot ni VYZON.

## Correcciones confirmadas de contenido

- Los siete proyectos de Zetenta no tienen fechas individuales. `ProjectEntry.period` puede omitirse solo cuando hay `employer`; el período del empleo (abril–octubre de 2025, relación de dependencia) vive una sola vez en `employments` y se muestra en el encabezado del grupo en `/work`.
- Laura Kyriazis Law Group: período abril de 2024–agosto de 2026; stack Next.js, TypeScript, Tailwind CSS, Framer Motion, next-intl y Resend. Se actualizan el resumen ES/EN y la URL con los datos confirmados.
- Solution: febrero–septiembre de 2026 corresponde al trabajo; abril–octubre de 2026 corresponde al período en producción. La diferencia es intencional y se conservan fechas y textos originales.
- Solution incluye `https://solution-topaz.vercel.app`, con etiqueta ES/EN que aclara que es una versión archivada con checkout desactivado. Conserva el estado `archived`.

## Rutas y renderizado

Se conserva Next.js 16.4.5, App Router, Server Components y la garantía estática existente. `next/image` recibe archivos locales con dimensiones explícitas y tamaños adaptables, sin introducir componentes cliente ni diseño visual.
`lib/routes.ts` deriva los detalles solo de los case studies. El mismo inventario deriva `workImagePaths`; Proxy permite únicamente esas capturas exactas y deja que los archivos inexistentes reciban 404. Las entradas compactas nunca generan páginas propias.
El texto enriquecido es una unión discriminada de texto traducido, código compartido y enlace con etiqueta traducida y destino único; no admite HTML libre ni Markdown.
`Period.end` ausente significa desconocido; `null` significa en curso. Los case studies siempre especifican el final o `null`.
