'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 7 — Shopify Theme Capturado por FOLLA
   ──────────────────────────────────────────────────────────────────
   ⚠️  BOILERPLATE: Requiere revisión manual antes de usar.
   ──────────────────────────────────────────────────────────────────
   Estrategia (idéntica a plantilla1):
   - Render del HTML body limpio via containerRef.innerHTML
   - Carga dinámica de CSS via <link> tags en <head>
   - Carga dinámica de JS via <script> tags secuenciales
   - Scripts de Shopify problemáticos excluidos
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react';

const SHOPIFY_BASE = '/shopify/plantilla7/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla7/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/lenis.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/swiper.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/header-search.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/styles.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/hero-banner.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/product-card.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/global-drawer.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/main-product.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/featured-product.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/header.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/collection-list.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/horizontal-scroller.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/featured-collection.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/countdown-timer.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/after-before.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/product-steps.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/image-banner.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/collection-tab.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/image-with-text.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/image-gallery.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/product-feature.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/trending-collection.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/customer-insights.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/product-slider-hotspot.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/featured-blog.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/brand-logo-list.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/instafeed.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/icon-text-columns.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/footer.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/quick-view.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/cart-drawer.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/localization-dropdown.css`,
  `/shopify/plantilla7/assets/css/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/fancybox.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/swiper-t5vbch.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/lenis-9psjim.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/critical-3a04vr.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/animations-1r910a.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/fancybox-x4rrpk.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/header-search-lelzc.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/non-critical-be1zb3.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/quick-view-5xizsu.js` },
  { src: `/shopify/plantilla7/assets/js/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/shop/t/6/assets/localization-form-mefw81.js` },
];

/* ── Font faces — LOCAL paths, no CORS issues ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Jost;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n4.d47a1b6347ce4a4c9f437608011273009d91f2b7.woff2") format("woff2"),
       url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n4.791c46290e672b3f85c3d1c651ef2efa3819eadd.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n7.921dc18c13fa0b0c94c5e2517ffe06139c3615a3.woff2") format("woff2"),
       url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n7.cbfc16c98c1e195f46c536e775e4e959c5f2f22b.woff") format("woff");
}
@font-face {
  font-family: Jost;
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n5.7c8497861ffd15f4e1284cd221f14658b0e95d61.woff2") format("woff2"),
       url("/shopify/plantilla7/assets/fonts/56sctndnsigqli78-97367883849.shopifypreview.com/cdn/fonts/jost/jost_n5.fb6a06896db583cc2df5ba1b30d9c04383119dd9.woff") format("woff");
}
@font-face {
  font-family: 'GTStandard-M';
  src: url(/shopify/plantilla7/assets/fonts/cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MRegular.woff2) format('woff2');
  font-style: normal;
  font-weight: 450;
  font-display: swap;
}
@font-face {
  font-family: 'GTStandard-M';
  src: url(/shopify/plantilla7/assets/fonts/cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MMedium.woff2) format('woff2');
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'GTStandard-M';
  src: url(/shopify/plantilla7/assets/fonts/cdn.shopify.com/shop-assets/static_uploads/shoplift/GTStandard-MSemibold.woff2) format('woff2');
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
`;

export default function HomePage7() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '7';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl7-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl7="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl7', href);
      document.head.appendChild(link);
      links.push(link);
    });
    return () => { links.forEach(l => l.remove()); };
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla7/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla7] Error loading body-clean.html', err);
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
      shop: 'yesbella.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Noble Premium', id: '1234' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
      customerAccountsEnabled: false,
    };
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl7ScriptsLoaded) return;
    (window as any).__tpl7ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl7="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl7', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla7] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }
      try {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
        window.dispatchEvent(new Event('load'));
      } catch (e) {
        console.warn('[Plantilla7] dispatch DOMContentLoaded/load failed:', e);
      }
    })();

    return () => { (window as any).__tpl7ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla7/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 7...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl7-shopify-root template-index"
    />
  );
}
