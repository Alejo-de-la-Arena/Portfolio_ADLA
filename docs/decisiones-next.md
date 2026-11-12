# Decisiones de Next.js — revisión 2026-11-10

Versión instalada y conservada: Next.js 16.4.5. Se consultaron sus guías en web/node_modules/next/dist/docs/ antes de aplicar las decisiones.

## App Router, parámetros y tipos generados

Las carpetas son direcciones y el layout es su marco. El layout raíz sigue en app/[locale] para emitir html lang desde el HTML inicial.
Usamos PageProps y LayoutProps generados por Next, con await params. requireLocale valida el locale de la petición y usa notFound() como defensa; no lanza un Error genérico. generateStaticParams enumera contenido válido y no llama a este helper.
Proxy procesa URLs inválidas antes del layout. El slug es el número de documento del proyecto: un único id compartido por idiomas.
El layout enumera idiomas y el detalle enumera slugs; Next combina los parámetros. La unicidad del slug es global.

## Server Components

Son como una cocina que entrega el plato preparado. Las páginas y el selector son Server Components, sin estado del navegador.
Ser Server Component no significa ejecutar por petición: las páginas se prerenderizan en el build.
not-found no recibe props. Un pequeño contexto cliente comunica el idioma del layout a la frontera de error. El provider no convierte sus children de servidor en Client Components.

## Garantía estática actual

Es una inspección del edificio completo. Activamos cacheComponents: true y ensureStatic = "navigation" en el layout raíz.
Según la documentación instalada, exige el renderizado completo estático, incluso metadata y datos de petición detrás de Suspense, y valida tanto dev como build.
Reemplaza aquí a dynamic = "error", que pertenece al modelo anterior. Quitamos dynamicParams porque no está disponible con Cache Components.
No elegimos shell o prefetch porque permiten trabajo posterior por petición; force-static puede ocultar APIs de petición devolviendo valores vacíos.

ensureStatic protege el renderizado del servidor, no impide Proxy ni JavaScript del navegador. Tampoco restringe por sí solo parámetros: puede generar valores no enumerados al visitarlos.
Por eso Proxy admite únicamente las rutas derivadas del contenido y responde 404 para las demás.

El build muestra patrones genéricos ◐ además de URLs concretas ○. El verificador exige compute: static y response: complete en cada URL de contenido.
renderingMode: PARTIALLY_STATIC identifica el motor y por sí solo no indica si queda cómputo dinámico.

Fuentes locales:
- 01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md (introducido en 16.4.0).
- 01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md.
- 01-app/02-guides/keeping-pages-static.md.

## Prefetch durante la migración

Es conservar el recorrido entre habitaciones mientras cambiamos la inspección de construcción.
partialPrefetching: false mantiene la navegación previa al migrar a Cache Components. ensureStatic navigation funciona sin prefetch parcial.
La alternativa true incorpora un App Shell compartido y etapas de precarga; Next la recomienda para proyectos nuevos. Aquí conservamos explícitamente el comportamiento existente.
Fuente local: 01-app/02-guides/adopting-partial-prefetching.md.

## Proxy y 404

Proxy es el recepcionista. En / negocia Accept-Language, conserva query, usa 307 temporal, Vary y Cache-Control para evitar reutilizar una preferencia ajena.
En rutas con locale válido consulta el inventario del contenido. Las desconocidas reciben un documento HTML estático ES/EN y estado 404 real desde NextResponse.
Los dos documentos se construyen una vez por carga del módulo a partir del mismo diccionario, escapan HTML y usan la fuente local Hanken. No realizan renderizado de React por petición ni requieren JavaScript.
app/[locale]/not-found.tsx se conserva como frontera defensiva dentro del árbol React.

### Limitación comprobada y workaround

