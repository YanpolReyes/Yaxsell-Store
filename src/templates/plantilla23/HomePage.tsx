'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 23 — Shopify Theme Capturado por FOLLA v2
   ──────────────────────────────────────────────────────────────────
   ⚠️  BOILERPLATE: Requiere revisión manual antes de usar.
   ──────────────────────────────────────────────────────────────────
   Estrategia:
   - Render del HTML body limpio via containerRef.innerHTML
   - Carga dinámica de CSS via <link> tags en <head>
   - Carga dinámica de JS via <script> tags secuenciales
   - Scripts inline de animación están en body-clean.html (se ejecutan al inyectar)
   - Scripts de Shopify problemáticos excluidos
   - .in-view forzado en .animation-element tras carga
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react';

const SHOPIFY_BASE = '/shopify/plantilla23/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla23/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/compiled_assets/styles.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/base.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/styles.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-with-text.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/flexible-columns.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-product.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/article-card.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/editorial-banner.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.css`,
  `/shopify/plantilla23/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/footer.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/functions.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/pubsub.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/script.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/menu-drawer.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-swatch-selector.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-form.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-badge.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-block.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-media.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/accordion.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-invalid.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-validate.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/button-to-top.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gsap.min.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/ScrollMagic.min.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.gsap.min.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/MorphSVGPlugin.min.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/morph-svg.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.3c434e22befd5c18a6b4afadb1e3d77c128c7939.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.5d9fa6e2cae713c8fb539a9876489d86207fe957.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.5a4ea298b4789e064f62a29aafc18d41f09ae59b.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.072b5869c5e0ed5b9d2021e4c2af132e16681ad2.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.a0d4a463df4f146567d871890ffb3c80408e7732.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.f6ec9f2a0681acc6f8152c40921d2a4d2e1a2c78.woff") format("woff");
}
@font-face {
  font-family: "Nunito Sans";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.25d963ed46da26098ebeab731e90d8802d989fa5.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.d32e3219b3d2ec82285d3027bd673efc61a996c8.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla23/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
`;

