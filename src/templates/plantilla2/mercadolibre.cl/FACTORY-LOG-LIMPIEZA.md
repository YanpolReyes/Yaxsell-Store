# FACTORY-LOG-LIMPIEZA — mercadolibre.cl
Fecha: 2026-03-30
Agente: Limpiador 🧹 (Paso 1)

---

## RESUMEN DE ACCIONES

### 1. Scripts de tracking eliminados de `index.html`

| Script | ID / Patrón | Resultado |
|--------|-------------|-----------|
| `web-monitoring/1.5.3/agent.min.js` | `id="__WEB_MONITORING_AGENT__"` | ✅ Eliminado |
| `viewability-script.2.2.0.js` | `id="viewability-script"` | ✅ Eliminado |
| `melidata.min.js` | `async=""` src melidata | ✅ Eliminado |
| Hotjar inline | `(function(h,o,t,j,a,r){...hjid:720735...}` | ✅ Eliminado |

### 2. Archivos JS de ADN eliminados (físico)

- `assets/js/http2.mlstatic.com/frontend-assets/adn-frontend-library/adn-script.js` ✅
- `assets/js/http2.mlstatic.com/frontend-assets/adn-frontend-library/video-simple-banner.1.12.9.js` ✅
- También eliminadas las referencias `<script src="...adn-script.js">` y `<script src="...video-simple-banner...">` de `index.html`

### 3. Archivos `available-components-desktop-*` eliminados (físico + refs en HTML)

10 archivos eliminados de `assets/js/http2.mlstatic.com/frontend-assets/homes-palpatine/`:
- `available-components-desktop-adn.4ccfcfa8.js`
- `available-components-desktop-categories-new-design.d9686b2e.js`
- `available-components-desktop-collections-v2-design.8f866c36.js`
- `available-components-desktop-discovery.f6aa0f04.js`
- `available-components-desktop-dynamic-access.819e75e9.js`
- `available-components-desktop-exhibitor.c057a021.js`
- `available-components-desktop-loyalty-essential-benefits.d1952fe5.js`
- `available-components-desktop-loyalty-partner-subscriptions.e75d1127.js`
- `available-components-desktop-mplay-media-card.f9808d93.js`
- `available-components-desktop-site-shopping-info.a04c885b.js`

Referencias `<script async src="...available-components-desktop-...">` eliminadas de `index.html`.

### 4. Archivos de cookies-consent eliminados (físico + refs en HTML)

- `assets/js/http2.mlstatic.com/frontend-assets/cookies-consent-banner-builder/1.0.0-beta.3/cookie-consent-banner-opt-out/script.js` ✅
- `assets/css/http2.mlstatic.com/frontend-assets/cookies-consent-banner-builder/1.0.0-beta.3/cookie-consent-banner-opt-out/default-desktop.css` ✅
- `<link href="...default-desktop.css">` eliminado de `index.html`
- `<script src="...cookies-consent...script.js">` eliminado de `index.html`

### 5. Archivos de tracking físicos eliminados

- `assets/js/http2.mlstatic.com/frontend-assets/frontend-viewability/viewability-script.2.2.0.js` ✅
- `assets/js/http2.mlstatic.com/storage/melidata-js-sdk/js/3/0.7.6/melidata.min.js` ✅
- `assets/js/http2.mlstatic.com/frontend-assets/web-monitoring/1.5.3/agent.min.js` ✅

### 6. Revisión del JS inline

- `assets/js/inline/..-index-inline-1.js`: Revisado. **Sin `fetch()` ni `XMLHttpRequest`**. Contiene solo datos de estado de la app (JSON/props). No se modificó.

---

## CONSERVADO (sin tocar)

- Estructura HTML visual completa (header, nav, carousel, categorías, footer)
- `assets/css/inline/..-index-inline-1.css` — estilos inline críticos
- `assets/css/http2.mlstatic.com/frontend-assets/homes-palpatine/home.desktop.988da7b1.css`
- `assets/css/http2.mlstatic.com/frontend-assets/homes-palpatine/recommendations-fe-desktop.3bd806ac.css`
- Todos los JS de `homes-palpatine` (numerados: 133, 3771, 5045, 5081, 5840, 5990, 6534, 7243, 7492, 7808, 8398, 8581, 9256, home.desktop)
- `assets/js/mercadolibre.cl/v3/security.js`
- Imágenes, fuentes, SVGs en `assets/`
- Scripts de navegación inline (searchbox, categories, snackbar, one-tap widgets)

---

## TAMAÑO index.html

| Estado | Tamaño |
|--------|--------|
| Original | ~256,160 bytes |
| Tras limpieza | ~252,549 bytes |
| Reducción | ~3,611 bytes |

---

## ADVERTENCIAS PARA EL SIGUIENTE AGENTE

1. **`newrelic` referencias**: Quedan referencias a `window.newrelic` en scripts inline del body (setCustomAttribute). Son inofensivas sin el agente — no ejecutan tracking. Se dejaron para no romper la estructura del script de hidratación de Nordic.

2. **`viewability-script` en JS inline**: El string `viewability-script` aparece en código inline del body como `addEventListener('load', ...)` sobre el elemento ya eliminado. No rompe nada — simplemente nunca dispara el evento.

3. **`video-simple-banner` en JSON**: El string aparece dentro del bloque `__LOADABLE_REQUIRED_CHUNKS___ext` (JSON embebido) como nombre de chunk. Es solo metadata de carga dinámica, no un script activo.

4. **Cookie consent banner HTML**: El marcado HTML del banner de cookies (div con class `cookie-consent-banner-opt-out`) sigue en el body de `index.html`. Sin su CSS ni JS, quedará invisible/sin funcionalidad. Se puede limpiar en un paso posterior si se desea.

5. **CSS `home.desktop.988da7b1.css`**: Archivo de ~500KB+ con selectores potencialmente no usados. Candidato para PurgeCSS en un paso posterior de optimización.

6. **No se realizó minificación**: Según las instrucciones, la minificación es tarea posterior (paso 8). Los archivos JS y CSS restantes no fueron minificados en este paso.