En esta versión, notFound() dentro de un segmento dinámico produjo HTTP 404 pero html id="__next_error__" sin lang y sin texto visible inicial.
También comprobamos que el status de una reescritura no basta para convertir una página 200 en 404. No usamos ninguna de esas dos opciones para las URLs desconocidas.
La respuesta HTML directa desde Proxy evita el bug sin cambiar la versión instalada. Es una excepción documentada al renderizado de errores mediante el árbol React, con datos y fuentes compartidos.
Se puede retirar cuando Next corrija el problema y pasen las pruebas HTTP con JavaScript ausente.

Issue oficial confirmado: https://github.com/vercel/next.js/issues/100596

Para direcciones sin idioma válido se usa app/global-not-found.tsx, mediante experimental.globalNotFound: true.
Esa API omite layouts: importa sus propias fuentes/CSS y emite html/body. El documento global es bilingüe, con lang principal es y secciones lang es/en.
Todos los errores tienen noindex; no reciben canonical/hreflang de páginas indexables.
Corrección respecto del documento original: notFound no garantiza siempre HTTP 404 cuando ya empezó streaming; comprobamos estado, idioma y texto del HTML inicial juntos.
Fuente local: 01-app/03-api-reference/03-file-conventions/not-found.md.
Se necesita servidor Next para Proxy; no se usa output: export.

## Fuentes

Es guardar los materiales antes de abrir. Usamos next/font/local con Hanken Grotesk para texto y JetBrains Mono para fechas, stack y código.
Los archivos Latin variables fueron descargados por next/font/google en la verificación inicial y quedaron en public/fonts con sus licencias OFL.
Elegimos local frente a Google durante build para compartir los mismos archivos con el 404 directo y evitar futuras descargas de red.
fallback: [] y adjustFontFallback: false evitan familias del sistema explícitas y fallback automático.
Tailwind redefine font-sans, font-mono y las familias por defecto del preflight; no utiliza ui-sans-serif ni ui-monospace como familias efectivas.
El navegador conserva su sustitución final si un archivo no carga; CSS no puede eliminar ese comportamiento.
Fuentes locales: 01-app/01-getting-started/13-fonts.md y 01-app/03-api-reference/02-components/font.md.

## Metadata

Es una ficha con dirección principal y traducciones equivalentes.
El helper genera metadataBase, canonical, alternates.languages es/en/x-default y Open Graph básico para cada home, listado y proyecto.
x-default apunta a la versión española equivalente, para no perder el proyecto. / continúa negociando idioma.
SITE_URL define el origen absoluto; localhost:3000 es solo el default de desarrollo y debe sustituirse antes de un build para publicar.
Los 404 llevan noindex, sin anunciar URLs de error como traducciones indexables.
Se usa Metadata API, no head manual; los valores se resuelven durante prerenderizado.

## Selector e interfaz

Link conecta habitaciones. Un único LanguageSelector recibe locale y sufijo compartido y marca el idioma actual con aria-current.
Es Server Component: la página ya conoce su idioma, no necesita usePathname.
Textos, nombres de idiomas y separadores viven en dictionary.ts. Los tokens de espaciado se validan por longitud, no por trim.

## Fechas y datos técnicos

Slug, fechas, stack e href se almacenan una vez. Texto visible traducible lleva es/en.
ISODate distingue fechas del texto libre; la validación comprueba formato YYYY-MM o YYYY-MM-DD, calendario real y orden.
Un mes se normaliza al día 1 para comparar, pero se muestra sin día.
Intl.DateTimeFormat usa el idioma y timeZone UTC para evitar retroceder un día en Argentina.

## Verificación y dependencias

pnpm verify:build usa proyectos e idiomas del contenido y requiere pnpm start en otra terminal.
Comprueba manifiesto, HTTP 200, canonical, hreflang, Open Graph, aria-current, redirecciones y 404 con lang, texto visible y noindex.
Vitest configura @/ y prueba Proxy con NextRequest. Las versiones directas son exactas; el lockfile fija las transitivas.

## Segunda revisión: archivos, inventario y canario

El matcher ya no excluye todo /fonts/: enumera los archivos públicos existentes, con puntos escapados y final de ruta. Un archivo inexistente pasa por Proxy y termina en el 404 global; un locale inválido tampoco llega al layout. requireLocale usa notFound() como defensa adicional si se invoca fuera del flujo de Proxy. Se conserva globalNotFound y el workaround localizado, sin cambiar Next 16.4.5.

