# FACTORY-LOG-LIMPIEZA — shopify-mi-tienda3

**Fecha:** 2026-05-07
**Origen:** `https://9jo523yvuya95av2-82653806840.shopifypreview.com/`
**Tienda:** `6tk4k9-c1.myshopify.com` (tema **Venice**)

## Captura inicial

- 6 páginas (`/`, `/collections`, `/collections/all`, `/collections/frontpage`, `/pages/contact`, `/search`)
- 3 CSS + 1 inline
- 25 JS (incluyendo dependencies del tema Venice: `base.js`, `cart.js`, `cart-drawer.js`, `magnify.js`, `quantity-input.js`, etc.)
- 86 imágenes (productos + hero + iconos del tema)
- 4 fuentes (DM Sans, Poppins, Smooch en woff/woff2)

## Limpieza post-proceso aplicada

Total eliminado: **154 773 caracteres** entre los 6 HTML.

| Patrón eliminado | Razón |
|---|---|
| `<meta id="shopify-digital-wallet">` | metadato del checkout Shopify |
| `<script src="*preloads-jiwsx0*">` | preloads del checkout interno |
| `<script id="shopify-features">` | feature flags backend |
| `<script id="shop-js-analytics">` | analytics del shop-js |
| `<script id="hot-reload-client">` + `theme-hot-reload.js` | recarga en caliente del editor de temas |
| `<script id="__st">` | session-token de Shopify |
| `<script id="captcha-bootstrap">` (~3.4 KB) | bootstrap de hCaptcha |
| `<script src="*preview-bar-modules.js">` | barra de preview de Shopify |
| `<script id="OnlineStorePreviewBarNextData">` | datos del preview-bar |
| Marcas `performance.mark('shopify.content_for_header.*')` | timing del content_for_header |
| `<script>var Shopify = Shopify \|\| {}; …</script>` (globals) | inicializadores de Shopify global |
| `<script type="module">…Shopify.modules=!0…</script>` | flag de módulos |
| `<script>…Shopify.loadFeatures…</script>` | autoloader de features |
| `<script>…SignInWithShop.eligible…</script>` | login con Shop |
| `<script src="*loader.init-shop-cart-sync*">` + `<script type="module">await import…</script>` | sincronización de carrito Shop |
| `<script>…Shopify.featureAssets…</script>` (~1.7 KB) | mapa de feature-assets shop-js |
| `<script>window.ShopifyPaypalV4VisibilityTracking…</script>` | tracking PayPal |
| `<script data-source-attribution="shopify.loadfeatures">` | storefront load_feature |
| `<script data-source-attribution="shopify.dynamic_checkout.*">` (3 ocurrencias) | dynamic checkout / portable wallets |
| `<script>…__TREKKIE_SHIM_QUEUE…</script>` | tracking Trekkie |
| `<link href="https://monorail-edge.shopifysvc.com">` | dns-prefetch tracking |
| `<script>…ShopifyAnalytics + Trekkie + Monorail…</script>` (~14 KB cada) | telemetría completa |
| `<script src="*shopify-perf-kit*">` | perf-kit |
| Atributos `data-shopify-*`, `data-anti-flicker` en `<html>`/`<body>` | metadatos del editor |

### Por archivo (ahorro)

| Archivo | Antes | Después | Ahorro |
|---|---:|---:|---:|
| `index.html` | 411 951 B | ~390 000 B | -21 951 B |
| `collections/index.html` | ~120 KB | ~95 KB | ~-25 KB |
| `collections/all/index.html` | 255 500 B | 230 825 B | -24 675 B |
| `collections/frontpage/index.html` | 174 439 B | 146 759 B | -27 680 B |
| `pages/contact/index.html` | 149 093 B | 122 683 B | -26 410 B |
| `search/index.html` | 123 110 B | 96 891 B | -26 219 B |

## ⚠️ Daño colateral en el script de limpieza

El script `_limpiar-shopify.js` recorrió recursivamente la carpeta padre y modificó por error 6 archivos en `PROJECT YAXSEL`:

- 4 `index.html` en `chinamart/` y `PROJECT COMPRA REGION/.../web/` — pérdidas de **2-6 chars** (sólo whitespace).
- 2 `bignumber.js/doc/API.html` dentro de `node_modules/` — pérdidas de **306 chars** (whitespace en doc autogenerada).

Ningún regex de Shopify hizo match en esos archivos. Sólo aplicó la regla de **colapso de líneas vacías** y **eliminación de atributos `data-shopify-*`** (que no existían). Cambios funcionalmente irrelevantes pero no deberían haber ocurrido. Lección: limitar el `listarHtmls` con allowlist de páginas conocidas o blocklist explícita de `node_modules` y subdirectorios externos al clon.

## Estado final

```
shopify-mi-tienda3/
├── index.html
├── manifest.json
├── FACTORY-LOG-LIMPIEZA.md  ← este archivo
├── collections/
│   ├── index.html
│   ├── all/index.html
│   └── frontpage/index.html
├── pages/contact/index.html
├── search/index.html
└── assets/
    ├── css/  (3 + 1 inline)
    ├── fonts/  (4)
    ├── img/  (86)
    └── js/  (25)
```

Listo para ser referenciado desde `plantilla1/HomePage.tsx` (pendiente).
