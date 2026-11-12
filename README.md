# Portfolio de Alejo

Monorepo de un portfolio full-stack bilingüe, con Next.js 16.4.5 App Router y contenido tipado. Todavía sin diseño visual definitivo.

- web/: aplicación, contenido, tests y verificación.
- api/: servicio Go previsto para semana 3.
- docs/: decisiones y salida del build.
- AGENTS.md: reglas del repositorio.

## Ejecutar

Node.js >=22.20.0 y pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir http://localhost:3000. / negocia Accept-Language y usa español como fallback.

```sh
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Con el servidor de producción en otra terminal:

```sh
pnpm verify:build
```

TEST_BASE_URL cambia el servidor que verifica el script. SITE_URL define el origen de canonical/hreflang/Open Graph y debe tener el mismo valor durante build y verificación.
Sin SITE_URL se usa http://localhost:3000; establecer el dominio real antes de publicar. Las fuentes y licencias están en web/public/fonts; next/font/local no necesita descargarlas durante el build.

## Contenido

Editar web/content/case-studies.ts, projects.ts y dictionary.ts. El alias @/ apunta a web/.
Cada proyecto tiene un slug técnico compartido, fechas ISO (YYYY-MM o YYYY-MM-DD), stack e href sin duplicación. Texto visible traducible requiere es/en.
ISODate y los tests validan fechas; Intl.DateTimeFormat las presenta por idioma en UTC.
Un mes se compara como su día 1, pero se muestra sin día. end: null significa proyecto en curso.
Los bloques admiten párrafos y bullets con segmentos tipados de texto, código inline y enlaces, con lead opcional en strong. Cada case study tiene estado, orden, destacado, resumen y capturas locales en public/work/<slug>/ con alt ES/EN y dimensiones explícitas, servidas con next/image.
Las entradas compactas no tienen detalle propio; las de Zetenta se agrupan por employer. Un período ausente o un final omitido representan datos desconocidos; end: null se reserva para trabajo en curso.
Ver [procedencia y datos faltantes](docs/content-migration.md).

Se generan home, listado y cada proyecto en ambos idiomas, más el 404 global. Los 404 localizados son documentos estáticos servidos directamente por Proxy para evitar un bug confirmado de Next 16.4.5 (ver decisiones).
Cache Components y ensureStatic="navigation" garantizan el renderizado estático. Proxy negocia / y responde a URLs desconocidas con 404 traducidos.
Se requiere servidor Next; no es una exportación HTML sin servidor.
Las fuentes provisorias son Hanken Grotesk y JetBrains Mono mediante next/font.

Ver [decisiones de Next](docs/decisiones-next.md) y [salida del build](docs/build-output.txt).

El canario de notFound sin Proxy está salteado por defecto. Activarlo con NEXT_NOT_FOUND_CANARY=1; procedimiento y criterio de retirada del workaround en [decisiones de Next](docs/decisiones-next.md#canario-de-retirada-del-workaround).
