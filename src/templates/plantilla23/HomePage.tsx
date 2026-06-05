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
import { getServices, getAppwriteConfig, CATEGORIES_COLLECTION, SUBCATEGORIES_COLLECTION, PRODUCTS_COLLECTION, Query, formatPrice } from '@/lib/appwrite';
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
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-quantity-selector.js` },
  { src: `/shopify/plantilla23/assets/js/k-me-store-2.myshopify.com/cdn/shop/t/7/assets/cart-recommended-product-form.js` },
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
  const { addItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
        const [cRes, scRes, pRes] = await Promise.all([
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
          ])
        ]);
        setCategories(cRes.documents as unknown as Category[]);
        setSubcategories(scRes.documents as unknown as Subcategory[]);
        setProducts(pRes.documents as unknown as Product[]);
      } catch (err) {
        console.error('[Plantilla23] Error fetching categories/subcategories/products:', err);
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

      /* FIX 2: Media column must start at 100vw, not 50% */
      .split-hero .split-hero-column.split-hero-column__media {
        min-width: 100vw !important;
        max-width: 100vw !important;
      }

      /* FIX 3: Collapsed state must be 50vw */
      .split-hero .split-hero-column__media.is-collapsed {
        min-width: 50vw !important;
        max-width: 50vw !important;
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

      /* Highlight word "Novedades" in menu to black */
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
          transform-origin: left bottom !important;
          left: 0 !important;
          bottom: 50% !important;
          animation: none !important;
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
    if (!bodyHtml || !containerRef.current) return;
    if (containerRef.current.dataset.htmlSet) return;

    // Parse HTML string to DOM nodes in memory
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHtml;

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

          slide.innerHTML = `
  <div class="collection-card overflow-hidden h-full border-current relative w-full fade-in animation-element animation-delay-0">
      <a href="/productos?categoria=${cat.$id}" aria-label="${cat.name}" title="${cat.name}" class="link link-image hover-only block">
          <div class="collection-card__image-wrapper relative overflow-hidden hover-zoom-image-wrapper" data-ratio="square">
              <div class="collection-card__image w-full h-full absolute top-0 left-0 transition-all duration-300 ease-in-out transform img-blur placeholder" style="background-color: #FBCAC9;">
                  <hover-zoom-image class="w-full h-full">
                      <img src="${categoryImg}" alt="${cat.name}" loading="lazy" sizes="100vw" class="object-cover w-full h-full pointer-events-none">
                  </hover-zoom-image>
              </div>
              <div class="overlay absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out"></div>
          </div>
      </a>
      <div class="collection-card__content z-10">
          <a href="/productos?categoria=${cat.$id}" title="${cat.name}" aria-label="${cat.name}" class="transition-all duration-300 ease-in-out h-full w-full link">
              <div class="py-5 pr-2 relative">
                  <h6 class="heading transition-all duration-100 ease-in-out">
                      <span class="link-hover-animation">${cat.name}</span>
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

    containerRef.current.innerHTML = tempDiv.innerHTML;
    containerRef.current.dataset.htmlSet = '1';

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
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.dataset.isIntersecting = "true";
          // Do not autoplay collage videos when scrolled into view (they play only on hover)
          const isCollageVideo = video.classList.contains('ping-pong-video') || 
                                 video.classList.contains('ping-pong-forward') || 
                                 video.classList.contains('ping-pong-reverse') ||
                                 video.querySelector('source[src*="therea.mp4"]') || 
                                 video.querySelector('source[src*="rever.mp4"]') ||
                                 (video.src && (video.src.includes('therea.mp4') || video.src.includes('rever.mp4')));
          if (!isCollageVideo) {
            video.play().catch(() => {});
          }
        } else {
          video.dataset.isIntersecting = "false";
          video.pause();
        }
      });
    }, { threshold: 0.1 });
    root.querySelectorAll('video').forEach(video => {
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
        const desktopImg = root.querySelector('#hero1-image-desktop') as HTMLElement;
        const mobileImg = root.querySelector('#hero1-image-mobile') as HTMLElement;
        if (desktopImg) desktopImg.style.setProperty('display', 'none', 'important');
        if (mobileImg) mobileImg.style.setProperty('display', 'none', 'important');
        video.style.setProperty('z-index', '6', 'important');
      };
      video.addEventListener('playing', hideFallback);
      if (video.currentTime > 0 && !video.paused) {
        hideFallback();
      }
    });

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
      swiperObserver.observe(slide, { attributes: true, attributeFilter: ['class'] });
      // Re-trigger active ones on load
      if (slide.classList.contains('swiper-slide-active')) {
        slide.querySelectorAll('video').forEach(v => {
          v.currentTime = 0;
          v.play().catch(() => {});
        });
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
  }, [bodyHtml, categories]);

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
        <div style="padding:28px 24px 24px;text-align:center;">
          <div style="width:56px;height:56px;margin:0 auto 14px;border-radius:50%;background:linear-gradient(135deg,#fef2f8,#fce7f3);display:flex;align-items:center;justify-content:center;color:#ec4899;box-shadow:0 4px 14px rgba(236,72,153,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p style="font-size:18px;font-weight:800;color:#111;margin:0 0 8px;letter-spacing:-0.02em;">Inicia sesión o crea tu cuenta</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 20px;line-height:1.45;">Para realizar pedidos necesitas iniciar sesión o registrarte.</p>
          <a href="/login" id="yaxsel-auth-login-btn" style="display:block;width:100%;padding:14px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;box-shadow:0 6px 20px rgba(236,72,153,0.3);margin-bottom:10px;">Iniciar sesión</a>
          <a href="/login?tab=register" style="display:block;width:100%;padding:13px;background:#fff;color:#ec4899;border:2px solid #fce7f3;border-radius:14px;font-size:15px;font-weight:700;text-align:center;text-decoration:none;">Crear cuenta</a>
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
        loginBtn.addEventListener('mouseenter', () => { loginBtn.style.transform = 'translateY(-2px)'; loginBtn.style.boxShadow = '0 8px 32px rgba(236,72,153,0.25)'; });
        loginBtn.addEventListener('mouseleave', () => { loginBtn.style.transform = ''; loginBtn.style.boxShadow = '0 6px 24px rgba(236,72,153,0.15)'; });
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

      // ── Static links ──
      const bestSellersLi = document.createElement('li');
      bestSellersLi.className = 'inline-block group py-2 px-1 relative shrink-0 no-keyboard-focus';
      bestSellersLi.innerHTML = `
        <a href="/productos?tag=best-seller" title="Los Más Vendidos" aria-label="Los Más Vendidos"
            data-action="static-link"
            class="no-keyboard-focus"
            data-menu-tier="1"
        >
            <span class="link-hover-animation">Los Más Vendidos</span>
        </a>
      `;
      desktopMenu.appendChild(bestSellersLi);

      const newArrivalsLi = document.createElement('li');
      newArrivalsLi.className = 'inline-block group py-2 px-1 relative shrink-0 no-keyboard-focus';
      newArrivalsLi.innerHTML = `
        <a href="/productos?tag=new" title="Novedades" aria-label="Novedades"
            data-action="static-link"
            class="highlight no-keyboard-focus"
            data-menu-tier="1"
        >
            <span class="link-hover-animation">Novedades</span>
        </a>
      `;
      desktopMenu.appendChild(newArrivalsLi);
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

      ['Los Más Vendidos|/productos?tag=best-seller', 'Novedades|/productos?tag=new'].forEach(item => {
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
          <product-card class="product-card relative h-full mx-0 my-0 block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow" data-lifting-effect="true">
            <div class="product-card__image group group-product-card relative overflow-hidden hover-zoom-image-wrapper rounded-t-xl" data-ratio="portrait">
              <a href="${pLink}" title="${pName}" aria-label="${pName}" class="hover-only block" tabindex="-1">
                <div class="product-card__image-wrapper absolute inset-0 bg-white flex items-center justify-center p-4">
                  <img src="${pImg}" alt="${pName}" loading="lazy" class="w-full h-full object-contain pointer-events-none transition-transform duration-500 group-hover-product-card:scale-105" style="object-fit: contain !important; max-width: 100%; max-height: 100%;">
                </div>
                <div class="overlay top-0 absolute left-0 w-full h-full z-11"></div>
              </a>
              
              <div class="button-cart max-w-[95%] min-w-[45px] p-5 rounded-[100%] w-[45px] h-[45px] duration-300 ease-in-out cursor-pointer hover:py-0 hover:rounded-[0%] hover:w-auto button-cart--size z-20 absolute bottom-5 lg:bottom-10 left-0 right-0 mx-auto button--primary flex items-center justify-center inner-group"
                   role="button"
                   tabindex="0"
                   aria-label="Ver detalles de ${pName}"
                   onclick="window.location.href='${pLink}'"
              >
                <span class="button-cart__text min-w-[20px] min-h-[20px] [.inner-group:hover_&]:hidden [.inner-group:focus-within_&]:hidden flex items-center justify-center w-full h-full cursor-pointer">
                  <svg aria-hidden="true" width="20px" height="20px" class="w-[20px]" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30.622 9.602h-22.407l-1.809-7.464h-5.027v1.066h4.188l5.198 21.443c-1.108 0.323-1.923 1.334-1.923 2.547 0 1.472 1.193 2.666 2.666 2.666s2.666-1.194 2.666-2.666c0-0.603-0.208-1.153-0.545-1.599h7.487c-0.337 0.446-0.545 0.997-0.545 1.599 0 1.472 1.193 2.666 2.665 2.666s2.666-1.194 2.666-2.666c0-1.473-1.193-2.665-2.666-2.666v0h-11.403l-0.517-2.133h14.968l4.337-12.795zM13.107 27.196c0 0.882-0.717 1.599-1.599 1.599s-1.599-0.717-1.599-1.599c0-0.882 0.717-1.599 1.599-1.599s1.599 0.718 1.599 1.599zM24.836 27.196c0 0.882-0.718 1.599-1.6 1.599s-1.599-0.717-1.599-1.599c0-0.882 0.717-1.599 1.599-1.599 0.882 0 1.6 0.718 1.6 1.599zM11.058 21.331l-2.585-10.662h20.662l-3.615 10.662h-14.462z" fill="currentColor"></path>
                  </svg>
                </span>
                <span class="button-cart-hover-text hidden [.inner-group:hover_&]:inline [.inner-group:focus-within_&]:inline text-xs font-bold uppercase tracking-wider text-white">Ver Detalles</span>
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

      // 2. Populate Tab 2: Los Más Vendidos
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
        const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        
        // Update images
        const imgs = fpBlock.querySelectorAll('img');
        if (imgs.length > 0) {
          imgs.forEach((img: HTMLImageElement) => {
            img.src = resolveStorageImageUrl(randomProduct.IMAGEURL) || '';
            img.removeAttribute('srcset'); // Remove srcset to ensure the src fallback works correctly
          });
        }
        
        // Update title
        const heading = fpBlock.querySelector('h3.heading span');
        if (heading) heading.textContent = randomProduct.NAME;
        
        // Update prices
        const priceResolved = resolveProductDisplayPrice(randomProduct, apertura);
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
        if (badge) badge.textContent = `${randomProduct.STOCK} in stock`;
        
        // Update description
        const descBlock = fpBlock.querySelector('.body-text[data-index="6"] p');
        if (descBlock) descBlock.innerHTML = randomProduct.DESCRIPTION || '';
        
        // Remove variants to avoid messing with sizes
        const variantSelector = fpBlock.querySelector('variant-selector');
        if (variantSelector) variantSelector.remove();
        
        // Update cart button onClick to add THIS product and go to carrito
        const btn = fpBlock.querySelector('.button-cart');
        if (btn) {
          btn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(randomProduct, 1);
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
          fullDetailsLink.href = `/productos/${randomProduct.$id}`;
        }
        
        // Update vendor
        const vendor = fpBlock.querySelector('.vendor span');
        if (vendor) vendor.textContent = randomProduct.BRAND || 'Yaxsell';
      });

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

    root.dataset.navInjected = '1';
  }, [categories, subcategories, products]);

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
    if ((window as any).__tpl23ScriptsLoaded) return;
    (window as any).__tpl23ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl23="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `${file.src}?v=${Date.now()}`;
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
              hoverContainer.dataset.isHovered = "true";
              activeVideo.play().catch(() => {});
            });

            hoverContainer.addEventListener('mouseleave', () => {
              hoverContainer.dataset.isHovered = "false";
              forward.pause();
              reverse.pause();
            });
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
        Cargando plantilla 23...
      </div>
    );
  }

  return (
    <>
      <style>{`
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
      `}</style>

      <div className={`splash-screen ${!showSplash ? 'hidden' : ''}`}>
        <img src="https://storage.googleapis.com/geminai-449212.firebasestorage.app/KEVINCOCO/1779087644982-pegada-1779087644061.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=PPeyi%2BvN0%2B62TLw7qyFMesh00OphZaWOazNAsjn90cANf5ob9tPgJu1KOv8ICB%2FwEfnyhPGFRdqyk%2FUY7ZyuNnWuQLDi9cFL3ntbzNVJkYHj0HEibiG%2FpQ7yUDelDFO8onHfWEZtrRSWbiEx%2FN9eTwvtLrSNoBbKnunkQrS98HqLEn%2BtZPaG4O8l%2Frf%2BR61G6Cd3y0k9gtTHoas2CDDR91hQQZ32eInhg6mMwUraWyKuTX%2FcbeQZnxcNWJrLAEwY0Lyyv6SalTqU4gtZB%2FP83u4Vvo%2FBagcexcn5T6H910iFP4QEiDX%2BiFK9iLZtbZh0l2%2FmT4opjJqhPCjuQKcxXg%3D%3D" alt="Cargando Kevin & Coco..." className="splash-logo" />
      </div>

      <div
        ref={containerRef}
        className="tpl23-shopify-root template-index"
      />

    </>
  );
}
