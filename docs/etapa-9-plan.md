# Etapa 9 — Lanzamiento: reemplazo del portfolio anterior, CV y LinkedIn

Estado: decisiones de Alejo incorporadas (2026-11-17); pendiente de revisión de Codex. Nada de esto está aplicado.
Restricciones: ~10 h/semana compartidas con la subetapa 7.0 (`docs/etapa-7-plan.md`). El sitio se lanza sin el Lab (nada de «próximamente») y **sin dominio propio**: la URL pública es `https://adla-portfolio.vercel.app`.

## Punto de partida (comprobado el 2026-11-17)

| Qué | Estado |
|---|---|
| Portfolio nuevo | Proyecto de Vercel `portfolio`, producción en `https://adla-portfolio.vercel.app`. |
| Portfolio anterior | Proyecto `portfolio-adla` en `portfolio-adla.vercel.app` (Vite + React Router, código en `../Portfolio-Alejo/portfolio-dev`). Rutas: `/` y `/experiencia/:slug`; cualquier otra ruta muestra la home. |
| Proyecto 2024 | `portfolio_alejo`, sin dominios propios. Hay que ver qué sirve en su URL `vercel.app`. |
| Previews | Patrón confirmado con una URL real: `https://portfolio-git-design-v1-alejodla.vercel.app`. El prefijo sale del nombre del proyecto (`portfolio`), no del alias de producción. Los previews responden `302` al login de Vercel (Deployment Protection) y con `X-Robots-Tag: noindex`. |

### `SITE_URL` en producción

`lib/metadata.ts` rechaza en el build cualquier `SITE_URL` con path, query o hash, así que un `/es` no puede llegar a producción. Lo publicado usa el origen exacto, sin barra doble ni idioma de más:

- canonical: `https://adla-portfolio.vercel.app/es`, `/en`, `/en/work`, `/es/work/solution`;
- hreflang `es`, `en` y `x-default` (→ versión `es`) con el mismo origen en esas páginas;
- `og:url` igual al canonical.

El valor literal de la variable no se pudo leer: la API de Vercel devolvió 403 al listar las variables y la CLI no está instalada. Una barra final (`https://adla-portfolio.vercel.app/`) daría la misma salida, porque `new URL` normaliza el path a `/`. **El sitemap y la imagen de Open Graph todavía no existen**; se verifican con este mismo origen al terminar 9.0.

### Problemas encontrados en producción

1. **Las rutas desconocidas sin idioma devuelven 200, no 404.** `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/cualquier-cosa` y `/fonts/no-existe.woff2` responden 200 con el documento de `global-not-found` (que trae `noindex`). Las rutas con idioma están bien (`/es/no-existe` y `/es/work/no-existe` devuelven 404). `verify:build` exige 404 para `/fonts/no-existe.woff2` y pasa en local con `pnpm start`, así que **en Vercel no pasa lo mismo que con `next start`**. Google marca estos casos como «soft 404».
2. **No hay `robots.txt`, `sitemap.xml` ni imagen de Open Graph.** `twitter:card` es `summary` y no hay `og:image`: al compartir el enlace en LinkedIn la tarjeta sale sin imagen.
3. **`og:site_name` dice «Portfolio de Alejo»** (`siteTitle` en `content/dictionary.ts`). En la tarjeta, el nombre completo dice más.

## Alcance

Entra:
- Correcciones previas en `web/` (los tres puntos de arriba), Vercel Web Analytics y la publicación del CV.
- Redirecciones 301 desde el portfolio anterior hacia `https://adla-portfolio.vercel.app`.
- CV en ES y EN y perfil de LinkedIn alineados con el contenido del sitio.
- Search Console y una verificación final.

No entra: el dominio propio (ver «Más adelante»), el Lab, `/system`, un blog ni contenido nuevo. Tampoco rediseñar nada: el sitio ya está aprobado.

## Cómo trabajamos

Igual que en las etapas 1–6: yo construyo lo de `web/`, Codex revisa, cada subetapa en una rama `stage9/<n>-<tema>` y merge a main al aprobar. **El CV y LinkedIn los escribís vos** (es tu voz y tu firma): yo propongo estructura, marco las inconsistencias con `web/content/` y reviso. Las cuentas (Vercel, Search Console, LinkedIn) son tuyas; yo te paso los valores exactos y verifico desde afuera.

## Subetapas

Horas tuyas (revisión incluida); lo que construyo yo no cuenta en tu presupuesto.

### 9.0 — Correcciones previas en `web/` (yo construyo; vos 3–4 h de revisión)

