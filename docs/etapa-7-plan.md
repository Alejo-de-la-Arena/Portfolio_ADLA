# Etapa 7 — Backend en Go, Order Pipeline Lab y /system

Estado: plan revisado por Codex (revisión 1) e incorporado. Nada de esto está aplicado.
Restricciones: costo objetivo cero (condicionado a cuotas gratuitas, ver Hosting), ~10 h/semana, y que Alejo aprenda Go escribiéndolo.

## Nota estratégica: el portfolio no espera al Lab

El portfolio nuevo se lanza (dominio propio y reemplazo del portfolio actual) sin esperar a la etapa 7. El Lab v1 se suma después, cuando esté publicado y probado. Hasta entonces el sitio no lo anuncia: nada de «próximamente» ni enlaces a una página vacía. La etapa 9 y la etapa 7 corren en paralelo; lo único que las conecta es que, al llegar el dominio propio, se agrega a `ALLOWED_ORIGINS` y a `NEXT_PUBLIC_API_URL`.

## Por qué este Lab y no otro

El case study de Solution ya tiene la lista de lo que cambiaría (`web/content/case-studies.ts`):

- pedido e ítems en una sola transacción, con clave de idempotencia que sobreviva a los reintentos;
- webhooks guardados antes de confirmarse y procesados desde una cola;
- creación de envíos que reconcilie el resultado incierto (un timeout que sí creó el envío) en lugar de adivinar;
- tests para webhooks duplicados y envíos inciertos.

El Lab es esa lista construida y ejecutándose. La copia del sitio tiene que decirlo con honestidad: **Mercado Pago y Correo son simuladores; el pipeline (idempotencia, inbox, reintentos, reconciliación) es código real corriendo en un servidor real.** No es el código de producción de Solution.

Un matiz que la UI tiene que explicar: en Solution solo se reintentaban errores de red, nunca un 5xx, porque crear un envío en Correo no era idempotente. En el Lab el carrier simulado acepta una referencia externa y el worker reconcilia antes de reintentar; eso es lo que vuelve seguro reintentar un 5xx. La diferencia de política es justamente la mejora.

## Cómo trabajamos en esta etapa (cambia respecto de 1–6)

En `api/` los roles se invierten. Si yo escribo el Go, el portfolio dice que sabés Go y no es cierto.

| Quién | Qué |
|---|---|
| Alejo | Todo el Go de `api/`: dominio, HTTP, SQL, concurrencia **y todos sus tests**. |
| Claude | Por subetapa: un brief (conceptos, lectura de la doc oficial, ejercicio chico previo, criterios de «terminado» y **la lista de casos a testear, descritos en palabras, sin código**). Responde dudas explicando, no pegando la solución. Revisa los PRs de Go antes que Codex, incluido si los tests cubren los casos del brief. Construye la parte de `web/` (UI del Lab, /system) como en las etapas anteriores. |
| Codex | Revisa todo, igual que antes. |

Regla práctica para mí: ante una duda de Go, explico el concepto y señalo dónde mirar; si después de intentarlo seguís trabado, muestro un fragmento mínimo **de otro dominio** (no el código del Lab). Si en algún momento querés que escriba algo de Go igual (por ejemplo, el Dockerfile o el workflow de CI), lo decidís vos y queda anotado en el PR.

Cada subetapa = una rama `stage7/<n>-<tema>`, merge a main al aprobar.

## Alcance: dos entregas

### Lab v1 (publicable)

- SQLite por corrida, con pedido e ítems en una transacción.
- Idempotencia, incluido el conflicto: la misma clave con otro payload se rechaza (409), no devuelve el pedido anterior.
- Webhook firmado con HMAC, entregado duplicado; uno con firma inválida se rechaza.
- Un worker por corrida, con reintentos acotados (backoff con tope) ante 5xx y DLQ visible al agotarlos.
- Tres escenarios predefinidos, elegidos antes de ejecutar (no hay interruptores en vivo):
  1. **Reintentos y duplicados:** el cliente reenvía el pedido con la misma clave, otro con la misma clave y distinto payload, y el PSP entrega el webhook dos veces y uno mal firmado.
  2. **Correo con 5xx:** dos 5xx y después éxito; variante que agota los intentos y termina en DLQ.
  3. **Timeout pero creado:** el carrier crea el envío y la respuesta no llega; el worker reconcilia por referencia externa y hay un solo despacho.
- Timeline mínimo en ES/EN.
- Presupuesto de recursos, desconexión y despliegue desde el comienzo, no al final.

### Lab v2

- Pool de workers con lease y token de dueño; muerte y recuperación de un worker a mitad de trabajo.
- Desorden configurable de webhooks.
- Interruptores en vivo (requieren `POST` a una corrida abierta; ver «IDs de corrida»).
- Reprocesamiento desde la DLQ.
- /system.

## Arquitectura (v1)

Un solo binario Go. HTTP real **en las fronteras simuladas** (PSP y carrier), para que los timeouts y los 5xx sean reales y no un `if`; dentro del dominio, llamadas directas.

### La corrida es una petición de streaming

Regla de diseño que hace posible el plan B (ver Hosting) sin reescribir: **ningún estado del Lab sobrevive a la petición que lo creó.**

- El visitante elige un escenario y aprieta «Ejecutar». La UI hace `fetch("POST /lab/runs", { escenario })` y lee la respuesta como stream: una línea JSON por evento (NDJSON). Esa petición **es** la corrida.
- Antes de crear nada, el servidor valida el `Origin` (CORS) y reserva el cupo de admisión. Si no hay cupo, responde con un estado HTTP normal (429 o 503, con `Retry-After` y un motivo en JSON) y la UI lo muestra. Esta es la ventaja sobre `EventSource`: los errores de admisión se pueden leer, y no hay un `GET` que asigne recursos de forma implícita.
- **Sin reconexión.** Si la conexión se corta, la corrida termina y la UI ofrece empezar otra. No hay `Last-Event-ID` ni reanudación.
- Se cancela el `context` de la petición cuando el visitante cierra la pestaña, vence el TTL, se excede una cuota, el cliente es demasiado lento o el servidor se apaga. Al cancelarse, se cierran el worker, la base y el registro de la corrida.
- Supone una sola instancia del proceso, que es lo que dan Oracle (una VM) y los free tiers que escalan a cero. Varias instancias requerirían enrutar cada corrida a su instancia y aceptar la pérdida de estado; un WebSocket no resuelve eso por sí solo. No se construye.

