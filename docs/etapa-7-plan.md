# Etapa 7 — Backend en Go, Order Pipeline Lab y /system

Estado: borrador para revisar (Codex + Alejo). Nada de esto está aplicado.
Restricciones: costo objetivo cero, ~10 h/semana, y que Alejo aprenda Go escribiéndolo.

## Por qué este Lab y no otro

El case study de Solution ya tiene la lista de lo que cambiaría (`web/content/case-studies.ts`):

- pedido e ítems en una sola transacción, con clave de idempotencia que sobreviva a los reintentos;
- webhooks guardados antes de confirmarse y procesados desde una cola;
- creación de envíos que reconcilie el resultado incierto (un timeout que sí creó el envío) en lugar de adivinar;
- tests para webhooks duplicados y envíos inciertos.

El Lab es esa lista construida y ejecutándose. No hace falta inventar un problema: el texto lo promete y el Lab lo demuestra. La copia del sitio tiene que decirlo con honestidad: **Mercado Pago y Correo son simuladores; el pipeline (cola, reintentos, idempotencia, DLQ, reconciliación) es código real corriendo en un servidor real.** No es el código de producción de Solution.

## Cómo trabajamos en esta etapa (cambia respecto de 1–6)

En `api/` los roles se invierten. Si yo escribo el Go, el portfolio dice que sabés Go y no es cierto.

| Quién | Qué |
|---|---|
| Alejo | Todo el Go de `api/`: dominio, HTTP, SQL, concurrencia **y todos sus tests**. |
| Claude | Por subetapa: un brief (conceptos, lectura de la doc oficial, ejercicio chico previo, criterios de «terminado» y **la lista de casos a testear, descritos en palabras, sin código**). Responde dudas explicando, no pegando la solución. Revisa los PRs de Go antes que Codex, incluido si los tests cubren los casos del brief. Construye la parte de `web/` (UI del Lab, /system) como en las etapas anteriores. |
| Codex | Revisa todo, igual que antes. |

Regla práctica para mí: ante una duda de Go, explico el concepto y señalo dónde mirar; si después de intentarlo seguís trabado, muestro un fragmento mínimo **de otro dominio** (no el código del Lab). Si en algún momento querés que escriba algo de Go igual (por ejemplo, el Dockerfile o el workflow de CI), lo decidís vos y queda anotado en el PR.

Cada subetapa = una rama `stage7/<n>-<tema>`, merge a main al aprobar.

## Arquitectura

Un solo binario Go, varios componentes internos que se hablan **por HTTP de verdad** (no llamadas a funciones), para que los timeouts y los 5xx sean reales y no un `if`.

### Una corrida vive dentro de su conexión

Regla de diseño que hace posible el plan B (ver Hosting) sin reescribir: **ningún estado del Lab sobrevive a la conexión que lo creó.**

- El navegador abre `GET /lab/run` (SSE). Esa petición **es** la corrida: crea la base de la corrida, levanta su PSP y su carrier simulados en puertos efímeros de loopback (`127.0.0.1:0`), arranca sus workers y transmite los eventos. Cuando el visitante cierra la pestaña o vence el TTL, se cancela el `context` de la petición y todo se apaga y se libera.
- Los interruptores van por `POST /lab/run/{id}/…`. El `id` busca la corrida en un registro en memoria que **solo indexa conexiones abiertas**: si la conexión ya terminó, responde 404 «la corrida terminó». No hay forma de retomar una corrida.
- Si `EventSource` intenta reconectar, el servidor responde 204 a un `id` desconocido (eso detiene la reconexión automática) y la UI ofrece empezar otra.
- Supone una sola instancia del proceso, que es lo que dan Oracle (una VM) y los free tiers que escalan a cero. Si algún día hubiera varias, la alternativa es pasar controles y eventos por un único WebSocket; queda anotado, no se construye.
- El secreto HMAC entre PSP y receptor se genera al azar por corrida: no hay secretos que administrar en el servidor.