- **404 en Vercel (primero).** Reproducir en un preview, encontrar por qué `global-not-found` sale con 200 en Vercel y con 404 en `next start`, y corregirlo. Si la causa resulta ser otro bug de Next, va a `decisiones-next.md` con su issue, como el #100596. `verify:build` tiene que poder correr contra una URL desplegada (hoy da por hecho un servidor local), para que esto no se vuelva a escapar.
- **`app/robots.ts` y `app/sitemap.ts`** con la convención de metadata de Next. El sitemap sale de `lib/routes.ts` (la misma fuente que usan Proxy y `verify:build`) e incluye `alternates` es/en, todo con el origen de `SITE_URL`. Cada archivo lleva su excepción exacta en el matcher de Proxy, como ya dice `decisiones-next.md`. Explico la decisión antes de aplicarla.
- **Imagen de Open Graph** por idioma, estática, en la dirección B (Bricolage, tinta y campo; sin gradientes). `twitter:card` pasa a `summary_large_image`. Se prueba con el Post Inspector de LinkedIn.
- **`og:site_name`** pasa a «Alejo de la Arena» en los dos idiomas.
- **Vercel Web Analytics** (decidido: sí). Sin cookies, gratis en Hobby dentro de su cuota. Explico la integración antes de aplicarla y verifico que no rompa `ensureStatic` ni agregue peticiones en los previews de forma inesperada. Se activa también en el panel del proyecto (lo hacés vos).
- **Verificación de Search Console** para la propiedad de prefijo de URL `https://adla-portfolio.vercel.app/` (en un `vercel.app` no hay DNS propio para un TXT): meta tag con el campo `verification` de la Metadata API. El token no es secreto.
- **CV publicado:** `cv-es.pdf` y `cv-en.pdf` como archivos estáticos con su excepción en Proxy. Se enlazan desde Contacto con el idioma que corresponde, y `verify:build` comprueba 200 y `application/pdf`. Los PDF llegan en 9.2; hasta entonces el enlace no existe (no hay enlace a un archivo que falta), así que esta parte puede ir en una rama aparte.
- Terminado cuando: en un preview de Vercel, las rutas desconocidas devuelven 404, `robots.txt` y `sitemap.xml` son texto/XML válidos con el origen de producción, la tarjeta de LinkedIn muestra la imagen y `verify:build` pasa contra la URL desplegada. Después del merge, lo mismo contra producción.

### 9.1 — Reemplazo del portfolio anterior (2–3 h)

El portfolio anterior no se borra: se convierte en redirecciones **301** durante **unos seis meses** (hasta mediados de mayo de 2027), porque su URL está en CVs, postulaciones y mensajes que ya mandaste.

- En `portfolio-adla`, un deploy que solo tenga un `vercel.json` con redirecciones `statusCode: 301` (no `permanent: true`, que en Vercel da 308), sin la app:

  | Ruta anterior | Destino |
  |---|---|
  | `/` | `https://adla-portfolio.vercel.app/` (Proxy negocia el idioma) |
  | `/experiencia/solution` | `https://adla-portfolio.vercel.app/es/work/solution` |
  | `/experiencia/don-teofilo-amoblamientos` | `https://adla-portfolio.vercel.app/es/work/don-teofilo-amoblamientos` |
  | `/experiencia/format` | `https://adla-portfolio.vercel.app/es/work/format` |
  | `/experiencia/<otro slug>` (kyriazis, renova-tu-cocina, espacio-boa, fefe-bakes, mdvproyectos, zetenta, freelance) | `https://adla-portfolio.vercel.app/es/work` |
  | cualquier otra ruta | `https://adla-portfolio.vercel.app/` |

  El destino es `/es` porque el sitio anterior arrancaba en español. Las capturas viejas (`/images/...`) caen en la regla general: nadie las enlazaba.
- Antes del deploy, el código anterior queda con el tag `legacy-final` en su repo, y el repo se archiva en GitHub con un README que apunta al sitio nuevo. **Volver atrás** es desplegar ese tag otra vez en `portfolio-adla`.
- A los seis meses (mayo de 2027) se decide si las redirecciones siguen o el proyecto se baja. Mantenerlas no cuesta nada; la decisión es solo de orden.
- `portfolio_alejo` (2024): ver qué sirve. Si está indexado o enlazado en algún lado, se le aplica el mismo tratamiento (una sola regla hacia la home); si no, se puede borrar. Lo decidís vos después de verlo.
- Enlaces a actualizar: README de tu perfil de GitHub y los repos fijados, la URL del sitio en GitHub y en LinkedIn, firmas de email y los sitios de clientes que te acrediten en el footer (si alguno enlaza al portfolio anterior, se le pide el cambio; no es urgente porque la redirección cubre).
- Terminado cuando: cada fila de la tabla devuelve 301 al destino correcto (lo compruebo con un script de `curl` contra la lista, que queda versionado para reusarlo el día del dominio) y el repo anterior está archivado.