**Las corridas no son sandboxes.** Tienen estado separado (su base, su secreto, sus cuotas), pero comparten proceso, memoria y CPU: un OOM, un panic no recuperado en una goroutine o una fuga afectan a todas. El texto del sitio habla de «corridas», no de aislamiento.

#### Ciclo de vida de una corrida

1. **Admisión:** validar `Origin`; reservar atómicamente el cupo global y el de la IP; rechazar sin encolar. Nunca hay una cola de visitantes esperando.
2. **Inicialización con limpieza ante fallos parciales:** cada recurso que se abre (registro, base SQLite, secreto, worker) registra su cierre; si un paso falla, se cierra lo ya abierto, en orden inverso, y se libera el cupo. Un test fuerza el fallo en cada paso.
3. **Ejecución:** el escenario corre; los eventos pasan por un buffer de tamaño fijo hacia el escritor del stream.
4. **Heartbeat:** cada 15 s, si no hubo eventos, un evento `heartbeat`, para detectar conexiones muertas y que ningún intermediario corte por inactividad.
5. **Cliente lento:** cada escritura tiene plazo (`http.ResponseController.SetWriteDeadline`). Si una escritura falla o vence, o si el buffer de eventos se llena, **la corrida se cancela** con motivo registrado. No se bloquea el pipeline ni se descartan eventos en silencio.
6. **Cierre:** evento final (`done`, `quota_exceeded`, `ttl`, `slow_client`, `shutdown`) si la conexión todavía lo permite, liberación de recursos y del cupo.

Los timeouts globales del servidor se adaptan al streaming: `ReadHeaderTimeout` y `MaxHeaderBytes` globales; sin `WriteTimeout` global (cortaría las corridas), reemplazado por plazos por escritura.

#### Apagado con plazo

Al recibir `SIGTERM`: (1) dejar de admitir (`/healthz` responde 503 «drenando»); (2) intentar enviar el evento `shutdown` a las corridas abiertas; (3) cancelar sus contexts; (4) esperar a los workers con un plazo (p. ej. 5 s); (5) cerrar bases y listeners; (6) `Server.Shutdown` con plazo. `Server.Shutdown` por sí solo espera a las conexiones activas y no termina un stream: por eso la cancelación pasa por el registro de corridas. El evento `shutdown` es un intento: ante una caída abrupta (OOM, `kill -9`, corte de la VM) solo hay desconexión, y la UI muestra «se perdió la conexión».

### Fronteras simuladas: listeners internos compartidos

PSP y carrier son servidores HTTP reales en **un listener interno compartido** en `127.0.0.1`, abierto al arrancar el proceso (no dos por corrida). El estado de cada corrida va separado, indexado por su ID. Los destinos los construye el servidor (nunca vienen del visitante) y las rutas internas están en otro `ServeMux`, fuera del router público. El cliente HTTP interno tiene timeouts y topes de conexiones propios.

```
navegador ──POST /lab/runs {escenario} (fetch, respuesta NDJSON)──▶ corrida
                                         (todo lo de abajo vive y muere con esta petición)

  dominio: crear pedido + ítems ──(Idempotency-Key)──▶ base de la corrida (SQLite, una conexión)
                    │
                    ▼  HTTP interno
  PSP simulado («Mercado Pago») ──webhook firmado HMAC (duplicado / firma inválida)──▶ receptor
                    receptor: verifica, guarda en inbox, recién después 200
                    │
                    ▼
  worker (uno por corrida): marca pagado (transacción corta, sin HTTP adentro)
                    │  HTTP interno
                    ▼
  carrier simulado («Correo»): ok / 5xx / timeout-pero-creado
                    │ reintentos acotados con backoff; reconciliación por referencia externa
                    ▼
  despachado ─── o ──▶ DLQ (con request/response truncados)

  todo evento ──▶ buffer fijo de la corrida ──NDJSON──▶ timeline del navegador
```

### IDs de corrida

128 bits de `crypto/rand`, codificados en base64url. En v1 solo identifican la corrida en eventos y en las rutas internas; en v2, cuando haya `POST` de interruptores, el ID funciona como **capacidad**: tenerlo es la prueba de pertenencia, por eso no puede ser secuencial ni adivinable. El ID completo nunca va a los logs (se registra un prefijo de un hash). El secreto HMAC entre PSP y receptor también se genera al azar por corrida.

## Presupuesto de recursos

Se implementa y se prueba **antes del primer endpoint público que cree estado** (subetapa 7.4). Hasta entonces, lo único público es `/healthz`.

Los topes de aplicación reducen el trabajo admitido; no garantizan disponibilidad frente a una saturación de red o de TLS contra la VM. Eso queda fuera de alcance y se dice.

### Valores iniciales

Son valores de arranque para medir en la VM, no capacidad demostrada. Todos vienen del entorno.