app/icon.svg usa la convención de metadata de Next. Como esa convención no crea /favicon.ico, se agrega también app/favicon.ico, un ICO real de 32x32. Ambos tienen su excepción exacta. robots.txt, sitemap.xml, otros íconos y opengraph-image necesitan una excepción propia cuando existan; no excluir anticipadamente archivos inexistentes. Los recursos internos /_next/ continúan bajo control de Next.
Fuente: documentación instalada 01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md y proxy.md; https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons.

lib/routes.ts es la única fuente del inventario para Proxy y verify-build.mjs. Sus imports relativos con extensión .ts permiten ejecutarlo con Node sin resolver @/. allowImportingTsExtensions es compatible con noEmit; no cambia el runtime de Next. routes.test.ts recorre recursivamente app/[locale] y exige que cada page.tsx tenga al menos una URL en ese inventario. Agregar una página requiere actualizar el inventario; los slugs siguen derivados del contenido.

verify:build comprueba además /favicon.ico y /icon.svg (200, imagen no vacía), /fonts/no-existe.woff2 (404) y /es/no-existe (404 con lang, traducción y noindex). Se elimina la carpeta vacía app/[locale]/404.

### Canario de retirada del workaround

next-not-found.canary.test.ts está salteado por defecto. Para ejecutarlo en PowerShell:

```powershell
$env:NEXT_NOT_FOUND_CANARY = "1"
pnpm test
Remove-Item Env:NEXT_NOT_FOUND_CANARY
```

Copia la aplicación a una carpeta temporal sin proxy.ts, enlaza las dependencias instaladas, construye con webpack (permite dependencias fuera de la raíz temporal) y arranca Next en un puerto libre. No modifica ni desactiva el Proxy original. Solicita un slug inexistente en ES y EN sin JavaScript y exige HTTP 404, html lang, título traducido y noindex. El canario debe FALLAR con el bug #100596 y pasar cuando Next lo resuelva; no se invierte la aserción para validar el bug. Al pasar, revisar la retirada del documento manual y volver a ejecutar verify:build. La copia y el servidor se limpian al finalizar.

Comprobación 2026-11-10: el canario fue ejecutado explícitamente y reprodujo el 404 con html id="__next_error__" sin lang ni texto visible. Se conserva el workaround. La suite normal mantiene el canario salteado.

## Dirección B en las rutas reales (2026-11-12)

Los previews /[locale]/preview/a y /preview/b se retiraron: sus rutas, estilos, la fuente Archivo, las entradas de Proxy y los chequeos de verify-build. Ahora responden 404 como cualquier ruta desconocida, y verify-build lo comprueba. Esta migración no agregó decisiones de Next.js; usa las ya documentadas:

- Server Components para home, listado y case study. Las páginas siguen prerenderizadas y estáticas (verify-build: compute static y response complete).
- Un solo Client Component para el diagrama (components/system-diagram.tsx), que necesita estado, requestAnimationFrame, IntersectionObserver y matchMedia. El servidor lo prerenderiza en «todo el sistema», que es también lo que se ve sin JavaScript o con prefers-reduced-motion. El recorrido es un reducer puro (components/walkthrough.ts, con tests): si reduced motion se activa en pleno recorrido, un listener de matchMedia despacha `reducedMotion` y vuelve a la vista completa. Otro Client Component es el botón para copiar el email.
- CSS Modules por ruta (home.module.css, work.module.css, case.module.css) y globals.css con los tokens de B. El tema de cada proyecto es la variable `--field`, que se asigna inline por case study y por fila del índice.
- next/font/local para Bricolage Grotesque desde web/assets/fonts (fuera de public/, servida en /_next/static/media; el matcher de Proxy no cambia). `declarations` declara el rango de font-stretch.
- La navegación general (layout) agrega «Contacto», que apunta a /[locale]#contact, en la home.
