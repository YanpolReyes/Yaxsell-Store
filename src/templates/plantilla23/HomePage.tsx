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
import { createPortal } from 'react-dom';
import RecentProductsSection from '@/components/RecentProductsSection';
import { getServices, getAppwriteConfig, CATEGORIES_COLLECTION, SUBCATEGORIES_COLLECTION, PRODUCTS_COLLECTION, TIMED_OFFERS_COLLECTION, Query, formatPrice } from '@/lib/appwrite';
import { Category, Subcategory, Product } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { isEditorMockEnabled } from '@/lib/editor-mock';
import { getTpl23MockData } from './mockData';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { resolveStorageImageUrl } from '@/lib/product-images';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';

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
  // cart-drawer.js removed — native script calls Shopify fetch() which crashes; React handles drawer instead
  // cart-quantity-selector.js removed — React handles qty updates
  // cart-recommended-product-form.js removed — React hydrates recommendations
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
  const { user } = useAuth();
  const router = useRouter();
  const { addItem, items: cartItems, subtotal: cartTotal, updateQuantity, removeItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [destacadoTemporal, setDestacadoTemporal] = useState<any>(null);
  const [packTimer, setPackTimer] = useState<any>(null);
  const [timedOffers, setTimedOffers] = useState<any[]>([]);
  const [isAppwriteLoaded, setIsAppwriteLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasPortalRoot, setHasPortalRoot] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // React countdown timer, Lottie, and Particles for the global timer pack
  useEffect(() => {
    if (!bodyHtml || !hasPortalRoot) return;
    const root = containerRef.current;
    if (!root) return;

    // 1. Timer Setup
    let targetTime = Date.now() + (3 * 24 * 3600) * 1000;
    try {
      const cached = localStorage.getItem('yaxsell_offers_timer_3d');
      if (cached) {
        const parsed = parseInt(cached);
        if (parsed > Date.now()) {
          targetTime = parsed;
        } else {
          localStorage.setItem('yaxsell_offers_timer_3d', targetTime.toString());
        }
      } else {
        localStorage.setItem('yaxsell_offers_timer_3d', targetTime.toString());
      }
    } catch (e) {
      console.error(e);
    }

    const updateDomTimer = () => {
      const dEl = root.querySelector('#yaxsell-days');
      const hEl = root.querySelector('#yaxsell-hours');
      const mEl = root.querySelector('#yaxsell-minutes');
      const sEl = root.querySelector('#yaxsell-seconds');

      const diff = targetTime - Date.now();
      if (diff <= 0) {
        if (dEl) dEl.textContent = '00';
        if (hEl) hEl.textContent = '00';
        if (mEl) mEl.textContent = '00';
        if (sEl) sEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (dEl) dEl.textContent = days.toString().padStart(2, '0');
      if (hEl) hEl.textContent = hours.toString().padStart(2, '0');
      if (mEl) mEl.textContent = minutes.toString().padStart(2, '0');
      if (sEl) sEl.textContent = seconds.toString().padStart(2, '0');
    };

    updateDomTimer();
    const timerId = setInterval(updateDomTimer, 1000);

    // 2. Lottie Initialization
    let lottieAnim: any = null;
    const lottieContainer = root.querySelector('#yaxsell-lottie-hourglass');
    if (lottieContainer) {
      import('lottie-web').then((lottieModule) => {
        lottieAnim = lottieModule.default.loadAnimation({
          container: lottieContainer as HTMLElement,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/lottie/offert.json'
        });
      }).catch((err) => {
        console.error('Error loading lottie-web:', err);
      });
    }

    // 3. Particle Canvas Setup
    const canvas = root.querySelector('#yaxsell-timer-particles') as HTMLCanvasElement;
    let animationFrameId: number;
    let resizeObserver: ResizeObserver | null = null;
    let onMouseMove: any = null;
    let onMouseLeave: any = null;
    let parentSection = canvas?.parentElement;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let width = (canvas.width = canvas.offsetWidth || canvas.clientWidth || 300);
        let height = (canvas.height = canvas.offsetHeight || canvas.clientHeight || 150);

        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            width = canvas.width = entry.contentRect.width;
            height = canvas.height = entry.contentRect.height;
          }
        });
        resizeObserver.observe(parentSection || canvas);

        class Particle {
          x: number = 0;
          y: number = 0;
          size: number = 0;
          baseSize: number = 0;
          speedY: number = 0;
          speedX: number = 0;
          opacity: number = 0;
          wobble: number = 0;
          wobbleSpeed: number = 0;
          sparkleSpeed: number = 0;

          constructor() {
            this.reset(true);
          }

          reset(initY = false) {
            this.x = Math.random() * width;
            this.y = initY ? Math.random() * height : height + 10;
            this.baseSize = Math.random() * 2.5 + 0.5;
            this.size = this.baseSize;
            this.speedY = -(Math.random() * 0.8 + 0.2);
            this.speedX = Math.random() * 0.2 - 0.1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.02 + 0.005;
            this.sparkleSpeed = Math.random() * 0.05 + 0.01;
          }

          update(mX: number, mY: number) {
            this.y += this.speedY;
            this.wobble += this.wobbleSpeed;
            this.x += this.speedX + Math.sin(this.wobble) * 0.25;

            this.opacity = Math.max(0.1, Math.min(0.9, this.opacity + Math.sin(Date.now() * this.sparkleSpeed * 0.1) * 0.02));

            const dx = this.x - mX;
            const dy = this.y - mY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const force = (100 - dist) / 100;
              const angle = Math.atan2(dy, dx);
              this.x += Math.cos(angle) * force * 2;
              this.y += Math.sin(angle) * force * 2;
            }

            if (this.y < -10 || this.x < -10 || this.x > width + 10) {
              this.reset(false);
            }
          }

          draw(c: CanvasRenderingContext2D) {
            c.beginPath();
            c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            c.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            c.shadowBlur = this.baseSize > 1.5 ? 8 : 0;
            c.shadowColor = '#ffffff';
            c.fill();
          }
        }

        const particles: Particle[] = Array.from({ length: 70 }, () => new Particle());

        let mouseX = -9999;
        let mouseY = -9999;

        onMouseMove = (e: MouseEvent) => {
          if (!parentSection) return;
          const rect = parentSection.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
        };
        onMouseLeave = () => {
          mouseX = -9999;
          mouseY = -9999;
        };

        if (parentSection) {
          parentSection.addEventListener('mousemove', onMouseMove);
          parentSection.addEventListener('mouseleave', onMouseLeave);
        }

        const animate = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.shadowBlur = 0;
          particles.forEach((p) => {
            p.update(mouseX, mouseY);
            p.draw(ctx);
          });
          animationFrameId = requestAnimationFrame(animate);
        };
        animate();
      }
    }

    return () => {
      clearInterval(timerId);
      if (lottieAnim) {
        lottieAnim.destroy();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (parentSection && onMouseMove && onMouseLeave) {
        parentSection.removeEventListener('mousemove', onMouseMove);
        parentSection.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [bodyHtml, hasPortalRoot]);


  /* 🪄🤖 Tabbed FAQ JS Logic 🤖🪄 */
  useEffect(() => {
    if (!bodyHtml || !containerRef.current) return;
    const root = containerRef.current;
    
    const handleFAQClicks = (e: any) => {
        const target = e.target;
        
        // Tab switching logic
        const tabBtn = target.closest('.kc-tab-btn');
        if (tabBtn) {
            const targetId = tabBtn.getAttribute('data-target');
            root.querySelectorAll('.kc-tab-btn').forEach((btn: any) => btn.classList.remove('active'));
            tabBtn.classList.add('active');
            
            root.querySelectorAll('.kc-faq-pane').forEach((pane: any) => pane.classList.remove('active'));
            const targetPane = document.getElementById(targetId || '');
            if (targetPane) targetPane.classList.add('active');
            return;
        }
        
        // Accordion logic
        const accordionBtn = target.closest('.kc-accordion-btn');
        if (accordionBtn) {
            const parent = accordionBtn.parentElement;
            const contentPane = accordionBtn.nextElementSibling;
            const isActive = parent.classList.contains('active');
            
            const currentPane = parent.closest('.kc-faq-pane');
            if (currentPane) {
                currentPane.querySelectorAll('.kc-accordion-item').forEach((item: any) => {
                    item.classList.remove('active');
                    const itemContent = item.querySelector('.kc-accordion-content');
                    if (itemContent) itemContent.style.display = 'none';
                });
            }
            if (!isActive) {
                parent.classList.add('active');
                contentPane.style.display = 'block';
            }
        }
    };
    root.addEventListener('click', handleFAQClicks);

    // Strip native Shopify listeners from cart close buttons so they don't intercept our custom logic
    const allCloseBtns = root.querySelectorAll('cart-drawer .button-close, cart-drawer .drawer__close');
    allCloseBtns.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode?.replaceChild(newBtn, btn);
    });

    const handleDrawerClose = (e: Event) => {
      const target = e.target as HTMLElement;
      // Only handle cart-drawer globally to avoid breaking Shopify native menu-drawer and search-drawer
      const clickedOutside = target.matches('cart-drawer') && !target.closest('.drawer__inner');
      const isCloseBtn = !!target.closest('cart-drawer .button-close, cart-drawer .drawer__close, cart-drawer [data-close]');
      
      if (isCloseBtn || clickedOutside) {
        const activeDrawers = document.querySelectorAll('cart-drawer');
        let closedAny = false;
        activeDrawers.forEach(drawer => {
          if (drawer.getAttribute('data-hidden') !== 'true' || drawer.classList.contains('active') || drawer.classList.contains('is-active') || drawer.hasAttribute('open')) {
            drawer.setAttribute('data-hidden', 'true');
            drawer.setAttribute('inert', '');
            drawer.classList.remove('active', 'is-active');
            drawer.removeAttribute('open');
            closedAny = true;
          }
        });
        if (closedAny) {
          e.preventDefault();
          e.stopPropagation();
          document.documentElement.style.overflow = '';
          document.body.classList.remove('overflow-hidden');
        }
      }
    };

    document.addEventListener('click', handleDrawerClose, true);
    document.addEventListener('touchstart', handleDrawerClose, { passive: false, capture: true });

    return () => {
       root.removeEventListener('click', handleFAQClicks);
       document.removeEventListener('click', handleDrawerClose, true);
       document.removeEventListener('touchstart', handleDrawerClose, { capture: true });
    };
  }, [bodyHtml]);

  /* ── Fetch categories, subcategories & products from Appwrite ── */
  useEffect(() => {
    const fetchData = async () => {
      if (isEditorMockEnabled()) {
        const mock = getTpl23MockData();
        setCategories(mock.categories);
        setSubcategories(mock.subcategories);
        setProducts(mock.products);
        return;
      }
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const [cRes, scRes, pRes, dtRes, ptRes, toRes] = await Promise.all([
          databases.listDocuments(databaseId, CATEGORIES_COLLECTION, [
            Query.orderAsc('order'),
            Query.limit(100)
          ]),
          databases.listDocuments(databaseId, SUBCATEGORIES_COLLECTION, [
            Query.limit(200)
          ]),
          databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
            Query.greaterThan('STOCK', 0),
            Query.orderDesc('SOLDQUANTITY'),
            Query.limit(500)
          ]),
          databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [
            Query.equal('offerType', 'destacado_temporal'),
            Query.equal('isActive', true),
            Query.limit(1)
          ]).catch(() => ({ documents: [] })),
          databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [
            Query.equal('offerType', 'pack_timer'),
            Query.equal('isActive', true),
            Query.limit(1)
          ]).catch(() => ({ documents: [] })),
          databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [
            Query.equal('offerType', 'product'),
            Query.equal('isActive', true),
            Query.equal('status', 'active'),
            Query.limit(5)
          ]).catch(() => ({ documents: [] }))
        ]);
        setCategories(cRes.documents as unknown as Category[]);
        setSubcategories(scRes.documents as unknown as Subcategory[]);
        setProducts(pRes.documents as unknown as Product[]);
        if (dtRes.documents && dtRes.documents.length > 0) {
          setDestacadoTemporal(dtRes.documents[0]);
        }
        if (ptRes.documents && ptRes.documents.length > 0) {
          setPackTimer(ptRes.documents[0]);
        }
        if (toRes.documents && toRes.documents.length > 0) {
          setTimedOffers(toRes.documents);
        }
      } catch (err) {
        console.error('[Plantilla23] Error fetching categories/subcategories/products:', err);
      } finally {
        setIsAppwriteLoaded(true);
      }
    };
    fetchData();
  }, []);

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

    // Precargar la imagen del hero para que aparezca instantáneamente
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/1780173022333-pegada-1780173016432.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=Sa3yaIOBQLI7MIR1zG81iSWWMToOKHSAOeEhhjZjS3KZIOtkOZWDvV4imyKt3Xg%2BZvUI7DfAxYvGYPZJsVuEJSgTW8PrcSO9gNNwoy%2BEUq9MxaYw0PVkw%2BQXoEJPCXyZKPOK%2F7Nwnk3mUsZFp0uqFJQ0FB8Zqg%2BeOkHzWOIngMIh96BkQRVqnS3ecsnGqPYZqDEqsidg9v3YIl%2FM7z71qwI3MGjfOL7TKfn45vcNV1vb4MgQr%2FhjOTL2OAzawTtlB2IQTbehko3RL2T7JIdkMQWtS9Gm2MsefoCeOexwuwv3nHOTluGGUHIj6ff3yLJ7Ec4RJJMoHZ7TJA1h%2FC9XDQ%3D%3D';
    preloadLink.id = 'tpl23-preload-hero';
    if (!document.getElementById('tpl23-preload-hero')) document.head.appendChild(preloadLink);

    return () => { 
      styleEl.remove(); 
      const pl = document.getElementById('tpl23-preload-hero');
      if (pl) pl.remove();
    };
  }, []);

  /* ── Load CSS files dynamically + split-hero overrides ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl23="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${href}?v=${Date.now()}`;
      link.setAttribute('data-tpl23', href);
      document.head.appendChild(link);
    });

    // ═══ CRITICAL OVERRIDES for split-hero (from plantilla8 docs) ═══
    const overrideStyle = document.createElement('style');
    overrideStyle.id = 'tpl23-overrides';
    overrideStyle.textContent = `
      /* FIX 1: filter:blur(0px) breaks position:fixed (CSS spec) */
      [style*="blur(0"] { filter: none !important; }

      /* FIX 2: Media column must start at 100vw, not 50% on desktop */
      @media (min-width: 768px) {
        .split-hero .split-hero-column.split-hero-column__media {
          min-width: 100vw !important;
          max-width: 100vw !important;
        }

        /* FIX 3: Collapsed state must be 50vw on desktop */
        .split-hero .split-hero-column__media.is-collapsed {
          min-width: 50vw !important;
          max-width: 50vw !important;
        }
      }

      @media (max-width: 767px) {
        /* Fix mobile video scroll blocking and object-fit */
        .split-hero video, .split-hero .split-hero__video {
          object-fit: cover !important;
          height: 100% !important;
          width: 100% !important;
          pointer-events: none !important; /* Allow scroll through video */
        }
        .split-hero-column__media {
          touch-action: pan-y !important; /* Allow vertical scroll */
        }
        
        /* Fix cards 'Tu ritual' / 'Dulce color' height showing skeleton */
        .multimedia-collage-block__inner, .multimedia-collage__block {
          height: 100% !important;
          min-height: 100% !important;
        }
        hover-zoom-image {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
        }
        hover-zoom-image img {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Fix category images cut off */
        collection-list img, .collection-list img {
          object-fit: cover !important;
          height: 100% !important;
          width: 100% !important;
        }

        /* Fix slideshow (Herobanner) background separating from text on mobile */
        .slideshow__background {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 0 !important;
        }
        .slideshow__content {
          z-index: 10 !important;
          position: relative !important;
          height: 100% !important;
          display: flex !important;
          align-items: flex-end !important; /* Push text to bottom over the image */
        }
        .slideshow video, .slideshow img {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
          touch-action: pan-y !important;
        }
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
      
      /* FIX 9.1: Prevent tap highlighting on mobile */
      * {
        -webkit-tap-highlight-color: transparent !important;
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


      /* Disable white logo filter brightness/invert during loading so the pink skeleton shows beautifully */
      .header img.logo:not(.is-loaded) {
        filter: none !important;
      }
      .header img.logo:not(.is-loaded)::after {
        content: "" !important;
        position: absolute !important;
        top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent) !important;
        transform: translateX(-100%) !important;
        animation: premiumShimmer 1.8s infinite !important;
        z-index: 50 !important;
      }

      /* Smooth reveal when loaded */
      .header img.logo.is-loaded {
        animation: premiumReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }

      /* Highlight word "CATÁLOGO" in menu to black */
      .header[data-id="sections--27304712208665__header"] .highlight {
        color: #000000 !important;
      }

      /* ═══ Responsive nav & elements: prevent menu items crowding at medium/small laptops (e.g. 1366x768) ═══ */

      /* CRITICAL: Force nav to stay on ONE LINE — no wrapping allowed.
         The ul has Tailwind "flex-wrap" class which causes items to drop
         to a 2nd row and overlap the hero heading text. */
      .menu-wrapper ul[data-tier="1"] {
        flex-wrap: nowrap !important;
        overflow: hidden !important;
      }

      /* [MODIFICACION YAXSEL]: Ajustes para pantallas laptops pequeñas (como 1366x768) hasta 1400px */
      @media (max-width: 1400px) {
        /* Reducir espaciado del menú de navegación */
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
        
        /* Reducir tamaño del logo para liberar espacio vertical y horizontal */
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
        
        /* Reducir tamaño de las acciones Buscar y Carrito en el header */
        .header .search-icon,
        .header .cart-icon {
          font-size: 12px !important;
        }

        /* --- Ajustes específicos de Hero Banner 1 --- */
        
        /* Reducir el tamaño de las letras del título gigante (La Selección Glow) */
        .slideshow .giant-heading,
        .slideshow .giant-heading span,
        .slideshow .giant-heading .highlighted-text {
          font-size: clamp(2rem, 3.8vw, 3.4rem) !important;
        }
        
        /* Reducir tamaño del texto descriptivo */
        .slideshow .body-text p,
        .slideshow .body-text span p {
          font-size: 0.95rem !important;
          line-height: 1.4 !important;
        }
        
        /* Reducir el padding vertical del contenedor del contenido del slideshow */
        .slideshow__content .custom-container {
          padding-top: 1rem !important;
          padding-bottom: 2rem !important;
        }
        
        /* Reducir paddings de espaciado del botón del slideshow para compactar verticalmente */
        .slideshow-block-button .custom-theme-block,
        .slideshow__content .button-block .custom-theme-block {
          --padding-bottom: 15px !important;
        }
      }

      /* [MODIFICACION YAXSEL]: Ajustes para pantallas medianamente pequeñas hasta 1200px */
      @media (max-width: 1200px) {
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

      /* [MODIFICACION YAXSEL]: Ajustes extremos antes de pasar a la vista móvil */
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
          transform-origin: left top !important;
          left: 0 !important;
          top: 88% !important;
          bottom: auto !important;
          border-radius: 0 0 8px 8px !important;
          animation: none !important;
          padding: 5px 10px !important;
          box-shadow: 0 2px 5px rgba(251, 202, 201, 0.4) !important;
          font-size: 11px !important;
        }
        .button-newsletter:hover, .button-newsletter:active {
          transform: rotate(-90deg) !important;
          box-shadow: 0 2px 5px rgba(251, 202, 201, 0.4) !important;
        }
        .button-newsletter .h6 {
          font-size: 11px !important;
        }
        .button-newsletter .button-close svg {
          width: 14px !important;
          height: 14px !important;
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

      /* Animación suave de transición para todo el header al scrollear */
      custom-header.header-element {
        transition: background 0.4s ease-in-out, 
                    background-color 0.4s ease-in-out, 
                    backdrop-filter 0.4s ease-in-out, 
                    -webkit-backdrop-filter 0.4s ease-in-out, 
                    box-shadow 0.4s ease-in-out,
                    transform 0.4s ease-in-out !important;
      }

      /* ── COMPACT HEADER & UTILITY BAR (MOVE NAVBAR HIGHER) ── */
      /* Hacer la barra de utilidad (utility-bar) súper delgada */
      utility-bar.header-element {
        min-height: 24px !important;
        --min-height: 24px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
        font-size: 11px !important;
      }
      utility-bar.header-element .custom-container {
        padding-top: 1px !important;
        padding-bottom: 1px !important;
      }
      utility-bar.header-element localization-form {
        margin-top: 0px !important;
        margin-bottom: 0px !important;
      }

      /* Reducir paddings internos del header para subir la barra y compactarla al máximo */
      custom-header.header-element {
        --top: 24px !important; /* Fuerza al header a estar pegado al utility-bar súper arriba */
        --utility-bar-gap: 0px !important;
        --announcement-bar-gap: 0px !important;
      }
      custom-header.header-element .py-3,
      custom-header.header-element .lg\:pt-5,
      custom-header.header-element .lg\:pb-2 {
        padding-top: 2px !important;
        padding-bottom: 2px !important;
      }
      custom-header.header-element .logo-wrapper {
        padding-top: 1px !important;
        padding-bottom: 1px !important;
      }

      /* Quitar la línea blanca de abajo de forma ultra agresiva en toda la sección del header */
      .section-header,
      .shopify-section,
      custom-header.header-element,
      custom-header.header-element *,
      .header,
      .header * {
        border-bottom: none !important;
        border-bottom-width: 0px !important;
        border-top: none !important;
        border-top-width: 0px !important;
        border-color: transparent !important;
        outline: none !important;
      }

      /* ── HERO BANNER CONTENT POSITION (LOWER IT) ── */
      /* Bajar el título, descripción y botón del slideshow para que no queden pegados arriba */
      @media (min-width: 1024px) {
        .slideshow__content .custom-container {
          padding-top: 140px !important; /* Desplaza el bloque hacia abajo en desktop */
        }
      }
      @media (max-width: 1023px) {
        .slideshow__content .custom-container {
          padding-top: 90px !important; /* Desplaza el bloque hacia abajo en mobile */
        }
      }

      /* ── HEADER THREE-STATE STYLING (GLASSMORPHISM ONLY ON SCROLLED STICKY) ── */
      /* Estado 1: Inicial / Fijo arriba (data-scroll="false") - Transparente puro, sin blur ni fondos */
      custom-header.header-element[data-scroll="false"],
      .header[data-id="sections--27304712208665__header"][data-scroll="false"] {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
      }

      /* Ocultar logo en móvil cuando no hay scroll y mostrarlo solo en el sticky (data-scroll="true") */
      @media (max-width: 1023px) {
        custom-header[data-scroll="false"] .logo-wrapper {
          display: none !important;
        }
        custom-header[data-scroll="true"] .logo-wrapper {
          display: block !important;
        }
      }

            /* ── NEWSLETTER POPUP: Never auto-open on mobile — only if user clicks button ── */
      /* On mobile the popup will only show when user taps the button-newsletter label */
      @media (max-width: 767px) {
        /* When popup opens (triggered by user), make it look nice and compact */
        newsletter-popup:not([data-hidden="true"]):not([data-auto-hidden="true"]) {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          left: 16px !important;
          bottom: 80px !important;
          right: 16px !important;
          width: auto !important;
          max-width: 340px !important;
          z-index: 999999 !important;
          transform: none !important;
        }
      }

      /* ── HIDE HEROBANNER PAGINATION AND ARROWS ── */
      .slideshow .swiper-pagination,
      .slideshow .button-previous,
      .slideshow .button-next,
      .slideshow .swiper-navigation-wrapper {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
      }

      /* ── DISABLE SLIDING/DRAGGING IN HEROBANNER ── */
      .slideshow .swiper-wrapper {
          pointer-events: none !important;
          touch-action: none !important;
      }
      .slideshow .slideshow__slide {
          pointer-events: auto !important;
      }

      /* ── MOBILE HERO BANNER: Remove description, add two buttons ── */
      @media (max-width: 767px) {
        /* Hide description text in hero banner */
        #shopify-block-AcVBhSWFiRHVuUkd6T__text_JfdEpN { display: none !important; }
        /* Make hero button smaller */
        #shopify-block-ANTBPMjNnaUZNbklXR__button_VKQi4f .custom-button { font-size: 12px !important; padding: 8px 18px !important; }

        /* Hide descriptions on multimedia collage cards */
        /* Manos Suaves description */
        #shopify-block-AYXpwUzZ2UjI3VEhCQ__text_99crGb { display: none !important; }
        /* Manos Suaves button smaller */
        #shopify-block-ASEtVbTFsdUJKUm1XV__button_yUjQqP .custom-button { font-size: 11px !important; padding: 6px 14px !important; }
        /* Tu Ritual Diario description */
        #shopify-block-Aa0hpRFd5WEFEbWEwV__text_mzj3iN { display: none !important; }
        /* Dulce Color description — will need to find its block ID, applying via parent */
        .multimedia-collage__block .text-block.shopify-block:not(:first-child) { display: none !important; }

        /* Videos: allow scroll through them */
        video { pointer-events: none !important; touch-action: pan-y !important; }

        /* Hero banner mobile: remove description */
        .slideshow .body-text { display: none !important; }

        /* Hide Navbar1 top section and overlays on mobile, keep ONLY bottom mobile nav */
        .tpl1-nav { display: none !important; }
        .tpl1-nav-mobile-overlay { display: none !important; }

        /* Center "Poderosamente Bella" title horizontally on mobile */
        #shopify-block-AWVVEUzRxSzlKZnpON__giant_heading_3cqAMy,
        #shopify-block-AWVVEUzRxSzlKZnpON__giant_heading_3cqAMy giant-heading,
        #shopify-block-AWVVEUzRxSzlKZnpON__giant_heading_3cqAMy h2 {
          text-align: center !important;
          justify-content: center !important;
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
        }
        #shopify-block-AWVVEUzRxSzlKZnpON__giant_heading_3cqAMy h2 span {
          width: 100% !important;
          text-align: center !important;
        }
      }

      /* Globally hide Navbar1 top sections for Plantilla 23 */
      .tpl1-nav { display: none !important; }
      .tpl1-nav-mobile-overlay { display: none !important; }

      /* ── MANOS SUAVES BLOCK CUSTOM LAYOUT ── */
      [data-block-id="AMXRRQ2RsU3J0dWQzY__multimedia_collage_image_block_hThbgy"] .multimedia-collage-block__inner {
        position: relative !important;
      }
      [data-block-id="AMXRRQ2RsU3J0dWQzY__multimedia_collage_image_block_hThbgy"] .multimedia-collage__content {
        position: absolute !important;
        inset: 0 !important;
        display: block !important;
      }
      [data-block-id="AMXRRQ2RsU3J0dWQzY__multimedia_collage_image_block_hThbgy"] .multimedia-collage__content > div {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        padding: 24px !important;
        box-sizing: border-box !important;
      }
      #shopify-block-AMDN1ejVZUHhhRDZEd__heading_UErC4k {
        position: absolute !important;
        top: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 100% !important;
        text-align: center !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #shopify-block-AMDN1ejVZUHhhRDZEd__heading_UErC4k h5 {
        text-align: center !important;
        display: inline-block !important;
      }
      #shopify-block-AYXpwUzZ2UjI3VEhCQ__text_99crGb {
        position: absolute !important;
        top: 65px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: calc(100% - 48px) !important;
        text-align: center !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #shopify-block-ASEtVbTFsdUJKUm1XV__button_yUjQqP {
        position: absolute !important;
        bottom: 24px !important;
        left: 24px !important;
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
      }
      #shopify-block-ASEtVbTFsdUJKUm1XV__button_yUjQqP .custom-theme-block {
        padding: 0 !important;
        width: auto !important;
      }
      #shopify-block-ASEtVbTFsdUJKUm1XV__button_yUjQqP .custom-button {
        width: auto !important;
        display: inline-flex !important;
        padding-left: 24px !important;
        padding-right: 24px !important;
      }

      /* Adjust bottom spacing for Manos Suaves button on mobile */
      @media (max-width: 767px) {
        #shopify-block-ASEtVbTFsdUJKUm1XV__button_yUjQqP {
          bottom: 16px !important;
          left: 16px !important;
        }
      }

      /* ── FORCE LIVE SHOPPING RECENT PRODUCTS SECTION BACKGROUND TO PURE WHITE ── */
      #recent-products-portal-root,
      #recent-products-portal-root section {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }

/* Estado 3: Navbar final scrolled (data-scroll="true") - Glassmorphism sutil y elegante, sin línea blanca abajo */
      custom-header.header-element[data-scroll="true"],
      .header[data-id="sections--27304712208665__header"][data-scroll="true"] {
        background: rgba(253, 242, 248, 0.72) !important;
        background-color: rgba(253, 242, 248, 0.72) !important;
        background-image: none !important;
        backdrop-filter: blur(12px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(12px) saturate(140%) !important;
        border: none !important;
        border-bottom: none !important;
        box-shadow: 0 4px 20px -2px rgba(227, 150, 191, 0.12) !important;
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
    if (!bodyHtml || !containerRef.current || !isAppwriteLoaded) return;
    if (containerRef.current.dataset.htmlSet) return;

    // Parse HTML string to DOM nodes in memory
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHtml;

    // Hydrate Categories
    tempDiv.querySelectorAll('.collection-list-grid').forEach(wrapper => {
      if (categories.length === 0) return;
      const html = categories.slice(0, 10).map((cat: any) => `
        <div class="grid__item scroll-trigger animate--slide-in" data-cascade="" style="--animation-order: 1;" data-cascade-done="1">
          <a href="/colecciones/${cat.slug}" class="card-wrapper w-full block bg-white rounded-xl overflow-hidden" style="-webkit-tap-highlight-color: transparent;">
             <div class="card__inner relative w-full pt-[100%] rounded-xl overflow-hidden">
                <img src="${cat.BACKGROUND_IMAGE_URL || cat.iconUrl || ''}" alt="${cat.name}" class="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300">
             </div>
             <div class="card__content pt-3 pb-2 px-1 text-center">
                 <h3 class="card__heading text-[12px] font-semibold text-gray-800 leading-tight">${cat.name}</h3>
             </div>
          </a>
        </div>
      `).join('');
      wrapper.innerHTML = html;
      wrapper.classList.remove('slider');
    });

    // Hydrate Subcategories
    tempDiv.querySelectorAll('.subcategories-pill-list').forEach(wrapper => {
      if (subcategories.length === 0) return;
      const html = subcategories.map((sub: any) => `
        <a href="/colecciones/sub/${sub.slug}" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors" style="-webkit-tap-highlight-color: transparent;">
          ${sub.name}
        </a>
      `).join('');
      wrapper.innerHTML = html;
    });

    if (categories.length > 0) {
      // Find Swiper wrapper inside collection-list
      const swiperWrapper = tempDiv.querySelector('.collection-list .swiper-wrapper');
      const swiperContainer = tempDiv.querySelector('.collection-list .swiper-container');
      if (swiperWrapper) {
        swiperWrapper.innerHTML = ''; // Clear hardcoded slides

        categories.forEach((cat, index) => {
          const slide = document.createElement('div');
          slide.className = `swiper-slide w-full h-auto animation-delay-${(index + 1) * 100} animation-element fade-in`;

          // Fallback image handling
          const categoryImg = (cat as any).BACKGROUND_IMAGE_URL || cat.iconUrl || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';

          const cleanName = cat.name.replace(/\s*\(\d+\)$/, '').trim();

          slide.innerHTML = `
  <div class="collection-card overflow-hidden h-full border-current relative w-full fade-in animation-element animation-delay-0">
      <a href="/productos?categoria=${cat.$id}" aria-label="${cleanName}" title="${cleanName}" class="link link-image hover-only block">
          <div class="collection-card__image-wrapper relative overflow-hidden hover-zoom-image-wrapper" data-ratio="square">
              <div class="collection-card__image w-full h-full absolute top-0 left-0 transition-all duration-300 ease-in-out transform img-blur placeholder" style="background-color: #FBCAC9;">
                  <hover-zoom-image class="w-full h-full">
                      <img src="${categoryImg}" alt="${cleanName}" loading="lazy" sizes="100vw" class="object-cover w-full h-full pointer-events-none">
                  </hover-zoom-image>
              </div>
              <div class="overlay absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out"></div>
          </div>
      </a>
      <div class="collection-card__content z-10">
          <a href="/productos?categoria=${cat.$id}" title="${cleanName}" aria-label="${cleanName}" class="transition-all duration-300 ease-in-out h-full w-full link">
              <div class="py-5 pr-2 relative">
                  <h6 class="heading transition-all duration-100 ease-in-out">
                      <span class="link-hover-animation">${cleanName}</span>
                  </h6>
              </div>
          </a>
      </div>
  </div>
          `;
          swiperWrapper.appendChild(slide);
        });
      }

      if (swiperContainer) {
        // Synchronize Swiper total item count
        swiperContainer.setAttribute('data-items-total', String(categories.length));
      }
    }

    // Find the category section container to insert the recent products portal root below it
    const colListSection = tempDiv.querySelector('#shopify-section-template--27304712470809__collection_list_slider_YAxwGw') || tempDiv.querySelector('.collection-list')?.closest('.shopify-section');
    if (colListSection) {
      const portalRoot = document.createElement('div');
      portalRoot.id = 'recent-products-portal-root';
      colListSection.parentNode?.insertBefore(portalRoot, colListSection.nextSibling);
    }

    // Populate the global pack timed offers carousel / grid
    const carouselPlaceholder = tempDiv.querySelector('#yaxsell-homepage-offers-carousel');
    if (carouselPlaceholder && timedOffers.length > 0) {
      const cardsHtml = timedOffers.map(offer => {
        const originalPrice = formatPrice(offer.originalPrice);
        const discountPrice = formatPrice(offer.discountPrice);
        const discountPercentage = offer.discountPercentage;
        const productName = offer.productName;
        const imgUrl = offer.customImagePath || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
        const targetUrl = offer.targetId ? `/productos/${offer.targetId}` : '#';

        return `
          <div style="background: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 16px; width: calc(50% - 10px); display: flex; flex-direction: column; gap: 12px; transition: transform 0.3s ease, box-shadow 0.3s ease; box-sizing: border-box;" class="offer-card-hover hover:scale-[1.02] hover:shadow-lg">
            <a href="${targetUrl}" style="text-decoration: none; color: inherit; display: block; position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #fdf2f8;">
              <img src="${imgUrl}" alt="${productName}" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 8px; left: 8px; background: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 8px;">
                -${discountPercentage}%
              </div>
            </a>
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
              <a href="${targetUrl}" style="text-decoration: none; color: #1f2937; font-size: 13px; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">
                ${productName}
              </a>
              <div style="display: flex; align-items: baseline; gap: 6px; margin-top: 4px;">
                <span style="font-size: 16px; font-weight: 800; color: #db2777;">${discountPrice}</span>
                <span style="font-size: 12px; color: #9ca3af; text-decoration: line-through;">${originalPrice}</span>
              </div>
            </div>
            <a href="${targetUrl}" style="text-decoration: none; display: block; text-align: center; background: #db2777; color: #ffffff; font-size: 12px; font-weight: 800; padding: 10px 14px; border-radius: 12px; margin-top: auto; transition: background 0.2s ease;">
              Ver Oferta
            </a>
          </div>
        `;
      }).join('');

      carouselPlaceholder.innerHTML = `
        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1200px; margin-bottom: 30px; padding: 0 10px; box-sizing: border-box;">
          ${cardsHtml}
        </div>
        <a href="/productos?ofertas=true" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; background: #ffffff; border: 2px solid #db2777; color: #db2777; font-size: 14px; font-weight: 800; padding: 12px 30px; border-radius: 999px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(219, 39, 119, 0.1);" class="ver-ofertas-btn">
          Ver todas las ofertas
        </a>
      `;
    }

    containerRef.current.innerHTML = tempDiv.innerHTML;
    containerRef.current.dataset.htmlSet = '1';
    setHasPortalRoot(true);

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
    const isMobile = window.innerWidth < 1024;
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.dataset.isIntersecting = "true";
          const isCollageVideo = video.classList.contains('ping-pong-video') || 
                                 video.classList.contains('ping-pong-forward') || 
                                 video.classList.contains('ping-pong-reverse') ||
                                 video.querySelector('source[src*="therea.mp4"]') || 
                                 video.querySelector('source[src*="rever.mp4"]') ||
                                 (video.src && (video.src.includes('therea.mp4') || video.src.includes('rever.mp4')));
          
          // En móvil (no hay hover), auto-reproducir incluso los videos de collage
          if (!isCollageVideo || isMobile) {
            // Ensure loop on mobile so video repeats while visible
            if (isMobile) video.loop = true;
            video.play().catch(() => {});
          }
        } else {
          video.dataset.isIntersecting = "false";
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    root.querySelectorAll('video').forEach(video => {
      // Skip our custom hero videos — they are managed entirely by the inline HTML scripts
      const videoId = video.id;
      if (videoId === 'hero1-video-desktop' || videoId === 'hero1-video-mobile') return;

      // Exclude slideshow/hero and split-hero videos from preload="none" and disabling autoplay
      const isHeroVideo = video.closest('.slideshow') || video.closest('split-hero') || video.closest('.split-hero');
      if (isHeroVideo) {
        video.preload = 'auto';
        video.setAttribute('autoplay', 'autoplay');
        return;
      }
      // Remove autoplay so we control playback via observer for secondary videos
      video.removeAttribute('autoplay');
      video.preload = 'none';
      videoObserver.observe(video);
    });

    // Sweep slideshow videos and add robust listener to hide fallback images when they play
    root.querySelectorAll('.slideshow video, split-hero video, .split-hero video').forEach(vid => {
      const video = vid as HTMLVideoElement;
      const hideFallback = () => {
        if (!video.closest('.slideshow')) return;
        video.style.setProperty('z-index', '6', 'important');
      };
      video.addEventListener('playing', hideFallback);
      if (video.currentTime > 0 && !video.paused) {
        hideFallback();
      }
    });

    // ═══ HERO VIDEO INIT (runs here because <script> inside innerHTML doesn't execute) ═══
    const initHeroVideos = () => {
      // ── Desktop ──
      const vidDesktop = root.querySelector('#hero1-video-desktop') as HTMLVideoElement | null;
      const imgDesktop = root.querySelector('#hero1-image-desktop') as HTMLElement | null;
      if (vidDesktop) {
        let isFrozen = false;
        vidDesktop.addEventListener('playing', function onDesktopPlay() {
          vidDesktop.style.opacity = '1';
          vidDesktop.style.transform = 'scale(1)';
          if (imgDesktop) imgDesktop.style.opacity = '0';
          vidDesktop.removeEventListener('playing', onDesktopPlay);
        });
        vidDesktop.addEventListener('timeupdate', () => {
          if (!isFrozen && vidDesktop.duration && vidDesktop.currentTime >= vidDesktop.duration - 0.1) {
            vidDesktop.pause();
            isFrozen = true;
          }
        });
        vidDesktop.play().catch(() => {});
      }

      // ── Mobile ──
      const vidMobile = root.querySelector('#hero1-video-mobile') as HTMLVideoElement | null;
      const imgMobile = root.querySelector('#hero1-image-mobile') as HTMLElement | null;
      if (vidMobile && imgMobile) {
        const fadeOutImg = () => {
          vidMobile.style.opacity = '1';
          imgMobile.style.opacity = '0';
        };
        vidMobile.addEventListener('playing', fadeOutImg, { once: true });
        vidMobile.addEventListener('canplay', () => {
          if (!vidMobile.paused) fadeOutImg();
        }, { once: true });
        vidMobile.play().catch(() => {});
      }
    };
    initHeroVideos();
    // Also retry after 500ms in case preload=auto hasn't buffered yet
    setTimeout(initHeroVideos, 500);

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
      if (slide.querySelector('video')) {
        swiperObserver.observe(slide, { attributes: true, attributeFilter: ['class'] });
        // Re-trigger active ones on load
        if (slide.classList.contains('swiper-slide-active')) {
          slide.querySelectorAll('video').forEach(v => {
            v.currentTime = 0;
            v.play().catch(() => {});
          });
        }
      }
    });

    // ═══ HeroBanner 1: Smooth JS-driven fade-in on initial load ═══
    // Uses rAF + transition to bypass CSS !important conflicts reliably.
    setTimeout(() => {
      const firstSlide = root.querySelector('.swiper-slide');
      if (firstSlide) {
        firstSlide.querySelectorAll('video').forEach(vid => {
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

    // ═══ DISABLE HEROBANNER SWIPER COMPLETELY (no drag, no swipe, no auto) ═══
    const disableHeroSwiper = () => {
      const heroSwiperEl = root.querySelector('custom-slideshow .swiper-container, custom-slideshow parallax-element-section .swiper-container') as HTMLElement | null;
      if (heroSwiperEl) {
        // @ts-ignore
        const swiperInstance = (heroSwiperEl as any).swiper;
        if (swiperInstance) {
          try {
            swiperInstance.allowTouchMove = false;
            swiperInstance.allowSlidePrev = false;
            swiperInstance.allowSlideNext = false;
            swiperInstance.autoplay?.stop?.();
            swiperInstance.disable?.();
            // Also remove any touch/mouse event listeners by cloning the wrapper
            const wrapper = heroSwiperEl.querySelector('.swiper-wrapper') as HTMLElement;
            if (wrapper) {
              wrapper.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
              wrapper.style.setProperty('transition-duration', '0ms', 'important');
            }
          } catch(e) { /* ignore */ }
        }
        // Belt-and-suspenders: prevent all pointer/touch events on the swiper itself
        heroSwiperEl.style.setProperty('touch-action', 'pan-y', 'important');
        heroSwiperEl.style.setProperty('user-select', 'none', 'important');
        // Override the swiper-container data to disable init
        heroSwiperEl.setAttribute('data-enabled', 'false');
      }
    };
    // Try immediately, then retry after JS loads
    disableHeroSwiper();
    setTimeout(disableHeroSwiper, 500);
    setTimeout(disableHeroSwiper, 1500);
    setTimeout(disableHeroSwiper, 3000);

    // ═══ NEWSLETTER POPUP ON MOBILE: Never auto-open, only on user tap ═══
    // On mobile, always keep the popup closed unless the user explicitly opens it.
    if (window.matchMedia('(max-width: 767px)').matches) {
      const preventAutoPopup = () => {
        const popup = document.querySelector('newsletter-popup') as HTMLElement | null;
        if (!popup) return;
        // Mark the popup as auto-hidden so CSS doesn't force it open
        popup.setAttribute('data-auto-hidden', 'true');
        popup.setAttribute('data-hidden', 'true');
        popup.setAttribute('inert', '');
        popup.style.setProperty('display', 'none', 'important');
        popup.style.setProperty('visibility', 'hidden', 'important');
      };
      preventAutoPopup();
      // Watch for the popup to be auto-triggered and block it
      const popupEl = document.querySelector('newsletter-popup') as HTMLElement | null;
      if (popupEl) {
        const popupMutObs = new MutationObserver(() => {
          // Only allow display if user manually opened it (removed data-auto-hidden)
          if (popupEl.getAttribute('data-auto-hidden') === 'true') {
            let needsUpdate = false;
            if (popupEl.getAttribute('data-hidden') !== 'true') needsUpdate = true;
            if (!popupEl.hasAttribute('inert')) needsUpdate = true;
            if (popupEl.style.display !== 'none') needsUpdate = true;
            
            if (needsUpdate) {
              popupMutObs.disconnect(); // prevent infinite loop
              popupEl.setAttribute('data-hidden', 'true');
              popupEl.setAttribute('inert', '');
              popupEl.style.setProperty('display', 'none', 'important');
              popupMutObs.observe(popupEl, { attributes: true, attributeFilter: ['data-hidden', 'inert', 'style'] });
            }
          }
        });
        popupMutObs.observe(popupEl, { attributes: true, attributeFilter: ['data-hidden', 'inert', 'style'] });
      }

      // When user clicks the button-newsletter label, allow the popup to open
      const btnNewsletter = document.querySelector('.button-newsletter') as HTMLElement | null;
      if (btnNewsletter) {
        btnNewsletter.addEventListener('click', () => {
          const popup = document.querySelector('newsletter-popup') as HTMLElement | null;
          if (popup) {
            popup.removeAttribute('data-auto-hidden');
            popup.removeAttribute('data-hidden');
            popup.removeAttribute('inert');
            popup.style.removeProperty('display');
            popup.style.removeProperty('visibility');
          }
        });
      }

      // Prevent auto-open after scripts load
      setTimeout(preventAutoPopup, 1500);
      setTimeout(preventAutoPopup, 3000);
    }

    // ═══ MOBILE HERO: Replace single button with two buttons (Tienda + Catálogo) ═══
    const injectMobileHeroButtons = () => {
      const heroButtonBlock = root.querySelector('#shopify-block-ANTBPMjNnaUZNbklXR__button_VKQi4f .custom-theme-block') as HTMLElement | null;
      if (!heroButtonBlock || heroButtonBlock.dataset.mobileBtnsInjected) return;
      heroButtonBlock.dataset.mobileBtnsInjected = '1';
      const originalHtml = heroButtonBlock.innerHTML;
      heroButtonBlock.innerHTML = `
        <div class="md:hidden" style="display:flex; gap:12px; padding: 15px 0 40px; justify-content:center; width: 100%;">
          <a href="/productos" role="button" style="
            flex: 1; max-width: 160px;
            display:inline-flex; align-items:center; justify-content:center;
            padding: 14px 20px; border-radius:30px;
            background: #111827; 
            color: #ffffff; font-weight:800; font-size:14px; text-transform:uppercase;
            text-decoration:none; 
            box-shadow: 0 10px 25px -5px rgba(17, 24, 39, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;
            letter-spacing:1px; border:none; white-space:nowrap;
          ">Tienda</a>
          <a href="/catalogo" role="button" style="
            flex: 1; max-width: 160px;
            display:inline-flex; align-items:center; justify-content:center;
            padding: 14px 20px; border-radius:30px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            color:#111827; font-weight:800; font-size:14px; text-transform:uppercase;
            text-decoration:none; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05) inset;
            letter-spacing:1px; border:none; white-space:nowrap;
          ">Catálogo</a>
        </div>
        <div class="hidden md:block">
          ${originalHtml}
        </div>
      `;
    };
    injectMobileHeroButtons();
    setTimeout(injectMobileHeroButtons, 800);
    setTimeout(injectMobileHeroButtons, 2000);

  }, [bodyHtml, categories, isAppwriteLoaded, timedOffers]);

  /* ── Wire "Iniciar Sesión" button to auth popup (same style as plantilla1) ── */
  useEffect(() => {
    if (!containerRef.current || !containerRef.current.dataset.htmlSet) return;

    const root = containerRef.current;
    const loginLink = root.querySelector('li[data-type="account"] a');
    if (!loginLink || (loginLink as HTMLElement).dataset.authWired) return;
    (loginLink as HTMLElement).dataset.authWired = '1';

    // Ensure keyframes style
    const ensureKeyframes = () => {
      if (document.getElementById('tpl23-auth-keyframes')) return;
      const ks = document.createElement('style');
      ks.id = 'tpl23-auth-keyframes';
      ks.textContent =
        '@keyframes tpl1AuthIn{from{opacity:0;transform:translateY(-12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}' +
        '@keyframes tpl1AuthSheetIn{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(ks);
    };

    const layoutPanel = (anchor: HTMLElement, popup: HTMLElement, panelWidth = 340) => {
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      const pad = 12;
      popup.classList.add('yaxsel-user-panel');
      if (mobile) {
        popup.style.top = 'auto';
        popup.style.bottom = '0';
        popup.style.left = `${pad}px`;
        popup.style.right = `${pad}px`;
        popup.style.width = 'auto';
        popup.style.maxWidth = 'none';
        popup.style.maxHeight = 'min(92dvh, calc(100vh - env(safe-area-inset-top, 0px) - 16px))';
        popup.style.overflowY = 'auto';
        popup.style.borderRadius = '20px 20px 0 0';
        popup.style.transform = 'none';
        popup.style.animation = 'tpl1AuthSheetIn .32s cubic-bezier(0.16,1,0.3,1)';
        return;
      }
      popup.style.animation = 'tpl1AuthIn .3s cubic-bezier(0.16,1,0.3,1)';
      popup.style.bottom = 'auto';
      popup.style.width = `${panelWidth}px`;
      popup.style.left = 'auto';
      popup.style.maxHeight = `${window.innerHeight - pad * 2}px`;
      popup.style.overflowY = 'auto';
      popup.style.borderRadius = panelWidth >= 340 ? '24px' : '20px';
      popup.style.transform = 'none';
      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 14;
      const place = () => {
        const pw = popup.offsetWidth;
        const top = Math.min(rect.bottom + gap, vh - pad - 80);
        let right = Math.max(pad, vw - rect.right);
        const left = vw - right - pw;
        if (left < pad) right = Math.max(pad, vw - pw - pad);
        popup.style.top = `${top}px`;
        popup.style.right = `${right}px`;
        popup.style.maxHeight = `${Math.max(160, vh - top - pad)}px`;
      };
      requestAnimationFrame(place);
    };

    let authPopupEl: HTMLDivElement | null = null;
    let authOverlayEl: HTMLDivElement | null = null;
    let authPopupJustOpened = false;

    const closeAuthPopup = () => {
      if (authPopupEl) { authPopupEl.remove(); authPopupEl = null; }
      if (authOverlayEl) { authOverlayEl.style.opacity = '0'; authOverlayEl.style.pointerEvents = 'none'; }
      document.body.classList.remove('cart-drawer-open', 'overflow-hidden');
      document.body.style.overflow = '';
      authPopupJustOpened = false;
    };

    const toggleAuthPopup = (anchor: HTMLElement) => {
      if (authPopupEl) { closeAuthPopup(); return; }
      authPopupJustOpened = true;

      if (!authOverlayEl) {
        authOverlayEl = document.createElement('div');
        authOverlayEl.id = 'yaxsel-auth-overlay';
        authOverlayEl.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity 0.3s ease;';
        document.body.appendChild(authOverlayEl);
      }
      authOverlayEl.style.opacity = '1';
      authOverlayEl.style.pointerEvents = 'auto';
      document.body.classList.add('cart-drawer-open', 'overflow-hidden');
      document.body.style.overflow = 'hidden';

      const popup = document.createElement('div');
      popup.id = 'yaxsel-auth-popup';
      popup.style.cssText = 'position:fixed;z-index:10002;width:340px;background:#fff;border-radius:24px;box-shadow:0 8px 30px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.04);border:1px solid #f0f0f0;overflow:hidden;animation:tpl1AuthIn .3s cubic-bezier(0.16,1,0.3,1);font-family:"DM Sans",system-ui,sans-serif;';
      popup.innerHTML = `
        <button id="yaxsel-auth-close" type="button" aria-label="Cerrar" style="position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;border:none;background:#f3f4f6;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;z-index:2;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3L11 11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
        <div style="padding:32px 24px 28px;text-align:center;background:rgba(255,255,255,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:24px;">
          <div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,#fdf2f8,#fbcfe8);display:flex;align-items:center;justify-content:center;color:#db2777;box-shadow:0 8px 20px rgba(219,39,119,0.15); border: 2px solid #fce7f3;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p style="font-size:20px;font-weight:800;color:#1f2937;margin:0 0 8px;letter-spacing:-0.02em;">¡Hola, Belleza!</p>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">Ingresa o regístrate para acceder a ofertas exclusivas y realizar pedidos.</p>
          <a href="/login" id="yaxsel-auth-login-btn" style="display:block;width:100%;padding:14px;background:linear-gradient(135deg,#f9a8d4,#f472b6);color:#fff;border:none;border-radius:16px;font-size:15px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;box-shadow:0 8px 20px rgba(244,114,182,0.3);margin-bottom:12px;transition:all 0.3s ease;">Iniciar sesión</a>
          <a href="/login?tab=register" style="display:block;width:100%;padding:14px;background:rgba(253,242,248,0.8);color:#db2777;border:1px solid #fbcfe8;border-radius:16px;font-size:15px;font-weight:700;text-align:center;text-decoration:none;transition:all 0.3s ease;">Crear cuenta nueva</a>
        </div>
      `;

      document.body.appendChild(popup);
      authPopupEl = popup;
      ensureKeyframes();
      layoutPanel(anchor, popup, 340);

      const closeBtn = popup.querySelector('#yaxsel-auth-close') as HTMLElement | null;
      if (closeBtn) {
        closeBtn.addEventListener('click', () => { closeAuthPopup(); });
        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = '#fce7f3'; closeBtn.style.color = '#ec4899'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = '#f3f4f6'; closeBtn.style.color = '#666'; });
      }

      if (authOverlayEl) {
        authOverlayEl.onclick = () => {
          if (authPopupJustOpened) { authPopupJustOpened = false; return; }
          closeAuthPopup();
        };
      }

      const loginBtn = popup.querySelector('#yaxsel-auth-login-btn') as HTMLElement | null;
      if (loginBtn) {
        loginBtn.addEventListener('mouseenter', () => { loginBtn.style.transform = 'translateY(-2px)'; loginBtn.style.boxShadow = '0 8px 32px rgba(244,114,182,0.4)'; });
        loginBtn.addEventListener('mouseleave', () => { loginBtn.style.transform = ''; loginBtn.style.boxShadow = '0 8px 20px rgba(244,114,182,0.3)'; });
      }

      if (!window.matchMedia('(max-width: 768px)').matches) {
        const onOutside = (ev: MouseEvent) => {
          if (!popup.contains(ev.target as Node) && !anchor.contains(ev.target as Node)) {
            closeAuthPopup();
            document.removeEventListener('mousedown', onOutside);
          }
        };
        setTimeout(() => document.addEventListener('mousedown', onOutside), 0);
      }
    };

    // Override the Shopify link behavior
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleAuthPopup(loginLink as HTMLElement);
    });
  }, [bodyHtml, user]);

  /* ── INJECT DYNAMIC CATEGORIES INTO NAVBAR MEGAMENU (separate effect) ── */
  useEffect(() => {
    if (!containerRef.current || !containerRef.current.dataset.htmlSet) return;
    if (categories.length === 0 || subcategories.length === 0) return;
    if (containerRef.current.dataset.navInjected) return;

    const root = containerRef.current;

    // ── Compute product counts per category and subcategory ──
    const catProductCount: Record<string, number> = {};
    const subProductCount: Record<string, number> = {};
    const catProducts: Record<string, Product[]> = {};
    const subProducts: Record<string, Product[]> = {};

    products.forEach(p => {
      const cid = p.CATEGORYID || '';
      const sid = p.SUBCATEGORYID || '';
      catProductCount[cid] = (catProductCount[cid] || 0) + 1;
      if (sid) subProductCount[sid] = (subProductCount[sid] || 0) + 1;
      if (!catProducts[cid]) catProducts[cid] = [];
      catProducts[cid].push(p);
      if (sid) {
        if (!subProducts[sid]) subProducts[sid] = [];
        subProducts[sid].push(p);
      }
    });

    // Sort categories by product count (most products first) and pick top 4
    const sortedCats = [...categories]
      .filter(cat => (catProductCount[cat.$id] || 0) > 0)
      .map(cat => ({
        ...cat,
        prodCount: catProductCount[cat.$id] || 0
      }))
      .sort((a, b) => b.prodCount - a.prodCount)
      .slice(0, 4);

    // ── Desktop menu ──
    const desktopMenu = root.querySelector('ul.menu[data-tier="1"]:not(.menu--drawer)');
    if (desktopMenu) {
      desktopMenu.innerHTML = '';

      sortedCats.forEach((cat, idx) => {
        const megamenuId = `megamenu-dynamic-${idx}`;
        const catProdCount = cat.prodCount;

        // Sort subcategories by product count (most first)
        const catSubs = subcategories
          .filter(sc => sc.categoryId === cat.$id)
          .map(sc => ({ ...sc, prodCount: subProductCount[sc.$id] || 0 }))
          .filter(sc => sc.prodCount > 0)
          .sort((a, b) => b.prodCount - a.prodCount);

        const navLi = document.createElement('li');
        navLi.className = 'inline-block group py-2 px-1 shrink-0 no-keyboard-focus';
        navLi.innerHTML = `
          <a href="javascript:void(0)" title="${cat.name}" aria-label="${cat.name}"
              data-action="hover"
              data-id="${megamenuId}"
              class="flex items-center no-keyboard-focus"
              data-menu-tier="1"
          >
              <span class="link-hover-animation">${cat.name} <span style="opacity:0.5;font-size:0.85em">(${catProdCount})</span></span>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[18px]">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
          </a>
        `;

        // ── Megamenu <template> (must be SIBLING of <li>, not child) ──
        const templateEl = document.createElement('template');
        templateEl.id = megamenuId;

        // Left column: subcategories with product counts
        let subsHtml = '';
        catSubs.forEach((sub, subIdx) => {
          const subHandle = `cat${idx}-sub${subIdx}`;
          const isActive = subIdx === 0 ? 'true' : 'false';
          subsHtml += `
            <li
                data-active="${isActive}"
                class="py-2 px-2 flex justify-between items-center link-hover cursor-pointer"
                data-link-handle="${subHandle}"
                tabindex="0"
            >
                <span class="link-hover-animation">${sub.name} <span style="opacity:0.5;font-size:0.85em">(${sub.prodCount})</span></span>
                <span class="rotate-[270deg]"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[18px]">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg></span>
            </li>
          `;
        });

        // Right column: product carousel per subcategory — show 4 products max
        let grandchildHtml = '';
        catSubs.forEach((sub, subIdx) => {
          const subHandle = `cat${idx}-sub${subIdx}`;
          const subLink = `/productos?categoria=${encodeURIComponent(cat.name)}&subcategoria=${encodeURIComponent(sub.name)}`;
          const isHidden = subIdx === 0 ? 'false' : 'true';
          const inertAttr = subIdx === 0 ? '' : 'inert';
          const subProds = (subProducts[sub.$id] || []).slice(0, 4);

          // Build product cards (no Swiper — simple flex row for 4 items)
          let productCardsHtml = '';
          subProds.forEach(p => {
            const pLink = `/productos/${p.$id}`;
            const pImg = p.IMAGEURL || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
            const pName = p.NAME || 'Producto';
            productCardsHtml += `
              <a href="${pLink}" title="${pName}" aria-label="${pName}"
                  class="flex group/image flex-col gap-2 items-start no-keyboard-focus relative"
                  style="text-decoration:none !important;width:25% !important;min-width:0 !important;display:flex !important;flex-direction:column !important;box-sizing:border-box !important;padding:0 8px !important"
                  data-type="standard"
              >
                  <span class="w-full aspect-square shrink-0 overflow-hidden rounded-[20px] bg-white flex items-center justify-center p-4" style="width:100% !important;aspect-ratio:1/1 !important;display:flex !important">
                      <img src="${pImg}" alt="${pName}" loading="lazy" class="pointer-events-none transition-transform duration-500 group-hover/image:scale-105" style="width:100% !important;height:100% !important;object-fit:contain !important; max-width:100% !important; max-height:100% !important;">
                  </span>
                  <div class="menu__heading-content w-full mt-2">
                      <h6 class="menu__heading-title" style="font-size:0.85em;line-height:1.2;font-weight:500;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:2.4em">
                          <span class="link-hover-animation">${pName}</span>
                      </h6>
                  </div>
              </a>
            `;
          });

          grandchildHtml += `
            <div class="menu menu--megamenu menu--megamenu-hover-split menu--megamenu-hover-split-grandchild flex-1 overflow-y-auto max-h-[400px]" data-tier="3" role="list"
                data-hidden="${isHidden}"
                ${inertAttr}
                data-link-handle="${subHandle}"
                style="
                    --num-columns: 4;
                    --image-border-radius: 20px;
                    --image-border-width: 0px;
                    --text-alignment: left;
                    --vertical-alignment: center;
                    --color-text: inherit;
                    --color-background: transparent;
                "
            >
                <div class="flex justify-between items-center mb-4">
                    <a href="${subLink}" title="${sub.name}" aria-label="${sub.name}" class="font-bold max-w-max border-b-1 border-current/20 no-keyboard-focus">
                        <span class="link-hover-animation">${sub.name} <span style="opacity:0.5;font-size:0.85em">(${sub.prodCount})</span></span>
                    </a>
                    <a href="${subLink}" class="text-xs font-medium transition-opacity rounded-full px-3 py-1 hover:opacity-90" style="font-size:0.75em;text-decoration:none;background-color:#FFB6C1;color:#fff">Ver todo</a>
                </div>
                <div class="megamenu-product-grid" style="display:flex !important;flex-wrap:nowrap !important;gap:12px !important;width:100% !important;overflow:hidden !important">
                    ${productCardsHtml}
                </div>
            </div>
          `;
        });

        templateEl.innerHTML = `
          <div class="custom-container flex my-[3rem] scroll-area" data-menu-type="hover-split">
              <ul class="custom-list menu menu--megamenu menu--megamenu-hover-split menu--megamenu-hover-split-child flex-1 max-w-[250px] w-max border-current/20 border-r-1 overflow-y-auto max-h-[400px]" data-tier="2" role="list">
                  ${subsHtml}
              </ul>
              ${grandchildHtml}
          </div>
        `;

        // Append <li> first, then <template> as SIBLING (matches original HTML structure)
        desktopMenu.appendChild(navLi);
        desktopMenu.appendChild(templateEl);
      });

    }

    // ── Mobile drawer menu ──
    const mobileMenu = root.querySelector('ul.menu--drawer[data-tier="1"]');
    if (mobileMenu) {
      mobileMenu.innerHTML = '';

      sortedCats.forEach(cat => {
        const catLink = `/productos?categoria=${encodeURIComponent(cat.name)}`;
        const catSubs = subcategories
          .filter(sc => sc.categoryId === cat.$id)
          .map(sc => ({ ...sc, prodCount: subProductCount[sc.$id] || 0 }))
          .filter(sc => sc.prodCount > 0)
          .sort((a, b) => b.prodCount - a.prodCount);

        const mobileLi = document.createElement('li');
        mobileLi.className = 'group relative before:content-[\'\'] before:block before:absolute before:top-0 before:left-0 before:transition-all before:duration-500 before:ease-in-out before:h-full before:w-0 before:bg-black before:opacity-1';

        let subMenuHtml = '';
        if (catSubs.length > 0) {
          subMenuHtml = `<div class="menu menu--drawer hidden" data-link-handle="${cat.$id}" data-tier="2"><ul class="custom-list">`;
          subMenuHtml += `<li class="group relative"><a href="${catLink}" aria-label="Ver todo ${cat.name}" class="w-full flex p-7 justify-between cursor-pointer z-10 relative"><span class="px-3">Ver todo ${cat.name} (${cat.prodCount})</span></a></li>`;
          catSubs.forEach(sub => {
            const subLink = `/productos?categoria=${encodeURIComponent(cat.name)}&subcategoria=${encodeURIComponent(sub.name)}`;
            subMenuHtml += `<li class="group relative"><a href="${subLink}" aria-label="${sub.name}" class="w-full flex p-7 justify-between cursor-pointer z-10 relative"><span class="px-3">${sub.name} (${sub.prodCount})</span></a></li>`;
          });
          subMenuHtml += `</ul></div>`;
        }

        mobileLi.innerHTML = `
          <a href="${catLink}" aria-label="${cat.name}" title="${cat.name}" class="w-full flex p-7 justify-between cursor-pointer z-10 relative">
              <span class="after:content-[\'\'] relative after:absolute after:top-full after:left-0 after:w-0 after:block after:h-0.5 after:bg-current after:transition-all after:duration-300 after:ease-in-out px-3">${cat.name} (${cat.prodCount})</span>
          </a>
          ${subMenuHtml}
        `;
        mobileMenu.appendChild(mobileLi);
      });

      ['TIENDA|https://kevincocochile.cl/productos', 'CATÁLOGO|https://kevincocochile.cl/catalogo'].forEach(item => {
        const [label, href] = item.split('|');
        const li = document.createElement('li');
        li.className = 'group relative before:content-[\'\'] before:block before:absolute before:top-0 before:left-0 before:transition-all before:duration-500 before:ease-in-out before:h-full before:w-0 before:bg-black before:opacity-1';
        li.innerHTML = `<a href="${href}" aria-label="${label}" title="${label}" class="w-full flex p-7 justify-between cursor-pointer z-10 relative"><span class="px-3">${label}</span></a>`;
        mobileMenu.appendChild(li);
      });
    }

    // ── Watch megamenu-wrapper for content injection by header.js ──
    // header.js clones <template> content into #megamenu-wrapper on hover.
    // We observe it to apply our custom styling overrides after injection.
    const megamenuWrapper = root.querySelector('#megamenu-wrapper');
    if (megamenuWrapper) {
      const observer = new MutationObserver(() => {
        // Force our grandchild display overrides on the cloned content
        megamenuWrapper.querySelectorAll('.menu--megamenu-hover-split-grandchild').forEach(el => {
          const grandchild = el as HTMLElement;
          if (grandchild.dataset.hidden === 'false') {
            grandchild.style.setProperty('display', 'flex', 'important');
            grandchild.style.setProperty('flex-direction', 'column', 'important');
            grandchild.style.setProperty('width', '100%', 'important');
            grandchild.style.setProperty('max-width', 'none', 'important');
            grandchild.style.setProperty('padding-left', '2.5rem', 'important');
            grandchild.style.setProperty('padding-right', '1.5rem', 'important');
            grandchild.style.setProperty('overflow', 'hidden', 'important');
          }
        });
        // Force product grid styling on cloned content
        megamenuWrapper.querySelectorAll('.megamenu-product-grid').forEach(el => {
          const grid = el as HTMLElement;
          grid.style.setProperty('display', 'flex', 'important');
          grid.style.setProperty('flex-wrap', 'nowrap', 'important');
          grid.style.setProperty('gap', '12px', 'important');
          grid.style.setProperty('width', '100%', 'important');
          grid.style.setProperty('overflow', 'hidden', 'important');
        });
        // Force image sizing on cloned content
        megamenuWrapper.querySelectorAll('.megamenu-product-grid img').forEach(img => {
          const imgEl = img as HTMLImageElement;
          imgEl.style.setProperty('width', '100%', 'important');
          imgEl.style.setProperty('height', '100%', 'important');
          imgEl.style.setProperty('max-width', 'none', 'important');
          imgEl.style.setProperty('max-height', 'none', 'important');
          imgEl.style.setProperty('object-fit', 'cover', 'important');
        });
        // Hide scrollbar on scroll-area inside megamenu
        megamenuWrapper.querySelectorAll('.scroll-area').forEach(el => {
          (el as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
        });
      });
      observer.observe(megamenuWrapper, { childList: true, subtree: true });
    }

    // ── Inject dynamic categories into collection-list section below hero banner ──
    const collectionList = root.querySelector('collection-list.collection-list');
    if (collectionList) {
      const allCats = [...categories]
        .map(cat => ({
          ...cat,
          prodCount: catProductCount[cat.$id] || 0
        }))
        .sort((a, b) => b.prodCount - a.prodCount);

      const swiperContainer = collectionList.querySelector('.swiper-container');
      const swiperWrapper = collectionList.querySelector('.swiper-wrapper');
      if (swiperContainer && swiperWrapper) {
        swiperWrapper.innerHTML = '';
        swiperContainer.setAttribute('data-items-total', String(allCats.length));

        allCats.forEach((cat, idx) => {
          const catLink = `/productos?categoria=${encodeURIComponent(cat.name)}`;
          // Use category iconUrl as card image
          const catImg = cat.iconUrl || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
          const delay = (idx + 1) * 100;

          const slide = document.createElement('div');
          slide.className = 'swiper-slide w-full h-auto animation-element fade-in';
          slide.setAttribute('style', `animation-delay: ${delay}ms`);
          slide.innerHTML = `
<div class="collection-card overflow-hidden h-full border-current relative w-full fade-in animation-element animation-delay-0">
    <a href="${catLink}" aria-label="${cat.name}" title="${cat.name}" class="link link-image hover-only block">
        <div class="collection-card__image-wrapper relative overflow-hidden hover-zoom-image-wrapper" data-ratio="square">
            <div class="collection-card__image w-full h-full absolute top-0 left-0 transition-all duration-300 ease-in-out transform img-blur placeholder">
                <hover-zoom-image class="w-full h-full">
                    <img src="${catImg}" alt="${cat.name}" loading="lazy" sizes="100vw" class="object-cover w-full h-full pointer-events-none">
                </hover-zoom-image>
            </div>
            <div class="overlay absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out"></div>
        </div>
    </a>
    <div class="collection-card__content z-10">
        <a href="${catLink}" title="${cat.name}" aria-label="${cat.name}" class="transition-all duration-300 ease-in-out h-full w-full link">
            <div class="py-5 pr-2 relative">
                <h6 class="heading transition-all duration-100 ease-in-out">
                    <span class="link-hover-animation">${cat.name} <span style="opacity:0.5;font-size:0.85em">(${cat.prodCount})</span></span>
                </h6>
            </div>
        </a>
    </div>
</div>
          `;
          swiperWrapper.appendChild(slide);
        });
      }
    }

    // ── Inject dynamic products into Featured Collections tabs ──
    if (products.length > 0) {
      const formatCLP = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

      const createCardHtml = (product: Product) => {
        const pLink = `/productos/${product.$id}`;
        const pImg = product.IMAGEURL || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
        const pName = product.NAME || 'Producto';
        const catObj = categories.find(c => c.$id === product.CATEGORYID);
        const categoryName = catObj ? catObj.name : '';

        const originalPrice = product.PRICE;
        const currentPrice = product.CURRENTPRICE && product.CURRENTPRICE > 0 ? product.CURRENTPRICE : originalPrice;
        const hasDiscount = currentPrice < originalPrice;

        let priceHtml = '';
        if (hasDiscount) {
          priceHtml = `
            <div class="price__sale flex w-max flex-wrap gap-[5px] items-center">
              <div class="price-item price-item--sale">${formatCLP(currentPrice)}</div>
              <span class="price-item price-item--compare line-through opacity-50">${formatCLP(originalPrice)}</span>
            </div>
          `;
        } else {
          priceHtml = `
            <div class="price__regular">
              <span class="price-item">${formatCLP(originalPrice)}</span>
            </div>
          `;
        }

        return `
          <product-card class="product-card relative h-full mx-auto my-0 block bg-white rounded-xl shadow-sm transition-shadow w-full" data-lifting-effect="true" style="max-width: 240px; -webkit-tap-highlight-color: transparent;">
            <div class="product-card__image group group-product-card relative overflow-hidden rounded-t-xl" data-ratio="portrait" style="aspect-ratio: 1/1;">
              <a href="${pLink}" title="${pName}" aria-label="${pName}" class="block" tabindex="-1">
                <div class="product-card__image-wrapper absolute inset-0 bg-white flex items-center justify-center p-4">
                  <img src="${pImg}" alt="${pName}" loading="lazy" class="w-full h-full object-contain pointer-events-none transition-transform duration-500" style="object-fit: contain !important; max-width: 100%; max-height: 100%;">
                </div>
                <div class="overlay top-0 absolute left-0 w-full h-full z-11"></div>
              </a>
              
              <div class="button-cart pk-grid-add-to-cart max-w-[95%] min-w-[45px] p-5 rounded-[100%] w-[45px] h-[45px] duration-300 ease-in-out cursor-pointer hover:py-0 hover:rounded-[0%] hover:w-auto button-cart--size z-20 absolute bottom-5 lg:bottom-10 left-0 right-0 mx-auto button--primary flex items-center justify-center inner-group"
                   role="button"
                   tabindex="0"
                   aria-label="Agregar ${pName} al carrito"
                   data-product-id="${product.$id}"
              >
                <span class="button-cart__text min-w-[20px] min-h-[20px] [.inner-group:hover_&]:hidden [.inner-group:focus-within_&]:hidden flex items-center justify-center w-full h-full cursor-pointer">
                  <svg aria-hidden="true" width="20px" height="20px" class="w-[20px]" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30.622 9.602h-22.407l-1.809-7.464h-5.027v1.066h4.188l5.198 21.443c-1.108 0.323-1.923 1.334-1.923 2.547 0 1.472 1.193 2.666 2.666 2.666s2.666-1.194 2.666-2.666c0-0.603-0.208-1.153-0.545-1.599h7.487c-0.337 0.446-0.545 0.997-0.545 1.599 0 1.472 1.193 2.666 2.665 2.666s2.666-1.194 2.666-2.666c0-1.473-1.193-2.665-2.666-2.666v0h-11.403l-0.517-2.133h14.968l4.337-12.795zM13.107 27.196c0 0.882-0.717 1.599-1.599 1.599s-1.599-0.717-1.599-1.599c0-0.882 0.717-1.599 1.599-1.599s1.599 0.718 1.599 1.599zM24.836 27.196c0 0.882-0.718 1.599-1.6 1.599s-1.599-0.717-1.599-1.599c0-0.882 0.717-1.599 1.599-1.599 0.882 0 1.6 0.718 1.6 1.599zM11.058 21.331l-2.585-10.662h20.662l-3.615 10.662h-14.462z" fill="currentColor"></path>
                  </svg>
                </span>
                <span class="button-cart-hover-text hidden [.inner-group:hover_&]:inline [.inner-group:focus-within_&]:inline text-xs font-bold uppercase tracking-wider text-white">Al Carrito</span>
              </div>
            </div>
            
            <div class="product-card__content p-5 z-10 relative">
              <div>
                <small class="type opacity-40"><span>${categoryName}</span></small>
              </div>
              <a href="${pLink}" aria-label="${pName}" title="${pName}" class="link">
                <h3 class="heading pt-2 pb-3 h5"><span class="link-hover-animation">${pName}</span></h3>
              </a>
              <div class="price flex gap-[5px] flex-wrap">
                ${priceHtml}
              </div>
            </div>
          </product-card>
        `;
      };

      // Push heavy hydration task to next tick to prevent mobile freezing on load
      setTimeout(() => {
      // 1. Populate Tab 1: Lo Último Añadido
      const tab1Products = [...products]
        .sort((a: any, b: any) => {
          const dateA = a.DATE_ADDED ? new Date(a.DATE_ADDED).getTime() : (a.$createdAt ? new Date(a.$createdAt).getTime() : 0);
          const dateB = b.DATE_ADDED ? new Date(b.DATE_ADDED).getTime() : (b.$createdAt ? new Date(b.$createdAt).getTime() : 0);
          return dateB - dateA;
        })
        .slice(0, 4);

      const section1 = root.querySelector('.featured-collection__products[data-index="1"]');
      if (section1 && tab1Products.length > 0) {
        const firstWrapper = section1.querySelector('.featured-collection__first-product-wrapper');
        const swiperWrapper = section1.querySelector('.featured-collection__product-by-collection .swiper-wrapper');
        
        if (firstWrapper) {
          firstWrapper.innerHTML = createCardHtml(tab1Products[0]);
        }
        
        if (swiperWrapper) {
          swiperWrapper.innerHTML = '';
          const sliderProducts = tab1Products.slice(1, 4);
          sliderProducts.forEach((prod, idx) => {
            const slide = document.createElement('div');
            slide.className = `swiper-slide h-auto w-full items-center flex animation-element fade-in animation-delay-${(idx + 2) * 100} py-3`;
            slide.innerHTML = createCardHtml(prod);
            swiperWrapper.appendChild(slide);
          });
        }

        const swiperEl1 = section1.querySelector('.featured-collection__product-by-collection .swiper-container') as any;
        if (swiperEl1 && swiperEl1.swiper) {
          swiperEl1.swiper.update();
        }
      }

      // 2. Populate Tab 2: TIENDA
      const tab2Products = [...products]
        .sort((a, b) => {
          const aBest = a.TAGS?.some(t => t.toLowerCase() === 'best-seller') ? 1 : 0;
          const bBest = b.TAGS?.some(t => t.toLowerCase() === 'best-seller') ? 1 : 0;
          if (aBest !== bBest) return bBest - aBest;
          return (b.SOLDQUANTITY || 0) - (a.SOLDQUANTITY || 0);
        })
        .slice(0, 4);

      const section2 = root.querySelector('.featured-collection__products[data-index="2"]');
      if (section2 && tab2Products.length > 0) {
        const firstWrapper = section2.querySelector('.featured-collection__first-product-wrapper');
        const swiperWrapper = section2.querySelector('.featured-collection__product-by-collection .swiper-wrapper');
        
        if (firstWrapper) {
          firstWrapper.innerHTML = createCardHtml(tab2Products[0]);
        }
        
        if (swiperWrapper) {
          swiperWrapper.innerHTML = '';
          const sliderProducts = tab2Products.slice(1, 4);
          sliderProducts.forEach((prod, idx) => {
            const slide = document.createElement('div');
            slide.className = `swiper-slide h-auto w-full items-center flex animation-element fade-in animation-delay-${(idx + 2) * 100} py-3`;
            slide.innerHTML = createCardHtml(prod);
            swiperWrapper.appendChild(slide);
          });
        }

        const swiperEl2 = section2.querySelector('.featured-collection__product-by-collection .swiper-container') as any;
        if (swiperEl2 && swiperEl2.swiper) {
          swiperEl2.swiper.update();
        }
      }

      // 3. Populate ALL .product-columns-block and product-columns .swiper-container with random in-stock products
      const columnBlocks = root.querySelectorAll('.product-columns-block .swiper-container, product-columns .swiper-container');
      columnBlocks.forEach((swiperContainer: any) => {
        const wrapper = swiperContainer.querySelector('.swiper-wrapper');
        if (wrapper) {
          const availableProducts = products.filter(p => p.STOCK && p.STOCK > 0);
          const shuffled = availableProducts.sort(() => 0.5 - Math.random());
          
          const itemsTotalStr = swiperContainer.getAttribute('data-items-total');
          const itemsNeeded = itemsTotalStr ? parseInt(itemsTotalStr, 10) : 8;
          
          const selected = shuffled.slice(0, itemsNeeded);
          
          wrapper.innerHTML = '';
          selected.forEach((prod) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide product-card-wrapper w-full py-3';
            slide.innerHTML = createCardHtml(prod);
            wrapper.appendChild(slide);
          });

          if (swiperContainer.swiper) {
            swiperContainer.swiper.update();
          }
        }
      });

      // 4. Populate featured-product blocks with random in-stock products
      const featuredProductBlocks = root.querySelectorAll('featured-product');
      featuredProductBlocks.forEach((fpBlock: any) => {
        const availableProducts = products.filter(p => p.STOCK && p.STOCK > 0);
        if (availableProducts.length === 0) return;
        
        let targetProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        let isDestacado = false;
        if (destacadoTemporal && destacadoTemporal.targetId) {
          const matched = products.find(p => p.$id === destacadoTemporal.targetId);
          if (matched && matched.STOCK && matched.STOCK > 0) {
            targetProduct = matched;
            isDestacado = true;
          }
        }
        
        // Fix image opacity
        const productMedia = fpBlock.querySelector('product-media');
        if (productMedia) {
          productMedia.classList.remove('opacity-0');
        }

        // Update images
        const imgs = fpBlock.querySelectorAll('img');
        if (imgs.length > 0) {
          imgs.forEach((img: HTMLImageElement) => {
            img.src = resolveStorageImageUrl(targetProduct.IMAGEURL) || '';
            img.removeAttribute('srcset'); // Remove srcset to ensure the src fallback works correctly
          });
        }
        
        // Update title
        const heading = fpBlock.querySelector('h3.heading span');
        if (heading) heading.textContent = targetProduct.NAME;
        
        // Update prices
        const priceResolved = resolveProductDisplayPrice(targetProduct, apertura);
        const regularPrice = fpBlock.querySelector('.price__regular .price-item');
        if (regularPrice) regularPrice.textContent = formatPrice(priceResolved.displayPrice);
        const salePrice = fpBlock.querySelector('.price__sale .price-item--sale');
        if (salePrice) salePrice.textContent = formatPrice(priceResolved.displayPrice);
        
        const comparePrice = fpBlock.querySelector('.price-item--compare');
        if (comparePrice) {
          if (priceResolved.hasDiscount && priceResolved.originalPrice != null) {
            comparePrice.textContent = formatPrice(priceResolved.originalPrice);
          } else {
            comparePrice.textContent = '';
          }
        }
        
        // Update stock
        const badge = fpBlock.querySelector('.badge--in-stock');
        if (badge) badge.textContent = `${targetProduct.STOCK} in stock`;
        
        // Update description
        const descBlock = fpBlock.querySelector('.body-text[data-index="6"] p');
        if (descBlock) descBlock.innerHTML = targetProduct.DESCRIPTION || '';
        
        // Timer Injection
        const timerBlock = fpBlock.querySelector('.body-text[data-index="7"]');
        if (timerBlock) {
          if (isDestacado && destacadoTemporal.endDateTime) {
            timerBlock.innerHTML = `
              <div class="flex flex-col gap-1 my-2 w-full">
                <span class="text-xs sm:text-sm font-bold text-red-500 uppercase tracking-wide">La oferta termina en:</span>
                <div class="flex items-center gap-1 sm:gap-2 flex-nowrap justify-between w-full" id="dt-timer-container">
                  <div class="bg-gray-100 rounded-md px-1 sm:px-3 py-1 sm:py-2 flex flex-col items-center flex-1"><span class="text-sm sm:text-lg font-bold text-gray-900" id="dt-d">00</span><span class="text-[8px] sm:text-[10px] text-gray-500 uppercase">Días</span></div>
                  <span class="text-gray-400 font-bold text-xs sm:text-sm">:</span>
                  <div class="bg-gray-100 rounded-md px-1 sm:px-3 py-1 sm:py-2 flex flex-col items-center flex-1"><span class="text-sm sm:text-lg font-bold text-gray-900" id="dt-h">00</span><span class="text-[8px] sm:text-[10px] text-gray-500 uppercase">Hrs</span></div>
                  <span class="text-gray-400 font-bold text-xs sm:text-sm">:</span>
                  <div class="bg-gray-100 rounded-md px-1 sm:px-3 py-1 sm:py-2 flex flex-col items-center flex-1"><span class="text-sm sm:text-lg font-bold text-gray-900" id="dt-m">00</span><span class="text-[8px] sm:text-[10px] text-gray-500 uppercase">Min</span></div>
                  <span class="text-gray-400 font-bold text-xs sm:text-sm">:</span>
                  <div class="bg-gray-100 rounded-md px-1 sm:px-3 py-1 sm:py-2 flex flex-col items-center flex-1"><span class="text-sm sm:text-lg font-bold text-red-600" id="dt-s">00</span><span class="text-[8px] sm:text-[10px] text-red-500 uppercase">Seg</span></div>
                </div>
                <a href="/productos" style="margin-top:12px;background:#db2777;color:#fff;font-weight:900;text-align:center;padding:12px;border-radius:12px;text-decoration:none;display:block;text-transform:uppercase;box-shadow:0 4px 14px rgba(219,39,119,0.35);font-size:14px;letter-spacing:0.5px;">Mira todos productos de oferta</a>
              </div>
            `;
            const end = new Date(destacadoTemporal.endDateTime).getTime();
            const updateTimer = () => {
              const now = new Date().getTime();
              const distance = end - now;
              if (distance < 0) {
                timerBlock.innerHTML = '<span class="text-sm font-bold text-gray-500">La oferta ha terminado</span>';
                return;
              }
              const d = Math.floor(distance / (1000 * 60 * 60 * 24));
              const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((distance % (1000 * 60)) / 1000);
              const elD = document.getElementById('dt-d');
              const elH = document.getElementById('dt-h');
              const elM = document.getElementById('dt-m');
              const elS = document.getElementById('dt-s');
              if (elD) elD.textContent = d.toString().padStart(2, '0');
              if (elH) elH.textContent = h.toString().padStart(2, '0');
              if (elM) elM.textContent = m.toString().padStart(2, '0');
              if (elS) elS.textContent = s.toString().padStart(2, '0');
            };
            updateTimer();
            if ((window as any)._dtInterval) clearInterval((window as any)._dtInterval);
            (window as any)._dtInterval = setInterval(updateTimer, 1000);
          } else {
            timerBlock.style.display = 'none';
          }
        }

        // Remove variants to avoid messing with sizes
        const variantSelector = fpBlock.querySelector('variant-selector');
        if (variantSelector) variantSelector.remove();
        
        // Update cart button onClick to add THIS product and go to carrito
        const btn = fpBlock.querySelector('.button-cart');
        if (btn) {
          btn.classList.remove('pointer-events-none'); // Ensure it's clickable
          btn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(targetProduct, 1);
            router.push('/carrito');
          });
        }

        // Remove shopify payment skeleton as we only use "Añadir to cart" for simple checkout
        const shopifyPaymentBtn = fpBlock.querySelector('.shopify-payment-button');
        if (shopifyPaymentBtn) shopifyPaymentBtn.remove();
        
        // Update form action just in case
        const forms = fpBlock.querySelectorAll('form');
        forms.forEach((f: HTMLFormElement) => f.onsubmit = (e) => e.preventDefault());
        
        // Update link to details
        const fullDetailsLink = fpBlock.querySelector('.full-details-link a');
        if (fullDetailsLink) {
          fullDetailsLink.href = `/productos/${targetProduct.$id}`;
        }
        
        // Update vendor
        const vendor = fpBlock.querySelector('.vendor span');
        if (vendor) vendor.textContent = (targetProduct as any).BRAND || 'Yaxsell';
      });
      }, 50); // End of heavy hydration timeout

      // Intersection Observer for Hero Scroll Videos
      const scrollVideos = root.querySelectorAll('.hero-scroll-video');
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.currentTime = 0;
            video.play().catch(e => console.log('Video auto-play prevented:', e));
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.1 });
      scrollVideos.forEach(v => videoObserver.observe(v));
    }

    // ═══ MOBILE: Inject Profile icon next to Buscar / Carrito in mobile header ═══
    if (window.innerWidth < 1024) {
      const mobileHeaderActions = root.querySelector('.flex.lg\\:hidden.justify-center.items-center') || 
                                  document.querySelector('.flex.lg\\:hidden.justify-center.items-center');
      if (mobileHeaderActions && !mobileHeaderActions.querySelector('[data-profile-icon]')) {
        const profileBtn = document.createElement('a');
        profileBtn.href = '/cuenta';
        profileBtn.setAttribute('role', 'button');
        profileBtn.setAttribute('aria-label', 'Mi perfil');
        profileBtn.setAttribute('data-profile-icon', '1');
        profileBtn.className = 'relative px-[0.5rem] uppercase';
        profileBtn.style.cssText = 'display:inline-flex;align-items:center;';
        profileBtn.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg></span>`;
        // Insert before cart icon
        const cartIcon = mobileHeaderActions.querySelector('.cart-icon');
        if (cartIcon) {
          mobileHeaderActions.insertBefore(profileBtn, cartIcon);
        } else {
          mobileHeaderActions.appendChild(profileBtn);
        }
      }

      // Intercept clicks on cart and search icons on mobile header to redirect directly and avoid broken overlays
      if (mobileHeaderActions) {
        // Removed cart redirect to allow native drawer to open
        const mobileSearchIcon = mobileHeaderActions.querySelector('[data-object="search-drawer"]');
        if (mobileSearchIcon && !(mobileSearchIcon as HTMLElement).dataset.redirectInjected) {
          (mobileSearchIcon as HTMLElement).dataset.redirectInjected = '1';
          mobileSearchIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/productos';
          }, true);
        }
      }
    }

    // ═══ Replace "Buscar", "Carrito" text with SVGs in PC & Mobile header ═══
    const searchIcons = root.querySelectorAll('.search-icon .link-hover-animation');
    searchIcons.forEach((el) => {
      if (el.textContent?.trim().toLowerCase() === 'buscar') {
        el.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg></span>`;
      }
    });

    const cartIcons = root.querySelectorAll('.cart-icon .link-hover-animation');
    cartIcons.forEach((el) => {
      if (el.textContent?.trim().toLowerCase().includes('carrito')) {
        const qtySpan = el.parentElement?.querySelector('.cart-item-size') || el.querySelector('.cart-item-size');
        el.innerHTML = `<span style="display:inline-flex;align-items:center;position:relative;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></span>`;
        if (qtySpan) {
           (qtySpan as HTMLElement).style.position = 'absolute';
           (qtySpan as HTMLElement).style.top = '-8px';
           (qtySpan as HTMLElement).style.right = '-8px';
           (qtySpan as HTMLElement).style.background = 'black';
           (qtySpan as HTMLElement).style.color = 'white';
           (qtySpan as HTMLElement).style.fontSize = '10px';
           (qtySpan as HTMLElement).style.padding = '2px 4px';
           (qtySpan as HTMLElement).style.borderRadius = '10px';
           (qtySpan as HTMLElement).style.lineHeight = '1';
           (qtySpan as HTMLElement).innerText = (qtySpan as HTMLElement).innerText.replace(/[()]/g, ''); // Remove parenthesis
           el.appendChild(qtySpan);
        }
      }
    });

    // ═══ Inject Notification SVG in PC header ═══
    const headerActionsPC = root.querySelector('.lg\\:flex.hidden.items-center.justify-center.pl-\\[30px\\]');
    if (headerActionsPC && !headerActionsPC.querySelector('.notification-icon')) {
      const storeBtn = document.createElement('a');
      storeBtn.href = '/productos';
      storeBtn.className = 'px-[1rem] uppercase';
      storeBtn.innerHTML = `<span class="link-hover-animation" style="font-weight:900; color:#db2777; font-size: 14px; letter-spacing: 0.5px;">Tienda</span>`;
      headerActionsPC.insertBefore(storeBtn, headerActionsPC.firstChild);

      const catalogBtn = document.createElement('a');
      catalogBtn.href = '/productos';
      catalogBtn.className = 'px-[1rem] uppercase';
      catalogBtn.innerHTML = `<span class="link-hover-animation" style="font-weight:900; color:#db2777; font-size: 14px; letter-spacing: 0.5px;">Catálogo</span>`;
      headerActionsPC.insertBefore(catalogBtn, headerActionsPC.firstChild);

      const notifBtn = document.createElement('a');
      notifBtn.href = '/cuenta';
      notifBtn.className = 'notification-icon px-[0.5rem] uppercase';
      notifBtn.innerHTML = `<span class="link-hover-animation" style="display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg></span>`;
      headerActionsPC.insertBefore(notifBtn, headerActionsPC.querySelector('.cart-icon'));
    }

    root.dataset.navInjected = '1';
  }, [categories, subcategories, products, isAppwriteLoaded]);

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
    if ((window as any).__tpl23ScriptsLoaded) return;
    (window as any).__tpl23ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl23="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src.includes('elfsight') ? file.src : `${file.src}?v=${Date.now()}`;
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
              if (window.innerWidth < 768) return; // Prevent hover video playback on mobile
              hoverContainer.dataset.isHovered = "true";
              activeVideo.play().catch(() => {});
            });

            hoverContainer.addEventListener('mouseleave', () => {
              if (window.innerWidth < 768) return; // Prevent hover video playback on mobile
              hoverContainer.dataset.isHovered = "false";
              forward.pause();
              reverse.pause();
            });

            // Scroll-driven Autoplay and Morph for Mobile on "Set de botella"
            if ('IntersectionObserver' in window && wrapper.closest('#shopify-block-AeU1KMU9YMGYxdWlmU__multimedia_collage_video_block_ndXhr3')) {
              const morphCard = wrapper.closest('#shopify-block-AeU1KMU9YMGYxdWlmU__multimedia_collage_video_block_ndXhr3');
              if (morphCard && !wrapper.dataset.scrollObserverBound) {
                wrapper.dataset.scrollObserverBound = "true";

                const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                    // Only run on mobile
                    if (window.innerWidth >= 768) return;

                    const morphInner = morphCard.querySelector('.morph-svg-inner') as HTMLElement | null;
                    if (entry.isIntersecting) {
                      // Prevent video autoplay on mobile to stop lag and show static image
                      hoverContainer.dataset.isHovered = "true";
                      // activeVideo.play().catch(() => {});
                      if (morphInner) {
                        morphInner.dispatchEvent(new PointerEvent('pointerenter'));
                      }
                    } else {
                      hoverContainer.dataset.isHovered = "false";
                      forward.pause();
                      reverse.pause();
                      if (morphInner) {
                        morphInner.dispatchEvent(new PointerEvent('pointerleave'));
                      }
                    }
                  });
                }, {
                  threshold: 0.35
                });

                observer.observe(morphCard);
              }
            }
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
  }, [bodyHtml, categories]);
  /* ═══ GRID ADD TO CART DELEGATION ═══ */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    
    const handleClickEvents = (e: Event) => {
      const target = e.target as HTMLElement;
      
      const btn = target.closest('.pk-grid-add-to-cart');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const pid = btn.getAttribute('data-product-id');
        const p = products.find(prod => prod.$id === pid);
        if (p) {
          addItem(p, 1);

          // Animate button: show checkmark for 600ms then open drawer
          const btnEl = btn as HTMLElement;
          const originalHtml = btnEl.innerHTML;
          btnEl.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>`;
          btnEl.style.background = '#22c55e';
          btnEl.style.transform = 'scale(1.15)';

          setTimeout(() => {
            btnEl.innerHTML = originalHtml;
            btnEl.style.background = '';
            btnEl.style.transform = '';
            const cartDrawer = document.querySelector('cart-drawer');
            if (cartDrawer) {
              cartDrawer.setAttribute('data-hidden', 'false');
              cartDrawer.removeAttribute('inert');
              document.documentElement.style.overflow = 'hidden';
            }
          }, 650);
        }
        return;
      }

      const cartIcon = target.closest('[data-object="cart"], .cart-icon');
      if (cartIcon && !target.closest('cart-drawer')) {
        e.preventDefault();
        e.stopPropagation();
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer) {
          cartDrawer.setAttribute('data-hidden', 'false');
          cartDrawer.removeAttribute('inert');
          document.documentElement.style.overflow = 'hidden';
        }
      }
    };

    root.addEventListener('click', handleClickEvents);
    return () => root.removeEventListener('click', handleClickEvents);
  }, [bodyHtml, products, addItem]);

  /* ═══ CART DOM HYDRATION ═══ */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cartWrapper = root.querySelector('cart-drawer .cart-items-wrapper') as HTMLElement;
    const checkoutWrapper = root.querySelector('cart-drawer .cart-drawer-checkout') as HTMLElement;
    if (!cartWrapper || !checkoutWrapper) return;

    if (cartItems.length === 0) {
      cartWrapper.innerHTML = `
        <h5 class="headding mb-3">Carrito</h5>
        <div class="flex items-center pt-10 mt-10 flex-col">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[25px]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h6 class="heading pt-3">Tu carrito está vacío</h6>
        </div>
      `;
      checkoutWrapper.style.display = 'none';
    } else {
      // Sort items: newest added at the top
      const sortedItems = [...cartItems].reverse();

      cartWrapper.innerHTML = `
        <h5 class="headding mb-3">Carrito</h5>
        <div class="flex flex-col gap-[0.5rem] pt-2" style="max-height: 48vh; overflow-y: auto;">
           ${sortedItems.map((item: any) => {
             const price = (item.product?.CURRENTPRICE && item.product.CURRENTPRICE > 0) ? item.product.CURRENTPRICE : (item.product?.PRICE || 0);
             return `
               <div class="cart-item">
                  <a href="/productos/${item.product.$id}" class="image-wrapper block h-[64px] w-[64px] min-h-[64px] min-w-[64px] relative">
                      <img src="${item.product.IMAGEURL || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png'}" class="object-cover w-full h-full" />
                  </a>
                  <div class="cart-item__details flex-1" style="min-width: 0;">
                      <a href="/productos/${item.product.$id}" class="link" style="text-decoration: none;">
                          <h6 class="heading" style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #374151; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                            ${item.product.NAME}
                          </h6>
                      </a>
                      <div class="flex items-center justify-between mt-2">
                          <div class="price font-bold text-[14px]">$${price.toLocaleString()}</div>
                          <div class="cart-qty-container">
                              <button class="cart-qty-btn" data-action="minus" data-id="${item.product.$id}">-</button>
                              <span class="text-xs font-semibold w-5 text-center">${item.quantity}</span>
                              <button class="cart-qty-btn" data-action="plus" data-id="${item.product.$id}">+</button>
                          </div>
                      </div>
                  </div>
                  <button class="cart-remove-btn" data-id="${item.product.$id}">✕</button>
               </div>
             `;
           }).join('')}
        </div>
      `;

      // Hydrate subtotal and checkout buttons
      checkoutWrapper.style.display = 'block';
      checkoutWrapper.innerHTML = `
        <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 14px; font-weight: 600; color: #4b5563;">Subtotal</span>
            <span style="font-size: 18px; font-weight: 800; color: #111827;">$${(cartTotal || 0).toLocaleString()}</span>
          </div>
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">Impuestos y envío calculados al pagar</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" class="checkout-redirect-btn" style="
            width: 100%;
            padding: 12px 0;
            background: #111827;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: background 0.2s;
          ">
            Proceder al Checkout
          </button>
          
          <a href="/carrito" style="
            display: block;
            width: 100%;
            padding: 10px 0;
            background: #fff;
            color: #4b5563;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
          ">
            Ver Carrito Completo
          </a>
        </div>
      `;

      const redirectBtn = checkoutWrapper.querySelector('.checkout-redirect-btn');
      redirectBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/checkout';
      });
    }

    const handleQtyClick = (e: Event) => {
      e.preventDefault();
      const btn = e.currentTarget as HTMLButtonElement;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const item = cartItems.find((i: any) => i.product.$id === id);
      if (item) {
        if (action === 'plus') updateQuantity(id!, item.quantity + 1);
        if (action === 'minus' && item.quantity > 1) updateQuantity(id!, item.quantity - 1);
      }
    };

    const handleRemoveClick = (e: Event) => {
      e.preventDefault();
      const btn = e.currentTarget as HTMLButtonElement;
      const id = btn.getAttribute('data-id');
      if (id) removeItem(id);
    };

    cartWrapper.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', handleQtyClick);
    });

    cartWrapper.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', handleRemoveClick);
    });

    root.querySelectorAll('.cart-item-size').forEach(el => {
      el.textContent = `(${cartItems.reduce((acc: any, curr: any) => acc + curr.quantity, 0)})`;
    });

    // Removed old cart-specific closeBtn logic, handled globally now
    // Hydrate "Otros también compraron" with compact 2-col scrollable grid
    root.querySelectorAll('.drawer__recommendation-wrapper').forEach((wrapper, index) => {
      // Fix PC squishing issue
      if (wrapper.classList.contains('md:block')) {
        (wrapper as HTMLElement).style.setProperty('width', '360px', 'important');
        (wrapper as HTMLElement).style.setProperty('min-width', '360px', 'important');
        (wrapper as HTMLElement).style.setProperty('flex-shrink', '0', 'important');
      }

      const gridId = `pk-rec-grid-${index}`;
      let gridEl = wrapper.querySelector(`#${gridId}`) as HTMLElement | null;
      if (!gridEl) {
        gridEl = document.createElement('div');
        gridEl.id = gridId;
        gridEl.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 24px;';
        // Remove existing swiper markup or custom-list to avoid conflicts
        const existingList = wrapper.querySelector('.swiper-container, ul.custom-list');
        if (existingList) existingList.replaceWith(gridEl);
        else wrapper.appendChild(gridEl);
      }

      gridEl.innerHTML = products.slice(0, 8).map((p: any) => {
        const pImg = p.IMAGEURL || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
        const pName = p.NAME || 'Producto';
        const pLink = `/productos/${p.$id}`;
        const currentPrice = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
        return `
          <div style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);display:flex;flex-direction:column;">
            <a href="${pLink}" style="display:block;padding:8px;">
              <img src="${pImg}" alt="${pName}" style="width:100%;height:80px;object-fit:contain;display:block;">
            </a>
            <div style="padding:6px 8px 8px;flex:1;display:flex;flex-direction:column;justify-content:space-between;">
              <a href="${pLink}" style="text-decoration:none;color:#111;">
                <p style="margin:0;font-size:11px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${pName}</p>
              </a>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                <span style="font-size:12px;font-weight:700;color:#111;">$${(currentPrice||0).toLocaleString()}</span>
                <button class="pk-grid-add-to-cart" data-product-id="${p.$id}" style="background:var(--color-button,#e396bf);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;" aria-label="Agregar al carrito">
                  <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor" style="color:#fff;"><path d="M30.622 9.602h-22.407l-1.809-7.464h-5.027v1.066h4.188l5.198 21.443c-1.108 0.323-1.923 1.334-1.923 2.547 0 1.472 1.193 2.666 2.666 2.666s2.666-1.194 2.666-2.666c0-0.603-0.208-1.153-0.545-1.599h7.487c-0.337 0.446-0.545 0.997-0.545 1.599 0 1.472 1.193 2.666 2.665 2.666s2.666-1.194 2.666-2.666c0-1.473-1.193-2.665-2.666-2.666v0h-11.403l-0.517-2.133h14.968l4.337-12.795z"/></svg>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    });

    // Hydrate "Trending Search" with real products
    const searchProductsList = root.querySelector('.search-drawer-initial-content .pt-10 ul.custom-list');
    const searchHeadings = root.querySelectorAll('.search-drawer-initial-content h5.heading');
    searchHeadings.forEach(h => {
      if (h.textContent?.trim().toLowerCase().includes('trending') || h.textContent?.trim().toLowerCase().includes('tendencia')) {
        h.textContent = 'Búsquedas Populares';
      }
    });

    if (searchProductsList) {
      searchProductsList.innerHTML = products.slice(0, 6).map((p: any) => {
        const pImg = p.IMAGEURL || 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/gold_eyepatch.png';
        const pName = p.NAME || 'Producto';
        const pLink = `/productos/${p.$id}`;
        const currentPrice = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
        const hasDiscount = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
        
        return `
          <li class="py-3 flex leading-[1]">
              <a href="${pLink}" title="${pName}" class="block h-[70px] w-[70px] min-h-[70px] min-w-[70px] mr-5 overflow-hidden rounded-md border border-gray-100">
                  <img src="${pImg}" alt="${pName}" loading="lazy" class="object-cover h-full w-full" />
              </a>
              <div class="flex-1">
                  <a href="${pLink}" title="${pName}" class="link" style="text-decoration:none;">
                      <h6 class="heading pb-1 text-sm font-semibold text-gray-800 line-clamp-2">${pName}</h6>
                  </a>
                  <div class="price flex gap-[5px] flex-wrap mt-1">
                      <span class="font-bold text-gray-900">$${(currentPrice||0).toLocaleString()}</span>
                      ${hasDiscount ? `<span class="text-xs text-gray-400 line-through mt-[2px]">$${p.PRICE.toLocaleString()}</span>` : ''}
                  </div>
              </div>
          </li>
        `;
      }).join('');
    }

  }, [cartItems, cartTotal, bodyHtml, updateQuantity, removeItem, products]);

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
        {/* Pantalla en blanco mientras carga — no mostrar texto al cliente */}
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Tabbed FAQ Styles */
        .kc-tabbed-faq { position: relative; overflow: hidden; background: #ffffff; padding: 100px 0; font-family: system-ui, -apple-system, sans-serif; }
        .kc-faq-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; }
        .kc-faq-header { text-align: center; margin-bottom: 60px; }
        .kc-faq-header h2 { font-size: 3.5rem; font-weight: 900; color: #111827; margin-bottom: 24px; line-height: 1.1; letter-spacing: -1px; }
        .kc-faq-header p { font-size: 1.25rem; color: #6b7280; max-width: 600px; margin: 0 auto; }
        .kc-faq-grid { display: flex; flex-direction: column; gap: 40px; }
        @media (min-width: 1024px) { .kc-faq-grid { flex-direction: row; gap: 60px; align-items: flex-start; } }
        .kc-faq-tabs { flex: 0 0 320px; display: flex; flex-direction: column; gap: 12px; }
        .kc-tab-btn { display: flex; align-items: center; gap: 16px; padding: 18px 24px; border-radius: 16px; font-size: 1.1rem; font-weight: 600; color: #4b5563; background: #f9fafb; border: 1px solid #f3f4f6; cursor: pointer; text-align: left; transition: all 0.3s ease; }
        .kc-tab-btn:hover { background: #f3f4f6; color: #111827; }
        .kc-tab-btn.active { background: #fdf2f8; color: #db2777; border-color: #fbcfe8; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.1); }
        .kc-tab-btn .icon { font-size: 1.4rem; }
        .kc-faq-content-area { flex: 1; min-height: 500px; }
        .kc-faq-pane { display: none; animation: fadeInPane 0.4s ease forwards; }
        .kc-faq-pane.active { display: block; }
        @keyframes fadeInPane { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .kc-faq-pane h3 { font-size: 2rem; font-weight: 800; color: #111827; margin: 0 0 32px 0; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6; }
        .kc-accordion-wrapper { display: flex; flex-direction: column; gap: 16px; }
        .kc-accordion-item { background: #ffffff; border: 1px solid #f3f4f6; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
        .kc-accordion-item:hover { border-color: #fbcfe8; box-shadow: 0 10px 30px rgba(0,0,0,0.04); transform: translateY(-2px); }
        .kc-accordion-item.active { border-color: #fbcfe8; box-shadow: 0 10px 25px -5px rgba(244, 114, 182, 0.2); }
        .kc-accordion-btn { width: 100%; text-align: left; background: transparent; border: none; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-family: inherit; }
        .kc-accordion-btn span:first-child { font-size: 1.15rem; font-weight: 700; color: #1f2937; padding-right: 20px; line-height: 1.4; }
        .kc-icon-wrap { width: 36px; height: 36px; border-radius: 50%; background: #fdf2f8; color: #ec4899; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .kc-icon-wrap svg { width: 20px; height: 20px; }
        .kc-accordion-item.active .kc-icon-wrap { transform: rotate(45deg); }
        .kc-accordion-content { padding: 0 32px; display: none; }
        .kc-accordion-content p { color: #4b5563; line-height: 1.7; font-size: 1.05rem; padding-bottom: 24px; margin: 0; }

        /* Scoped override for plantilla23 dynamic megamenu styling */
        .tpl23-shopify-root .menu--megamenu-hover-split-grandchild {
          display: none !important;
        }
        .tpl23-shopify-root .menu--megamenu-hover-split-grandchild[data-hidden="false"] {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: none !important;
          padding-left: 2.5rem !important;
          padding-right: 1.5rem !important;
          overflow: hidden !important;
        }
        /* Product grid: 4 cards in a row */
        .tpl23-shopify-root .megamenu-product-grid {
          display: flex !important;
          flex-wrap: nowrap !important;
          gap: 12px !important;
          width: 100% !important;
          overflow: hidden !important;
        }
        .tpl23-shopify-root .megamenu-product-grid a {
          width: 25% !important;
          min-width: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          padding: 0 8px !important;
        }
        /* Force image sizing */
        .tpl23-shopify-root .megamenu-product-grid img {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: cover !important;
        }
        /* Hide scrollbars inside megamenu */
        .tpl23-shopify-root .scroll-area {
          overflow: hidden !important;
          scrollbar-width: none !important;
        }
        .tpl23-shopify-root .scroll-area::-webkit-scrollbar {
          display: none !important;
        }

        /* --- PREMIUM CART DRAWER OVERRIDES --- */
        cart-drawer.cart-drawer, .added-to-cart-popup {
          z-index: 10005 !important;
        }
        cart-drawer {
          font-family: 'Outfit', 'Inter', sans-serif !important;
        }
        cart-drawer .drawer__inner {
          background-color: #ffffff !important;
          border-left: 1px solid #f3f4f6 !important;
          box-shadow: -10px 0 30px rgba(0,0,0,0.08) !important;
          max-width: 400px !important;
          display: flex !important;
          flex-direction: column !important;
          padding-top: 20px !important;
        }
        @media (max-width: 480px) {
          cart-drawer .drawer__inner {
            max-width: 100vw !important;
            width: 100vw !important;
          }
        }
        cart-drawer .button-close {
          top: 15px !important;
          right: 15px !important;
          width: 36px !important;
          height: 36px !important;
          border-radius: 50% !important;
          background: #f9fafb !important;
          border: 1px solid #f3f4f6 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          color: #4b5563 !important;
          transition: all 0.2s !important;
        }
        cart-drawer .button-close:hover {
          background: #f3f4f6 !important;
          color: #111827 !important;
          transform: scale(1.05) !important;
        }
        cart-drawer .cart-items-wrapper {
          padding-left: 24px !important;
          padding-right: 24px !important;
          padding-top: 10px !important;
        }
        cart-drawer .cart-items-wrapper .headding {
          font-size: 20px !important;
          font-weight: 800 !important;
          letter-spacing: -0.5px !important;
          color: #111827 !important;
          border-bottom: 2px solid #111827 !important;
          padding-bottom: 12px !important;
          margin-bottom: 20px !important;
        }
        cart-drawer .cart-item {
          display: flex !important;
          align-items: center !important;
          gap: 16px !important;
          padding: 16px 0 !important;
          border-bottom: 1px solid #f3f4f6 !important;
          position: relative !important;
        }
        cart-drawer .cart-item .image-wrapper {
          border-radius: 12px !important;
          border: 1px solid #f3f4f6 !important;
          overflow: hidden !important;
          background: #fafafa !important;
          transition: transform 0.2s !important;
        }
        cart-drawer .cart-item:hover .image-wrapper {
          transform: scale(1.02) !important;
        }
        cart-drawer .cart-item__details h6 {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #374151 !important;
          line-height: 1.4 !important;
          margin: 0 0 6px 0 !important;
        }
        cart-drawer .cart-item__details .price {
          font-size: 14px !important;
          font-weight: 800 !important;
          color: #111827 !important;
        }
        cart-drawer .cart-qty-container {
          display: flex !important;
          align-items: center !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 20px !important;
          background: #fff !important;
          overflow: hidden !important;
          padding: 2px 6px !important;
        }
        cart-drawer .cart-qty-btn {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #9ca3af !important;
          background: none !important;
          border: none !important;
          width: 24px !important;
          height: 24px !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: color 0.15s !important;
        }
        cart-drawer .cart-qty-btn:hover {
          color: #111827 !important;
        }
        cart-drawer .cart-remove-btn {
          top: 16px !important;
          right: 0px !important;
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          background: none !important;
          border: none !important;
          color: #9ca3af !important;
          font-size: 14px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.15s !important;
        }
        cart-drawer .cart-remove-btn:hover {
          color: #ef4444 !important;
          background: #fef2f2 !important;
        }

        /* --- SPLASH SCREEN --- */
        .splash-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #FBCAC9;
          z-index: 9999999;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out;
        }
        .splash-screen.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        @keyframes pulseLogo {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .splash-logo {
          width: 250px;
          max-width: 80%;
          animation: pulseLogo 2s infinite ease-in-out;
          filter: drop-shadow(0 4px 15px rgba(255,255,255,0.4));
        }

        /* Hero Banner 1 auto-height to match image aspect ratio */
        .tpl23-shopify-root .slideshow {
          height: auto !important;
          min-height: unset !important;
        }
        .tpl23-shopify-root .slideshow parallax-element-section,
        .tpl23-shopify-root .slideshow .hero-no-swiper-container,
        .tpl23-shopify-root .slideshow .hero-no-swiper-wrapper {
          height: auto !important;
          min-height: unset !important;
        }
        .tpl23-shopify-root .slideshow__slide {
          height: auto !important;
          min-height: unset !important;
          position: relative !important;
        }
        .tpl23-shopify-root .slideshow__background {
          position: relative !important;
          height: auto !important;
          width: 100% !important;
          display: block !important;
          background-color: transparent !important;
        }
        /* Hero images are now absolute overlays — let inline styles + HTML classes handle them */
        .tpl23-shopify-root #hero1-image-desktop,
        .tpl23-shopify-root #hero1-image-mobile {
          position: absolute !important;
        }
        /* Force ALL slideshow wrapper heights to auto so Shopify's JS-set heights don't create gaps */
        .tpl23-shopify-root custom-slideshow,
        .tpl23-shopify-root parallax-element-section,
        .tpl23-shopify-root .hero-no-swiper-container,
        .tpl23-shopify-root .hero-no-swiper-wrapper,
        .tpl23-shopify-root .hero-no-swiper-wrapper > div {
          height: auto !important;
          min-height: unset !important;
          max-height: unset !important;
        }
        .tpl23-shopify-root .slideshow__content {
          display: none !important;
        }
      `}</style>

      <div className={`splash-screen ${!showSplash ? 'hidden' : ''}`}>
        <img src="https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/1779087644982-pegada-1779087644061.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=PPeyi%2BvN0%2B62TLw7qyFMesh00OphZaWOazNAsjn90cANf5ob9tPgJu1KOv8ICB%2FwEfnyhPGFRdqyk%2FUY7ZyuNnWuQLDi9cFL3ntbzNVJkYHj0HEibiG%2FpQ7yUDelDFO8onHfWEZtrRSWbiEx%2FN9eTwvtLrSNoBbKnunkQrS98HqLEn%2BtZPaG4O8l%2Frf%2BR61G6Cd3y0k9gtTHoas2CDDR91hQQZ32eInhg6mMwUraWyKuTX%2FcbeQZnxcNWJrLAEwY0Lyyv6SalTqU4gtZB%2FP83u4Vvo%2FBagcexcn5T6H910iFP4QEiDX%2BiFK9iLZtbZh0l2%2FmT4opjJqhPCjuQKcxXg%3D%3D" alt="Cargando Kevin & Coco..." className="splash-logo" />
      </div>

      <div
        ref={containerRef}
        className="tpl23-shopify-root template-index"
      />

      {hasPortalRoot && typeof document !== 'undefined' && document.getElementById('recent-products-portal-root') && createPortal(
        <RecentProductsSection />,
        document.getElementById('recent-products-portal-root')!
      )}
    </>
  );
}