| Dimensión | Tope inicial |
|---|---|
| Corridas simultáneas, global | 4 |
| Corridas simultáneas, por IP | 1 |
| Creación de corridas por IP | 2 por minuto, ráfaga 2 |
| Creación de corridas, global | tasa y ráfaga propias (p. ej. 10/min, ráfaga 4) |
| TTL de una corrida | 2 min |
| Pedidos por corrida | 10 |
| Ítems por pedido | 5 |
| Webhooks por corrida (incluidos duplicados e inválidos) | 20 |
| Intentos por trabajo | 5 |
| Workers por corrida | 1 en v1, 2 como máximo en v2 |
| Peticiones HTTP internas concurrentes por corrida | 2 |
| Body de una petición | 8 KiB |
| Headers (`MaxHeaderBytes`) | 16 KiB |
| Clave de idempotencia | 64 bytes, charset acotado |
| Filas de inbox y de DLQ por corrida | 50 cada una |
| Request/response guardados por intento | 2 KiB cada uno, truncados y marcados como truncados |
| Eventos del timeline por corrida | 500 |
| Bytes emitidos por corrida | 256 KiB |
| Buffer de eventos por corrida | 64 eventos |
| Plazo por escritura al cliente | 5 s |
| SQLite `max_page_count` | segunda barrera, p. ej. 1 MiB por base |
| Entradas del limitador por IP | 10 000, vencimiento 10 min |

Exceder una cuota de corrida termina la corrida con `quota_exceeded`; no degrada en silencio. `max_page_count` limita las páginas de la base, no la memoria total de la corrida (conexión, estructuras de Go, buffers): por eso las filas y los payloads se limitan en la aplicación primero.

### Presupuesto verificable

```
memoria base del proceso
+ corridas máximas × consumo máximo medido por corrida
+ margen para Caddy y el sistema operativo
≤ RAM disponible de la VM
```

El consumo por corrida se mide con la prueba de saturación (7.4 con una corrida falsa, otra vez en 7.8 con el pipeline real) y se anota en `docs/` con la VM y la fecha. Como última barrera, el servicio de systemd lleva `MemoryHigh` (presión y reclamo antes del límite), `MemoryMax` y `CPUQuota`. Llegar a `MemoryMax` termina el proceso y todas las corridas: es un fusible, no un control.

### Limitador por IP

Mapa con vencimiento (10 min sin actividad) y tamaño máximo. Si se llena, las IP nuevas se rechazan como si se hubiera alcanzado el tope global (503), en vez de crecer sin límite o desalojar a quien está activo. «No hace falta limpieza periódica» vale solo para el estado de las corridas; el limitador sí se barre.

### Política de `X-Forwarded-For`

- `TRUSTED_PROXIES` es una lista de IPs concretas (en Oracle, `127.0.0.1` y `::1`, porque Caddy está en la misma VM; en el plan B, las que documente la plataforma). No rangos amplios.
- Si la conexión **no** viene de un proxy de confianza, se usa la dirección de la conexión y se ignora el encabezado.
- Si viene de un proxy de confianza, se recorre la cadena de derecha a izquierda y se toma la primera dirección que no sea un proxy de confianza. Varios encabezados `X-Forwarded-For` se tratan como una sola cadena en orden.
- Se parsea con `net/netip`; IPv4 mapeada en IPv6 se normaliza a IPv4. Una entrada mal formada en la posición elegida rechaza la petición (400).
- IPv6 se agrupa por `/64` para el limitador: una sola conexión hogareña tiene millones de direcciones.

### Logs

- Nunca cuerpos completos ni el ID completo de la corrida. Una línea de resumen por corrida, más advertencias y errores.
- Los errores provocados por los escenarios se cuentan, no se registran uno por uno; los logs de error tienen su propio limitador.
- journald con `SystemMaxUse` y retención acotada (p. ej. 200 MB, 14 días).

## CORS: orígenes permitidos

`web/` ya está desplegado en Vercel: producción en el dominio `vercel.app` del proyecto y un preview automático por rama. La API acepta tres clases de origen:

1. **Desarrollo:** `http://localhost:3000`.
2. **Producción:** el origen exacto del proyecto en Vercel (y, al llegar, el dominio propio).
3. **Previews:** orígenes con la forma `https://portfolio-git-<rama>-alejodla.vercel.app`.

Nada de comodines como `*.vercel.app`: cualquiera puede publicar en ese dominio.

Configuración: `ALLOWED_ORIGINS` es la lista de orígenes exactos (1 y 2) separados por coma; `PREVIEW_ORIGIN_PATTERN=https://portfolio-git-{branch}-alejodla.vercel.app` describe el 3 con un único marcador `{branch}`. El código no conoce ningún dominio.

### Validación al arrancar

Cada origen de `ALLOWED_ORIGINS` y el patrón se validan con las mismas reglas que un `Origin` entrante; si alguno no las cumple, el proceso no arranca y dice cuál. `url.Parse` es un parser de URLs, no un validador de orígenes: las reglas de abajo se aplican encima.

### Cómo se valida un `Origin` entrante

Sin expresiones regulares, comparando partes, y **antes de crear cualquier recurso** (antes de la admisión): quitar el encabezado CORS de una respuesta no deshace el trabajo que el servidor ya hizo.

- Sin encabezado `Origin`: la petición no es CORS (curl, monitoreo) y se atiende sin encabezados CORS. CORS lo hace cumplir el navegador; no protege contra clientes que no son navegadores.
- Se rechaza (403, sin encabezados CORS): más de un encabezado `Origin`; valores con coma, espacios o caracteres de control; `null`; URLs opacas (sin `//`); escapes `%`; usuario, path (distinto de vacío), query o fragmento; puerto vacío (`https://host:`); puerto explícito en un preview; mayúsculas en cualquier parte (se rechazan, no se normalizan: los navegadores envían el origen en minúsculas).
- Primero, comparación exacta contra `ALLOWED_ORIGINS`.
- Si no coincide, contra el patrón: esquema `https`; el host empieza con el prefijo (`portfolio-git-`) y termina con el sufijo (`-alejodla.vercel.app`); lo del medio no es vacío, solo tiene `a-z`, `0-9` y `-`, y no empieza ni termina con `-`; todo lo que va antes de `.vercel.app` es una sola etiqueta DNS de hasta 63 caracteres.
- Origen aceptado: `Access-Control-Allow-Origin` con **ese origen exacto** (nunca `*`). `Vary: Origin` en todas las respuestas. Sin credenciales: la API no usa cookies.
- Preflight (`OPTIONS`): además del origen, se comprueban `Access-Control-Request-Method` (solo `POST`) y `Access-Control-Request-Headers` (solo `content-type`). Si todo pasa, 204 con exactamente esos valores y un `Access-Control-Max-Age`; si algo no pasa, 403.

