import type { CaseStudy } from "./types";

// Text copied literally from the previous portfolio; see docs/content-migration.md.
export const caseStudies: readonly CaseStudy[] = [
  {
    "slug": "solution",
    "title": {
      "es": "Solution Perfumes: e-commerce a medida, de ~80 a ~300 pedidos por mes",
      "en": "Solution Perfumes: custom e-commerce, from ~80 to ~300 orders a month"
    },
    "roleLine": {
      "es": "Desarrollador full-stack · en producción abr–oct 2026",
      "en": "Full-stack developer · in production Apr–Oct 2026"
    },
    "period": {
      "start": "2026-02",
      "end": "2026-09"
    },
    "status": "archived",
    "featured": true,
    "order": 1,
    "summary": {
      "es": "Desarrollé la plataforma de e-commerce propia de Solution, que entró en producción a principios de abril de 2026. La marca pasó de unos 80 pedidos mensuales en Tienda Nube a unos 300, y al 14 de septiembre de 2026 la plataforma había procesado 1.086 pedidos de 1.006 compradores únicos.",
      "en": "I built Solution’s custom e-commerce platform, which went live in early April 2026. The brand went from around 80 monthly orders on Tienda Nube to around 300, and as of September 14, 2026, the platform had processed 1,086 orders from 1,006 unique buyers."
    },
    "cover": {
      "src": "/work/solution/solution-home.webp",
      "alt": {
        "es": "Portada de Solution Perfumes en escritorio: presentación de fragancias y acceso al carrito.",
        "en": "Solution Perfumes desktop homepage: fragrance introduction and cart access."
      },
      "width": 2532,
      "height": 1266,
      "variant": "desktop"
    },
    "gallery": [
      {
        "src": "/work/solution/solution-home-mobile.webp",
        "alt": {
          "es": "Vista mobile de SOLUTION: interfaz del e-commerce adaptada a pantalla pequeña.",
          "en": "SOLUTION mobile view: e-commerce interface adapted for small screens."
        },
        "width": 850,
        "height": 1100,
        "variant": "mobile"
      }
    ],
    "stack": [
      "React",
      "Node.js",
      "Mercado Pago",
      "REST API",
      "Correo Argentino",
      "Auth"
    ],
    "links": [{
      "href": "https://solution-topaz.vercel.app",
      "label": {
        "es": "Ver versión archivada (checkout desactivado)",
        "en": "View archived version (checkout disabled)"
      }
    }],
    "highlights": [
      {
        "es": "Mercado Pago como única pasarela.",
        "en": "Mercado Pago as the sole payment provider."
      },
      {
        "es": "Envíos nacionales mediante Correo Argentino.",
        "en": "Nationwide shipping through Correo Argentino."
      },
      {
        "es": "Checkout con estados explícitos de pago.",
        "en": "Checkout with explicit payment states."
      },
      {
        "es": "Portal mayorista con aprobación de cuenta y acceso por plan.",
        "en": "Wholesale portal with account approval and plan-based access."
      }
    ],
    "sections": [
      {
        "heading": {
          "es": "Contexto",
          "en": "Context"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Solution vendía en Tienda Nube y procesaba unos 80 pedidos por mes. Necesitaba cosas que la plataforma no le daba: un canal mayorista con reglas propias, envíos con su cuenta de Correo Argentino y una atribución confiable de compras para Meta Ads, su principal canal de venta.",
                  "en": "Solution sold on Tienda Nube and handled around 80 orders a month. They needed things the platform didn’t give them: a wholesale channel with its own rules, shipping through their own Correo Argentino account, and reliable purchase attribution for Meta ads, their main sales channel."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué construí",
          "en": "What I built"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Una tienda propia de punta a punta: SPA en React, API en Node/Express y Supabase (Postgres, Auth, Storage). Checkout con Mercado Pago; envíos con Correo Argentino, con cotización en vivo, retiro en sucursal y despacho; un portal mayorista con aprobación de cuentas y acceso por plan; y un panel de administración que los dueños usaban a diario para pedidos, productos, métricas y rentabilidad. Después del lanzamiento seguí sumando mejoras a partir de reuniones de seguimiento con el cliente cada dos o tres semanas.",
                  "en": "A custom store, end to end: React SPA, Node/Express API, and Supabase (Postgres, Auth, Storage). Mercado Pago checkout; Correo Argentino shipping with live quotes, branch pickup and dispatch; a wholesale portal with account approval and plan-based access; and an admin panel the owners used daily for orders, products, metrics and profit. After launch I kept shipping improvements based on check-ins with the client every two to three weeks."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Decisiones que importaron",
          "en": "Decisions that mattered"
        },
        "blocks": [
          {
            "type": "bullets",
            "items": [
              {
                "lead": {
                  "es": "El pago lo confirma Mercado Pago, no la redirección.",
                  "en": "A payment is confirmed by Mercado Pago, not by the redirect."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Volver a la URL de “éxito” no marca un pedido como pagado. El servidor consulta el pago en Mercado Pago, verifica que corresponda a ese pedido y recién ahí lo confirma. Los webhooks se validan con firma HMAC.",
                      "en": "Landing on the “success” URL doesn’t mark an order as paid. The server asks Mercado Pago for the payment, checks that it belongs to that order, and only then confirms it. Webhooks are verified with an HMAC signature."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Reintentar un timeout, nunca un 5xx, al crear un envío.",
                  "en": "Retry a timeout, never a 5xx, when creating a shipment."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Crear un envío en Correo despacha un paquete real, así que solo reintento errores de red, con backoff. Cada falla guarda el request y la respuesta exactos para que el administrador vea qué pasó. Esto reduce los despachos duplicados pero no los elimina, porque un timeout también puede significar que el envío se creó (ver abajo).",
                      "en": "Creating a shipment with Correo dispatches a real package, so I only retry network errors, with backoff. Every failure stores the exact request and response so the admin can see what went wrong. This reduces duplicate dispatches but doesn’t eliminate them, since a timeout can also mean the shipment was created (see below)."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Seguimiento de compras desde el servidor sin contar dos veces.",
                  "en": "Server-side purchase tracking without double counting."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Los bloqueadores de anuncios e iOS rompían la atribución. Sumé la Conversions API de Meta desde el servidor, con datos del cliente hasheados y el mismo ID de evento que el pixel del navegador (",
                      "en": "Ad blockers and iOS were breaking attribution. I added Meta’s Conversions API from the server with hashed customer data, sharing the same event ID as the browser pixel ("
                    }
                  },
                  {
                    "type": "code",
                    "value": "purchase_<orderId>"
                  },
                  {
                    "type": "text",
                    "value": {
                      "es": "), para que Meta cuente cada venta una sola vez.",
                      "en": ") so Meta counts each sale once."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Un problema de costos real.",
                  "en": "Fixing a real cost problem."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Los videos de productos y testimonios nos llevaron muy por encima de la cuota de egress de Supabase. Los moví a Cloudflare R2, que no cobra egress, y agregué posters y carga diferida. El consumo bajó fuerte después del cambio.",
                      "en": "Product and testimonial videos pushed us well over the Supabase egress quota. I moved them to Cloudflare R2, which has free egress, and added posters and deferred loading. Egress dropped sharply after the change."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Rentabilidad, no solo facturación.",
                  "en": "Profit, not just revenue."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "La calculadora del panel guarda el costo de cada producto al momento de la venta, usa las comisiones que efectivamente cobró Mercado Pago y el costo real de envío aunque sea gratis para el comprador, y prorratea los gastos fijos por día.",
                      "en": "The admin calculator snapshots each product’s cost at the moment of sale, uses the actual fees Mercado Pago charged and the real shipping cost even when shipping is free for the buyer, and prorates fixed expenses by day."
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Resultados",
          "en": "Results"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Salió a producción a principios de abril de 2026. Al 14 de septiembre había procesado 1.086 pedidos de 1.006 compradores únicos, y la marca pasó de ~80 a ~300 pedidos por mes.",
                  "en": "Went live in early April 2026. By September 14 it had processed 1,086 orders from 1,006 unique buyers, and the brand went from ~80 to ~300 orders a month."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Por qué pasó a Shopify",
          "en": "Why it moved to Shopify"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "El cliente iba a cambiar Correo Argentino por Andreani, y los proveedores de logística cambiaban seguido. Dimensioné y coticé con honestidad la integración con Andreani: en una plataforma propia, cada cambio de logística es trabajo de desarrollo. Lo evaluaron y migraron a Shopify, donde cambiar de proveedor son unos pocos clics. Estuve de acuerdo. El desarrollo a medida rindió mientras el negocio crecía; cuando la logística pasó a ser lo que cambiaba todo el tiempo, comprar tuvo más sentido que construir.",
                  "en": "The client was switching from Correo Argentino to Andreani, and logistics providers kept changing. I scoped and quoted the Andreani integration honestly: on a custom platform, every carrier change means development work. After weighing it, they moved to Shopify, where changing carriers is a few clicks. I agreed with the call. Building custom paid off while the business grew; once logistics became the part that kept changing, buying made more sense than building."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué haría distinto",
          "en": "What I’d do differently"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Mirando el código hoy:",
                  "en": "Looking at the code today:"
                }
              }
            ]
          },
          {
            "type": "bullets",
            "items": [
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Los precios y el costo de envío deberían salir solo del servidor, nunca del navegador.",
                      "en": "Prices and shipping cost should come only from the server, never from the browser."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "El pedido y sus ítems deberían crearse en una sola transacción, con una clave de idempotencia que sobreviva a los reintentos.",
                      "en": "Orders and their items should be created in one transaction, with an idempotency key that survives retries."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Los webhooks deberían guardarse antes de confirmarse y procesarse desde una cola.",
                      "en": "Webhooks should be stored before being acknowledged, and processed from a queue."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Todos los endpoints de administración deberían estar autenticados en la API, no solo ocultos en la interfaz.",
                      "en": "Every admin endpoint should be authenticated at the API, not just hidden in the UI."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "La creación de envíos debería conciliar los resultados inciertos (un timeout que en realidad creó el envío) en vez de adivinar.",
                      "en": "Shipment creation should reconcile uncertain results (a timeout that actually created the shipment) instead of guessing."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Tests para las invariantes críticas: webhooks duplicados, envíos con resultado incierto y parseo de direcciones.",
                      "en": "Tests for the critical invariants: duplicate webhooks, uncertain shipment creation, and address parsing."
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "don-teofilo-amoblamientos",
    "title": {
      "es": "Don Teófilo Amoblamientos: marca, sitio y panel para una carpintería a medida",
      "en": "Don Teófilo Amoblamientos: brand, website and admin panel for a custom carpentry shop"
    },
    "roleLine": {
      "es": "Diseñador y desarrollador full-stack",
      "en": "Designer & full-stack developer"
    },
    "period": {
      "start": "2026-07",
      "end": "2026-10"
    },
    "status": "live",
    "featured": true,
    "order": 2,
    "summary": {
      "es": "Don Teófilo mostraba su trabajo solo por WhatsApp. Diseñé la identidad visual y desarrollé el sitio y su panel de administración: un lenguaje tomado de los planos de carpintería, reglas de publicación aplicadas en la base de datos y consultas por WhatsApp según la sección.",
      "en": "Don Teófilo only showed its work through WhatsApp. I designed the visual identity and built the website and its admin panel: a visual language drawn from carpentry plans, publishing rules enforced in the database, and WhatsApp inquiries tailored to each section."
    },
    "cover": {
      "src": "/work/don-teofilo-amoblamientos/donteofilo-amoblamientos-home.png",
      "alt": {
        "es": "Portada de Don Teófilo: cocina a medida, lema «Medimos dos veces, cortamos una.», accesos a presupuesto y proyectos, controles del carrusel y WhatsApp. Vista de escritorio.",
        "en": "Don Teófilo homepage: custom kitchen, “Medimos dos veces, cortamos una.” headline, quote and project links, carousel controls and WhatsApp. Desktop view."
      },
      "width": 2516,
      "height": 1257,
      "variant": "desktop"
    },
    "gallery": [
      {
        "src": "/work/don-teofilo-amoblamientos/donteofilo-amoblamientos-home-mobile.png",
        "alt": {
          "es": "Portada de Don Teófilo: menú móvil, cocina a medida, lema «Medimos dos veces, cortamos una.», accesos a presupuesto y proyectos, controles del carrusel y WhatsApp. Vista móvil.",
          "en": "Don Teófilo homepage: mobile menu, custom kitchen, “Medimos dos veces, cortamos una.” headline, quote and project links, carousel controls and WhatsApp. Mobile view."
        },
        "width": 850,
        "height": 1100,
        "variant": "mobile"
      }
    ],
    "stack": [
      "React",
      "Vite",
      "JavaScript",
      "React Router",
      "Framer Motion",
      "Supabase",
      "PostgreSQL",
      "RLS",
      "SVG",
      "CSS Modules"
    ],
    "links": [
      {
        "label": {
          "es": "Don Teófilo Amoblamientos",
          "en": "Don Teófilo Amoblamientos"
        },
        "href": "https://www.donteofiloamoblamientos.com/"
      }
    ],
    "highlights": [
      {
        "es": "Identidad visual «Al milímetro», tomada del lenguaje de los planos de taller.",
        "en": "“Al milímetro” visual identity, drawn from the language of workshop plans."
      },
      {
        "es": "Ilustraciones SVG generadas desde datos en milímetros, nítidas en cualquier pantalla.",
        "en": "SVG illustrations generated from millimeter data, crisp on any screen."
      },
      {
        "es": "Reglas de visibilidad aplicadas en la base de datos con RLS y un trigger.",
        "en": "Visibility rules enforced in the database with RLS and a trigger."
      }
    ],
    "sections": [
      {
        "heading": {
          "es": "Contexto",
          "en": "Context"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Don Teófilo hace muebles a medida en Buenos Aires y Tandil. Sus ventas pasaban enteramente por WhatsApp: no había dónde ver el catálogo ni los trabajos terminados antes de escribir. El pedido era abierto (mostrar el trabajo y conseguir más clientes), sin especificaciones detalladas. Definí el alcance, la identidad visual y las funcionalidades, y los ajusté en dos reuniones de revisión con el cliente. Entregué una primera versión con catálogo y panel en julio y agosto, y en octubre rediseñé todo el sitio alrededor de una nueva identidad.",
                  "en": "Don Teófilo builds custom furniture in Buenos Aires and Tandil. Their sales ran entirely through WhatsApp: there was nowhere to see the catalog or finished work before reaching out. The brief was open (show the work, bring in more clients), with no detailed spec. I defined the scope, the visual identity and the features, and refined them across two review sessions with the client. I shipped a first version with the catalog and admin panel in July and August, then redesigned the whole site in October around a new identity."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué construí",
          "en": "What I built"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "La identidad visual, «Al milímetro», además del sitio y su panel de administración. React y Vite en el frontend, conectado directamente a Supabase (Postgres, Auth, Storage), con las reglas de acceso aplicadas en la base mediante RLS. Un catálogo filtrable por categoría, material, precio y búsqueda; páginas de obras con antes y después y galería; una sección del taller; y botones de WhatsApp que llevan el contexto del producto u obra que se estaba viendo. Las fotos se redimensionan y se convierten a WebP en el navegador antes de subirse, así el cliente puede publicar directo desde el celular.",
                  "en": "The visual identity, “Al milímetro” (“down to the millimeter”), plus the website and its admin panel. React and Vite on the front end, talking directly to Supabase (Postgres, Auth, Storage), with access rules enforced in the database through row-level security. A catalog filterable by category, material, price and search; project pages with before-and-after views and a gallery; a workshop section; and WhatsApp buttons that carry the context of the product or project being viewed. Photos are resized and converted to WebP in the browser before upload, so the client can publish straight from a phone."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Decisiones que importaron",
          "en": "Decisions that mattered"
        },
        "blocks": [
          {
            "type": "bullets",
            "items": [
              {
                "lead": {
                  "es": "Una identidad tomada del taller.",
                  "en": "An identity taken from the workshop."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Los carpinteros trabajan con planos, así que la interfaz habla ese idioma: cotas, medidas, dibujos técnicos. Diferencia al sitio de un catálogo genérico de muebles y refleja cómo funciona el oficio.",
                      "en": "Carpenters work from plans, so the interface speaks that language: dimension lines, measurements, technical drawings. It sets the site apart from a generic furniture catalog and reflects how the trade actually works."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Ilustraciones generadas desde datos, no exportadas.",
                  "en": "Illustrations generated from data, not exported."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Cada categoría del catálogo tiene un alzado de una pieza típica, descrito en milímetros, módulo por módulo: puertas, cajones, estantes. El componente mide su contenedor, calcula una escala uniforme de milímetros a píxeles y dibuja el SVG al tamaño real del contenedor, así los trazos y las cotas se ven nítidos en cualquier pantalla. Las aristas ocultas van punteadas, como en un plano real, y una categoría nueva armada con tipos de módulo existentes es solo datos. La página «Cómo trabajamos» aplica la misma idea a una vista isométrica de un bajo mesada, con su propia proyección.",
                      "en": "Each catalog category has a front-elevation drawing of a typical piece, described in millimeters, module by module: doors, drawers, shelves. The component measures its container, computes a uniform millimeter-to-pixel scale, and draws the SVG at the container’s real size, so lines and dimension labels stay crisp on any screen. Hidden edges are dashed, like on a real plan, and a new category built from existing module types is just data. The “How we work” page applies the same idea to an isometric view of a base cabinet, with its own projection math."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Dos antes y después para dos problemas distintos.",
                  "en": "Two before-and-after components for two different problems."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "En la portada, la transición sigue el scroll dentro de una sección fijada, sin arrastre, para no competir con el desplazamiento en el celular. En cada obra hay un comparador arrastrable: en pantallas táctiles, al arrastrar sobre la imagen espera 8 px para leer la dirección del gesto y solo toma los horizontales, así la página se sigue pudiendo scrollear. Actualiza el DOM directamente en lugar de pasar por el estado de React y se puede usar con teclado. Con movimiento reducido, ambos pasan a una comparación estática.",
                      "en": "On the homepage, the transition follows the scroll inside a pinned section, with no dragging, so it never fights with scrolling on a phone. On project pages there’s a draggable comparator: on touch, a drag over the image waits 8 px to read the gesture’s direction and only takes horizontal moves, so the page still scrolls. It updates the DOM directly instead of going through React state, and works with the keyboard. With reduced motion, both fall back to a static comparison."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Las reglas de visibilidad viven en la base de datos, no en la interfaz.",
                  "en": "Visibility rules live in the database, not the UI."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Las políticas RLS solo dejan que los visitantes lean productos y obras publicados, y la galería y la ficha de cada obra heredan el estado de su proyecto. Cuando se destaca una obra nueva en la portada, un trigger desmarca la anterior.",
                      "en": "Row-level security only lets visitors read published products and projects, and each project’s gallery and details inherit their parent’s status. When a new project is featured on the homepage, a database trigger unsets the previous one."
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Resultado",
          "en": "Outcome"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "En producción con dominio propio, con identidad de marca, catálogo y archivo de obras. El cliente puede publicar productos, obras y publicaciones del taller por su cuenta, y ordenar obras y publicaciones del taller, sin depender de un desarrollador ni de un nuevo deploy.",
                  "en": "Live on its own domain, with a brand identity, a catalog and a project archive. The client can publish products, projects and workshop posts on their own and reorder projects and workshop posts, without depending on a developer or a redeploy."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué haría distinto",
          "en": "What I’d do differently"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Mirando el código hoy:",
                  "en": "Looking at the code today:"
                }
              }
            ]
          },
          {
            "type": "bullets",
            "items": [
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Las reglas de acceso deberían verificar un rol de administrador, no solo que haya un usuario logueado, tanto en las tablas como en el almacenamiento de imágenes.",
                      "en": "Access rules should check for an admin role, not just a logged-in user, for both tables and image storage."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Todo el esquema de la base debería estar versionado en migraciones. Algunos campos que usa la app se agregaron por fuera, así que la base no se puede reconstruir solo desde el repo.",
                      "en": "The full database schema should be versioned in migrations. Some fields the app relies on were added outside them, so the database can’t be rebuilt from the repo alone."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Las consultas públicas deberían pedir columnas explícitas en vez de ",
                      "en": "Public queries should request explicit columns instead of "
                    }
                  },
                  {
                    "type": "code",
                    "value": "*"
                  },
                  {
                    "type": "text",
                    "value": {
                      "es": ", para que un precio que el cliente decidió ocultar no llegue igual al navegador.",
                      "en": ", so a price the client chose to hide isn’t still sent to the browser."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Crear un producto u obra con imágenes lleva varios pasos separados. Deberían completarse todos o limpiarse, en vez de dejar registros a medias o archivos huérfanos.",
                      "en": "Creating a product or project with images takes several separate steps. They should either all succeed or clean up after themselves, instead of leaving partial records or orphaned files."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Las especificaciones de los dibujos merecen validación y tests: hoy un tipo de módulo desconocido se ignora sin avisar.",
                      "en": "The drawing specs deserve validation and tests: today an unknown module type is skipped silently."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "El panel necesita subidas operables con teclado y una forma de reordenar que no dependa del arrastre.",
                      "en": "The admin panel needs keyboard-accessible uploads and a non-drag way to reorder."
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "slug": "format",
    "title": {
      "es": "FORMAT: un sitio donde cada edición mensual trae su propia identidad visual",
      "en": "FORMAT: a website where every monthly edition brings its own visual identity"
    },
    "roleLine": {
      "es": "Diseñador y desarrollador full-stack",
      "en": "Designer & full-stack developer"
    },
    "period": {
      "start": "2026-08",
      "end": null
    },
    "status": "ongoing",
    "featured": true,
    "order": 3,
    "summary": {
      "es": "FORMAT necesitaba reunir la próxima fecha, su lineup y flyer, sin perder el archivo de ediciones anteriores. Organicé el contenido en Seasons mensuales que también definen la identidad visual, con publicación desde el panel sin redeploy.",
      "en": "FORMAT needed to bring together its next event, lineup and flyer while preserving an archive of past editions. I organized the content into monthly Seasons that also define the visual identity, with publishing through the admin panel without redeployment."
    },
    "cover": {
      "src": "/work/format/format-home-hero.png",
      "alt": {
        "es": "Portada de FORMAT: identidad ASCENT, trama violeta y lema del ciclo. Vista de escritorio.",
        "en": "FORMAT homepage: ASCENT identity, purple pattern and event series tagline. Desktop view."
      },
      "width": 1904,
      "height": 912,
      "variant": "desktop"
    },
    "gallery": [
      {
        "src": "/work/format/format-home-hero-mobile.png",
        "alt": {
          "es": "Portada de FORMAT: identidad ASCENT, trama violeta y lema del ciclo. Vista móvil.",
          "en": "FORMAT homepage: ASCENT identity, purple pattern and event series tagline. Mobile view."
        },
        "width": 850,
        "height": 1660,
        "variant": "mobile"
      }
    ],
    "stack": [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "Supabase",
      "Three.js",
      "GLSL",
      "Playwright"
    ],
    "links": [
      {
        "label": {
          "es": "FORMAT",
          "en": "FORMAT"
        },
        "href": "https://productions-format.com/"
      }
    ],
    "highlights": [
      {
        "es": "Identidad visual por Season, derivada de los datos de forma y paleta.",
        "en": "Per-season visual identity derived from shape and palette data."
      },
      {
        "es": "Shader GLSL halftone con Three.js que responde a la Season activa.",
        "en": "Halftone GLSL shader built with Three.js, driven by the active season."
      },
      {
        "es": "Panel autogestionado con Server Actions que publica sin redeploy.",
        "en": "Self-managed admin panel with Server Actions, publishing without a redeploy."
      }
    ],
    "sections": [
      {
        "heading": {
          "es": "Contexto",
          "en": "Context"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "FORMAT es un ciclo de música electrónica de Buenos Aires, organizado en Seasons mensuales de fechas los viernes. Cada Season tiene su nombre, su paleta y su forma. Los organizadores necesitaban un sitio que explicara qué es FORMAT, que mostrara las próximas fechas con su lineup y flyer, que conservara un archivo de ediciones anteriores, y que les permitiera gestionar todo por su cuenta: Seasons, fechas, lineups, horarios y fotos. Tenían un manual de marca; sobre esa base diseñé el lenguaje visual del sitio.",
                  "en": "FORMAT is an electronic music event series in Buenos Aires, organized in monthly seasons of Friday events. Each season has its own name, palette and shape. The organizers needed a site that explained what FORMAT is, made upcoming dates easy to find with their lineup and flyer, kept an archive of past editions, and let them manage all of it on their own: seasons, dates, lineups, schedules and photos. They had a brand manual; I designed the website’s visual language on top of it."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué construí",
          "en": "What I built"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Un sitio en Next.js 15 (App Router) con React 19 y TypeScript estricto, sobre Supabase (Postgres, Auth, Storage). Páginas públicas con próximas fechas, eventos con su lineup y un archivo, más un panel de administración desde el que los organizadores manejan todo. El núcleo lo construí en agosto de 2026, y sigo trabajando con ellos todos los meses: mejoras del panel, optimización de imágenes, aftermovies mensuales y formas nuevas para cada Season.",
                  "en": "A Next.js 15 (App Router) site with React 19 and strict TypeScript, backed by Supabase (Postgres, Auth, Storage). Public pages for upcoming dates, events with their lineup, and an archive, plus an admin panel where the organizers run everything. I built the core in August 2026 and keep working with them monthly: panel improvements, image optimization, monthly aftermovies, and new shapes for new seasons."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Decisiones que importaron",
          "en": "Decisions that mattered"
        },
        "blocks": [
          {
            "type": "bullets",
            "items": [
              {
                "lead": {
                  "es": "El contenido decide la estética.",
                  "en": "The content decides the look."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Una Season guarda su forma y su paleta, y el sitio deriva de esos datos sus acentos, stickers y fondos. Los colores se propagan como variables CSS definidas en la raíz de la página y expuestas a Tailwind; las páginas de evento las vuelven a aplicar con su propia Season, y cada tarjeta lleva la identidad de su Season por props, así mantiene su estética dentro de una página con otro tema. El texto sobre colores de acento alterna entre papel y tinta automáticamente según el contraste. Una Season que reutiliza una forma existente es solo datos; cuando los organizadores quieren una geometría nueva, la agrego al set compartido de formas en SVG y GLSL.",
                      "en": "A season stores its shape and palette, and the site derives its accents, stickers and backgrounds from that data. Colors propagate as CSS custom properties set at the page root and exposed to Tailwind; event pages reapply them for their own season, and each card carries its season’s identity through props, so it keeps its look inside a page themed by another season. Text over accent colors switches between paper and ink automatically for contrast. A season that reuses an existing shape is just data; when the organizers want a new geometry, I add it to the shared set of SVG and GLSL shapes."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Un shader en el hero que responde a la Season activa.",
                  "en": "A hero shader driven by the active season."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Three.js renderiza un único plano a pantalla completa con un shader GLSL propio. Dibuja la forma de la Season con funciones de distancia firmada, la deforma en el tiempo con ruido simplex (de dominio público) y la muestrea por celdas en una trama de puntos halftone con el color de la Season. Se pausa fuera de pantalla o con la pestaña oculta, muestra un único frame estático con movimiento reducido, limita el pixel ratio en mobile y, si WebGL falla, quedan el fondo CSS y el contenido.",
                      "en": "Three.js renders a single full-screen plane with a custom GLSL shader. It draws the season’s shape with signed distance functions, warps it over time with (public-domain) simplex noise, and samples it per cell into a halftone dot pattern in the season’s color. It pauses when off-screen or in a hidden tab, renders a single static frame with reduced motion, caps the pixel ratio on mobile, and if WebGL fails, the CSS background and content stay in place."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "Un panel pensado para organizadores, no para desarrolladores.",
                  "en": "An admin panel built for organizers, not developers."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Fue lo más difícil: las Seasons contienen fechas, las fechas contienen lineups y horarios, y todo tiene que mantenerse consistente mientras lo editan personas sin perfil técnico. Las fotos se comprimen a WebP en el navegador antes de subirse, así pueden publicar directo desde el celular. Los cambios pasan por Server Actions de Next.js que guardan en Supabase y revalidan las páginas afectadas, así se publican sin redeploy. La Season activa se calcula en hora de Buenos Aires: la que incluye el día de hoy; si no hay, la próxima; si no, la más reciente.",
                      "en": "This was the hardest part: seasons contain dates, dates contain lineups and schedules, and all of it has to stay consistent while non-technical people edit it. Photos are compressed to WebP in the browser before upload, so organizers can publish straight from a phone. Edits go through Next.js Server Actions that save to Supabase and revalidate the affected pages, so changes go live without a redeploy. The active season is resolved in Buenos Aires time: the one whose dates include today, otherwise the next one, otherwise the most recent."
                    }
                  }
                ]
              },
              {
                "lead": {
                  "es": "La escritura está restringida en dos capas, y está testeada.",
                  "en": "Writes are restricted at two layers, and tested."
                },
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Cualquiera puede leer; solo los usuarios con rol de administrador en su token pueden escribir. Eso lo aplican las políticas RLS de Postgres y se vuelve a verificar en cada Server Action. Una suite de Playwright corre contra un Supabase local para verificar roles, borrados cuando falla Storage y qué pasa si un administrador pierde su rol; las páginas públicas se prueban en desktop y mobile.",
                      "en": "Anyone can read; only users with an admin role in their auth token can write. That’s enforced by row-level security in Postgres and checked again in every server action. A Playwright suite runs against a local Supabase stack to verify roles, deletions when storage fails, and what happens when an admin loses their role; the public pages are tested on desktop and mobile viewports."
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Resultado",
          "en": "Outcome"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Los organizadores manejan el sitio por su cuenta: crean Seasons, fechas, lineups y horarios, y publican un aftermovie nuevo cada mes. Sigo trabajando con ellos mensualmente en el panel y en nuevas identidades visuales.",
                  "en": "The organizers run the site themselves: they create seasons, dates, lineups and schedules, and publish a new aftermovie every month. I keep working with them monthly on the panel and on new visual identities."
                }
              }
            ]
          }
        ]
      },
      {
        "heading": {
          "es": "Qué haría distinto",
          "en": "What I’d do differently"
        },
        "blocks": [
          {
            "type": "paragraph",
            "segments": [
              {
                "type": "text",
                "value": {
                  "es": "Mirando el código hoy:",
                  "en": "Looking at the code today:"
                }
              }
            ]
          },
          {
            "type": "bullets",
            "items": [
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Validar la paleta de cada Season al guardarla: el esquema permite una vacía, y partes del sitio asumen que hay al menos un color.",
                      "en": "Validate a season’s palette when it’s saved: the schema allows an empty one, and parts of the site assume there’s at least one color."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Hacer que la revalidación siga las dependencias reales: editar un lineup no actualiza la home, aunque la home usa datos del lineup.",
                      "en": "Make revalidation follow real dependencies: editing a lineup doesn’t refresh the homepage, even though the homepage uses lineup data."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Distinguir “no hay datos” de “falló la carga”: hoy una caída de la base se vería como un calendario vacío.",
                      "en": "Tell “no data” apart from “data failed to load”: today a database outage would look like an empty calendar."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Aplicar los límites de subida en el servidor, no solo con la compresión en el navegador.",
                      "en": "Enforce upload limits on the server, not just through compression in the browser."
                    }
                  }
                ]
              },
              {
                "segments": [
                  {
                    "type": "text",
                    "value": {
                      "es": "Aplicar los mismos resguardos a todos los efectos WebGL. El fondo de las páginas de evento no tiene el manejo de movimiento reducido ni de errores que tiene el hero, y ninguno de los dos se recupera si se pierde el contexto WebGL.",
                      "en": "Apply the same safeguards to every WebGL effect. The event-page background lacks the reduced-motion handling and error handling the hero has, and neither one recovers from a lost WebGL context."
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export function findCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