```
navegador ──GET /lab/run (SSE)──▶ abre la corrida (todo lo de abajo vive y muere con esta conexión)
navegador ──POST /lab/run/{id}/…──▶ interruptores de la corrida abierta

             Orders API ──(Idempotency-Key)──▶ base de la corrida (SQLite en memoria)
                                   │
                                   ▼
                        PSP simulado («Mercado Pago»)
                                   │  webhook firmado HMAC (puede duplicar, demorar, desordenar, firmar mal)
                                   ▼
                        Receptor de webhooks ──guarda en inbox──▶ 200
                                   │
                                   ▼
                     Workers (lease + visibility timeout)
                       │ marca pagado (transacción)
                       ▼
                 Carrier simulado («Correo»): ok / 5xx / timeout / timeout-pero-creado
                       │ reintentos con backoff + jitter, solo errores reintentables
                       │ reconciliación por referencia externa ante resultado incierto
                       ▼
                 despachado ─── o ──▶ dead-letter queue (con request/response exactos)

todo evento ──▶ bus de la corrida ──SSE──▶ timeline del navegador
```

### Qué puede romper el visitante

Interruptores por corrida (cada conexión es su propia sandbox; lo que rompe no afecta a nadie más):

- webhook duplicado, webhook fuera de orden, firma inválida;
- el cliente reenvía el POST (mismo Idempotency-Key) → mismo pedido, no dos;
- carrier: 5xx, timeout, **timeout pero el envío se creó** → reconciliación, no doble despacho;
- matar el worker a mitad de un trabajo → el lease vence y otro worker lo retoma;
- mensaje venenoso → agota intentos → DLQ → botón «reprocesar» desde la DLQ.

El tiempo está comprimido (backoff de 1 s, 2 s, 4 s… con un reloj inyectado) para ver los reintentos en segundos, y la UI lo dice.

### Límites (es un endpoint público que dispara trabajo)

- Corridas con TTL (p. ej. 5 min, con aviso en la UI) que cortan la conexión; tope global de corridas simultáneas y tope por IP. No hace falta limpieza periódica: al cortarse la conexión no queda nada.
- La IP del visitante sale de `X-Forwarded-For` solo si la petición viene del proxy configurado (Caddy o la plataforma); si no, de la conexión.
- Ningún dato del visitante: no hay texto libre ni URLs. Los webhooks solo van al receptor interno (cero riesgo de SSRF).
- Límite de tamaño de body, timeouts de servidor (`ReadHeaderTimeout`, etc.), CORS solo para los orígenes del sitio (ver «CORS: orígenes permitidos»).
- Si el servidor se cae, el sitio sigue funcionando: el Lab y /system muestran «sin conexión» de forma explícita.

### CORS: orígenes permitidos

`web/` ya está desplegado en Vercel: producción en el dominio `vercel.app` del proyecto y un preview automático por rama. La API acepta exactamente tres clases de origen:

1. **Desarrollo:** `http://localhost:3000`.
2. **Producción:** el origen exacto del proyecto en Vercel (y, en la etapa 9, el dominio propio).
3. **Previews:** solo los del patrón `https://portfolio-git-<rama>-alejodla.vercel.app`.

Nada de comodines como `*.vercel.app`: cualquiera puede publicar en ese dominio.

Configuración: `ALLOWED_ORIGINS` es la lista de orígenes exactos (1 y 2) separados por coma; `PREVIEW_ORIGIN_PATTERN=https://portfolio-git-{branch}-alejodla.vercel.app` describe el 3 con un único marcador `{branch}`. El código no conoce ningún dominio; todos vienen del entorno.

Cómo se valida un `Origin` (sin expresiones regulares, comparando partes):