### 9.2 — CV en ES y EN (6–8 h)

- **Una página por idioma**, en texto real (PDF con texto seleccionable, no una imagen exportada): los ATS tienen que poder leerlo.
- **Misma fuente que el sitio.** Titular, disponibilidad, fechas y stack salen de `web/content/` tal como están publicados: Solution febrero–septiembre de 2026 (trabajo), Zetenta abril–octubre de 2025 en relación de dependencia, Laura Kyriazis abril de 2024–agosto de 2026, etc. Cuando tengas el borrador, hago una comprobación cruzada línea por línea contra `web/content/` y te marco cada diferencia de fecha, nombre o stack. El CV puede resumir, pero no puede contradecir al sitio.
- **Go:** en el CV figura igual que en el titular del sitio («profundizando en Go»), no como skill de producción, hasta que el Lab v1 esté publicado. Ahí se actualiza junto con el sitio.
- Cada experiencia destacada enlaza a su case study en `https://adla-portfolio.vercel.app` (`/en/work/solution` en el CV en inglés). El día del dominio, la redirección de `adla-portfolio.vercel.app` mantiene vivos esos enlaces aunque el PDF ya esté repartido.
- El archivo editable queda fuera de `web/` (en tu Drive o donde prefieras); en el repo solo entran los PDF finales. Se publican con el enlace de 9.0.
- Terminado cuando: los dos PDF pasan la comprobación cruzada, se leen bien al copiar y pegar su texto (prueba rápida de ATS) y están publicados y enlazados.

### 9.3 — LinkedIn y GitHub (3–4 h)

- **LinkedIn:** titular y «Acerca de» derivados de `profile.headline` y `availability` (en inglés si tu búsqueda es remota hacia afuera; podés agregar el perfil secundario en español que permite LinkedIn). Experiencia con las mismas fechas que el CV. En «Destacado»: el sitio y los tres case studies (con la imagen de Open Graph de 9.0, LinkedIn arma bien las tarjetas). «Open to Work» según cuánto quieras mostrarlo.
- **GitHub:** README del perfil con una línea, enlace al sitio y los repos públicos que tengan sentido fijados. El README raíz del monorepo, que hoy está desactualizado, ya está en el entregable de 7.0; se hace una sola vez, allá.
- Terminado cuando: sitio, CV, LinkedIn y GitHub dicen lo mismo con las mismas fechas, y todos enlazan a `https://adla-portfolio.vercel.app`.

### 9.4 — Lanzamiento (2–3 h)

- Search Console: verificar la propiedad con el meta tag de 9.0, enviar el sitemap y revisar la cobertura a la semana (que no aparezcan «soft 404»).
- Checklist final, desde afuera y en producción: `verify:build`, Lighthouse en mobile en la home y un case study, el recorrido con teclado, las tarjetas en el Post Inspector de LinkedIn, el script de redirecciones de 9.1, los enlaces del CV y que Analytics registre visitas.
- Publicación en LinkedIn (la escribís vos): qué cambió y por qué, con un case study como gancho, no una lista de tecnologías. Te doy devolución sobre el borrador.
- Terminado cuando: el checklist está en verde y quedó anotado acá con la fecha.

## Calendario con 7.0 en paralelo

Total tuyo: etapa 9 ~16–22 h + 7.0 12–16 h ≈ **28–38 h, entre tres y cuatro semanas a 10 h/semana**. **Lanzamiento objetivo: 8 de diciembre**, con margen hasta el 15. El alta en Oracle va primero porque puede demorar días (verificación de tarjeta, capacidad de A1), y 9.0 corre mientras tanto, porque es trabajo mío.

| Semana | Etapa 9 | 7.0 |
|---|---|---|
| 1 (18–24 nov) | Revisás 9.0 y activás Analytics en el panel. | Alta en Oracle y registro de la cuota. Tour of Go (primera mitad). |
| 2 (25 nov–1 dic) | 9.1 redirecciones. Borrador del CV. | Tour of Go completo. |
| 3 (2–8 dic) | CV con la comprobación cruzada (9.2), LinkedIn y GitHub (9.3), lanzamiento (9.4). | Módulo en `api/`, `GET /healthz`, primer test con `httptest`. |
| 4 (9–15 dic) | Margen. Revisión de cobertura en Search Console. | CI (vet, staticcheck, govulncheck, `test -race`). |

