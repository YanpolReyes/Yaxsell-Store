# FACTORY-LOG-MIGRACION-1 — mercadolibre.cl
Fecha: 2026-03-30
Agente: Migrador 🔧 (#1 de 3)

---

## CONTEXTO

Este paso recibió el proyecto tras el Limpiador 🧹. El estado inicial ya tenía:
- Todos los CSS en rutas locales `./assets/css/...`
- Todas las imágenes en rutas locales `./assets/img/...`
- Sin scripts de tracking activos
- Carpetas vacías residuales de la limpieza anterior

---

## ANÁLISIS PRE-MIGRACIÓN

| Item | Estado encontrado |
|------|------------------|
| CSS externo bloqueante | ❌ Ninguno (todo ya local) |
| Imágenes externas en `src` | ❌ Ninguna (todo ya local) |
| Link `rel=stylesheet` externos | Solo 1 `rel="prefetch"` de nav (no bloqueante) |
| Directorios vacíos residuales | 5 carpetas vacías en `assets/js/` |
| `security.js` activo | Presente pero inútil en estático |

---

## ACCIONES REALIZADAS

### 1. Limpieza de `index.html`

**Eliminados:**
- `<link rel="prefetch" href="https://http2.mlstatic.com/.../navigation-desktop.css">` — CSS externo de navegación (prefetch, no bloqueante, innecesario en local)
- 6× `<link rel="preconnect">` a dominios de Google Ads (`adservice.google.com`, `googletagservices.com`, `doubleclick.net`, `tpc.googlesyndication.com`, `pagead2.googlesyndication.com`, `data.mercadolibre.com`)
- 18× `<link rel="alternate" hrefLang="...">` — SEO multilenguaje irrelevante en local
- `<link rel="canonical">` — SEO canónico irrelevante en local

**Tamaño:** 252,549 → 250,657 bytes (−1,892 bytes)

### 2. Creado `assets/css/main.css`

Archivo nuevo con:
- **Variables CSS corporativas**: `--ml-yellow: #ffe600`, `--ml-blue: #3483fa`, `--ml-green: #00a650`, etc.
- **Reset mínimo** con `box-sizing: border-box`
- **Layout del header** con CSS Grid (`grid-template-areas`)
- **Estilos del menú de navegación** con hover y transiciones
- **Estilos del carrusel hero** (wrapper, slides, controles prev/next)
- **Estilos de secciones**: categorías, dynamic-access, footer
- **Utilities**: `.clipped`, `[hidden]`

Referencia añadida en `index.html` como primer `<link rel="stylesheet">` (antes de `home.desktop.css`).

### 3. Creado `assets/js/app.js`

Archivo nuevo con lógica JS pura (sin frameworks):
- **`initCarousels()`**: Detecta todos los carruseles `[data-andes-carousel-snapped-main]`, implementa prev/next, autoplay (5s), touch/swipe, paginación, pausa en hover
- **`initCategories()`**: Menú desplegable de categorías con toggle, cierre al click externo y tecla Escape
- **`initCookieBanner()`**: Cierra el banner de cookies al hacer click en "Aceptar" o "Configurar"
- Init automático en `DOMContentLoaded` o inmediato si DOM ya cargado

Referencia añadida en `index.html` antes de `</body>`.

### 4. Eliminación de directorios vacíos y archivos inútiles

**Carpetas eliminadas** (estaban vacías tras el paso del Limpiador):
- `assets/js/http2.mlstatic.com/frontend-assets/adn-frontend-library/`
- `assets/js/http2.mlstatic.com/frontend-assets/web-monitoring/`
- `assets/js/http2.mlstatic.com/frontend-assets/frontend-viewability/`
- `assets/js/http2.mlstatic.com/frontend-assets/cookies-consent-banner-builder/`
- `assets/js/http2.mlstatic.com/storage/` (melidata-js-sdk vacío)
- `assets/css/http2.mlstatic.com/frontend-assets/cookies-consent-banner-builder/`

**Archivos eliminados:**
- `assets/js/mercadolibre.cl/v3/security.js` — script de seguridad/telemetría de ML, sin función en entorno estático

---

## ESTRUCTURA FINAL DEL PROYECTO

```
mercadolibre.cl/
├── index.html                        (250,657 bytes — HTML limpio)
├── FACTORY-LOG-LIMPIEZA.md
├── FACTORY-LOG-MIGRACION-1.md
├── README_RESPONSE.md
└── assets/
    ├── css/
    │   ├── main.css                  ← NUEVO: variables + layout base
    │   ├── inline/
    │   │   └── ..-index-inline-1.css (63,874 bytes)
    │   └── http2.mlstatic.com/frontend-assets/homes-palpatine/
    │       ├── home.desktop.988da7b1.css          (336,138 bytes)
    │       └── recommendations-fe-desktop.3bd806ac.css (16,448 bytes)
    ├── js/
    │   ├── app.js                    ← NUEVO: carrusel + navegación pura
    │   ├── inline/
    │   │   └── ..-index-inline-1.js  (146,500 bytes — estado app)
    │   └── http2.mlstatic.com/frontend-assets/homes-palpatine/
    │       ├── home.desktop.33533908.js  (316,561 bytes — bundle principal)
    │       ├── 133.9b8c14e3.js
    │       ├── 3771.ed5e03eb.js
    │       ├── 5045.fbf84df1.js
    │       ├── 5081.22ba38c9.js
    │       ├── 5840.87d01522.js
    │       ├── 5990.229714db.js
    │       ├── 6534.b8731a3e.js
    │       ├── 7243.0196f2bf.js
    │       ├── 7492.90637d2c.js
    │       ├── 7808.b55e9194.js
    │       ├── 8398.a790c23b.js
    │       ├── 8581.dd27a884.js
    │       └── 9256.f43a6a49.js
    ├── img/   (sin cambios — todas las imágenes ya eran locales)
    └── fonts/ (sin cambios — fuentes Proxima Nova ya locales)
```

---

## CONSERVADO SIN CAMBIOS

- Toda la estructura HTML visual (header, carruseles, categorías, footer)
- `home.desktop.988da7b1.css` — CSS principal del sitio (336KB)
- `recommendations-fe-desktop.3bd806ac.css`
- `home.desktop.33533908.js` + todos los chunks numerados — bundle React/Nordic
- `inline/..-index-inline-1.js` — estado de la app (JSON props)
- Todas las imágenes locales en `assets/img/`
- Fuentes Proxima Nova locales en `assets/fonts/`

---

## ADVERTENCIAS PARA EL SIGUIENTE AGENTE

1. **Bundle React/Nordic intacto**: El sitio usa el framework Nordic (React SSR de MercadoLibre). Los bundles JS en `homes-palpatine/` son necesarios para la hidratación del lado cliente. NO eliminarlos si se quiere mantener interactividad.

2. **`home.desktop.988da7b1.css`**: Este archivo de 336KB contiene TODOS los estilos del sitio. `main.css` es complementario, no reemplazante. El siguiente agente podría ejecutar PurgeCSS para eliminar reglas no usadas.

3. **`assets/js/mercadolibre.cl/v3/`**: La carpeta contenedor queda vacía tras eliminar `security.js`. Se puede eliminar en el siguiente paso.

4. **Cookie consent HTML**: El HTML del banner de cookies sigue en el body. El JS de `app.js` lo hace funcional (cierra al click), pero si se quiere eliminarlo del DOM, se puede hacer en un paso posterior.

5. **Fonts @font-face**: Las fuentes Proxima Nova ya están declaradas en `home.desktop.css` como rutas locales. No se necesita crear `fonts.css` adicional.

6. **Minificación pendiente**: `main.css` y `app.js` no están minificados. Candidatos para el paso de optimización final.