- Si no hay encabezado `Origin`, la petición no es CORS (curl, monitoreo): se atiende sin encabezados CORS. Esto no es un agujero: CORS lo hace cumplir el navegador, no protege contra clientes que no son navegadores.
- `null` o algo que `url.Parse` no acepta como origen se rechaza.
- Primero, comparación exacta (como string) contra `ALLOWED_ORIGINS`.
- Si no coincide, contra el patrón: esquema exactamente `https`; sin puerto, usuario, path, query ni fragmento; host en minúsculas; el host empieza con el prefijo del patrón (`portfolio-git-`) y termina con el sufijo (`-alejodla.vercel.app`), y lo que queda en el medio (la rama, tal como la escribe Vercel) no es vacío, solo tiene `a-z`, `0-9` y `-`, y no empieza ni termina con `-`. Además, todo lo que va antes de `.vercel.app` es una sola etiqueta DNS de hasta 63 caracteres: así no entra un subdominio extra adelante ni un dominio ajeno detrás.
- Si el origen pasa, la respuesta lleva `Access-Control-Allow-Origin` con **ese origen exacto** (nunca `*`) y siempre `Vary: Origin`, para que ningún cache sirva la respuesta de un origen a otro. Sin credenciales: la API no usa cookies, así que no hay `Allow-Credentials`.
- Preflight (`OPTIONS` antes de los `POST` con JSON): si el origen pasa, 204 con los métodos y encabezados permitidos; si no, 403 sin encabezados CORS.

Riesgo que queda, dicho con honestidad: el patrón limita la **forma** del origen, no prueba que el preview sea mío. Otro equipo de Vercel cuyo slug termine en `-alejodla` (por ejemplo, `x-alejodla`) produciría hosts que encajan. Lo acepto porque CORS acá no es control de acceso: la API no tiene datos privados ni sesiones, y lo único que permitiría es correr simulaciones del Lab desde otra página, algo que cualquier cliente que no sea un navegador ya puede hacer. La defensa real contra el abuso son los topes por IP y globales.

## Decisiones (cada una se explica antes de aplicarla)

**Biblioteca estándar primero.** `net/http` con el router de patrones (`POST /lab/run/{id}/faults`, desde Go 1.22) en vez de Gin/Chi/Echo: para este tamaño alcanza, y aprendés lo que los frameworks esconden. `log/slog` para logs estructurados. `encoding/json`, `crypto/hmac` (con `hmac.Equal`, comparación en tiempo constante), `context` para cancelación y timeouts.

**SQLite en memoria, una base por corrida, con `modernc.org/sqlite`** (Go puro, sin cgo: compila en tu Windows sin gcc y se cruza a `linux/arm64` para la VM de Oracle sin dramas) y `database/sql` con SQL escrito a mano. Por qué una base y no un `map`: transacciones, restricciones `UNIQUE` para la idempotencia y la cola con lease (`UPDATE … SET leased_until = ? WHERE id = (SELECT …) RETURNING …`) son exactamente lo que el case study dice que faltó, y se aprenden con SQL real. Por qué en memoria: cumple la regla de la conexión y no escribe en disco, que en un free tier que escala a cero es efímero. Alternativas: Postgres (el de Solution, con `FOR UPDATE SKIP LOCKED`, la cola canónica) suma un servicio que en costo cero no tenemos; un ORM esconde lo que queremos aprender. El diseño por interfaces deja abierta una base en archivo o Postgres más adelante.

Lo que el Lab **no** puede demostrar en público es durabilidad ante un reinicio del proceso (la base muere con él). La UI lo dice; lo que sí demuestra es el worker que muere a mitad de trabajo dentro de la corrida y el lease que vence.

**Tests con la estándar.** `testing`, tablas de casos, `net/http/httptest`, `go test -race` siempre. Para backoff y leases, `testing/synctest` (estable desde Go 1.25): el tiempo es falso y los tests de «esperar 8 s» corren en microsegundos sin `sleep`. `go vet` + `staticcheck` en CI.

