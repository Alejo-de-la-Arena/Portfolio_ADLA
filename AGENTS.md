# Reglas del repositorio

- TypeScript strict, sin any.
- Contenido como datos tipados en web/content/. ES y EN obligatorios para texto visible traducible, incluidos textos de interfaz.
- slug es un id técnico único compartido por todos los idiomas. Fechas, stack y destinos de enlaces se almacenan una sola vez.
- Fechas: strings ISO YYYY-MM o YYYY-MM-DD con tipo propio ISODate y validación de calendario. Formatear por idioma con Intl.DateTimeFormat y timeZone: "UTC".
- Nada de Inter, Roboto ni fuentes del sistema; nada de gradientes violetas; nada de animaciones de entrada genéricas en cada sección.
- Cada decisión de framework se explica antes de aplicarla.
- No commitear sin mostrar el diff.
