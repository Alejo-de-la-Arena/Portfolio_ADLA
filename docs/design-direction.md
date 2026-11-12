# Dirección visual: «tus sistemas, dibujados»

Para quién: hiring managers que quieren ver si construyo sistemas reales, y clientes que muchas veces entran desde el celular.
Qué tiene que pasar: en los primeros segundos de cada case study se ve el sistema (quién le habla a quién, qué se confirma y dónde) antes de leer una sola línea.
Lo que ya se descartó: «documentación técnica sobria» quedó en texto plano. Las dos direcciones parten de un dibujo, no de un párrafo.

## Base común

- Texto: Hanken Grotesk. Datos, etiquetas de diagrama, callouts y fechas: JetBrains Mono. Ambas ya están en `next/font/local`.
- Acento del sitio, naranja señal: `#D9480F` en claro y `#FF6A2B` en oscuro. **Restricción AA medida:** `#D9480F` da 3,72:1 sobre el gris de A y 4,30:1 sobre blanco, así que en modo claro **no se usa para texto normal**. Queda para lo que necesita 3:1: anillo de foco, subrayado de enlaces, marcador de página actual y cifras grandes. En oscuro, `#FF6A2B` da más de 6:1 y sí puede ser texto.
- Acento por proyecto: un dato tipado en `web/content/case-visuals.ts`, junto con el diagrama, las métricas y las anotaciones. Para Solution es el cian de su propia interfaz (lo tomé de la captura): `#00707F` en claro (5,0:1) y `#35D3EA` en oscuro (9,7:1). El naranja marca el sitio y el acento marca el sistema; no compiten porque aparecen en capas distintas.
- Movimiento: solo en el diagrama. Un paquete recorre cada conexión en orden, el paso activo se resalta en la lista sincronizada y hay botones de pausa y paso a paso (WCAG 2.2.2). Con `prefers-reduced-motion` o sin JavaScript se muestra el diagrama completo, quieto y legible, y la lista numerada (que acá sí es una secuencia real).
- Diagrama de Solution, sacado solo del texto del case study: navegador (SPA React) → API (Node/Express) → cotización en Correo Argentino → Mercado Pago → redirección a «éxito» (punteada, *no confirma nada*) → webhook con firma HMAC → la API consulta el pago y verifica el pedido → Supabase (Postgres) → creación del envío en Correo (reintento solo ante timeout) → Meta CAPI con datos hasheados y `purchase_<orderId>`, y el pixel del navegador con el mismo ID.
- Las cifras salen de `case-visuals.ts`, y un test comprueba que cada número aparezca literalmente en el texto del case study. Así un número no puede separarse del contenido.

## A. Plano

Un plano de ingeniería: preciso, frío, con una sola tinta de color. El case study es una lámina.

- **Display: Archivo**, eje de ancho 62–125, usado entre 62 y 75 de ancho, en 600–700. La rotulación de planos técnicos (ISO 3098) es angosta y de trazo parejo. Un grotesco condensado variable da cifras enormes que entran en 390 px («~80 → ~300» sin cortar) y títulos largos en pocas líneas. No es una fuente de moda, y un solo archivo cubre de títulos a números.
- **Color:** gris frío de film de dibujo `#EDEFEE` con la lámina en `#F8F9F8` y tinta `#16191A`. En oscuro, `#101314`, `#161A1B` y `#E4E8E8`. Las líneas inactivas van en gris; el acento del proyecto aparece solo en el recorrido activo, las cifras y los callouts.
- **Diagrama:** horizontal en desktop, sobre una grilla de puntos; recorridos ortogonales; nodos rectangulares con nombre en sans y rol en mono; números de paso sobre cada conexión. La lámina lleva un rótulo como los de un plano: número de documento = slug, período, estado. En mobile se cambia a un trazado vertical propio, no a una versión achicada.
- **Case study:** rótulo arriba (título en Archivo condensado, metadatos en tabla mono), lámina con el diagrama a todo el ancho y debajo la lista de pasos. Después, fila de cifras grandes con regla fina. El cuerpo va en dos columnas: encabezados en el margen izquierdo y texto a 65ch. Las capturas se anotan con líneas de 1 px y etiquetas mono en un riel sobre la imagen.
- **Home:** nombre y descripción a la izquierda. A la derecha, la lámina de Solution en vivo, como prueba en lugar de promesa. Debajo, índice de case studies con su número de documento.

```
A · desktop                                   A · mobile
┌──────────────────────────────────────────┐  ┌──────────────┐
│ título condensado        │ doc  solution │  │ título       │
│                          │ per. 2026-02… │  │ rótulo       │
├──────────────────────────┴───────────────┤  ├──────────────┤
│ ·  ·  [Nav]──1──[API]──3──[MP]  ·  ·  ·  │  │ [Nav]  [MP]  │
│ ·  ·    ╰───────┼──7──[Correo]  ·  ·  ·  │  │    [API]     │
│ ·  ·         [Supabase]  [Meta] ·  ·  ·  │  │ [DB] [Correo]│
├──────────────────────────────────────────┤  │    [Meta]    │
│ 1 … 2 … 3 …  (pasos sincronizados)       │  │ 1 … 2 …      │
├──────────────────────────────────────────┤  ├──────────────┤
│ ~80→~300      1.086        1.006         │  │ ~80→~300     │
├────────────┬─────────────────────────────┤  │ 1.086        │
│ Contexto   │ texto 65ch                  │  │ Contexto     │
└────────────┴─────────────────────────────┘  └──────────────┘
```

## B. Cartel

Editorial y frontal: blanco y negro absolutos, un campo de color plano por proyecto y tipografía que ocupa el ancho.