**Contrato API ↔ web sin generadores.** Go es la fuente de verdad. Los tests de Go escriben fixtures JSON de cada evento en `api/testdata/contract/`; un test de vitest en `web/` los parsea con el validador TS (tipado, sin `any`). Si alguien cambia un evento de un lado, el otro test se rompe. Documentado en `docs/lab-contract.md`. Alternativa descartada por ahora: OpenAPI + codegen, demasiado aparato para ~8 tipos de evento.

**Streaming con SSE, no WebSockets.** El flujo es servidor → navegador; SSE es HTTP plano y en Go es un `http.Flusher`. Los controles van por POST normales. La conexión SSE es además el límite de vida de la corrida (ver arriba).

**El sitio sigue estático.** `ensureStatic` no cambia: las páginas `/[locale]/lab` y `/[locale]/system` se prerenderizan con su texto ES/EN, y un Client Component conecta con la API en el navegador. La URL de la API entra en el build como `NEXT_PUBLIC_API_URL` (Next la inlinea en el bundle del cliente; no es secreta). Se configura en Vercel para los entornos Production y Preview, y en `web/.env.local` para desarrollo (con un `web/.env.example` versionado). Como se inlinea en el build, cambiarla exige redesplegar. Sin JavaScript o sin servidor, se ve la explicación y un diagrama quieto del pipeline (mismo criterio que el diagrama de Solution).

### Hosting (decidido)

**Plan A: Oracle Cloud Always Free, VM.** Preferentemente Ampere A1 (`linux/arm64`); si no hay capacidad en la región, la VM AMD micro, también Always Free. Proceso de larga vida bajo systemd, con Caddy adelante.

**HTTPS: subdominio gratis de DuckDNS + Caddy**, hasta comprar el dominio propio en la etapa 9. Caddy obtiene y renueva el certificado de Let's Encrypt solo (desafío HTTP-01, puertos 80 y 443). Para que el subdominio no apunte a una IP vieja, la VM usa una IP pública reservada (gratis dentro del límite de Oracle) o un timer que actualiza DuckDNS. Cuando llegue el dominio propio, solo cambian el `Caddyfile`, `NEXT_PUBLIC_API_URL` y `ALLOWED_ORIGINS` (se suma el dominio nuevo).

**Plan B: plataforma gratis que escala a cero (tipo Render free).** La plataforma pone el HTTPS en su propio subdominio; Caddy y DuckDNS no hacen falta.

#### Reglas para que el plan B no requiera reescribir

1. Ningún estado del Lab sobrevive a su conexión (sección de arriba).
2. Nada se escribe en disco: bases en memoria por corrida.
3. Configuración solo por variables de entorno: `PORT`, `ALLOWED_ORIGINS`, `PREVIEW_ORIGIN_PATTERN`, `TRUSTED_PROXY`, topes. Sin archivos de configuración ni secretos.
4. El binario habla HTTP plano en `PORT`; el TLS siempre lo pone alguien de afuera (Caddy en A, la plataforma en B).
5. `SIGTERM` → apagado ordenado: las corridas abiertas reciben un evento «el servidor se reinicia» y se cierran. Las plataformas que escalan a cero mandan `SIGTERM` al dormir.
6. El mismo binario sirve para los dos: en A, systemd lo corre directo; para B hay un `Dockerfile` multi-stage que **CI construye en cada PR**, así no se pudre sin que nadie lo note.
7. La UI tolera el arranque en frío: si `/healthz` tarda, muestra «despertando el servidor» con un límite de espera, en vez de un error.

/system es honesto en los dos planes si dice qué mide: «desde el arranque de este proceso». En A, el uptime es largo y la carga es de la VM; en B, se reinicia en cada arranque en frío y la memoria es la del contenedor (se lee del cgroup, no de `/proc/meminfo`). Los contadores agregados (req/s, reintentos) viven en memoria y se reinician con el proceso; son métricas, no estado del Lab.

