'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 13 — Shopify Theme Capturado por FOLLA
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

const SHOPIFY_BASE = '/shopify/plantilla13/assets';

// Keep ScrollMagic pin spacers visible for split-hero.
if (typeof document !== 'undefined' && !document.getElementById('tpl13-sh-fix')) {
  const s = document.createElement('style');
  s.id = 'tpl13-sh-fix';
  s.textContent = `.scrollmagic-pin-spacer{display:block!important}`;
  document.head.appendChild(s);
}

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla13/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/compiled_assets/styles.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/base.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/styles.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-with-text.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/flexible-columns.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-product.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/article-card.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/editorial-banner.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.css`,
  `/shopify/plantilla13/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/footer.css`,
  `/shopify/plantilla13/assets/css/tpl13-overrides.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gsap.min.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/MorphSVGPlugin.min.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/ScrollMagic.min.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.gsap.min.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/functions.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/pubsub.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/script.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/menu-drawer.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-swatch-selector.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-form.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-block.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-media.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/accordion.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-invalid.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-validate.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.js` },
  { src: `/shopify/plantilla13/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/button-to-top.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.3c434e22befd5c18a6b4afadb1e3d77c128c7939.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.5d9fa6e2cae713c8fb539a9876489d86207fe957.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.5a4ea298b4789e064f62a29aafc18d41f09ae59b.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.072b5869c5e0ed5b9d2021e4c2af132e16681ad2.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.a0d4a463df4f146567d871890ffb3c80408e7732.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.f6ec9f2a0681acc6f8152c40921d2a4d2e1a2c78.woff") format("woff");
}
@font-face {
  font-family: "Nunito Sans";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.25d963ed46da26098ebeab731e90d8802d989fa5.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.d32e3219b3d2ec82285d3027bd673efc61a996c8.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla13/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
`;

export default function HomePage13() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '13';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Prevent browser scroll restoration & force top ── */
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  /* ── Block all programmatic scroll for first 15s ── */
  useEffect(() => {
    const origScrollTo = window.scrollTo.bind(window);
    const origScrollBy = window.scrollBy.bind(window);
    const origScroll = window.scroll.bind(window);
    const origSIV = Element.prototype.scrollIntoView;
    const start = Date.now();
    const ms = 15000;
    const blocked = () => Date.now() - start < ms;
    window.scrollTo = ((...a: any[]) => { if (!blocked()) origScrollTo(...a); }) as any;
    window.scroll = ((...a: any[]) => { if (!blocked()) origScroll(...a); }) as any;
    window.scrollBy = ((...a: any[]) => { if (!blocked()) origScrollBy(...a); }) as any;
    Element.prototype.scrollIntoView = function(a?: boolean | ScrollIntoViewOptions) { if (!blocked()) origSIV.call(this, a); };
    setTimeout(() => {
      window.scrollTo = origScrollTo;
      window.scrollBy = origScrollBy;
      window.scroll = origScroll;
      Element.prototype.scrollIntoView = origSIV;
    }, ms);
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl13-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl13="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl13', href);
      document.head.appendChild(link);
      links.push(link);
    });
    return () => { links.forEach(l => l.remove()); };
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla13/body-clean.html', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        if (aborted) return;
        // Disable SVG clipping mask which causes the video container to become invisible
        let sanitized = html.replace(/data-mask-enabled="true"/g, 'data-mask-enabled="false"');
        // Force HTTPS on all protocol-relative Shopify URLs to avoid Mixed Content / autoplay block
        sanitized = sanitized.replace(/\/\/k-me-store-2\.myshopify\.com/g, 'https://k-me-store-2.myshopify.com');
        // Prevent immediate 404 requests for local Shopify preview posters.
        sanitized = sanitized.replace(/poster="files\/preview_images\/[^"]*"/g, '');
        // Localize mask-url to the local SVG so the morph mask animation works.
        sanitized = sanitized.replace(
          /data-mask-url="[^"]*\/([^\/"]+\.svg)[^"]*"/gi,
          `data-mask-url="/shopify/plantilla13/assets/img/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/$1"`
        );
        setBodyHtml(sanitized);
      })
      .catch(err => {
        if (aborted) return;
        console.error('[Plantilla13] Error loading body-clean.html', err);
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

    // Remove rules that hide ScrollMagic spacers.
    root.querySelectorAll('style').forEach(style => {
      if (style.textContent?.includes('.scrollmagic-pin-spacer')) {
        style.textContent = style.textContent.replace(
          /\.scrollmagic-pin-spacer\s*\{[^}]*display\s*:\s*none[^}]*\}/g,
          ''
        );
      }
    });

    // Force secure URL & direct video.src assignment to guarantee autoplay/playback
    root.querySelectorAll<HTMLVideoElement>('video').forEach(video => {
      const source = video.querySelector('source');
      if (source) {
        let src = source.getAttribute('src') || '';
        if (src.startsWith('//')) {
          src = `https:${src}`;
          source.setAttribute('src', src);
        }
        // Direct src assignment fixes React innerHTML video decoding issues
        video.src = src;
        video.setAttribute('src', src);
      }

      // Explicitly set muted property to bypass browser innerHTML muted attribute bug
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', 'muted');
      video.setAttribute('playsinline', 'true');

      // Keep visual fallbacks valid
      const poster = video.getAttribute('poster') || '';
      if (poster.startsWith('//')) {
        video.setAttribute('poster', `https:${poster}`);
      } else if (poster.startsWith('files/')) {
        const fallbackImg = video.querySelector('img[src]');
        const fallbackSrc = fallbackImg?.getAttribute('src') || '';
        if (fallbackSrc.startsWith('//')) {
          video.setAttribute('poster', `https:${fallbackSrc}`);
        }
      }

      const fallbackImg = video.querySelector('img[src]');
      if (fallbackImg) {
        const src = fallbackImg.getAttribute('src') || '';
        if (src.startsWith('//')) {
          fallbackImg.setAttribute('src', `https:${src}`);
        }
      }

      video.load();
      video.play().catch(err => {
        console.warn('[Plantilla13] video play failed:', err);
      });
    });

    // Localize mask URLs to local assets — keep the mask so the morph animation works.
    root.querySelectorAll<HTMLElement>('[data-mask-url]').forEach(el => {
      const rawMaskUrl = el.getAttribute('data-mask-url') || '';
      if (!rawMaskUrl) return;
      const noQuery = rawMaskUrl.split('?')[0];
      const normalized = noQuery.startsWith('//') ? `https:${noQuery}` : noQuery;
      try {
        const u = new URL(normalized);
        if (u.hostname.includes('k-me-store-2.myshopify.com')) {
          el.setAttribute('data-mask-url', `/shopify/plantilla13/assets/img/${u.hostname}${u.pathname}`);
        }
      } catch {
        // keep original URL if it's not parseable
      }
    });

    // Load split-hero videos eagerly and ensure visibility WITHOUT killing the mask morph.
    const shEl = root.querySelector('split-hero') as HTMLElement | null;
    if (shEl) {
      const enforceSplitMediaVisible = () => {
        shEl.querySelectorAll<HTMLElement>('.split-hero-column__media-media').forEach(mediaEl => {
          // Keep visibility but DON'T touch clip-path — let the morph animation handle it.
          mediaEl.style.setProperty('visibility', 'visible', 'important');
          mediaEl.style.setProperty('opacity', '1', 'important');

          // Force removal of clip-path so the video is 100% visible
          mediaEl.style.setProperty('clip-path', 'none', 'important');
          mediaEl.style.setProperty('-webkit-clip-path', 'none', 'important');

          const videos = mediaEl.querySelectorAll<HTMLVideoElement>('video');
          videos.forEach(v => {
            v.classList.add('loaded');
            v.style.setProperty('display', 'block', 'important');
            v.style.setProperty('visibility', 'visible', 'important');
            v.style.setProperty('opacity', '1', 'important');
            v.style.setProperty('z-index', '30', 'important');
            
            // Bypass browser innerHTML muted bug
            v.muted = true;
            v.defaultMuted = true;
            v.setAttribute('muted', 'muted');
            v.setAttribute('playsinline', 'true');

            if (v.paused) {
              v.play().catch(() => {});
            }
          });

          const overlay = mediaEl.parentElement?.querySelector<HTMLElement>('.overlay');
          if (overlay) {
            overlay.style.setProperty('opacity', '0', 'important');
            overlay.style.setProperty('background', 'transparent', 'important');
            overlay.style.setProperty('pointer-events', 'none', 'important');
          }
        });
      };

      enforceSplitMediaVisible();
      setTimeout(enforceSplitMediaVisible, 250);
      setTimeout(enforceSplitMediaVisible, 1000);
      setTimeout(enforceSplitMediaVisible, 2500);

      const mediaVideos = shEl.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
      mediaVideos.forEach(video => {
        video.classList.add('loaded');
        video.style.setProperty('opacity', '1', 'important');
        
        // Bypass browser innerHTML muted bug
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', 'muted');
        video.setAttribute('playsinline', 'true');

        if (video.paused) {
          video.play().catch(() => {});
        }
      });

      // Fallback image if video never becomes ready.
      shEl.querySelectorAll<HTMLElement>('.split-hero-column__media-media').forEach(mediaEl => {
        mediaEl.style.setProperty('background', '#f6f3ee');
        let fallback = mediaEl.querySelector<HTMLImageElement>('.tpl13-split-fallback');
        const sourceVideo = mediaEl.querySelector<HTMLVideoElement>('video');
        const fallbackFromVideoPoster = sourceVideo?.getAttribute('poster') || '';
        const fallbackFromNestedImg = sourceVideo?.querySelector('img')?.getAttribute('src') || '';
        const fallbackSrc = fallbackFromVideoPoster || fallbackFromNestedImg;
        if (fallbackSrc) {
          mediaEl.style.setProperty('background-image', `url("${fallbackSrc}")`);
          mediaEl.style.setProperty('background-size', 'cover');
          mediaEl.style.setProperty('background-position', 'center');
          mediaEl.style.setProperty('background-repeat', 'no-repeat');
        }
        if (!fallback && fallbackSrc) {
          fallback = document.createElement('img');
          fallback.className = 'tpl13-split-fallback object-cover w-full h-full absolute top-0 left-0';
          fallback.setAttribute('src', fallbackSrc);
          fallback.setAttribute('alt', 'split hero fallback');
          fallback.style.zIndex = '1';
          fallback.style.opacity = '1';
          fallback.style.transition = 'opacity .35s ease';
          mediaEl.appendChild(fallback);
        }
        const hideFallback = () => { if (fallback) fallback.style.opacity = '0'; };
        const showFallback = () => { if (fallback) fallback.style.opacity = '1'; };
        const videos = mediaEl.querySelectorAll<HTMLVideoElement>('video');
        let anyLoaded = false;
        videos.forEach(v => {
          const onReady = () => { anyLoaded = true; hideFallback(); };
          v.addEventListener('loadeddata', onReady);
          v.addEventListener('canplay', onReady);
          if (v.readyState >= 2) onReady();
        });
        setTimeout(() => { if (!anyLoaded) showFallback(); }, 1800);
      });

    }

    // IntersectionObserver fallback for all animation blocks.
    root.querySelectorAll<HTMLElement>('.animation-element').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add('in-view');
      }
    });
    if (!document.getElementById('tpl13-anim-observer')) {
      const as = document.createElement('script');
      as.id = 'tpl13-anim-observer';
      as.textContent = `(function(){
        var els=[].slice.call(document.querySelectorAll('.animation-element'));
        if(!els.length) return;
        var onVisible=function(el){el.classList.add('in-view');};
        if('IntersectionObserver' in window){
          var io=new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
              if(entry.isIntersecting||entry.intersectionRatio>0){
                onVisible(entry.target);
              }
            });
          },{root:null,rootMargin:'0px 0px -8% 0px',threshold:[0,0.1,0.2]});
          els.forEach(function(el){io.observe(el);});
        } else {
          var tick=function(){
            els.forEach(function(el){
              var r=el.getBoundingClientRect();
              if(r.top<window.innerHeight*0.92&&r.bottom>0) onVisible(el);
            });
          };
          window.addEventListener('scroll',tick,{passive:true});
          window.addEventListener('resize',tick,{passive:true});
          tick();
        }
      })();`;
      document.body.appendChild(as);
    }

    // When split media collapses, force reveal of staged animation blocks.
    const splitMedia = root.querySelector('.split-hero .split-hero-column__media');
    if (splitMedia && !document.getElementById('tpl13-split-collapse-watch')) {
      const cs = document.createElement('script');
      cs.id = 'tpl13-split-collapse-watch';
      cs.textContent = `(function(){
        var media=document.querySelector('.split-hero .split-hero-column__media');
        var host=document.querySelector('split-hero');
        if(!media||!host) return;
        var reveal=function(){
          host.querySelectorAll('.animation-element').forEach(function(el){
            el.classList.add('in-view');
          });
        };
        if(media.classList.contains('is-collapsed')) reveal();
        var mo=new MutationObserver(function(){
          if(media.classList.contains('is-collapsed')) reveal();
        });
        mo.observe(media,{attributes:true,attributeFilter:['class']});
      })();`;
      document.body.appendChild(cs);
    }

    // Hide page-loader shortly after mount.
    setTimeout(() => {
      const loader = root.querySelector('.page-loader');
      if (loader) loader.setAttribute('data-hidden', 'true');
    }, 1500);
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
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl13ScriptsLoaded) return;
    (window as any).__tpl13ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl13="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl13', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla13] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }

      // Ensure GSAP plugins are registered after all scripts are loaded.
      try {
        const w = window as any;
        if (w.gsap && w.MorphSVGPlugin) {
          w.gsap.registerPlugin(w.MorphSVGPlugin);
        }
        if (w.gsap && w.ScrollTrigger) {
          w.gsap.registerPlugin(w.ScrollTrigger);
        }
      } catch (e) {
        console.warn('[Plantilla13] GSAP plugin registration failed:', e);
      }

      try {
        document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
        window.dispatchEvent(new Event('load'));
      } catch (e) {
        console.warn('[Plantilla13] dispatch DOMContentLoaded/load failed:', e);
      }

      // Trigger resize so ScrollMagic recalculates pin dimensions.
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 2000);
    })();

    return () => { (window as any).__tpl13ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla13/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 13...
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="tpl13-shopify-root template-index"
      />
      <svg
        id="split-hero-clip-defs"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          opacity: 0.001,
          overflow: 'hidden',
        }}
      >
        <defs>
          <clipPath id="clip-template--27304712470809__split_hero_HFdBqn" clipPathUnits="objectBoundingBox">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 0 H1 V1 H0 Z" />
          </clipPath>
        </defs>
      </svg>
    </>
  );
}