export default function HomePage23() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '23';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl23-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically + split-hero overrides ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl23="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl23', href);
      document.head.appendChild(link);
    });

    // ═══ CRITICAL OVERRIDES for split-hero (from plantilla8 docs) ═══
    const overrideStyle = document.createElement('style');
    overrideStyle.id = 'tpl23-overrides';
    overrideStyle.textContent = `
      /* FIX 1: filter:blur(0px) breaks position:fixed (CSS spec) */
      [style*="blur(0"] { filter: none !important; }

      /* FIX 2: Media column must start at 100vw, not 50% */
      .split-hero .split-hero-column.split-hero-column__media {
        min-width: 100vw !important;
        max-width: 100vw !important;
      }

      /* FIX 3: Collapsed state must be 50vw */
      .split-hero .split-hero-column__media.is-collapsed {
        min-width: 50vw !important;
        max-width: 50vw !important;
      }

      /* FIX 4: Hide page loader and page-transition overlay */
      .page-loader { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }
      page-transition { display: none !important; }

      /* FIX 5: Logo size override */
      .logo-wrapper { max-width: none !important; }
      @media (min-width: 768px) {
        .header a.logo-wrapper { width: 300px !important; min-width: 300px !important; max-width: none !important; flex-basis: 300px !important; --width: 300px !important; }
        .header img.logo { width: 300px !important; min-width: 300px !important; max-width: 300px !important; height: auto !important; max-height: none !important; }
      }

      /* FIX 6: Utility bar pastel pink */
      utility-bar, .utility-bar { background-color: #ffc0cb !important; }
      .utility-bar * { border-color: rgba(255,192,203,0.3) !important; }

      /* FIX 7: Video reveal — see main animation block below (cinematicReveal) */

      /* FIX 8: Fade out collage background once loaded to prevent source-swap flashes */
      .multimedia-collage__background.is-loaded {
        background-color: transparent !important;
      }

      /* FIX 9: Disable selection on specific static elements to prevent ugly blue highlight without blocking mobile swipes */
      img, video, h1, h2, h3, h4, h5, h6 {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      /* Explicitly enable touch gestures and scrolling on Swiper containers */
      .swiper-container, .swiper-wrapper, .swiper-slide {
        touch-action: pan-y pinch-zoom !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
      }
      input, textarea {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }

      /* FIX 10: Remove ugly rectangular selection/border from search input */
      input[type="search"],
      input[type="search"]:focus,
      input[type="search"]:focus-visible,
      .search-drawer input,
      .search-drawer input:focus,
      .search-drawer input:focus-visible,
      #drawer-input-search,
      #drawer-input-search:focus,
      #drawer-input-search:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15) !important;
        background-color: transparent !important;
        border-radius: 0 !important;
      }

      /* Premium Skeleton & Smooth Animations System */
      @keyframes premiumShimmer {
        100% { transform: translateX(100%); }
      }
      @keyframes premiumReveal {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Floating animation for discount image card */
      @keyframes floatAnimation {
        0% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0); }
      }
      .float-animation {
        animation: floatAnimation 4s ease-in-out infinite !important;
      }

      /* ═══ Video starts hidden — JS handles the cinematic reveal animation ═══ */
      .reveal-on-play {
        opacity: 0 !important;
      }
      /* Fallback if JS animation completes */
      .reveal-on-play.is-playing-revealed {
        opacity: 1 !important;
      }


      /* Skeletons active by default */
      .header img.logo:not(.is-loaded) {
        background-color: #FBCAC9 !important;
        background-image: none !important;
        position: relative !important;
        overflow: hidden !important;
        color: transparent !important;
        border-color: transparent !important;
        pointer-events: none !important;
      }
      .custom-button:not(.is-loaded) {
        background-color: #000000 !important; /* Black skeleton loader! */
        background-image: none !important;
        position: relative !important;
        overflow: hidden !important;
        color: transparent !important;
        border-color: transparent !important;
        pointer-events: none !important;
      }

      /* Disable white logo filter brightness/invert during loading so the pink skeleton shows beautifully */
      .header img.logo:not(.is-loaded) {
        filter: none !important;
      }
      .header img.logo:not(.is-loaded)::after,
      .custom-button:not(.is-loaded)::after {
        content: "" !important;
        position: absolute !important;
        top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent) !important;
        transform: translateX(-100%) !important;
        animation: premiumShimmer 1.8s infinite !important;
        z-index: 50 !important;
      }

      /* Smooth reveal when loaded */
      .header img.logo.is-loaded,
      .custom-button.is-loaded {
        animation: premiumReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }

      /* Highlight word "Novedades" in menu to black */
      .header[data-id="sections--27304712208665__header"] .highlight {
        color: #000000 !important;
      }

      /* ═══ Responsive nav: prevent menu items crowding at medium screens ═══ */

      /* CRITICAL: Force nav to stay on ONE LINE — no wrapping allowed.
         The ul has Tailwind "flex-wrap" class which causes items to drop
         to a 2nd row and overlap the hero heading text. */
      .menu-wrapper ul[data-tier="1"] {
        flex-wrap: nowrap !important;
        overflow: hidden !important;
      }

      /* ~1280px — reduce spacing slightly */
      @media (max-width: 1280px) {
        .menu-wrapper ul[data-tier="1"] > li > a,
        .menu-wrapper ul[data-tier="1"] > li > button {
          font-size: 12px !important;
          letter-spacing: 0 !important;
        }
        .menu-wrapper ul[data-tier="1"] {
          gap: 6px !important;
        }
        .menu-wrapper ul[data-tier="1"] > li {
          padding-left: 2px !important;
          padding-right: 2px !important;
        }
        /* Slightly smaller logo */
        .header a.logo-wrapper {
          width: 200px !important;
          min-width: 200px !important;
          flex-basis: 200px !important;
        }
        .header img.logo {
          width: 200px !important;
          min-width: 200px !important;
          max-width: 200px !important;
        }
      }

      /* ~1150px — more compact */
      @media (max-width: 1150px) {
        .menu-wrapper ul[data-tier="1"] > li > a,
        .menu-wrapper ul[data-tier="1"] > li > button {
          font-size: 11px !important;
          letter-spacing: 0 !important;
        }
        .menu-wrapper ul[data-tier="1"] {
          gap: 2px !important;
        }
        .menu-wrapper ul[data-tier="1"] > li {
          padding-left: 1px !important;
          padding-right: 1px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          shrink: 1 !important;
        }
        .header a.logo-wrapper {
          width: 160px !important;
          min-width: 160px !important;
          flex-basis: 160px !important;
        }
        .header img.logo {
          width: 160px !important;
          min-width: 160px !important;
          max-width: 160px !important;
        }
      }

      /* ~1024px — minimum desktop before hamburger */
      @media (max-width: 1024px) {
        .menu-wrapper ul[data-tier="1"] > li > a,
        .menu-wrapper ul[data-tier="1"] > li > button {
          font-size: 10px !important;
          letter-spacing: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .menu-wrapper ul[data-tier="1"] {
          gap: 0px !important;
        }
        .menu-wrapper ul[data-tier="1"] > li {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        /* Also shrink the action buttons area (BUSCAR / CARRITO) */
        .header__actions,
        .header-actions,
        .header [class*="actions"] {
          gap: 4px !important;
        }
      }

      /* Bouncy Breathtaking 20% OFF Button - Soft Pink #FBCAC9 */
      @keyframes bouncyPop {
        0%, 100% { transform: scale(1) translateY(0) rotate(0deg); }
        15% { transform: scale(1.12) translateY(-14px) rotate(-3deg); }
        25% { transform: scale(1.12) translateY(-14px) rotate(3deg); }
        35% { transform: scale(1.08) translateY(-6px) rotate(-1.5deg); }
        45% { transform: scale(1.08) translateY(-6px) rotate(1.5deg); }
        55% { transform: scale(1.02) translateY(-2px) rotate(0deg); }
      }
      .button-newsletter {
        --newsletter-popup-color-button-background: #FBCAC9 !important;
        --newsletter-popup-color-button-text: #ffffff !important;
        background: #FBCAC9 !important;
        color: #ffffff !important;
        box-shadow: 0 10px 25px rgba(251, 202, 201, 0.4) !important;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        animation: bouncyPop 3.5s infinite ease-in-out !important;
      }
      .button-newsletter:hover {
        transform: scale(1.15) translateY(-5px) !important;
        box-shadow: 0 15px 35px rgba(251, 202, 201, 0.6) !important;
        background: #fbb4b3 !important;
      }
      .button-newsletter span.h6 {
        color: #ffffff !important;
      }
      .button-newsletter .button-close svg {
        color: #ffffff !important;
      }
      @media (max-width: 1023px) {
        .button-newsletter {
          transform: rotate(-90deg) !important;
          transform-origin: left bottom !important;
          left: 0 !important;
          bottom: 50% !important;
          animation: none !important;
        }
      }

      /* Editorial Serif Typography with Metallic Shimmer Gradient for Kevin&Coco */
      .animated-kevin-coco {
        font-family: 'Didot', 'Playfair Display', 'Garamond', 'Times New Roman', serif !important;
        font-style: italic !important;
        font-weight: 900 !important;
        font-size: 1.15em !important;
        letter-spacing: 2px !important;
        background: linear-gradient(135deg, rgb(251, 207, 232), rgb(245, 168, 207), rgb(227, 150, 191), rgb(245, 168, 207), rgb(251, 207, 232)) !important;
        background-size: 200% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        display: inline-block !important;
        animation: pinkPulse 2.5s infinite ease-in-out, shimmerBg 5s infinite linear !important;
        text-shadow: none !important;
        padding-left: 5px !important;
      }
      
      /* Subtle Shadow Glassmorphism Price Badge */
      .hero2-price-badge {
        position: absolute !important;
        z-index: 999 !important;
        right: 28% !important;
        bottom: 14% !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85)) !important;
        color: #E396BF !important; /* Elegant rose matching gradient middle-tone */
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 900 !important;
        font-size: clamp(1.8rem, 4vw, 3.2rem) !important;
        padding: 10px 24px !important;
        border-radius: 20px !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.4) !important; /* Subtle soft shadow */
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-shadow: none !important;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        text-decoration: none !important;
      }
      .hero2-price-badge:hover {
        transform: scale(1.15) rotate(5deg) !important;
        background: linear-gradient(135deg, rgb(251, 207, 232), rgb(245, 168, 207), rgb(227, 150, 191)) !important;
        color: #ffffff !important;
        box-shadow: 0 15px 30px rgba(245, 168, 207, 0.4) !important;
      }

      /* Mobile styles for Herobanner 2 custom elements */
      @media (max-width: 1023px) {
        .hero2-price-badge {
          right: 4% !important;
          bottom: 20% !important;
          font-size: 1.8rem !important;
          padding: 6px 16px !important;
          border-radius: 12px !important;
        }
      }
    `;
    document.head.appendChild(overrideStyle);
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla23/body-clean.html', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        if (aborted) return;
        setBodyHtml(html);
      })
      .catch(err => {
        if (aborted) return;
        console.error('[Plantilla23] Error loading body-clean.html', err);
        setLoadError(err.message || 'Error de carga');
      });
    return () => { aborted = true; };
  }, []);

  /* ── Set innerHTML ONCE via ref ── */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    if (containerRef.current.dataset.htmlSet) return;
    containerRef.current.innerHTML = bodyHtml;
    containerRef.current.dataset.htmlSet = '1';

    // Remove leftover Shopify elements
    const root = containerRef.current;
    root.querySelectorAll('.fusion-overlay-custom, .fusion-scroll-top, .quickView-popup').forEach(el => el.remove());

    // ═══ MutationObserver: remove filter:blur(0px) that Shopify scripts re-add ═══
    // filter:blur(0) creates a new stacking context → breaks position:fixed → white flash
    // Must observe on document.body too, not just root, because Shopify scripts add
    // filter:blur(0px) to ANCESTOR elements (main, div wrappers) outside our container
    const removeBlurFilter = (el: HTMLElement) => {
      if (el.style && el.style.filter && el.style.filter.includes('blur(0')) {
        el.style.removeProperty('filter');
      }
    };
    const blurObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const el = mutation.target as HTMLElement;
        removeBlurFilter(el);
      }
    });
    // Observe both the container root AND document.body for filter changes
    blurObserver.observe(root, { attributes: true, subtree: true, attributeFilter: ['style'] });
    blurObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });

    // Sweep: remove any existing blur(0) inline styles immediately
    root.querySelectorAll('[style*="blur(0"]').forEach(el => removeBlurFilter(el as HTMLElement));
    document.body.querySelectorAll('[style*="blur(0"]').forEach(el => removeBlurFilter(el as HTMLElement));

    // Periodic sweep: Shopify scripts can add blur(0) at any time during load
    let sweepCount = 0;
    const sweepInterval = setInterval(() => {
      document.querySelectorAll('[style*="blur(0"]').forEach(el => removeBlurFilter(el as HTMLElement));
      sweepCount++;
      if (sweepCount >= 20) clearInterval(sweepInterval); // 10 seconds
    }, 500);

    // ═══ IntersectionObserver fallback for .animation-element outside split-hero ═══
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });
    root.querySelectorAll('.animation-element').forEach(el => {
      if (!el.closest('split-hero')) {
        animObserver.observe(el);
      }
    });

    // ═══ Video lazy-play: only play videos when visible ═══
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.dataset.isIntersecting = "true";
          // Do not autoplay collage videos when scrolled into view (they play only on hover)
          const isCollageVideo = video.classList.contains('ping-pong-video') || 
                                 video.classList.contains('ping-pong-forward') || 
                                 video.classList.contains('ping-pong-reverse') ||
                                 video.querySelector('source[src*="therea.mp4"]') || 
                                 video.querySelector('source[src*="rever.mp4"]') ||
                                 (video.src && (video.src.includes('therea.mp4') || video.src.includes('rever.mp4')));
          if (!isCollageVideo) {
            video.play().catch(() => {});
          }
        } else {
          video.dataset.isIntersecting = "false";
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    root.querySelectorAll('video').forEach(video => {
      // Remove autoplay so we control playback via observer
      video.removeAttribute('autoplay');
      video.preload = 'none';
      videoObserver.observe(video);
    });

    // ═══ Pause hero video when nav menu dropdown is open ═══
    const heroVideos = root.querySelectorAll('split-hero video, .split-hero video');
    const navItems = root.querySelectorAll('.header-menu-item, menu-drawer .menu-item, .header nav li');
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        heroVideos.forEach(v => (v as HTMLVideoElement).pause());
      });
      item.addEventListener('mouseleave', () => {
        heroVideos.forEach(v => (v as HTMLVideoElement).play().catch(() => {}));
      });
    });

    // ═══ Swiper active slide video re-trigger ═══
    const swiperObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('swiper-slide-active')) {
            const videos = target.querySelectorAll('video');
            videos.forEach(v => {
              v.currentTime = 0;
              v.play().catch(() => {});
              // Force CSS animation re-trigger
              v.style.animation = 'none';
              void v.offsetHeight; // trigger reflow
              v.style.animation = '';
            });
          }
        }
      });
    });
    root.querySelectorAll('.swiper-slide').forEach(slide => {
      swiperObserver.observe(slide, { attributes: true, attributeFilter: ['class'] });
      // Re-trigger active ones on load
      if (slide.classList.contains('swiper-slide-active')) {
        slide.querySelectorAll('video').forEach(v => {
          v.currentTime = 0;
          v.play().catch(() => {});
        });
      }
    });

    // ═══ HeroBanner 1: Smooth JS-driven fade-in on initial load ═══
    // Uses rAF + transition to bypass CSS !important conflicts reliably.
    setTimeout(() => {
      const firstSlide = root.querySelector('.swiper-slide');
      if (firstSlide) {
        firstSlide.querySelectorAll('video.reveal-on-play').forEach(vid => {
          const v = vid as HTMLVideoElement;
          // Force the video to start invisible and without transition
          v.style.setProperty('opacity', '0', 'important');
          v.style.setProperty('transform', 'scale(1.06) translateY(14px)', 'important');
          v.style.setProperty('transition', 'none', 'important');
          v.play().catch(() => {});
          // Double rAF ensures the browser has painted the initial hidden state
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              v.style.setProperty('transition', 'opacity 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'important');
              v.style.setProperty('opacity', '1', 'important');
              v.style.setProperty('transform', 'scale(1) translateY(0)', 'important');
            });
          });
        });
      }
    }, 600);
  }, [bodyHtml]);

  /* ── Inject window.Shopify stub BEFORE loading JS ── */
  useEffect(() => {
    if ((window as any).Shopify) return;
    (window as any).Shopify = {
      shop: 'k-me-store-2.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Captured Theme', id: '7' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
      customerAccountsEnabled: false,
    };

    // Intercept fetch/XHR to prevent 404s on /products/* and external APIs
    const origFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.startsWith('/products/') || (url.includes('/products/') && !url.includes('/shopify/'))) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (url.includes('appwrite.io') || url.includes('nyc.cloud.appwrite')) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 401, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch(input, init);
    };
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl23ScriptsLoaded) return;
    (window as any).__tpl23ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl23="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl23', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla23] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    const forceInView = () => {
      // Forzar .in-view SOLO en elementos FUERA del split-hero
      // El split-hero maneja sus propios .animation-element via setCollapsed
      document.querySelectorAll('.animation-element, .animation-wrapper').forEach(el => {
        if (!el.closest('split-hero')) {
          el.classList.add('in-view');
        }
      });
      // Forzar autoplay en videos del split hero
      document.querySelectorAll('split-hero video, .split-hero video').forEach(el => {
        const video = el as HTMLVideoElement;
        video.muted = true;
        video.play().catch(() => {});
      });
      // NO forzar .is-collapsed ni re-inicializar split-hero:
      // el split-hero debe empezar DESCOLAPSADO (100vw imagen)
      // ScrollMagic maneja el colapso durante el scroll
    };

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }

      setTimeout(() => {
        forceInView();

        // Pre-load reverse video to enable seamless source swapping
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'video';
        preloadLink.href = "https://firebasestorage.googleapis.com/v0/b/geminai-449212.firebasestorage.app/o/rever.mp4?alt=media&token=e563d34d-d5c4-4379-a11d-47901d2d01a6";
        document.head.appendChild(preloadLink);

        // ═══ Stacked Seamless Video Alternator & Hover Hunter ═══
        const collageVideoInterval = setInterval(() => {
          const wrappers = document.querySelectorAll('.collage-video-wrapper');
          wrappers.forEach(el => {
            const wrapper = el as HTMLElement;
            if (wrapper.dataset.pingPongBound) return;
            wrapper.dataset.pingPongBound = "true";
            
            const forward = wrapper.querySelector('.ping-pong-forward') as HTMLVideoElement;
            const reverse = wrapper.querySelector('.ping-pong-reverse') as HTMLVideoElement;
            if (!forward || !reverse) return;

            // Initially paused
            forward.pause();
            reverse.pause();
            forward.dataset.isHovered = "false";
            reverse.dataset.isHovered = "false";

            // Track active video
            let activeVideo = forward;

            // Fade out pink background when any video starts playing
            const handlePlaying = () => {
              const bg = wrapper.closest('.multimedia-collage__background');
              if (bg) {
                bg.classList.add('is-loaded');
              }
            };
            forward.addEventListener('playing', handlePlaying);
            reverse.addEventListener('playing', handlePlaying);

            // Forward video ended transition
            forward.addEventListener('ended', () => {
              forward.pause();
              
              setTimeout(() => {
                // Seamless Crossfade to Reverse:
                reverse.currentTime = 0;
                
                // Swap opacities and z-indices
                reverse.style.zIndex = "2";
                reverse.style.opacity = "1";
                forward.style.zIndex = "1";
                forward.style.opacity = "0";
                
                activeVideo = reverse;

                // Play if hover container is active
                const hoverContainer = (wrapper.closest('.multimedia-collage-block__inner') || wrapper) as HTMLElement;
                if (hoverContainer.dataset.isHovered === "true") {
                  reverse.play().catch(() => {});
                }
              }, 1000); // 1-second pause on the last frame of forward
            });

            // Reverse video ended transition
            reverse.addEventListener('ended', () => {
              reverse.pause();

              setTimeout(() => {
                // Seamless Crossfade to Forward:
                forward.currentTime = 0;

                // Swap opacities and z-indices
                forward.style.zIndex = "2";
                forward.style.opacity = "1";
                reverse.style.zIndex = "1";
                reverse.style.opacity = "0";

                activeVideo = forward;

                // Play if hover container is active
                const hoverContainer = (wrapper.closest('.multimedia-collage-block__inner') || wrapper) as HTMLElement;
                if (hoverContainer.dataset.isHovered === "true") {
                  forward.play().catch(() => {});
                }
              }, 1000); // 1-second pause on the last frame of reverse
            });

            // Hover trigger for the main container
            const hoverContainer = (wrapper.closest('.multimedia-collage-block__inner') || wrapper) as HTMLElement;
            hoverContainer.addEventListener('mouseenter', () => {
              hoverContainer.dataset.isHovered = "true";
              activeVideo.play().catch(() => {});
            });

            hoverContainer.addEventListener('mouseleave', () => {
              hoverContainer.dataset.isHovered = "false";
              forward.pause();
              reverse.pause();
            });
          });
        }, 500);
        setTimeout(() => clearInterval(collageVideoInterval), 10000);

        // ═══ Simple Fade-In Reveal for Videos ═══
        const cinematicReveal = (video: HTMLVideoElement) => {
          if (video.dataset.revealStarted) return;
          video.dataset.revealStarted = 'true';

          video.style.setProperty('opacity', '0', 'important');
          void video.offsetHeight;
          video.style.setProperty('transition', 'opacity 1.5s ease-out');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              video.style.setProperty('opacity', '1', 'important');
              video.classList.add('is-playing-revealed');
            });
          });
        };

        const revealInterval = setInterval(() => {
          const videos = document.querySelectorAll('video.reveal-on-play');
          videos.forEach(el => {
            const video = el as HTMLVideoElement;
            if (!video || video.dataset.revealBound) return;
            video.dataset.revealBound = "true";

            if (video.currentTime > 0 && !video.paused) {
              cinematicReveal(video);
            }

            video.addEventListener('playing', () => cinematicReveal(video));
            video.addEventListener('play', () => cinematicReveal(video));
          });
        }, 500);
        setTimeout(() => clearInterval(revealInterval), 10000);

        // ═══ Logo Instant Load Reveal ═══
        const logo = document.querySelector('.header img.logo') as HTMLImageElement;
        if (logo) {
          if (logo.complete) {
            logo.classList.add('is-loaded');
          } else {
            logo.addEventListener('load', () => logo.classList.add('is-loaded'));
          }
        }

        // ═══ Early Skeleton Reveal for Slideshow Buttons (before video loads) ═══
        setTimeout(() => {
          document.querySelectorAll('.slideshow__content .custom-button').forEach(el => {
            el.classList.add('is-loaded');
          });
        }, 400);

        // ═══ Delayed Skeleton-to-Content Reveal for Other Buttons ═══
        setTimeout(() => {
          document.querySelectorAll('.header img.logo, .custom-button').forEach(el => {
            el.classList.add('is-loaded');
          });
        }, 1200);
        
        try {
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
          window.dispatchEvent(new Event('load'));
        } catch (e) {
          console.warn('[Plantilla23] dispatch DOMContentLoaded/load failed:', e);
        }
      }, 500);
    })();

    return () => { (window as any).__tpl23ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla23/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 23...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl23-shopify-root template-index"
    />
  );
}