## Subetapas

Estimaciones a ~10 h/semana aprendiendo Go en paralelo. Son orientativas; las ajustamos después de 7.1 con datos reales.
El «terminado cuando» de cada una es el resumen; la lista completa de casos a testear llega en el brief de la subetapa, en palabras y sin código.

### 7.0 — Arranque (1 semana)
- Go: Tour of Go completo, módulos, `go run/test/vet`, layout (`cmd/lab`, `internal/…`), errores como valores.
- Entregable: módulo en `api/`, servidor con `GET /healthz` que escucha en `PORT`, primer test con `httptest`, CI (vet, staticcheck, `test -race`), README de `api/` y README raíz actualizados (hoy dicen «semana 3»).
- Terminado cuando: CI verde y podés explicar qué hace cada línea de `main.go`.

### 7.1 — Dominio sin HTTP (1 semana)
- Go: tipos, métodos, constantes tipadas, `errors.Is/As`, errores centinela, tests de tabla.
- Entregable: máquina de estados del pedido (`created → payment_pending → paid → dispatching → dispatched`, más `failed`/`dead`) como funciones puras; transiciones inválidas devuelven error.
- Terminado cuando: cada transición, válida e inválida, tiene un caso de test.

### 7.2 — Orders API, idempotencia y walking skeleton desplegado (1,5 semanas)
- Go: `net/http`, JSON, middleware (logging, recover, límite de body), interfaces, `sync.Mutex`, apagado ordenado con `signal.NotifyContext`.
- Entregable: la Orders API como `http.Handler` (crear pedido con `Idempotency-Key`), con un store en memoria detrás de una interfaz y probada con `httptest`. **Deploy en Oracle** aunque haga poco: VM, reglas de ingreso para 80/443 (en Oracle hay que abrirlas en la security list **y** en el firewall de la VM), binario `linux/arm64` bajo systemd, Caddy con el subdominio de DuckDNS. Primer `Dockerfile`, que CI construye desde acá. Los problemas de infraestructura aparecen temprano y no la última semana.
- Terminado cuando: el mismo pedido enviado dos veces con la misma clave da un solo pedido (test), y `https://<sub>.duckdns.org/healthz` responde con certificado válido.
- También en 7.2: el middleware de CORS (es la lección de middleware y lo necesita la UI desde el primer preview, aunque sea para `/healthz`). Casos a testear, además de los del brief:
  - se aceptan `http://localhost:3000`, el origen de producción y un preview con rama válida (`portfolio-git-stage7-2-cors-alejodla.vercel.app`);
  - se rechazan: otro proyecto u otro equipo en `vercel.app`; `http://` en un preview; origen con puerto, path, usuario o query; un subdominio extra adelante (`a.portfolio-git-x-alejodla.vercel.app`); el patrón seguido de un dominio ajeno (`portfolio-git-x-alejodla.vercel.app.evil.example`); un prefijo extra (`evilportfolio-git-x-alejodla.vercel.app`); rama vacía (`portfolio-git--alejodla.vercel.app`); rama que empieza o termina con `-`; caracteres fuera de `a-z0-9-` (incluidas mayúsculas); etiqueta de más de 63 caracteres; `null`; un `Origin` que no se puede parsear;
  - un origen aceptado recibe `Access-Control-Allow-Origin` con su valor exacto, nunca `*`; uno rechazado no recibe ese encabezado;
  - `Vary: Origin` está en todas las respuestas, aceptadas o no;
  - preflight aceptado da 204 con métodos y encabezados permitidos; preflight rechazado da 403;
  - sin `Origin`, la petición se atiende normalmente y sin encabezados CORS;
  - la configuración se lee del entorno: un `PREVIEW_ORIGIN_PATTERN` sin `{branch}`, o con más de uno, hace fallar el arranque con un error claro.

