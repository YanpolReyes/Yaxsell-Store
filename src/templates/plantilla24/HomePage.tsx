'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 24 — Shopify Theme Capturado por FOLLA v2
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

const SHOPIFY_BASE = '/shopify/plantilla24/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla24/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/lenis.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/swiper.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/header-search.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/styles.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/hero-banner.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-card.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/global-drawer.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/main-product.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-product.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/header.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/collection-list.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/horizontal-scroller.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-collection.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/countdown-timer.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/after-before.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-steps.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/collection-tab.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/image-with-text.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/image-gallery.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-feature.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/trending-collection.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/customer-insights.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-slider-hotspot.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-blog.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/brand-logo-list.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/instafeed.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/icon-text-columns.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/footer.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/quick-view.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/cart-drawer.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/localization-dropdown.css`,
  `/shopify/plantilla24/assets/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/fancybox.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/swiper.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/lenis.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/critical.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/quick-view.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/header-search.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/localization-form.js`, module: true },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/animations.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/fancybox.js` },
  { src: `/shopify/plantilla24/assets/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/non-critical.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Jost;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n4.d47a1b6347ce4a4c9f437608011273009d91f2b7.woff2") format("woff2"),
       url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n4.791c46290e672b3f85c3d1c651ef2efa3819eadd.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n7.921dc18c13fa0b0c94c5e2517ffe06139c3615a3.woff2") format("woff2"),
       url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n7.cbfc16c98c1e195f46c536e775e4e959c5f2f22b.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_i4.b690098389649750ada222b9763d55796c5283a5.woff2") format("woff2"),
       url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_i4.fd766415a47e50b9e391ae7ec04e2ae25e7e28b0.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_i7.d8201b854e41e19d7ed9b1a31fe4fe71deea6d3f.woff2") format("woff2"),
       url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_i7.eae515c34e26b6c853efddc3fc0c552e0de63757.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n5.7c8497861ffd15f4e1284cd221f14658b0e95d61.woff2") format("woff2"),
       url("/shopify/plantilla24/assets/fonts/noble-preview.myshopify.com/cdn/fonts/jost/jost_n5.fb6a06896db583cc2df5ba1b30d9c04383119dd9.woff") format("woff");
}
`;

export default function HomePage24() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '24';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl24-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl24="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${href}?v=${Date.now()}`;
      link.setAttribute('data-tpl24', href);
      document.head.appendChild(link);
    });
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla24/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla24] Error loading body-clean.html', err);
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

  /* ── Inject window.Shopify stub BEFORE loading JS ── */
  useEffect(() => {
    if ((window as any).Shopify) return;
    (window as any).Shopify = {
      shop: 'noble-preview.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Captured Theme', id: '148' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/productos' },
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
    if ((window as any).__tpl24ScriptsLoaded) return;
    (window as any).__tpl24ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl24="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `${file.src}?v=${Date.now()}`;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl24', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla24] Failed to load:', file.src); done(); };
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
          console.warn('[Plantilla24] dispatch DOMContentLoaded/load failed:', e);
        }
      }, 500);
    })();

    return () => { (window as any).__tpl24ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla24/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 24...
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Quirúrgicamente desactivamos el pseudo-elemento ::before que crea la línea blanca debajo del navbar */
        body:not(.template-index) .main_header_wrapper:before,
        body:not(.template-index) .main_header_wrapper::before {
          display: none !important;
          background: transparent !important;
          height: 0 !important;
          width: 0 !important;
          opacity: 0 !important;
          content: none !important;
        }
      `}} />
      <div
        ref={containerRef}
        className="tpl24-shopify-root template-index"
      />
    </>
  );
}
