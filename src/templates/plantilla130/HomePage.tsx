'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 130 — Shopify Theme Capturado por FOLLA
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

const SHOPIFY_BASE = '/shopify/plantilla130/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla130/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/compiled_assets/styles.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/base.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/styles.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-with-text.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/flexible-columns.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-product.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/article-card.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/editorial-banner.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.css`,
  `/shopify/plantilla130/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/footer.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/functions.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/pubsub.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/script.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/menu-drawer.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-swatch-selector.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-form.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-badge.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-block.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-media.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/accordion.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-invalid.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-validate.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.js` },
  { src: `/shopify/plantilla130/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/button-to-top.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.3c434e22befd5c18a6b4afadb1e3d77c128c7939.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.5d9fa6e2cae713c8fb539a9876489d86207fe957.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.5a4ea298b4789e064f62a29aafc18d41f09ae59b.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.072b5869c5e0ed5b9d2021e4c2af132e16681ad2.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.a0d4a463df4f146567d871890ffb3c80408e7732.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.f6ec9f2a0681acc6f8152c40921d2a4d2e1a2c78.woff") format("woff");
}
@font-face {
  font-family: "Nunito Sans";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.25d963ed46da26098ebeab731e90d8802d989fa5.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.d32e3219b3d2ec82285d3027bd673efc61a996c8.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla130/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
`;

export default function HomePage130() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '130';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl130-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl130="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl130', href);
      document.head.appendChild(link);
      links.push(link);
    });
    return () => { links.forEach(l => l.remove()); };
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla130/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla130] Error loading body-clean.html', err);
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
      shop: 'k-me-store-2.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Captured Theme', id: '7' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/productos' },
      customerAccountsEnabled: false,
    };
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl130ScriptsLoaded) return;
    (window as any).__tpl130ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl130="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl130', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla130] Failed to load:', file.src); done(); };
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
        console.warn('[Plantilla130] dispatch DOMContentLoaded/load failed:', e);
      }
    })();

    return () => { (window as any).__tpl130ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla130/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 130...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl130-shopify-root template-index"
    />
  );
}