### 7.3 — SQLite, transacciones e inbox (1,5 semanas)
- Go: `database/sql`, transacciones, migraciones embebidas con `embed`, `context` con timeouts.
- Entregable: implementación SQLite **en memoria, una base por corrida**, de la interfaz de 7.2; esquema creado al abrir la corrida; pedido + ítems en una transacción; idempotencia con `UNIQUE`; tabla inbox de webhooks.
- Terminado cuando: los mismos tests de 7.2 pasan contra las dos implementaciones, y dos bases de corridas distintas no comparten datos.

### 7.4 — PSP simulado y webhooks (1 semana)
- Go: `crypto/hmac`, `net.Listen("tcp", "127.0.0.1:0")` para servidores en puertos efímeros, goroutines simples.
- Entregable: PSP que se levanta por corrida en su propio puerto de loopback, firma con el secreto de la corrida y envía webhooks con fallas configurables; receptor que verifica, guarda en inbox y recién después responde 200; deduplicación por id de evento.
- Terminado cuando: un webhook duplicado o desordenado no cambia el resultado, y uno con firma inválida queda rechazado y registrado.

### 7.5 — Workers, reintentos, DLQ y reconciliación (2 semanas, la más densa)
- Go: goroutines, canales, `select`, `context` y cancelación, `sync.WaitGroup`, reloj inyectado, `testing/synctest`, apagado ordenado con `signal.NotifyContext`.
- Entregable: pool de workers con lease; backoff exponencial con jitter y tope; clasificación reintentable / no reintentable; DLQ con request/response; carrier simulado con «timeout pero creado» y reconciliación por referencia externa.
- Terminado cuando: tests con `-race` y `synctest` cubren worker muerto a mitad de trabajo, timeout-pero-creado (un solo despacho) y mensaje venenoso (termina en DLQ tras N intentos).

### 7.6 — La corrida como conexión: caos y streaming (1,5 semanas)
- Go: SSE con `http.Flusher`, `context` de la petición como dueño de la vida de la corrida, bus de eventos con canales, registro de corridas abiertas con `sync.Mutex`, rate limiting (`golang.org/x/time/rate`, la única dependencia externa además de SQLite).
- Entregable: `GET /lab/run` que crea y transmite la corrida, `POST /lab/run/{id}/…` para los interruptores, 204 para ids desconocidos, TTL que corta la conexión, evento de cierre ante `SIGTERM`, límites por IP y globales, fixtures del contrato.
- Terminado cuando: dos conexiones simultáneas no se ven entre sí; al cortar el SSE se cierran la base, los listeners de loopback y los workers de esa corrida, y no quedan goroutines colgadas (test con `runtime.NumGoroutine`; `goleak` solo si hace falta, como dependencia de test).

### 7.7 — UI del Lab en web/ (Claude; en paralelo con 7.5–7.6)
- Página `/[locale]/lab`: timeline por carriles (API, PSP, inbox, worker, carrier, DLQ) en la dirección B, interruptores con texto ES/EN, explicación de cada mecanismo en el momento en que ocurre. Validador TS del contrato con test contra los fixtures. Estado «sin conexión» y versión sin JS.
- Se prueba en local y en el preview de Vercel de cada rama desde que existe la página, contra la API en Oracle (`NEXT_PUBLIC_API_URL` ya configurada para Production y Preview).
- Enlace desde la sección «qué cambiaría» de Solution: cada punto de la lista apunta al interruptor que lo demuestra.
- Antes de construir, propuesta visual para aprobar (como en la etapa 3).