### Qué cubre el patrón y qué no

- Cubre los aliases de rama (`portfolio-git-<rama>-…`). Vercel trunca los nombres de rama largos y les agrega un sufijo; el resultado sigue dentro del charset y del límite de 63, pero se prueba con una URL real.
- No cubre las URLs por commit (otra forma); no hacen falta, porque los previews se prueban por rama.
- **Riesgo residual:** el patrón limita la **forma** del origen, no prueba que el preview sea mío. `portfolio-git-demo-x-alejodla.vercel.app` puede ser la rama `demo-x` de mi equipo o la rama `demo` de otro equipo llamado `x-alejodla`; el patrón no los distingue, y agregar reglas al sufijo no lo resuelve. Lo acepto porque acá CORS no es control de acceso: la API no tiene datos privados ni sesiones, lo único que permitiría es correr corridas desde otra página (algo que cualquier cliente que no sea un navegador ya puede hacer), y las cuotas de admisión aplican igual. Si algún día hiciera falta verificar pertenencia, la salida es una lista de orígenes exactos aprobados, no un patrón más astuto.

## Decisiones (cada una se explica antes de aplicarla)

**Biblioteca estándar primero.** `net/http` con el router de patrones (`POST /lab/runs`, desde Go 1.22) en vez de Gin/Chi/Echo: para este tamaño alcanza, y aprendés lo que los frameworks esconden. `log/slog` para logs estructurados, `encoding/json`, `crypto/hmac` (con `hmac.Equal`, comparación en tiempo constante), `crypto/rand`, `net/netip`, `context`. Dependencias externas: `modernc.org/sqlite` y `golang.org/x/time/rate`.

**SQLite en memoria, una base y una conexión por corrida, con `modernc.org/sqlite`** (Go puro, sin cgo: compila en tu Windows sin gcc y se cruza a `linux/arm64` y `linux/amd64` sin dramas) y SQL escrito a mano.

- Por qué una base y no un `map`: transacciones, `UNIQUE` para la idempotencia y, en v2, la cola con lease son exactamente lo que el case study dice que faltó, y se aprenden con SQL real.
- El modelo de conexiones es explícito: `sql.DB` es un pool, y con `:memory:` **cada conexión abre una base distinta**. Por eso cada corrida tiene su `sql.DB` con `SetMaxOpenConns(1)`, sin vencimiento de conexiones (`SetConnMaxLifetime(0)`, `SetConnMaxIdleTime(0)`), conservada hasta el cierre de la corrida. El worker puede esperar respuestas HTTP en paralelo, pero las operaciones SQL se serializan.
- Reglas que se derivan: transacciones cortas; **ninguna llamada HTTP dentro de una transacción**; dentro de una transacción solo se usa esa transacción (pedir otra conexión con un pool de uno es un bloqueo garantizado). Abrir más conexiones tampoco convertiría a SQLite en una base con varios escritores.
- Alternativas: URI de memoria compartida con nombre único por corrida (necesita igual una conexión viva para que la base exista; más piezas sin ganancia); Postgres (el de Solution, con `FOR UPDATE SKIP LOCKED`) suma un servicio que en costo cero no tenemos; un ORM esconde lo que queremos aprender.
- Lo que el Lab **no** puede demostrar en público es durabilidad ante un reinicio del proceso. La UI lo dice.

**Leases con token de dueño (v2).** Tomar un trabajo escribe un token aleatorio y un vencimiento. Completar o reprogramar es condicional: `… WHERE id = ? AND lease_token = ?`. Si el lease venció y otro worker tomó el trabajo, la confirmación del primero no afecta ninguna fila y se descarta. Cancelar un worker no revierte una petición que el carrier ya recibió: por eso el efecto externo es idempotente por referencia externa, y el que retoma reconcilia antes de crear.

**Tests separados por tipo.** `testing`, tablas de casos, `go test -race` siempre, `go vet`, `staticcheck` y `govulncheck` en CI.
- **Tests de tiempo (deterministas):** backoff, vencimiento de leases, TTL, heartbeats y política de reintentos, con `testing/synctest` y dobles en memoria detrás de interfaces (carrier y PSP falsos, sin red). `synctest` no sirve con HTTP por loopback real: el bloqueo en I/O de red impide que la burbuja avance el tiempo.
- **Tests de integración:** HTTP real con `httptest` y el listener interno, con tiempos reales acotados (backoff de milisegundos configurado por el test) y un plazo total por test.

**Contrato API ↔ web sin generadores.** Go es la fuente de verdad. Los tests de Go escriben fixtures JSON de cada evento y de cada respuesta de admisión en `api/testdata/contract/`; un test de vitest en `web/` los parsea con el validador TS (tipado, sin `any`). Si un lado cambia un evento, el otro test se rompe. Documentado en `docs/lab-contract.md`. OpenAPI + codegen queda descartado por ahora: demasiado aparato para ~10 tipos de evento.

**Streaming NDJSON sobre `fetch`, no `EventSource` ni WebSockets.** `EventSource` reconecta solo a su URL, solo hace `GET` y no deja leer el cuerpo de un error de admisión; para que funcione con corridas efímeras habría que separar creación y suscripción con una reserva temporal. `fetch` con `POST` y lectura del stream evita todo eso: una petición, un dueño, sin reconexión. NDJSON en vez de formato SSE porque sin `EventSource` no aporta nada y cada línea es un JSON que el validador del contrato ya sabe leer. En Go: `json.Encoder` + `http.ResponseController.Flush`.

