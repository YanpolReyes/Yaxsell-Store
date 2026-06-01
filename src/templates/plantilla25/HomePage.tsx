'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 25 — Shopify Theme Capturado por FOLLA v2
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

const SHOPIFY_BASE = '/shopify/plantilla25/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla25/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/theme.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/apps.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/newsletter-popup.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/mobile-dock.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/pickup-availability.css`,
  `/shopify/plantilla25/assets/css/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/blog.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/vendor.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/theme.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/tab-attention.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/cart.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/gift-wrapping.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/search.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/newsletter-popup.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/mobile-dock.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/pickup-availability.js` },
  { src: `/shopify/plantilla25/assets/js/concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/instant-page.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Inter;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n4.b2a3f24c19b4de56e8871f609e73ca7f6d2e2bb9.woff2") format("woff2"),
       url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n4.af8052d517e0c9ffac7b814872cecc27ae1fa132.woff") format("woff");
}
@font-face {
  font-family: Inter;
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n5.d7101d5e168594dd06f56f290dd759fba5431d97.woff2") format("woff2"),
       url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n5.5332a76bbd27da00474c136abb1ca3cbbf259068.woff") format("woff");
}
@font-face {
  font-family: Inter;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n7.02711e6b374660cfc7915d1afc1c204e633421e4.woff2") format("woff2"),
       url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_n7.6dab87426f6b8813070abd79972ceaf2f8d3b012.woff") format("woff");
}
@font-face {
  font-family: Inter;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_i4.feae1981dda792ab80d117249d9c7e0f1017e5b3.woff2") format("woff2"),
       url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_i4.62773b7113d5e5f02c71486623cf828884c85c6e.woff") format("woff");
}
@font-face {
  font-family: Inter;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_i7.b377bcd4cc0f160622a22d638ae7e2cd9b86ea4c.woff2") format("woff2"),
       url("/shopify/plantilla25/assets/fonts/concept-theme-tech.myshopify.com/cdn/fonts/inter/inter_i7.7c69a6a34e3bb44fcf6f975857e13b9a9b25beb4.woff") format("woff");
}
`;

export default function HomePage25() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping & add js/body attributes ── */
  useEffect(() => {
    // DocumentElement settings
    document.documentElement.dataset.template = '25';
    document.documentElement.classList.add('js');
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    document.documentElement.classList.add(isTouch ? 'touch' : 'no-touch');

    // Body settings
    document.body.classList.add('template-index');
    document.body.setAttribute('data-rounded-button', 'round');
    document.body.setAttribute('data-rounded-input', 'round-slight');
    document.body.setAttribute('data-rounded-block', 'round');
    document.body.setAttribute('data-rounded-card', 'round');
    document.body.setAttribute('data-button-hover', 'standard');
    document.body.setAttribute('data-page-transition', '');
    document.body.setAttribute('data-lazy-image', '');
    document.body.setAttribute('data-modal-swipe-only', '');
    document.body.setAttribute('data-title-animation', '');
    document.body.setAttribute('data-page-rendering', '');

    return () => {
      delete document.documentElement.dataset.template;
      document.documentElement.classList.remove('js', 'touch', 'no-touch');
      
      document.body.classList.remove('template-index');
      document.body.removeAttribute('data-rounded-button');
      document.body.removeAttribute('data-rounded-input');
      document.body.removeAttribute('data-rounded-block');
      document.body.removeAttribute('data-rounded-card');
      document.body.removeAttribute('data-button-hover');
      document.body.removeAttribute('data-page-transition');
      document.body.removeAttribute('data-lazy-image');
      document.body.removeAttribute('data-modal-swipe-only');
      document.body.removeAttribute('data-title-animation');
      document.body.removeAttribute('data-page-rendering');
    };
  }, []);

  /* ── Load custom overrides and font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl25-custom-styles';
    styleEl.textContent = FONT_FACE_CSS + `
/* Ocultar iconos del menu start (hamburguesa/search de la izquierda) en desktop */
@media screen and (min-width: 1024px) {
  .header__icons--start {
    display: none !important;
  }
}

/* Fix Tailwind utilities for newsletter bar */
.grid {
  display: grid;
}
@media (min-width: 768px) {
  .md\\:grid {
    display: grid !important;
  }
}
`;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl25="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${href}?v=${Date.now()}`;
      link.setAttribute('data-tpl25', href);
      document.head.appendChild(link);
    });
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla25/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla25] Error loading body-clean.html', err);
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
  }, [bodyHtml]);

  /* ── Inject window.Shopify and window.theme stubs BEFORE loading JS ── */
  useEffect(() => {
    if (!(window as any).Shopify) {
      (window as any).Shopify = {
        shop: 'concept-theme-tech.myshopify.com',
        country: 'US',
        currency: 'USD',
        locale: 'es',
        theme: { name: 'Captured Theme', id: '188' },
        routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
        customerAccountsEnabled: false,
      };
    }

    if (!(window as any).theme) {
      const themeObj: any = {
        routes: {
          shop_url: 'https://concept-theme-tech.myshopify.com',
          root_url: '/',
          cart_url: '/cart',
          cart_add_url: '/cart/add',
          cart_change_url: '/cart/change',
          cart_update_url: '/cart/update',
          search_url: '/search',
          predictive_search_url: '/search/suggest'
        },
        variantStrings: {
          preOrder: "Pre-order",
          addToCart: "Add to cart",
          soldOut: "Sold Out",
          unavailable: "Unavailable",
          addToBundle: "Add to bundle",
          backInStock: "Notify me when it’s available"
        },
        shippingCalculatorStrings: {
          error: "One or more errors occurred while retrieving the shipping rates:",
          notFound: "Sorry, we do not ship to your address.",
          oneResult: "There is one shipping rate for your address:",
          multipleResults: "There are multiple shipping rates for your address:"
        },
        discountStrings: {
          error: "Discount code cannot be applied to your cart",
          shippingError: "Shipping discounts are shown at checkout after adding an address"
        },
        recipientFormStrings: {
          expanded: "Gift card recipient form expanded",
          collapsed: "Gift card recipient form collapsed"
        },
        quickOrderListStrings: {
          itemsAdded: "[quantity] items added",
          itemAdded: "[quantity] item added",
          itemsRemoved: "[quantity] items removed",
          itemRemoved: "[quantity] item removed",
          viewCart: "View cart",
          each: "[money]/ea",
          minError: "This item has a minimum of [min]",
          maxError: "This item has a maximum of [max]",
          stepError: "You can only add this item in increments of [step]"
        },
        cartStrings: {
          error: "There was an error while updating your cart. Please try again.",
          quantityError: "You can only add [quantity] of this item to your cart.",
          giftNoteAttribute: "Gift note",
          giftWrapAttribute: "Gift wrapping",
          giftWrapBooleanTrue: "Yes",
          targetProductAttribute: "For"
        },
        dateStrings: {
          d: "d",
          day: "Day",
          days: "Days",
          h: "h",
          hour: "Hour",
          hours: "Hours",
          m: "m",
          minute: "Min",
          minutes: "Mins",
          s: "s",
          second: "Sec",
          seconds: "Secs"
        },
        tabAttentionStrings: {
          firstMessage: "Something we said?",
          nextMessage: "We're still here!",
          messageDelay: 3
        },
        strings: {
          recentlyViewedEmpty: "Your recently viewed is empty.",
          close: "Close",
          next: "Next",
          previous: "Previous",
          qrImageAlt: "QR code — scan to redeem gift card"
        },
        settings: {
          moneyFormat: "${{amount}}",
          moneyWithCurrencyFormat: "${{amount}} USD",
          currencyCodeEnabled: false,
          externalLinksNewTab: false,
          cartType: "drawer",
          isCartTemplate: false,
          pswpModule: "//concept-theme-tech.myshopify.com/cdn/shop/t/188/assets/photoswipe.min.js?v=41760041872977459911778211903",
          themeName: 'Concept',
          themeVersion: '5.3.3',
          agencyId: ''
        }
      };
      (window as any).theme = themeObj;
      (window as any).themeVariables = themeObj;
    }

    // Intercept fetch/XHR to prevent 404s on /products/* and external APIs
    const origFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      const isShopifyPath = 
        url.startsWith('/products/') || 
        url.startsWith('/variants/') || 
        url.startsWith('/cart') || 
        url.startsWith('/search') || 
        url.startsWith('/recommendations/') ||
        ((url.includes('/products/') || url.includes('/variants/') || url.includes('/cart/') || url.includes('/recommendations/')) && !url.includes('/shopify/'));
      
      if (isShopifyPath) {
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
    if ((window as any).__tpl25ScriptsLoaded) return;
    (window as any).__tpl25ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl25="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `${file.src}?v=${Date.now()}`;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl25', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla25] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    const forceInView = () => {
      // Forzar .in-view en todos los .animation-element para activar animaciones
      document.querySelectorAll('.animation-element, .animation-wrapper').forEach(el => {
        el.classList.add('in-view');
      });
      // Forzar autoplay en videos del split hero
      document.querySelectorAll('split-hero video, .split-hero video').forEach(el => {
        const video = el as HTMLVideoElement;
        video.muted = true;
        video.play().catch(() => {});
      });
      // Forzar is-collapsed en split-hero para activar morph mask
      document.querySelectorAll('.split-hero-column__media').forEach(el => {
        if (!el.classList.contains('is-collapsed')) {
          el.classList.add('is-collapsed');
        }
      });
      // Re-inicializar split-hero si existe
      document.querySelectorAll('split-hero').forEach(el => {
        try { (el as any).initParallaxScrollAnimation(); } catch(e) {}
      });
    };

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }

      // Forzar .in-view después de un breve delay para que los scripts se ejecuten
      setTimeout(() => {
        forceInView();
        try {
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
          window.dispatchEvent(new Event('load'));
        } catch (e) {
          console.warn('[Plantilla25] dispatch DOMContentLoaded/load failed:', e);
        }
      }, 500);
    })();

    return () => { (window as any).__tpl25ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla25/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 25...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl25-shopify-root template-index"
    />
  );
}
