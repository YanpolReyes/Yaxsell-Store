'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 3 — Shopify Theme Capturado por FOLLA v2
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

const SHOPIFY_BASE = '/shopify/plantilla3/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla3/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/swiper-bundle.min.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/animate.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/base.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/component.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/theme.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/account.css`,
  `/shopify/plantilla3/assets/css/cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css`,
  `/shopify/plantilla3/assets/css/cdn.shopify.com/extensions/019e74df-668b-769a-ba9e-6cd96fff6c65/judgeme-546/assets/shopify_v2.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/announcement.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/header.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/cart.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/search.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/slideshow.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/promotional-bar.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/multiboxes.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/categories.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/featured-collection.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/best-selling-products.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/text-with-icon.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/countdown.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/marquee.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/image-with-text.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/revealing-text.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/before-after.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/featured-product.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/shop-the-look.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/trending-products.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/featured-blog.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/featured-collections-list.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/testimonials.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/collapsible.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/media-gallery.css`,
  `/shopify/plantilla3/assets/css/theking-castle.myshopify.com/cdn/shop/t/36/assets/footer.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/compiled_assets/scripts.js` },
  { src: `/shopify/plantilla3/assets/js/cdn.shopify.com/extensions/019e74df-668b-769a-ba9e-6cd96fff6c65/judgeme-546/assets/loader.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/swiper-bundle.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/cookies.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/animate.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/lazyload.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/gsap.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/ScrollTrigger.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/SplitText.min.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/pubsub.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/magnet.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/theme.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/product-3d-model.js` },
  { src: `/shopify/plantilla3/assets/js/theking-castle.myshopify.com/cdn/shop/t/36/assets/graphics-font.json` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: "Instrument Sans";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_n4.db86542ae5e1596dbdb28c279ae6c2086c4c5bfa.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_n4.510f1b081e58d08c30978f465518799851ef6d8b.woff") format("woff");
}
@font-face {
  font-family: "Instrument Sans";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_n7.e4ad9032e203f9a0977786c356573ced65a7419a.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_n7.b9e40f166fb7639074ba34738101a9d2990bb41a.woff") format("woff");
}
@font-face {
  font-family: "Instrument Sans";
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_i4.028d3c3cd8d085648c808ceb20cd2fd1eb3560e5.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_i4.7e90d82df8dee29a99237cd19cc529d2206706a2.woff") format("woff");
}
@font-face {
  font-family: "Instrument Sans";
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_i7.d6063bb5d8f9cbf96eace9e8801697c54f363c6a.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/instrument_sans/instrumentsans_i7.ce33afe63f8198a3ac4261b826b560103542cd36.woff") format("woff");
}
@font-face {
  font-family: "Roboto Condensed";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_n7.0c73a613503672be244d2f29ab6ddd3fc3cc69ae.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_n7.ef6ece86ba55f49c27c4904a493c283a40f3a66e.woff") format("woff");
}
@font-face {
  font-family: "Roboto Condensed";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_n7.0c73a613503672be244d2f29ab6ddd3fc3cc69ae.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_n7.ef6ece86ba55f49c27c4904a493c283a40f3a66e.woff") format("woff");
}
@font-face {
  font-family: "Roboto Condensed";
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_i7.bed9f3a01efda68cdff8b63e6195c957a0da68cb.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/roboto_condensed/robotocondensed_i7.9ca5759a0bcf75a82b270218eab4c83ec254abf8.woff") format("woff");
}
@font-face {
  font-family: "Playfair Display";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_n4.9980f3e16959dc89137cc1369bfc3ae98af1deb9.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_n4.c562b7c8e5637886a811d2a017f9e023166064ee.woff") format("woff");
}
@font-face {
  font-family: "Playfair Display";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_n7.592b3435e0fff3f50b26d410c73ae7ec893f6910.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_n7.998b1417dec711058cce2abb61a0b8c59066498f.woff") format("woff");
}
@font-face {
  font-family: "Playfair Display";
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_i4.804ea8da9192aaed0368534aa085b3c1f3411619.woff2") format("woff2"),
       url("/shopify/plantilla3/assets/fonts/theking-castle.myshopify.com/cdn/fonts/playfair_display/playfairdisplay_i4.5538cb7a825d13d8a2333cd8a94065a93a95c710.woff") format("woff");
}
@font-face{font-family:'JudgemeStar';src:url("data:application/x-font-woff;charset=utf-8;base64,d09GRgABAAAAAAScAA0AAAAABrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGRlRNAAAEgAAAABoAAAAcbyQ+3kdERUYAAARgAAAAHgAAACAAMwAGT1MvMgAAAZgAAABGAAAAVi+vS9xjbWFwAAAB8AAAAEAAAAFKwBMjvmdhc3AAAARYAAAACAAAAAj//wADZ2x5ZgAAAkAAAAEJAAABdH33LXtoZWFkAAABMAAAAC0AAAA2BroQKWhoZWEAAAFgAAAAHAAAACQD5QHQaG10eAAAAeAAAAAPAAAAFAYAAABsb2NhAAACMAAAAA4AAAAOAO4AeG1heHAAAAF8AAAAHAAAACAASgAvbmFtZQAAA0wAAADeAAABkorWfVZwb3N0AAAELAAAACkAAABEp3ubLXgBY2BkYADhPPP4OfH8Nl8ZuJkYQODS2fRrCPr/aSYGxq1ALgcDWBoAO60LkwAAAHgBY2BkYGDc+v80gx4TAwgASaAICmABAFB+Arl4AWNgZGBgYGPQYWBiAAIwyQgWc2AAAwAHVQB6eAFjYGRiYJzAwMrAwejDmMbAwOAOpb8ySDK0MDAwMbByMsCBAAMCBKS5pjA4PGB4wMR44P8BBj3GrQymQGFGkBwAjtgK/gAAeAFjYoAAEA1jAwAAZAAHAHgB3crBCcAwDEPRZydkih567CDdf4ZskmLwFBV8xBfCaC4BXkOUmx4sU0h2ngNb9V0vQCxaRKIAevT7fGWuBrEAAAAAAAAAAAA0AHgAugAAeAF9z79Kw1AUx/FzTm7un6QmJtwmQ5Bg1abgEGr/BAqlU6Gju+Cgg1MkQ/sA7Vj7BOnmO/gUvo2Lo14NqIO6/IazfD8HEODtmQCfoANwNsyp2/GJt3WKQrd1NLiYYWx2PBqOsmJMEOznPOTzfSCrhAtbbLdmeFLJV9eKd63WLrZcIcuaEVdssWCKM6pLCfTVOYbz/0pNSMSZKLIZpvh78sAUH6PlMrreTCabP9r+Z/puPZ2ur/RqpQHgh+MIegCnXeM4MRAPjYN//5tj4ZtTjkFqEdmeMShlEJ7tVAly2TAkx6R68Fl4E/aVvn8JqHFQ4JS1434gXKcuL31dDhzs3YbsEOAd/IU88gAAAHgBfY4xTgMxEEVfkk0AgRCioKFxQYd2ZRtpixxgRU2RfhU5q5VWseQ4JdfgAJyBlmNwAM7ABRhZQ0ORwp7nr+eZAa54YwYg9zm3ynPOeFRe8MCrciXOh/KSS76UV5L/iDmrLiS5AeU519wrL3jmSbkS5115yR2fyivJv9kx0ZMZ2RLZw27q87iNQi8EBo5FSPIMw3HqBboi5lKTGAGDp8FKXWP+t9TU01Lj5His1Ba6uM9dTEMwvrFmbf5GC/q2drW3ruXUhhsCiQOjznFlCzYhHUZp4xp76vsvQh89CQAAeAFjYGJABowM6IANLMrEyMTIzMjCXpyRWJBqZshWXJJYBKOMAFHFBucAAAAAAAAB//8AAngBY2BkYGDgA2IJBhBgAvKZGViBJAuYxwAABJsAOgAAeAFjYGBgZACCk535hiD60tn0azAaAEqpB6wAAA==") format("woff");font-weight:normal;font-style:normal}
`;

export default function HomePage3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '3';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl3-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl3="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl3', href);
      document.head.appendChild(link);
    });
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla3/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla3] Error loading body-clean.html', err);
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
      shop: 'theking-castle.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Captured Theme', id: '36' },
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
    if ((window as any).__tpl3ScriptsLoaded) return;
    (window as any).__tpl3ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl3="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl3', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla3] Failed to load:', file.src); done(); };
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
          console.warn('[Plantilla3] dispatch DOMContentLoaded/load failed:', e);
        }
      }, 500);
    })();

    return () => { (window as any).__tpl3ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla3/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 3...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl3-shopify-root template-index"
    />
  );
}