**El sitio sigue estático.** `ensureStatic` no cambia: las páginas `/[locale]/lab` y `/[locale]/system` se prerenderizan con su texto ES/EN, y un Client Component conecta con la API en el navegador. La URL de la API entra en el build como `NEXT_PUBLIC_API_URL` (Next la inlinea en el bundle del cliente; no es secreta). Se configura en Vercel para Production y Preview, y en `web/.env.local` para desarrollo (con un `web/.env.example` versionado). Cambiarla exige redesplegar. Sin JavaScript o sin servidor, se ve la explicación y un diagrama quieto del pipeline.

## Hosting y operación

### Plan A: Oracle Cloud Always Free, VM

- Preferentemente Ampere A1 (`linux/arm64`); si no hay capacidad en la región, la VM AMD micro (`linux/amd64`), también Always Free. **Registrar al provisionar la cuota vigente** (la documentación consultada en la revisión indica un equivalente de 2 OCPU y 12 GB para A1; puede cambiar).
- El fallback AMD tiene mucha menos memoria: sus topes se miden aparte, no se asume la capacidad de A1.
- **Servicio:** usuario dedicado sin login, el binario escucha solo en `127.0.0.1` y únicamente Caddy es accesible desde afuera, unidad de systemd con `MemoryHigh`, `MemoryMax`, `CPUQuota` y endurecimiento básico (`NoNewPrivileges`, `ProtectSystem`).
- **IP pública:** Oracle conserva la IP efímera al detener la instancia; el riesgo es eliminarla o recrearla. Una IP reservada (gratis dentro del límite) se puede reasignar a una instancia nueva; se decide al provisionar.

### HTTPS: DuckDNS + Caddy (hasta el dominio propio)

- Caddy obtiene y renueva el certificado de Let's Encrypt (HTTP-01 por el 80 y TLS-ALPN-01 por el 443: los dos puertos quedan abiertos, en la security list de Oracle **y** en el firewall de la VM).
- **Almacenamiento persistente y escribible** para certificados y claves de Caddy (su directorio de datos bajo el usuario del servicio, fuera de cualquier directorio temporal). Sin eso, cada reinicio pide certificados nuevos y choca con los límites de Let's Encrypt.
- Abrir puertos una vez no garantiza las renovaciones: DNS y conectividad tienen que seguir bien. **Verificación externa** del certificado (días hasta el vencimiento, con alerta) y revisión de errores de renovación en el journal.
- **Token de DuckDNS:** es un secreto del host, no del Lab. Vive en un archivo de entorno legible solo por el servicio que actualiza DuckDNS, fuera del repositorio y de los logs. La actualización corre al arrancar y con un timer, comprueba la respuesta `OK`/`KO`, y fija IPv4 y IPv6 explícitamente para no dejar un registro IPv6 obsoleto.
- Con el dominio propio cambian el `Caddyfile`, `NEXT_PUBLIC_API_URL` y `ALLOWED_ORIGINS`.

### Parches, despliegue y rollback

- Parches de seguridad del sistema automáticos (`unattended-upgrades`); Caddy desde su repositorio oficial de paquetes, actualizado con el sistema; reinicios controlados en una ventana conocida.
- `govulncheck` en CI; reconstrucción mensual del binario con el último parche de Go y dependencias revisadas, aunque no haya cambios de código.
- CI produce artefactos `linux/arm64` y `linux/amd64` con el commit embebido. En la VM, cada versión queda en su directorio (`/opt/lab/releases/<commit>`) y un enlace `current` apunta a la activa. **Rollback:** apuntar `current` a la versión anterior y reiniciar el servicio. Se ensaya una vez en 7.3.
- Runbook en `docs/runbook-api.md`: provisionar desde cero (script o cloud-init), desplegar, hacer rollback, renovar el token de DuckDNS, pasar al plan B. El objetivo es un procedimiento reproducible de recuperación, no solo una alerta.

### Reclamo por inactividad

Oracle puede reclamar instancias Always Free ociosas: según su documentación, una ventana de siete días con CPU p95 y red por debajo del 20 %, y para A1 también memoria por debajo del 20 %. Un portfolio con poco tráfico puede cumplirlo, y monitorear `/healthz` no lo evita.

**Mitigación:** pasar la cuenta a Pay As You Go. Los recursos Always Free siguen sin costo dentro del límite gratuito y, según lo que se sabe hoy, las instancias de cuentas pagas no se reclaman por inactividad. **A verificar en la documentación de Oracle antes de hacerlo**, y con una alerta de presupuesto en USD 1 para detectar cualquier cargo accidental.

### Plan B: plataforma gratis que escala a cero (tipo Render free)

La plataforma pone el HTTPS en su subdominio; Caddy y DuckDNS no hacen falta. «Costo cero» es condicional: estas plataformas tienen cuotas de horas, transferencia y builds, y según la cuenta pueden suspender o facturar excesos. Se revisan al ensayar.

**El ensayo se adelanta a 7.3:** antes de dar por estable el hosting, el mismo commit se despliega en la plataforma con el `Dockerfile`, se mide el arranque en frío, se anota el resultado y se baja.

#### Reglas para que el plan B no requiera reescribir

1. Ningún estado del Lab sobrevive a su petición.
2. Nada se escribe en disco: bases en memoria por corrida.
3. Configuración solo por variables de entorno: `PORT`, `ALLOWED_ORIGINS`, `PREVIEW_ORIGIN_PATTERN`, `TRUSTED_PROXIES`, topes. El binario no tiene secretos (el token de DuckDNS es del host del plan A).
4. El binario habla HTTP plano en `PORT`; el TLS lo pone alguien de afuera (Caddy en A, la plataforma en B).
5. `SIGTERM` → apagado con plazo (ver arriba). El aviso a las corridas es un intento, no una garantía.
6. Mismo código para los dos: en A, el binario bajo systemd; en B, un `Dockerfile` multi-stage que **CI construye en cada PR**.
7. La UI tolera el arranque en frío: si `/healthz` tarda, muestra «despertando el servidor» con un límite de espera.

