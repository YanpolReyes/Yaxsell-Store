'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 12 — Shopify Theme Capturado por FOLLA
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

// Minimal CSS: only ensure scrollmagic pin spacers are visible (original theme handles the rest)
if (typeof document !== 'undefined' && !document.getElementById('tpl12-sh-fix')) {
  const s = document.createElement('style');
  s.id = 'tpl12-sh-fix';
  s.textContent = `.scrollmagic-pin-spacer{display:block!important}`;
  document.head.appendChild(s);
}

const SHOPIFY_BASE = '/shopify/plantilla12/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla12/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/compiled_assets/styles.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/base.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/styles.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-with-text.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/flexible-columns.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-product.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/article-card.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/store-locator.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/editorial-banner.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.css`,
  `/shopify/plantilla12/assets/css/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/footer.css`,
  `/shopify/plantilla12/assets/css/tpl12-overrides.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  // GSAP + MorphSVG + split-hero (NO ScrollMagic — patched to use native scroll)
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gsap.min.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/MorphSVGPlugin.min.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/ScrollMagic.min.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/animation.gsap.min.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/split-hero.js` },
  // Core theme
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/swiper-bundle.min.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/functions.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/pubsub.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/script.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/utility-bar.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/announcement-bar.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/header.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/menu-drawer.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/slideshow.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/block-video.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/collection-list.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/multimedia-collage.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-collection.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-swatch-selector.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-card-form.js` },
  // product-badge.js removed - causes /products/ 404 spam
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns-block.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/media-columns.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-columns.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/bundle-products.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-selector.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/horizontal-testimonials.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/marquee.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-media.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/accordion.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/featured-blog-posts.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/gallery-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/faq.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/variant-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/added-to-cart-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/localization-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/search-drawer.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-invalid.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/newsletter-validate.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-popup.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/product-compare-bottom-sheet.js` },
  { src: `/shopify/plantilla12/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/button-to-top.js` }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.3c434e22befd5c18a6b4afadb1e3d77c128c7939.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n7.5d9fa6e2cae713c8fb539a9876489d86207fe957.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.5a4ea298b4789e064f62a29aafc18d41f09ae59b.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i4.072b5869c5e0ed5b9d2021e4c2af132e16681ad2.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 700;
  font-style: italic;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.a0d4a463df4f146567d871890ffb3c80408e7732.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_i7.f6ec9f2a0681acc6f8152c40921d2a4d2e1a2c78.woff") format("woff");
}
@font-face {
  font-family: "Nunito Sans";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.25d963ed46da26098ebeab731e90d8802d989fa5.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/nunito_sans/nunitosans_n7.d32e3219b3d2ec82285d3027bd673efc61a996c8.woff") format("woff");
}
@font-face {
  font-family: Montserrat;
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.81949fa0ac9fd2021e16436151e8eaa539321637.woff2") format("woff2"),
       url("/shopify/plantilla12/assets/fonts/k-me-store-2.myshopify.com/cdn/fonts/montserrat/montserrat_n4.a6c632ca7b62da89c3594789ba828388aac693fe.woff") format("woff");
}
`;

export default function HomePage12() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '12';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl12-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically (no cleanup — CSS must persist) ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl12="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl12', href);
      document.head.appendChild(link);
    });
  }, []);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla12/body-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla12] Error loading body-clean.html', err);
        setLoadError(err.message || 'Error de carga');
      });
    return () => { aborted = true; };
  }, []);

  /* ── Prevent browser scroll restoration & force top ── */
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  /* ── Block all programmatic scroll for 15s on mount ── */
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

  /* ── Set innerHTML ONCE via ref ── */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    if (containerRef.current.dataset.htmlSet) return;

    containerRef.current.innerHTML = bodyHtml;
    containerRef.current.dataset.htmlSet = '1';

    // Remove leftover Shopify elements
    const root = containerRef.current;
    root.querySelectorAll('.fusion-overlay-custom, .fusion-scroll-top, .quickView-popup').forEach(el => {
      el.remove();
    });

    // CRITICAL: Remove the CSS rule that hides ScrollMagic pin-spacers.
    // Without pin-spacers, ScrollMagic can't pin/position the split-hero,
    // so is-in-viewport never gets added and the video stays visibility:hidden forever.
    root.querySelectorAll('style').forEach(style => {
      if (style.textContent?.includes('.scrollmagic-pin-spacer')) {
        style.textContent = style.textContent.replace(
          /\.scrollmagic-pin-spacer\s*\{[^}]*display\s*:\s*none[^}]*\}/g,
          ''
        );
      }
    });

    // Fix video source URLs: keep Shopify CDN paths (normalize protocol-relative URLs).
    root.querySelectorAll('video source[src*="k-me-store-2.myshopify.com/cdn/shop/videos"]').forEach(el => {
      const orig = el.getAttribute('src') || '';
      if (orig.startsWith('//')) {
        el.setAttribute('src', `https:${orig}`);
      }
      const video = el.closest('video') as HTMLVideoElement | null;
      video?.load();
      video?.play().catch(() => {});
    });

    // Keep/fix visual fallbacks (poster + preview image) so media never renders blank.
    root.querySelectorAll<HTMLVideoElement>('video').forEach(video => {
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
    });

    root.querySelectorAll<HTMLElement>('.split-hero-column__media-media[data-mask-url*="mask-scoop-right.svg"]').forEach(el => {
      el.setAttribute('data-mask-url', '/shopify/plantilla12/assets/img/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/mask-scoop-right.svg');
    });

    // Preserve poster attributes; they are needed as fallback while video buffers.

    // Load videos and mark as loaded
    const shEl = root.querySelector('split-hero') as HTMLElement | null;
    if (shEl) {
      const mediaVideos = shEl.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
      mediaVideos.forEach(video => {
        video.classList.add('loaded');
        video.style.setProperty('opacity', '1', 'important');
        video.load();
        video.play().catch(() => {});
      });

      // Robust fallback: if split-hero video doesn't render, keep a media image visible.
      shEl.querySelectorAll<HTMLElement>('.split-hero-column__media-media').forEach(mediaEl => {
        mediaEl.style.setProperty('background', '#f6f3ee');

        let fallback = mediaEl.querySelector<HTMLImageElement>('.tpl12-split-fallback');
        const sourceVideo = mediaEl.querySelector<HTMLVideoElement>('video');
        const fallbackFromVideoPoster = sourceVideo?.getAttribute('poster') || '';
        const fallbackFromNestedImg = sourceVideo?.querySelector('img')?.getAttribute('src') || '';
        const fallbackSrc = fallbackFromVideoPoster || fallbackFromNestedImg;

        if (!fallback && fallbackSrc) {
          fallback = document.createElement('img');
          fallback.className = 'tpl12-split-fallback object-cover w-full h-full absolute top-0 left-0';
          fallback.setAttribute('src', fallbackSrc);
          fallback.setAttribute('alt', 'split hero fallback');
          fallback.style.zIndex = '1';
          fallback.style.opacity = '1';
          fallback.style.transition = 'opacity .35s ease';
          mediaEl.appendChild(fallback);
        }

        const hideFallback = () => {
          if (fallback) fallback.style.opacity = '0';
        };
        const showFallback = () => {
          if (fallback) fallback.style.opacity = '1';
        };

        const videos = mediaEl.querySelectorAll<HTMLVideoElement>('video');
        let anyLoaded = false;
        videos.forEach(v => {
          const onReady = () => {
            anyLoaded = true;
            hideFallback();
          };
          v.addEventListener('loadeddata', onReady);
          v.addEventListener('canplay', onReady);
          if (v.readyState >= 2) onReady();
        });

        // If nothing is ready shortly after mount, keep fallback visible.
        setTimeout(() => {
          if (!anyLoaded) showFallback();
        }, 1800);
      });
    }

    // Ensure split-hero is never blank while JS observers settle.
    root.querySelectorAll<HTMLElement>('split-hero').forEach(el => {
      el.classList.add('is-in-viewport');
    });

    // Inject inline script to register is-in-viewport toggling for every split-hero.
    // split-hero.js handles pinning/collapse but does NOT add is-in-viewport.
    // This script tag runs in the browser's main thread, immune to React re-renders.
    if (!document.getElementById('tpl12-viewport-script')) {
      const vs = document.createElement('script');
      vs.id = 'tpl12-viewport-script';
      vs.textContent = `(function(){
        var cv=function(){
          var els=document.querySelectorAll('split-hero');
          if(!els.length)return;
          els.forEach(function(el){
            var r=el.getBoundingClientRect();
            el.classList.toggle('is-in-viewport',r.top<window.innerHeight&&r.bottom>0);
          });
        };
        window.addEventListener('scroll',cv,{passive:true});
        window.addEventListener('resize',cv,{passive:true});
        setTimeout(cv,300);setTimeout(cv,1000);setTimeout(cv,3000);setTimeout(cv,6000);
        cv();
      })();`;
      document.body.appendChild(vs);
    }

    // Hide page-loader after 1.5s
    setTimeout(() => {
      const loader = root.querySelector('.page-loader');
      if (loader) loader.setAttribute('data-hidden', 'true');
    }, 1500);
  }, [bodyHtml]);

  /* ── Inject window.Shopify stub ── */
  useEffect(() => {
    if (!(window as any).Shopify) {
      (window as any).Shopify = {
        shop: 'k-me-store-2.myshopify.com',
        country: 'US',
        currency: 'USD',
        locale: 'es',
        theme: { name: 'Captured Theme', id: '7' },
        routes: { root_url: '/', cart_url: '/cart', search_url: '/productos' },
        customerAccountsEnabled: false,
      };
    }
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl12="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl12', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla12] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    // Load scripts sequentially
    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }
    })();

  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla12/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  if (!bodyHtml) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Cargando plantilla 12...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="tpl12-shopify-root template-index"
    />
  );
}