Si una semana se corta, se mueve 7.0 y no el lanzamiento: el lanzamiento tiene una fecha que importa (antes de que los procesos de selección se frenen en la segunda mitad de diciembre) y 7.0 no. La publicación en LinkedIn puede esperar a la primera semana de enero si el sitio sale cerca de las fiestas: el sitio y el CV sirven para postularte desde el día en que salen.

## Más adelante: dominio propio

No entra en esta etapa. Cuando se compre, cambia esto y nada más:

1. **Vercel:** se agrega el dominio al proyecto `portfolio`, con una sola dirección canónica (apex o `www`, la otra redirige).
2. **`SITE_URL`** en Production pasa al dominio, y se **redespliega** (se lee en el build). Canonical, hreflang, sitemap, `og:url` y la imagen de Open Graph cambian solos; se verifica con `verify:build` contra el dominio.
3. **`adla-portfolio.vercel.app` redirige al dominio** conservando la ruta, para no romper los enlaces ya compartidos (CV, LinkedIn, postulaciones).
4. **Redirecciones del portfolio anterior:** el destino del `vercel.json` de `portfolio-adla` pasa al dominio, para evitar una cadena de dos saltos. Se reusa el script de 9.1.
5. **`ALLOWED_ORIGINS`** de la API suma el dominio (si la API ya existe), y si para entonces el Lab está publicado, `api.<dominio>` reemplaza a DuckDNS: cambian el `Caddyfile` y `NEXT_PUBLIC_API_URL` (ver etapa 7).
6. **Search Console:** propiedad de dominio verificada por DNS y la herramienta de cambio de dirección.
7. CV, LinkedIn y GitHub se actualizan al dominio cuando toque reeditarlos; mientras tanto la redirección del punto 3 los cubre.

## Relación con la etapa 7

- El patrón de previews del plan de la etapa 7 (`portfolio-git-<rama>-alejodla.vercel.app`) está confirmado con una URL real (ver «Punto de partida»). Ya no es un pendiente.
- `ALLOWED_ORIGINS` de producción es `https://adla-portfolio.vercel.app` hasta que haya dominio.
- Los previews están detrás de la protección de Vercel: eso no cambia el `Origin` que manda el navegador, así que la UI del Lab se sigue probando en ellos con la sesión de Vercel abierta.

## Presupuesto en dinero

| Concepto | USD/mes |
|---|---|
| Vercel Hobby, Web Analytics (dentro de su cuota), Search Console | 0 |
| Redirecciones en `portfolio-adla` (Vercel Hobby) | 0 |
| **Total** | **0** |

El dominio propio queda para cuando se decida (ver «Más adelante»).

## Riesgos

- **Lanzar con los 200 de las rutas desconocidas.** Es lo primero de 9.0, y el lanzamiento no sale sin eso.
- **Romper enlaces viejos.** El portfolio anterior se redirige con 301 y no se borra; hay tag para volver atrás.
- **CV y sitio que se contradicen.** Comprobación cruzada contra `web/content/` antes de publicar.
- **Anunciar el Lab antes de tiempo.** Ni el sitio, ni el CV, ni LinkedIn lo mencionan hasta 7.10.
- **Superar la cuota gratuita de Web Analytics.** Improbable con el tráfico de un portfolio; si pasa, Hobby deja de registrar, no factura.
- **Que el lanzamiento se coma el tiempo de Go.** Tope: si 9.x pasa de 22 h, se recorta 9.3 (LinkedIn se puede pulir después), no 7.0.

## Decisiones tomadas

2026-11-17, por Alejo:
- Sin dominio propio por ahora: se lanza en `https://adla-portfolio.vercel.app`. Lo que cambia el día del dominio queda en «Más adelante».
- Vercel Web Analytics: sí.
- CV descargable desde el sitio, en ES y EN, contrastado contra `web/content/`.
- `portfolio-adla.vercel.app` no se borra: redirecciones 301 a `https://adla-portfolio.vercel.app` (por página cuando hay equivalente, a la home si no) durante unos seis meses, con el tag `legacy-final` para volver atrás.
- Patrón de previews confirmado con `https://portfolio-git-design-v1-alejodla.vercel.app`.

## Preguntas abiertas

1. **`portfolio_alejo` (2024): ¿redirigir o borrar?** Se decide en 9.1, después de ver qué sirve.