### 7.8 — /system (1 semana)
- Go: `runtime/metrics`, histogramas de latencia en un middleware, lectura de `/proc` en Linux (a mano, sin gopsutil: es un buen ejercicio de parseo), `debug.ReadBuildInfo` para versión y commit.
- Entregable API: `GET /system` en JSON, todo «desde el arranque de este proceso» (uptime, goroutines, heap, pausas de GC, req/s, p50/p95, profundidad de cola, tamaño de DLQ, reintentos de la última hora, versión de Go, commit, carga y memoria del host). Claude: página `/[locale]/system` que lo muestra y se actualiza cada pocos segundos.
- La memoria del host se lee de `/proc/meminfo` en la VM y del cgroup si el proceso corre en un contenedor (plan B); el endpoint dice cuál de las dos fuentes usó.
- Terminado cuando: cada cifra de la página viene del endpoint y la página dice de dónde sale cada una.

### 7.9 — Endurecimiento y cierre (1 semana)
- Prueba de carga escrita por vos en Go (un cliente con N goroutines) contra staging/local; ajustar topes según resultados.
- Deploy automático desde main a Oracle (o manual documentado), logs con `journalctl`, alerta mínima si `/healthz` cae (UptimeRobot u otro gratuito).
- **Ensayo del plan B:** un deploy de prueba del mismo commit en la plataforma gratis, con el `Dockerfile`, para comprobar que las reglas de portabilidad se cumplen de verdad. Se anota el resultado (incluido cuánto tarda el arranque en frío) y se baja.
- Actualizar README, case study de Solution y `docs/` con lo aprendido; pasada de accesibilidad del Lab.

**Total estimado: ~12 semanas.** Si querés algo publicable antes, el corte natural es 7.0–7.5 + una UI mínima del Lab: idempotencia, webhooks y reintentos ya cuentan la historia; caos fino y /system pueden venir después.

## Presupuesto

| Concepto | USD/mes |
|---|---|
| VM Oracle Cloud Always Free (plan B: free tier que escala a cero) | 0 |
| DuckDNS, Caddy, Let's Encrypt | 0 |
| SQLite, CI en GitHub Actions, monitoreo de uptime | 0 |
| Dominio propio | llega en la etapa 9 |
| **Total** | **0** |

## Riesgos

- **Que el Lab parezca un juguete.** Mitigación: interruptores ligados a fallas que realmente ocurrieron en Solution, y texto que lo dice.
- **Abuso del endpoint público.** Topes, TTL, sin datos del visitante, sin salidas a URLs externas.
- **Oracle: alta de cuenta, capacidad de A1 en la región, o reclamo de la instancia por estar ociosa.** Mitigación: probar el alta en 7.0, no en 7.2; si A1 no está disponible, VM AMD micro; si Oracle falla del todo, plan B, que es posible gracias a las reglas de portabilidad y queda probado en 7.9. La alerta de `/healthz` avisa si la instancia desaparece.
- **Arranque en frío en el plan B.** El visitante espera la primera respuesta; la UI lo anticipa con «despertando el servidor».
- **Subestimar 7.5.** La concurrencia es donde Go se pone difícil; si se alarga, se recorta 7.6 (menos interruptores), no los tests.
- **Que termine escribiéndolo la IA.** La tabla de roles de arriba es el contrato; Codex puede señalarlo si un PR de Go viene de mí.

## Decisiones tomadas (2026-11-17)

- Costo objetivo cero. API en Oracle Cloud Always Free; plan B, free tier que escala a cero, con el Lab diseñado para que el cambio no requiera reescribir.
- HTTPS con subdominio de DuckDNS + Caddy hasta comprar el dominio en la etapa 9.
- `/lab` como ruta propia.
- Alejo escribe todos los tests de Go; cada brief lista los casos a testear, sin código.
- `web/` ya está en Vercel (producción en `vercel.app` y un preview por rama); la etapa 9 solo suma el dominio propio. La UI del Lab se prueba en local y en los previews desde la subetapa en que exista. `NEXT_PUBLIC_API_URL` se configura en Vercel para Production y Preview. CORS acepta localhost, producción y solo el patrón de mis previews.

## Preguntas abiertas

Ninguna por ahora.
