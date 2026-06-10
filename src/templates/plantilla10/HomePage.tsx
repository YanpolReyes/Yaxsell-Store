'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 10 — Noble Premium Theme (noble-preview.myshopify.com)
   Estrategia (identica a plantilla7):
   - Render del HTML body limpio via containerRef.innerHTML
   - Carga dinamica de CSS via <link> tags en <head>
   - Carga dinamica de JS via <script> tags secuenciales
   - Scripts de Shopify problematicos excluidos
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react';

const SHOPIFY_BASE = '/shopify/plantilla10/assets';

/* ── CSS files: ORDEN CRITICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla10/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla10/assets/css/inline/index-inline-2.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/lenis-bbaiuo.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/swiper-ft39qk.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/header-search-uz7d60.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/styles-z7bqgw.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/hero-banner-c2k3lo.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-card-50ad58.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/global-drawer-c7cahr.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/main-product-p8682a.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-product-113hy9.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/header-86d2od.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/collection-list-2837r1.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/horizontal-scroller-owxi3k.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-collection-c3rqbf.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/countdown-timer-4jkaqe.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/after-before-vtux4u.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-steps-8zeqvz.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/collection-tab-l1jw1.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/image-with-text-lqaqtp.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/image-gallery-kxgy8.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-feature-dfln9e.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/trending-collection-6ra806.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/customer-insights-2dtmap.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/product-slider-hotspot-88rusv.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/featured-blog-w1dpdo.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/brand-logo-list-j29ddt.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/instafeed-sgqw9n.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/icon-text-columns-ggwzl2.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/footer-dhu8ei.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/quick-view-yosxge.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/cart-drawer-wzpt05.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/localization-dropdown-vhxm8c.css`,
  `${SHOPIFY_BASE}/css/noble-preview.myshopify.com/cdn/shop/t/148/assets/fancybox-2jt30.css`
];

/* ── JS files: solo los del tema, SIN perf-kit/account.js/analytics ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/swiper-3febdz.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/lenis-mvh37u.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/critical-rul27d.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/animations-ycinqq.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/fancybox-5b2nj4.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/non-critical-r1sfxl.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/header-search-vzv0r4.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/localization-form-g1ej0n.js` },
  { src: `${SHOPIFY_BASE}/js/noble-preview.myshopify.com/cdn/shop/t/148/assets/quick-view-qnqmxm.js` },
];

/* ── Overlay fix: header transparent on load, brown on scroll ── */
const OVERLAY_FIX_CSS = `
main-header[data-overlay="true"] .main_header_wrapper {
  background-color: transparent !important;
}
/* Force color-scheme-1 to be transparent - more specific selector */
.main_header_wrapper.color-scheme-1 {
  background-color: transparent !important;
}
/* Force transparent initially via class */
.tpl10-initial-transparent .main_header_wrapper {
  background-color: transparent !important;
}
`;

/* ── Font faces ── */
const FONT_FACE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
@font-face {
  font-family: "GTStandard-M";
  src: url("/shopify/plantilla10/assets/fonts/cdn.shopify.com/shop-assets/static_uploads/GTStandard-MRegular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "GTStandard-M";
  src: url("/shopify/plantilla10/assets/fonts/cdn.shopify.com/shop-assets/static_uploads/GTStandard-MMedium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
`;

export default function HomePage10() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '10';
    document.body.classList.add('template-index');
    return () => { delete document.documentElement.dataset.template; document.body.classList.remove('template-index'); };
  }, []);

  /* ── Load font faces + overlay fix ── */
  useEffect(() => {
    const existing = document.getElementById('tpl10-fontfaces');
    if (existing) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl10-fontfaces';
    styleEl.textContent = FONT_FACE_CSS + OVERLAY_FIX_CSS;
    document.head.appendChild(styleEl);
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl10="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl10', href);
      document.head.appendChild(link);
    });

    // Inject overlay fix CSS AFTER all Shopify CSS loads (delayed)
    setTimeout(() => {
      const existing = document.getElementById('tpl10-overlay-fix');
      if (existing) return;
      const styleEl = document.createElement('style');
      styleEl.id = 'tpl10-overlay-fix';
      styleEl.textContent = OVERLAY_FIX_CSS;
      document.head.appendChild(styleEl);
    }, 500);
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla10/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla10] Error loading body-clean.html', err);
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

    // Reset animation initial state for Free Shipping pill
    root.querySelectorAll('.additional_block').forEach(el => {
      (el as HTMLElement).style.cssText = '';
    });
    root.querySelectorAll('.additional_block_left, .additional_block_right').forEach(el => {
      (el as HTMLElement).style.cssText = '';
    });
    // Force reflow so browser processes initial state before JS animates
    void (root as HTMLElement).offsetHeight;

    // Force header transparent on load via class, remove on scroll
    const headerWrapper = root.querySelector('.main_header_wrapper') as HTMLElement | null;
    const mainHeader = root.querySelector('main-header') as HTMLElement | null;
    if (headerWrapper && mainHeader) {
      mainHeader.classList.add('tpl10-initial-transparent');
      
      const onScroll = () => {
        if (window.scrollY > 50) {
          mainHeader.classList.remove('tpl10-initial-transparent');
        } else {
          mainHeader.classList.add('tpl10-initial-transparent');
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }, [bodyHtml]);

  /* ── Inject window.Shopify stub BEFORE loading JS ── */
  useEffect(() => {
    if ((window as any).Shopify) return;
    (window as any).Shopify = {
      shop: 'noble-preview.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'en',
      theme: { name: 'Noble Premium', id: '148' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/productos' },
      customerAccountsEnabled: false,
    };
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl10ScriptsLoaded) return;
    (window as any).__tpl10ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl10="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl10', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla10] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }
      try {
        // Force custom element upgrade by recreating main-header
        const mainHeaderEl = containerRef.current?.querySelector('main-header');
        if (mainHeaderEl && mainHeaderEl.parentElement) {
          const parent = mainHeaderEl.parentElement;
          const next = mainHeaderEl.nextElementSibling;
          const newHeader = document.createElement('main-header');
          newHeader.innerHTML = mainHeaderEl.innerHTML;
          // Copy attributes
          Array.from(mainHeaderEl.attributes).forEach(attr => {
            newHeader.setAttribute(attr.name, attr.value);
          });
          parent.removeChild(mainHeaderEl);
          parent.insertBefore(newHeader, next);
          console.log('[Plantilla10] main-header recreated as custom element');
        }
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
        window.dispatchEvent(new Event('load'));
      } catch (e) {
        console.warn('[Plantilla10] dispatch DOMContentLoaded/load failed:', e);
      }
    })();
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla10/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 10...
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OVERLAY_FIX_CSS }} />
      <div
        ref={containerRef}
        className="tpl10-shopify-root template-index"
      />
    </>
  );
}