## /system (v2)

Pocas cifras, cada una con su significado exacto. Una instantánea compartida se calcula cada 5–10 s y se sirve a todos los visitantes: nada de consultas SQL ni parseos de `/proc` por cada polling, y ninguna etiqueta por IP o por corrida.

Primera versión:

- uptime **del proceso** y commit/versión de Go (`debug.ReadBuildInfo`);
- goroutines y heap vivo (`runtime/metrics`, con las unidades que documenta);
- corridas activas / capacidad, y admisiones rechazadas por motivo;
- trabajos pendientes y en ejecución, y DLQ actual;
- contadores de reintentos y errores.

Cómo se presentan, para no prometer de más:

- **Uptime del proceso no es disponibilidad del servicio.** La disponibilidad la mide el monitoreo externo; si se muestra, se cita esa fuente.
- **Heap no es la RAM del proceso.** Si se publica RSS, aparece como otra medida, con su nombre.
- **Cola y DLQ son valores actuales de corridas activas:** pueden bajar porque alguien cerró la pestaña, sin que los trabajos se hayan resuelto. La página lo dice.
- **Tasas con ventana explícita:** «último minuto» o «desde el arranque», nunca una cifra sin ventana.
- **Latencias p50/p95 (si entran):** histograma de buckets fijos, con ventana y cantidad de muestras visibles; con pocas muestras, «sin datos». Los endpoints breves se miden aparte de la duración de las corridas, y el polling de `/system` y `/healthz` queda fuera de la cifra.
- **«Reintentos de la última hora»:** anillo fijo de 60 contadores por minuto, sin guardar cada evento; si el proceso lleva menos de una hora, se indica la cobertura real.
- Métricas del host (carga, memoria de VM, cgroup) y pausas de GC quedan para después. Cuando entren: carga no es porcentaje de CPU, y memoria de la VM, consumo del cgroup y límite del servicio son tres magnitudes distintas (systemd también usa cgroups en la VM).

## Subetapas y estimación

Estimación orientativa: **180–250 h para todo** (v1 ~136–188 h, v2 ~44–62 h), unas 18–25 semanas a 10 h/semana, incluyendo aprendizaje, revisión y correcciones. No es una medición de tu velocidad: **se recalibra después de 7.1** con las horas reales de 7.0 y 7.1.

El «terminado cuando» de cada subetapa es el resumen; la lista completa de casos a testear llega en su brief, en palabras y sin código.

### Lab v1

#### 7.0 — Arranque y alta en Oracle (12–16 h)
- Go: Tour of Go completo, módulos, `go run/test/vet`, layout (`cmd/lab`, `internal/…`), errores como valores.
- Entregable: módulo en `api/`, `GET /healthz` que escucha en `PORT`, primer test con `httptest`, CI (vet, staticcheck, govulncheck, `test -race`), README de `api/` y README raíz actualizados (hoy dicen «semana 3»). Alta de la cuenta de Oracle y registro de la cuota vigente (sin desplegar todavía).
- Terminado cuando: CI verde, podés explicar cada línea de `main.go` y la cuenta de Oracle existe.

#### 7.1 — Dominio sin HTTP (10–14 h)
- Go: tipos, métodos, constantes tipadas, `errors.Is/As`, errores centinela, tests de tabla.
- Entregable: máquina de estados del pedido (`created → payment_pending → paid → dispatching → dispatched`, más `failed`/`dead`) como funciones puras; reglas de idempotencia (misma clave y mismo payload → mismo resultado; misma clave y otro payload → conflicto) como funciones puras.
- Terminado cuando: cada transición, válida e inválida, y cada caso de idempotencia tienen su test. **Recalibrar la estimación.**

#### 7.2 — HTTP, middleware y CORS (12–16 h)
- Go: `net/http`, JSON, middleware (logging, recover, límite de body, CORS), configuración desde el entorno con validación al arrancar.
- Entregable: solo `/healthz` es público. Middleware de CORS completo. Timeouts del servidor (`ReadHeaderTimeout`, `MaxHeaderBytes`).
- Casos a testear de CORS, además de los del brief:
  - se aceptan `http://localhost:3000`, el origen de producción y un preview con rama válida (`portfolio-git-stage7-2-cors-alejodla.vercel.app`), más **una URL real** copiada de un preview de Vercel, incluida una de rama larga truncada;
  - se rechazan: otro proyecto en `vercel.app` (`otro-git-x-alejodla.vercel.app`); otro equipo con slug distinto (`portfolio-git-x-otro.vercel.app`); `http://` en un preview; puerto, puerto vacío, path, usuario, query o fragmento; un subdominio extra adelante (`a.portfolio-git-x-alejodla.vercel.app`); el patrón seguido de un dominio ajeno (`portfolio-git-x-alejodla.vercel.app.evil.example`); un prefijo extra (`evilportfolio-git-x-alejodla.vercel.app`); rama vacía (`portfolio-git--alejodla.vercel.app`); rama que empieza o termina con `-`; caracteres fuera de `a-z0-9-`; mayúsculas en cualquier parte; etiqueta de más de 63 caracteres; `null`; una URL opaca; escapes `%`; valores con coma o espacios; dos encabezados `Origin`;
  - **documenta el límite conocido:** `portfolio-git-demo-x-alejodla.vercel.app` se acepta (el test existe para que el riesgo residual quede visible, no para celebrarlo);
  - un origen aceptado recibe `Access-Control-Allow-Origin` con su valor exacto, nunca `*`; uno rechazado no recibe ese encabezado;
  - `Vary: Origin` está en todas las respuestas, aceptadas o no;
  - preflight: 204 solo si origen, método (`POST`) y headers (`content-type`) pasan; 403 si falla cualquiera de los tres, incluido un header extra;
  - un `Origin` rechazado en `POST /lab/runs` no llega a la admisión (se verifica en 7.6 con un contador de admisiones);
  - sin `Origin`, la petición se atiende normalmente y sin encabezados CORS;
  - configuración: un `PREVIEW_ORIGIN_PATTERN` sin `{branch}` o con más de uno, o un `ALLOWED_ORIGINS` con un origen inválido (con path, mayúsculas, sin esquema), hace fallar el arranque con un error que dice cuál.