- **Display: Bricolage Grotesque** en 800, óptico 96 y ancho 75. Tiene *ink traps* y curvas desparejas que a tamaño cartel se ven dibujadas a mano, con carácter, sin caer en una serif (evita el combo crema + serif + terracota). Los ejes óptico y de ancho permiten pasar de cifras a 22vw a títulos de sección sin otra familia.
- **Color:** `#FFFFFF` y `#000000` puros, sin negros teñidos, y reglas negras de 2 px. El acento del proyecto es un **campo** a sangre: el encabezado del case study es un bloque cian `#35D3EA` con texto negro (11,7:1) en ambos modos. El naranja del sitio se reduce a navegación y foco.
- **Diagrama:** vertical en todos los tamaños, como un recorrido que se lee de arriba hacia abajo. El trazo es grueso (3 px) y el webhook dibuja un retorno lateral. En desktop, el diagrama queda a la izquierda y los pasos a la derecha, en cuerpo grande; el paso activo cambia de peso, no solo de color.
- **Case study:** campo de color con el título enorme. Debajo, las cifras como titulares («~80 → ~300» a todo el ancho), después el recorrido y luego el texto en una columna con el resumen como bajada grande. Los encabezados de sección van en Bricolage y las capturas a sangre de la columna, con callouts.
- **Home:** el nombre ocupa el ancho de la pantalla. Debajo, los case studies como titulares grandes numerados por su `order`, y el primero muestra su recorrido en miniatura.

```
B · desktop                                   B · mobile
┌──────────────────────────────────────────┐  ┌──────────────┐
│████ campo cian ███████████████████████████│  │██ campo ██████│
│ SOLUTION PERFUMES: E-COMMERCE…  (enorme) │  │ título        │
│██████████████████████████████████████████│  │██████████████│
│ ~80 → ~300   pedidos/mes                 │  │ ~80→~300      │
│ 1.086  ·  1.006                          │  │ 1.086         │
├──────────────┬───────────────────────────┤  ├──────────────┤
│ [Nav]        │ 1  Checkout: crear pedido │  │ [Nav]  [MP]  │
│   │          │ 2  Cotizar envío          │  │   [API]      │
│ [API]──[MP]  │ 3  …  (activo en negrita) │  │ …            │
├──────────────┴───────────────────────────┤  │ 1 …  2 …     │
│ bajada grande / texto                    │  └──────────────┘
└──────────────────────────────────────────┘
```

## Qué revisé contra los defaults

- Saqué una propuesta inicial con fondo casi negro y acento ácido para B: es el default número 2. Quedó blanco y negro puros con un campo de color plano.
- No hay etiquetas en mayúsculas sobre cada título, ni «A · B · C» en metadatos de interfaz, ni flechas agregadas a los enlaces. El mono queda para datos reales (stack, pasos, rótulo), no para decorar.
- La numeración solo aparece donde hay secuencia: los pasos del flujo y el `order` de los case studies. Las anotaciones de capturas usan letras como clave, no números.

## Preview

`/[locale]/preview/a` y `/[locale]/preview/b`: el hero de la home y el case study completo de Solution, con `noindex`, sin canonical ni hreflang, en la lista blanca de Proxy y fuera del verificador de contenido indexable.

## Decisión (2026-11-12): dirección B

Ajustes aplicados en /[locale]/preview/b, todavía sin tocar las rutas reales:

- Diagrama vertical redibujado: Navegador arriba al centro, Mercado Pago y Meta a los lados, la API como franja y Supabase/Correo abajo. Todas las conexiones, la 10 incluida, son tramos cortos y ortogonales. `case-visuals.test.ts` comprueba que no haya cruces, solapamientos ni conexiones que atraviesen nodos, y que los números de paso no se pisen. El trazado horizontal de A no cambió.
- Home: nombre, titular y disponibilidad en `content/profile.ts`, literales de Alejo. Junto al primer proyecto destacado va la miniatura animada del diagrama, con pausa y el paso actual en texto.
- Lectura: cuerpo de 17 px con interlineado 1,6, también en la lista de pasos y la leyenda de capturas. Las etiquetas del riel van a 14 px; en columnas angostas se reemplazan por marcadores con letra, repartidos sobre la imagen y unidos al punto, y la leyenda queda a 17 px.
- Capturas: cada anotación nombra algo visible en esa imagen. Se sacaron Correo Argentino y «estados de pago». La sección muestra todas las imágenes del case study; para sumar una, va en `gallery` y sus callouts en `case-visuals.ts`, con el mismo `src`.
- Modo claro sin grises. El recorrido activo es negro grueso y el nodo activo un bloque cian con borde negro; las cifras van sobre una banda negra. En oscuro, el recorrido activo es cian. En ambos modos, el paso activo de la lista lleva fondo cian con texto negro (11,7:1).

### Ajustes finales (2026-11-12)

- Modo oscuro en mobile: la página lo aplicaba bien (comprobado con `matchMedia` y el fondo computado); la falla estaba en el script de capturas. El script nuevo vuelve a aplicar y verificar el esquema antes de cada captura y compara el píxel de fondo del PNG. Se agregó `color-scheme: light dark` para que los controles nativos sigan el modo.
- Contacto en `content/profile.ts`: email con mailto y botón para copiar, más LinkedIn y GitHub, debajo de la disponibilidad y visibles en el primer pantallazo. El preview usa su propia navegación (Inicio, Proyectos, Contacto → #contact) en lugar del header del layout, para no tocar las rutas reales; al pasar B a producción, «Contacto» va al layout.
- Case study: sin summary (lo reemplaza la banda de cifras); «Resultados destacados» pasa a «En resumen» / «At a glance» solo en el preview.
- Home: todos los proyectos muestran su summary. La miniatura aparece cuando el proyecto tiene diagrama en `case-visuals.ts`.
