'use client';
import { useEffect, useRef, useState } from 'react';

const SHOPIFY_BASE = '/shopify/plantilla11/assets';
const TPL = 'tpl11';

/* ── CSS files: inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  /* inline (extraídos del HTML) */
  `${SHOPIFY_BASE}/css/inline/index-inline-1.css`,
  `${SHOPIFY_BASE}/css/inline/index-inline-2.css`,
  /* vendor */
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min-i0hb0o.css`,
  /* core */
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/base-tdrfg0.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation-l1e62.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/styles-kaudaj.css`,
  /* sections */
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar-6e2wj1.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar-mbl8gg.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header-l46ncw.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow-i69lvp.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video-l3uq5l.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list-sac8qz.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage-u0jshz.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-sp0mfc.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection-o7u117.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero-v9mne3.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns-q53lg0.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-yvbwzi.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-j53p1a.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup-8bv8bl.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector-s7u44m.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup-l832n0.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-il6ey9.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials-vcreh1.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee-bleqv8.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/flexible-columns-hwwhmh.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-with-text-urshns.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-5ptgsv.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup-cqi10c.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-nsaujv.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup-6kekun.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer-ntmlau.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/footer-hsb6x.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator-hizeip.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup-8p2a4p.css`,
  `${SHOPIFY_BASE}/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet-bg2vj2.css`,
];

/* ── JS: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  /* vendor */
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min-gjpp7p.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gsap.min-9s8w19.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/ScrollMagic.min-iw8rt7.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.gsap.min-d45ysn.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/MorphSVGPlugin.min-h2gzmb.js` },
  /* core */
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/pubsub-yksfjw.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/functions-1s4xgl.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/script-zp121.js` },
  /* sections */
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero-dnpcia.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/morph-svg-w3fjtq.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar-rtanjo.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar-a6vds7.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header-8yjak8.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/menu-drawer-y5o4ep.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow-hi1rk1.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video-yudh7v.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list-ot3xzc.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage-ijq1v0.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection-ae6rlu.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-m6k7yu.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-swatch-selector-x7k2k.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-form-c0hxtx.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-badge-v4rx4h.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-block-46qkm9.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns-xi6lls.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-ge8s8l.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products-pg8s9h.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector-28qeme.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials-y9pmb6.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee-iwgwrw.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-media-nvn9da.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-info-61wucz.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/accordion-ob8bxa.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/countdown-timer-p34x72.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts-muwn60.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-4n44sa.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup-988vf9.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq-n8f6a4.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator-b04kpy.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup-jte38s.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup-fjvvmr.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup-hor0rr.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-phetlr.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer-hjb2od.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer-ra3u7w.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector-3u90le.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form-rie5rh.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup-bo2q0t.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-invalid-mxnvpx.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-validate-52iq4b.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup-1ycwsu.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet-28c7s8.js` },
  { src: `${SHOPIFY_BASE}/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/button-to-top-q0vylc.js` },
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: 'Montserrat';
  src: url(${SHOPIFY_BASE}/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2) format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Nunito Sans';
  src: url(${SHOPIFY_BASE}/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.25d963ed46da26098ebeab731e90d8802d989fa5.woff2) format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
`;

/* ── CSS overrides for split-hero (same pattern as plantilla8) ── */
const OVERRIDES_CSS = `
/* Fix: filter: blur(0px) breaks position:fixed */
[style*="blur(0"] { filter: none !important; }
/* Fix: split-hero media starts at 50% instead of 100vw */
.split-hero .split-hero-column.split-hero-column__media {
  min-width: 100vw !important;
  max-width: 100vw !important;
}
/* Fix: collapsed state must be 50vw */
.split-hero .split-hero-column__media.is-collapsed {
  min-width: 50vw !important;
  max-width: 50vw !important;
}
/* Hide page loader / page-transition overlay */
.page-loader { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }
page-transition { display: none !important; }
`;

export default function HomePage11() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── 1. Mark template on document ── */
  useEffect(() => {
    document.documentElement.dataset.template = '11';
    document.body.classList.add('template-index');
    return () => {
      delete document.documentElement.dataset.template;
      document.body.classList.remove('template-index');
    };
  }, []);

  /* ── 2. Inject font faces ── */
  useEffect(() => {
    const existing = document.getElementById(`${TPL}-fontfaces`);
    if (existing) return;
    const styleEl = document.createElement('style');
    styleEl.id = `${TPL}-fontfaces`;
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
  }, []);

  /* ── 3. Load CSS dynamically in <head> ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      if (document.querySelector(`link[data-${TPL}="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(`data-${TPL}`, href);
      document.head.appendChild(link);
    });

    // Inject overrides CSS AFTER all Shopify CSS loads (delayed)
    setTimeout(() => {
      const existing = document.getElementById(`${TPL}-overrides`);
      if (existing) return;
      const styleEl = document.createElement('style');
      styleEl.id = `${TPL}-overrides`;
      styleEl.textContent = OVERRIDES_CSS;
      document.head.appendChild(styleEl);
    }, 500);
  }, []);

  /* ── 4. Fetch clean HTML ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla11/body-clean.html', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(html => { if (!aborted) setBodyHtml(html); })
      .catch(err => { console.error(`[Plantilla11] Error:`, err); setLoadError(err.message); });
    return () => { aborted = true; };
  }, []);

  /* ── 5. Inject HTML via ref.innerHTML (ONCE) ── */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    if (containerRef.current.dataset.htmlSet) return;
    containerRef.current.innerHTML = bodyHtml;
    containerRef.current.dataset.htmlSet = '1';

    // Remove leftover Shopify elements
    const root = containerRef.current;
    root.querySelectorAll(
      '.fusion-overlay-custom, .fusion-scroll-top, .quickView-popup'
    ).forEach(el => el.remove());
  }, [bodyHtml]);

  /* ── 6. Load JS sequentially AFTER HTML ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any)[`__${TPL}ScriptsLoaded`]) return;
    (window as any)[`__${TPL}ScriptsLoaded`] = true;

    // Stub window.Shopify if needed
    if (!(window as any).Shopify) {
      (window as any).Shopify = {};
    }

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-${TPL}="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute(`data-${TPL}`, file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn(`[Plantilla11] Failed to load:`, file.src); done(); };
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
        console.warn('[Plantilla11] dispatch DOMContentLoaded/load failed:', e);
      }
    })();
  }, [bodyHtml]);

  /* ── 7. MutationObserver to remove filter:blur(0) ── */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target as HTMLElement;
        if (target.style?.filter?.includes('blur(0')) {
          target.style.removeProperty('filter');
        }
      });
    });
    observer.observe(containerRef.current, { attributes: true, subtree: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error cargando plantilla 11: {loadError}</div>;
  }
  if (!bodyHtml) {
    return <div style={{ padding: '2rem' }}>Cargando plantilla 11...</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`${TPL}-shopify-root template-index`}
    />
  );
}