- Terminado cuando: todos esos casos pasan y el servidor no arranca con configuración inválida.

#### 7.3 — Operación: despliegue, rollback y ensayo del plan B (14–20 h)
- Aprendizaje: systemd, Caddy, firewall de Oracle, compilación cruzada, Docker multi-stage.
- Entregable: VM provisionada según el runbook; usuario dedicado; Caddy con almacenamiento persistente; DuckDNS con token fuera del repo; artefactos `arm64` y `amd64` desde CI; despliegue por directorio de versión y enlace `current`; **un rollback ensayado**; verificación externa del certificado; `Dockerfile` construido en CI; **ensayo del plan B** con el mismo commit, anotado y bajado; `docs/runbook-api.md`.
- Terminado cuando: `https://<sub>.duckdns.org/healthz` responde con certificado válido, el rollback está probado, el plan B arrancó una vez y el runbook permite repetir todo sin memoria.

#### 7.4 — Presupuesto de recursos (16–22 h)
- Go: `sync.Mutex`, contadores atómicos, `golang.org/x/time/rate`, `net/netip`, `crypto/rand`, `context`.
- Entregable, **antes de cualquier endpoint que cree estado**: admisión con reserva atómica (global y por IP) sin cola; limitador por IP con vencimiento y tamaño máximo; política de `X-Forwarded-For`; IDs criptográficos; cuotas por corrida como tipo con contadores; logs acotados; unidad de systemd con `MemoryHigh`/`MemoryMax`/`CPUQuota`. Una **corrida falsa** (reserva cupo, emite heartbeats, respeta el TTL) para probar todo sin el pipeline.
- **Prueba de saturación** con un cliente de carga escrito por vos en Go (N goroutines abriendo corridas por encima de los topes): las rechazadas reciben 429/503, la memoria se estabiliza, no quedan goroutines al terminar. Se anota el consumo por corrida.
- Terminado cuando: la prueba de saturación pasa en la VM y el presupuesto de memoria está escrito con números medidos.

#### 7.5 — SQLite por corrida y pedidos idempotentes (16–22 h)
- Go: `database/sql`, transacciones, esquema embebido con `embed`, `context` con timeouts.
- Entregable: base en memoria por corrida con una sola conexión conservada; pedido + ítems en una transacción; idempotencia con `UNIQUE` y hash del payload (conflicto si difiere); límites de filas y `max_page_count`; tabla inbox.
- Terminado cuando: los tests prueban que la base persiste entre operaciones de la misma corrida, que dos corridas no comparten datos, que la misma clave con otro payload da conflicto, que exceder filas termina la corrida con `quota_exceeded`, y que ninguna operación pide una segunda conexión dentro de una transacción.

#### 7.6 — La corrida como petición de streaming (16–22 h)
- Go: `http.ResponseController` (flush y plazos de escritura), NDJSON con `json.Encoder`, canales con buffer fijo, `select`, `signal.NotifyContext`, registro de corridas.
- Entregable: `POST /lab/runs` que valida origen, admite, inicializa con limpieza ante fallos parciales y transmite; heartbeats; política de cliente lento; TTL; apagado con plazo; fixtures del contrato.
- Terminado cuando: hay tests de integración para corte del cliente, cliente que no lee (la corrida se cancela con `slow_client`), fallo forzado en cada paso de la inicialización (no queda nada abierto y el cupo se libera), `SIGTERM` con corridas abiertas (se cierran dentro del plazo) y ausencia de goroutines colgadas.

#### 7.7 — Webhooks firmados e inbox (10–14 h)
- Go: `crypto/hmac`, listener interno compartido, `ServeMux` separado, cliente HTTP con timeouts.
- Entregable: PSP simulado en el listener interno que firma con el secreto de la corrida y entrega duplicados o mal firmados según el escenario; receptor que verifica, guarda en inbox y recién después responde 200; deduplicación por ID de evento.
- Terminado cuando: un webhook duplicado no cambia el resultado, uno mal firmado se rechaza y se cuenta, y las rutas internas no responden en el listener público.

#### 7.8 — Worker, reintentos, reconciliación y escenarios (20–28 h)
- Go: goroutines, `context` y cancelación, reloj inyectado, `testing/synctest` para la lógica de tiempo, dobles detrás de interfaces.
- Entregable: un worker por corrida; backoff exponencial con jitter y tope; clasificación reintentable / no reintentable; DLQ con request/response truncados; carrier simulado con 5xx y timeout-pero-creado; reconciliación por referencia externa antes de reintentar; los tres escenarios v1.
- Terminado cuando: los tests de tiempo (`synctest`, sin red) cubren la secuencia de esperas, el tope de intentos y la entrada a DLQ; los de integración (HTTP real, tiempos de milisegundos) cubren timeout-pero-creado con un solo despacho y cada escenario de punta a punta. Se repite la prueba de saturación con el pipeline real y se actualiza el presupuesto.

#### 7.9 — UI del Lab v1 en web/ (Claude; Alejo 4–6 h de revisión y contrato)
- Página `/[locale]/lab`: selector de los tres escenarios, botón Ejecutar, timeline mínimo por carriles en la dirección B, explicación de cada mecanismo en el momento en que ocurre, ES/EN. Estados: admisión rechazada (con el motivo), «despertando el servidor», corrida terminada por cada motivo, «se perdió la conexión», sin JS.
- **Requisito de copia (escenarios «Correo con 5xx» y «Timeout pero creado»):** la UI cuenta el reintento ante 5xx como la mejora sobre Solution, con esta idea en ES/EN: «en producción no se podía reintentar un 5xx al crear un envío porque no había forma de saber si se había creado; con referencia externa y reconciliación, el reintento es seguro». El texto aparece en el momento del timeline en que ocurre el primer reintento, no en una nota aparte.
- Validador TS del contrato con test contra los fixtures.
- Se prueba en local y en el preview de Vercel de cada rama contra la API en Oracle.
- Antes de construir, propuesta visual para aprobar (como en la etapa 3). Puede empezar en paralelo con 7.6–7.8 contra los fixtures.

#### 7.10 — Publicación de v1 (6–8 h)
- Pasada de accesibilidad del Lab, enlace desde la sección «qué cambiaría» de Solution (cada punto apunta al escenario que lo demuestra), README y `docs/` al día, alerta de `/healthz` y del certificado activas.

### Lab v2

#### 7.11 — Pool de workers y leases (22–30 h)
- Hasta dos workers por corrida, lease con token de dueño y vencimiento, confirmación condicional, escenario «el worker muere a mitad de trabajo». Interruptores en vivo con el ID como capacidad (`POST /lab/runs/{id}/…`, cuotas de controles por segundo).
- Tests de tiempo para vencimiento y retoma; de integración para confirmación tardía del worker original (no afecta filas) y efecto externo único.

#### 7.12 — Desorden y reprocesamiento de DLQ (10–14 h)
- Webhooks fuera de orden configurables; botón «reprocesar» desde la DLQ con cuota de reprocesamientos.

#### 7.13 — /system (12–18 h)
- Endpoint con la instantánea compartida y las cifras de la sección /system; página `/[locale]/system` (Claude) que dice de dónde sale cada número y con qué ventana.

## Presupuesto en dinero

| Concepto | USD/mes |
|---|---|
| VM Oracle Cloud Always Free (Pay As You Go dentro del límite gratuito, a verificar) | 0 |
| DuckDNS, Caddy, Let's Encrypt | 0 |
| SQLite, CI en GitHub Actions, monitoreo externo | 0 |
| Plan B (si hace falta): free tier que escala a cero, dentro de sus cuotas | 0 |
| Dominio propio | más adelante (ver etapa 9) |
| **Total objetivo** | **0, condicionado a cuotas** |

## Riesgos

- **Que el Lab parezca un juguete.** Escenarios ligados a fallas que ocurrieron en Solution, y texto que lo dice.
- **Abuso del endpoint público.** Presupuesto de recursos verificable antes del primer endpoint con estado; no protege contra saturación de red o TLS.
- **Una corrida tumba a las demás.** Comparten proceso: `recover` en cada goroutine de corrida, cuotas, `MemoryHigh` antes de `MemoryMax`, y la palabra «sandbox» fuera del texto.
- **Oracle: alta de cuenta, capacidad de A1, reclamo por inactividad.** Alta en 7.0; fallback AMD con topes propios; Pay As You Go contra el reclamo (a verificar); plan B ensayado en 7.3; runbook de recuperación.
- **Certificado que deja de renovarse.** Almacenamiento persistente de Caddy, verificación externa y alerta.
- **Arranque en frío en el plan B.** La UI lo anticipa.
- **Subestimar la concurrencia.** v2 concentra lo más difícil (pool y leases) y no bloquea la publicación de v1. Si 7.8 se alarga, se recortan escenarios, no los tests.
- **Que termine escribiéndolo la IA.** La tabla de roles es el contrato; Codex puede señalarlo si un PR de Go viene de mí.

## Decisiones tomadas

2026-11-17:
- Costo objetivo cero. API en Oracle Cloud Always Free; plan B, free tier que escala a cero, con el Lab diseñado para que el cambio no requiera reescribir.
- HTTPS con subdominio de DuckDNS + Caddy hasta el dominio propio.
- `/lab` como ruta propia.
- Alejo escribe todos los tests de Go; cada brief lista los casos a testear, sin código.
- `web/` ya está en Vercel (producción en `vercel.app` y un preview por rama). La UI del Lab se prueba en local y en los previews desde que existe. `NEXT_PUBLIC_API_URL` se configura en Vercel para Production y Preview. CORS acepta localhost, producción y la forma de mis previews, con el riesgo residual documentado.

Revisión 1 de Codex (incorporada):
- Dos entregas: Lab v1 publicable y Lab v2. Estimación 180–250 h, a recalibrar después de 7.1.
- Presupuesto de recursos verificable antes del primer endpoint con estado.
- Corrida = petición `fetch` con respuesta NDJSON, sin reconexión; heartbeats, cliente lento, limpieza ante fallos parciales y apagado con plazo.
- Una conexión SQL por corrida, sin HTTP dentro de transacciones; leases con token de dueño (v2).
- Listeners internos compartidos; tests de tiempo separados de los de integración.
- Las corridas no son sandboxes.
- Operación: Caddy persistente y verificado, token de DuckDNS fuera del repo, parches y rollback, artefacto `amd64`, Pay As You Go contra el reclamo, ensayo del plan B en 7.3.
- El portfolio se lanza sin esperar al Lab.

Aprobado por Alejo tras la revisión 1:
- Reintento ante 5xx en el Lab, contado en la UI como la mejora sobre Solution (requisito de 7.9).
- Pay As You Go con alerta de presupuesto en USD 1, a verificar en la documentación de Oracle antes de activarlo.

## Preguntas abiertas

Ninguna por ahora. Pendientes de verificar al ejecutar (no de decidir): cuota vigente de A1, condiciones de Pay As You Go y de reclamo en la documentación de Oracle, y cuotas del free tier del plan B.
