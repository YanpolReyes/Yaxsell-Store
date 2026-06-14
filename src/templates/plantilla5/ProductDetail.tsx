'use client';
/* ════════════════════════════════════════════════════════════════════
   PLANTILLA 5 — Shopify Theme Capturado por FOLLA v2
   ──────────────────────────────────────────────────────────────────
   ⚠️  BOILERPLATE: Requiere revisión manual antes de usar.
   ──────────────────────────────────────────────────────────────────
   Estrategia:
   - Render del HTML body limpio via containerRef.innerHTML
   - Carga dinámica de CSS via <link> tags en <head>
   - Carga dinámica de JS via <script> tags secuenciales
   - Scripts inline de animación están en product-clean.html (se ejecutan al inyectar)
   - Scripts de Shopify problemáticos excluidos
   - .in-view forzado en .animation-element tras carga
   ════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, TIMED_OFFERS_COLLECTION, formatPrice, STOCK_REQUESTS_COLLECTION } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { normalizeProductImages, resolveStorageImageUrl } from '@/lib/product-images';
import { Query } from 'appwrite';
import { Product, TimedOffer } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import ReviewSection from '@/components/ReviewSection';
import ProductQuestions from '@/components/ProductQuestions';
import { getCustomTabsFromFeatures } from '@/lib/product-features';

function getExpiresAtEpochSeconds(offer: TimedOffer): number | null {
  if (offer.timeType === 'endDateTime' && offer.endDateTime) {
    return Math.floor(new Date(offer.endDateTime).getTime() / 1000);
  }
  if (offer.timeType === 'duration' && offer.durationHours) {
    const start = offer.activatedAt || (offer as any).$createdAt;
    if (start) {
      return Math.floor((new Date(start).getTime() + offer.durationHours * 3600000) / 1000);
    }
  }
  return null;
}

const SHOPIFY_BASE = '/shopify/plantilla5/assets';

/* ── CSS files: ORDEN CRÍTICO — inline primero, luego core, luego secciones ── */
const CSS_FILES = [
  `/shopify/plantilla5/assets/css/inline/index-inline-1.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/theme.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/photoswipe.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/component-non-critical.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/menu-drawer.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/header-menu.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/section-product-information.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shopifycloud/portable-wallets/latest/accelerated-checkout-backwards-compat.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/component-localization-dropdown.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/pickup-availability.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-video-testimonials.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-drawer.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-modules.css`,
  `/shopify/plantilla5/assets/css/pebble-little.myshopify.com/cdn/shop/t/22/assets/quick-view.css`
];

/* ── JS files: solo los críticos del tema ── */
type JsFile = { src: string; module?: boolean };
const JS_FILES: JsFile[] = [
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/motion-component.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/custom-elements.js` },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/carousel.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/modules.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/theme.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/dialog.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/variant-picker.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/media-gallery.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-card.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-price.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-badge.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-inventory.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/quantity-selector.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-form.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/gift-card-recipient-form.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-count.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/quick-add.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/video-card.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/sticky-add-to-cart.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/search.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-note.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-discount.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/free-shipping-goal.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/localization.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/page-transition.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/critical.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-video-testimonials.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/product-recommendations.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/card-layered.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-drawer.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-items.js`, module: true },
  { src: `/shopify/plantilla5/assets/js/pebble-little.myshopify.com/cdn/shop/t/22/assets/cart-shipping.js`, module: true }
];

/* ── Font faces ── */
const FONT_FACE_CSS = `
@font-face {
  font-family: "Bricolage Grotesque";
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n5.8c091e52a78b3e58ef96221ce55140a80a8253ff.woff2") format("woff2"),
       url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n5.fd299922888265641eb4cdf8883119ce0130018b.woff") format("woff");
}
@font-face {
  font-family: "Bricolage Grotesque";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n7.de5675dd7a8e145fdc4cb2cfe67a16cb085528d0.woff2") format("woff2"),
       url("/shopify/plantilla5/assets/fonts/pebble-little.myshopify.com/cdn/fonts/bricolage_grotesque/bricolagegrotesque_n7.d701b766b46c76aceb10c78473f491dff9b09e5e.woff") format("woff");
}
`;

export default function ProductDetail({ previewProductId }: { previewProductId?: string }) {
  const params = useParams<{ id: string; productId?: string }>();
  const id = previewProductId || params.productId || params.id;
  const router = useRouter();
  const { addItem } = useCart();
  const { unlimitedStock } = useStoreSettings();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<TimedOffer | null>(null);
  const { settings: apertura, isActive: aperturaActive, discountPercent: aperturaPct } = useAperturaPromotion();
  
  const [related, setRelated] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');

  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  // variantLabels: map productId -> custom label (e.g. 'Rojo', 'Verde')
  const [variantLabels, setVariantLabels] = useState<Record<string, string>>({});
  // activeVariantId: which linked product is currently shown inline
  const [activeVariantId, setActiveVariantId] = useState<string>('');
  // activeVariantProduct: the actual product data for the currently shown variant
  const activeVariantProduct = linkedProducts.find(lp => lp.$id === activeVariantId) || product;

  const [refElement, setRefElement] = useState<HTMLDivElement | null>(null);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Stock Requests state
  const { user } = useAuth();
  const [isStockRequestModalOpen, setIsStockRequestModalOpen] = useState(false);
  const [stockRequestQty, setStockRequestQty] = useState(1);
  const [isRequestingStock, setIsRequestingStock] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  /* ── Fetch Product from Appwrite ── */
  /* ── Fetch Product from Appwrite API (CACHED) ── */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public-data/product-detail?id=${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error fetching product data');
        const data = await res.json();
        
        setProduct(data.product || null);
        setLinkedProducts(data.linkedProducts || []);
        setActiveVariantId(data.product?.$id || '');
        setVariantLabels(data.variantLabels || {});
        setCategoryName(data.categoryName || '');
        setRelated(data.relatedProducts || []);
        setActiveOffer(data.activeOffer || null);

      } catch (err) {
        console.warn('Error fetching product from backend API:', err);
        setLoadError('Error fetching product: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      load();
    }
  }, [id, router]);

  /* ── Mark template attribute on document for CSS scoping ── */
  useEffect(() => {
    document.documentElement.dataset.template = '5';
    return () => { delete document.documentElement.dataset.template; };
  }, []);

  /* ── Load font faces ── */
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tpl5-fontfaces';
    styleEl.textContent = FONT_FACE_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  /* ── Load CSS files dynamically ── */
  useEffect(() => {
    CSS_FILES.forEach(href => {
      const existing = document.querySelector(`link[data-tpl5="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-tpl5', href);
      document.head.appendChild(link);
    });
  }, []);

  /* ── Check for pending stock requests ── */
  useEffect(() => {
    if (!user || !product) return;
    async function checkPendingRequest() {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, STOCK_REQUESTS_COLLECTION, [
          Query.equal('productId', product!.$id),
          Query.equal('userId', user!.id),
          Query.equal('status', 'pending')
        ]);
        if (res.total > 0) {
          setHasPendingRequest(true);
        }
      } catch (err: any) {
        // Silently ignore if collection doesn't exist yet
        if (!err?.message?.includes('could not be found')) {
          console.error('Error checking stock requests:', err);
        }
      }
    }
    checkPendingRequest();
  }, [user, product]);

  /* ── Fetch the cleaned HTML body content ── */
  useEffect(() => {
    let aborted = false;
    fetch('/shopify/plantilla5/product-clean.html', { cache: 'no-cache' })
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
        console.error('[Plantilla5] Error loading product-clean.html', err);
        setLoadError(err.message || 'Error de carga');
      });
    return () => { aborted = true; };
  }, []);

  /* ── Switch displayed variant inline (no page navigation) ── */
  const switchVariant = (targetProduct: Product) => {
    if (!refElement) return;
    const root = refElement;
    const vImages = [targetProduct.IMAGEURL, (targetProduct as any).IMAGEURL2, (targetProduct as any).IMAGEURL3].filter(Boolean).map((v: string) => resolveStorageImageUrl(v)) as string[];

    // Update main gallery images (excluding thumbnails to prevent overwriting thumbnail row)
    root.querySelectorAll('.product__media img, .global-media-settings img, img[src*="LogoPoloRed"], .product__media-list img, .media img').forEach((img: any) => {
      if (img.closest('.carousel__thumbnail') || img.closest('.media-gallery__grid-thumbnails') || img.closest('.media-gallery__carousel-thumbnails')) {
        return;
      }
      const targetImg = vImages[0];
      if (!targetImg) return;
      
      img.src = targetImg;
      if (img.srcset) img.srcset = targetImg;
      img.setAttribute('src', targetImg);
      img.setAttribute('srcset', targetImg);
      img.setAttribute('data-media-src', targetImg);
      img.setAttribute('data-src', targetImg);
      
      const picture = img.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach((source: any) => {
          source.srcset = targetImg;
          source.setAttribute('srcset', targetImg);
          source.setAttribute('data-srcset', targetImg);
        });
      }
    });

    // Update thumbnail list images to show the different views
    root.querySelectorAll('.media-gallery__carousel-thumbnails img, .media-gallery__grid-thumbnails img, .thumbnail-list__item img').forEach((img: any, idx: number) => {
      const targetImg = vImages[idx % vImages.length] || vImages[0];
      img.src = targetImg;
      if (img.srcset) img.srcset = targetImg;
      img.setAttribute('src', targetImg);
      img.setAttribute('srcset', targetImg);
    });

    // Update title
    root.querySelectorAll('h1').forEach(h1 => { h1.textContent = targetProduct.NAME; });
    root.querySelectorAll('.reversed-link__text, [data-product-title]').forEach(el => { el.textContent = targetProduct.NAME; });

    // Update price
    const vPrice = formatPrice(targetProduct.PRICE);
    root.querySelectorAll('.price, .price-item, .price__regular span, .price__sale span, .product-card__price').forEach(el => {
      if (el.textContent?.includes('$') || el.textContent?.includes('CLP') || el.textContent?.trim() === '') {
        el.textContent = vPrice;
      }
    });

    // Rewire Add to Cart button for the new variant
    const qtyInput = root.querySelector('input[name="quantity"]') as HTMLInputElement;
    const addToCartBtn = root.querySelector('.add-to-cart-button') as HTMLElement | null;
    if (addToCartBtn) {
      // Clone to remove old listeners
      const newBtn = addToCartBtn.cloneNode(true) as HTMLButtonElement;
      delete (newBtn as any).dataset.cartBound;
      addToCartBtn.parentNode?.replaceChild(newBtn, addToCartBtn);
      newBtn.dataset.cartBound = '1';
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        addItem(targetProduct, qty);
        const textContent = newBtn.querySelector('.add-to-cart-text__content');
        if (textContent) {
          const originalText = textContent.textContent;
          textContent.textContent = '¡Añadido!';
          setTimeout(() => { textContent.textContent = originalText; }, 2000);
        }
      });
    }

    // Rewire Buy it now button
    const customBuyBtn = root.querySelector('.yaxsell-custom-buy-button') as HTMLButtonElement | null;
    if (customBuyBtn) {
      const newBuyBtn = customBuyBtn.cloneNode(true) as HTMLButtonElement;
      customBuyBtn.parentNode?.replaceChild(newBuyBtn, customBuyBtn);
      newBuyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        addItem(targetProduct, qty);
        router.push('/carrito');
      });
    }

    // Update variant picker highlights
    root.querySelectorAll('[data-variant-btn]').forEach((btn: any) => {
      const isActive = btn.dataset.variantBtn === targetProduct.$id;
      btn.style.border = isActive ? '2.5px solid #111827' : '1px solid #e5e7eb';
      btn.style.transform = isActive ? 'translateY(-2px)' : 'translateY(0)';
      btn.style.boxShadow = isActive ? '0 6px 12px rgba(17, 24, 39, 0.12)' : 'none';
      btn.style.opacity = isActive ? '1' : '0.85';
    });

    // Update the variant label display
    const labelEl = root.querySelector('#yaxsell-variant-label') as HTMLElement | null;
    if (labelEl) {
      const label = variantLabels[targetProduct.$id] || '';
      labelEl.textContent = label;
      labelEl.style.display = label ? 'inline-block' : 'none';
    }
  };

  /* ── Helper to dynamically overwrite/apply Yaxsell product data ── */
  const applyYaxsellData = () => {
    if (!product || !refElement) return;
    
    const root = refElement;
    
    // Use the currently active variant product data (or fall back to base product)
    const displayProduct = (activeVariantId && activeVariantId !== product.$id)
      ? (linkedProducts.find(lp => lp.$id === activeVariantId) || product)
      : product;

    // Resolve prices
    const priceResolved = activeOffer ? {
      displayPrice: activeOffer.discountPrice,
      originalPrice: activeOffer.originalPrice,
      hasDiscount: true,
      discountPercent: activeOffer.discountPercentage,
      fromApertura: false
    } : resolveProductDisplayPrice(displayProduct, apertura);
    const displayPrice = priceResolved.displayPrice;
    const formattedPrice = formatPrice(displayPrice);

    // 1. Inject variant thumbnails — clicking switches inline, no navigation
    root.querySelectorAll('variant-picker, .variant-picker').forEach(el => {
      if (linkedProducts && linkedProducts.length > 1) {
        (el as HTMLElement).style.display = 'block';
        
        const currentActiveId = activeVariantId || product.$id;
        
        let variantsHtml = `<div style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
            <span style="font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Modelo:</span>
            <span id="yaxsell-variant-label" style="font-size: 13px; font-weight: 600; color: #db2777; background: #fdf2f8; padding: 4px 12px; border-radius: 20px; border: 1px solid #fbcfe8; display: none;"></span>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">`;
          
        linkedProducts.forEach(lp => {
          const isActive = lp.$id === currentActiveId;
          const label = variantLabels[lp.$id] || '';
          const imgUrl = resolveStorageImageUrl(lp.IMAGEURL);
          const borderStyle = isActive
            ? 'border: 2.5px solid #111827; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(17, 24, 39, 0.12); opacity: 1;'
            : 'border: 1px solid #e5e7eb; transform: translateY(0); box-shadow: none; opacity: 0.85;';
          variantsHtml += `
            <button 
              data-variant-btn="${lp.$id}"
              data-variant-label="${label}"
              style="display: block; width: 80px; height: 80px; border-radius: 16px; overflow: hidden; ${borderStyle} cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); background: #ffffff; padding: 3px; outline: none; position: relative;"
              title="${label || lp.NAME}"
            >
              <img src="${imgUrl}" alt="${label || lp.NAME}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />
            </button>
          `;
        });
        
        variantsHtml += `</div></div>`;
        el.innerHTML = variantsHtml;

        // Update the label display
        const labelEl = el.querySelector('#yaxsell-variant-label') as HTMLElement | null;
        if (labelEl) {
          const activeBtn = el.querySelector(`[data-variant-btn="${currentActiveId}"]`) as HTMLElement | null;
          const text = activeBtn?.dataset.variantLabel || '';
          labelEl.textContent = text;
          labelEl.style.display = text ? 'inline-block' : 'none';
        }

        // Bind click handlers for inline switching
        el.querySelectorAll('[data-variant-btn]').forEach((btn: any) => {
          // Avoid re-binding
          if (btn.dataset.variantBound) return;
          btn.dataset.variantBound = '1';
          btn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            const targetId = btn.dataset.variantBtn;
            const targetProduct = linkedProducts.find(lp => lp.$id === targetId);
            if (!targetProduct) return;
            setActiveVariantId(targetId);
            switchVariant(targetProduct);
          });
        });

      } else {
        (el as HTMLElement).style.display = 'none';
      }
    });

    // 1b. Bind click handlers for mobile thumbnails to allow switching images on mobile
    root.querySelectorAll('.media-gallery__carousel-thumbnails .carousel__thumbnail').forEach((thumb: any, idx: number) => {
      if (thumb.dataset.thumbBound) return;
      thumb.dataset.thumbBound = '1';
      thumb.style.cursor = 'pointer';
      
      thumb.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Try Swiper transition first
        const swiperContainer = root.querySelector('.media-gallery__carousel-container') as any;
        if (swiperContainer && swiperContainer.swiper) {
          swiperContainer.swiper.slideTo(idx);
        } else {
          // Fallback: manually update the main display image
          const vImages = [displayProduct.IMAGEURL, (displayProduct as any).IMAGEURL2, (displayProduct as any).IMAGEURL3].filter(Boolean).map((v: string) => resolveStorageImageUrl(v)) as string[];
          const targetImg = vImages[idx % vImages.length] || vImages[0];
          root.querySelectorAll('.product__media img, .global-media-settings img, .product__media-list img, .media img').forEach((img: any) => {
            if (img.closest('.carousel__thumbnail') || img.closest('.media-gallery__grid-thumbnails') || img.closest('.media-gallery__carousel-thumbnails')) {
              return;
            }
            img.src = targetImg;
            if (img.srcset) img.srcset = targetImg;
          });
        }
        
        // Update active class highlights
        root.querySelectorAll('.media-gallery__carousel-thumbnails .carousel__thumbnail').forEach((t: any, tIdx: number) => {
          if (tIdx === idx) {
            t.classList.add('swiper-slide-active');
            t.style.borderColor = '#db2777';
            t.style.opacity = '1';
          } else {
            t.classList.remove('swiper-slide-active');
            t.style.borderColor = '#e5e7eb';
            t.style.opacity = '0.75';
          }
        });
      });
    });

    // 2. Inyectar Bloque Informativo de Envío y Stock (estilo Yaxsell / Plantilla 1) usando la estructura exacta de local-pickup
    const isLimitedStock = displayProduct ? (displayProduct.STOCK !== undefined && displayProduct.STOCK !== null && displayProduct.STOCK < 99999) : false;
    const stock = isLimitedStock ? (displayProduct?.STOCK ?? 0) : 99999;
    const isSoldOut = isLimitedStock && stock <= 0;
    const stockColor = stock > 10 ? '#10b981' : stock > 5 ? '#f59e0b' : stock > 0 ? '#ef4444' : '#9ca3af';
    const stockLabel = stock > 10 ? 'Stock disponible' : stock > 5 ? 'Stock limitado' : stock > 0 ? `Últimas unidades (${stock} disp.)` : 'Sin stock';

    const localPickup = root.querySelector('local-pickup, .product__pickup-availabilities');
    if (localPickup) {
      (localPickup as HTMLElement).style.display = 'block';
      localPickup.innerHTML = `
        <div class="pickup-availabilities__info" style="margin-top: 16px;">
          <div class="pickup-availabilities__info-wrapper" style="position: relative; border-radius: 12px; overflow: hidden; background: linear-gradient(145deg, #ffffff, #f9fafb); border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); width: 100%; transition: transform 0.2s ease, box-shadow 0.2s ease;">
            <!-- Barra decorativa superior -->
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #111827, #4b5563);"></div>
            
            <div class="pickup-availabilities__info-content" style="display: flex; align-items: flex-start; gap: 16px; padding: 20px;">
              <!-- Contenedor del ícono -->
              <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #ffffff; border-radius: 10px; flex-shrink: 0; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02); color: #111827;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" style="width: 24px; height: 24px;">
                  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 17.449V27h20v-9.551M6.75 5h18.5a1 1 0 0 1 .961.725L28 12H4l1.793-6.275A1 1 0 0 1 6.75 5"></path>
                    <path d="M12 12v2a4 4 0 1 1-8 0v-2m16 0v2a4 4 0 1 1-8 0v-2m16 0v2a4 4 0 1 1-8 0v-2"></path>
                  </g>
                </svg>
              </div>

              <!-- Contenido principal -->
              <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;">
                <h4 style="margin: 0; font-weight: 700; color: #111827; font-size: 15px; letter-spacing: -0.01em; line-height: 1.2;">Sale entre hoy y mañana</h4>
                
                <div style="display: flex; flex-direction: column; gap: 4px; color: #4b5563; font-size: 13px; line-height: 1.4;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #6b7280;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Envío disponible a todo Chile</span>
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                    <!-- Punto animado (Pulse) para Stock -->
                    <span style="position: relative; display: flex; width: 8px; height: 8px;">
                      <span style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 50%; background-color: ${stockColor}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                      <span style="position: relative; display: inline-flex; border-radius: 50%; width: 8px; height: 8px; background-color: ${stockColor};"></span>
                    </span>
                    <span style="font-weight: 600; color: ${stockColor};">${stockLabel}</span>
                  </div>
                </div>
              </div>
              
              <!-- Flecha derecha -->
              <div style="display: flex; align-items: center; justify-content: center; align-self: center; width: 24px; height: 24px; color: #9ca3af;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" style="width: 20px; height: 20px; color: currentColor;">
                  <path fill="none" d="M0 0H20V20H0V0z"></path>
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7.5 3.75L13.75 10L7.5 16.25" fill="none"></path>
                </svg>
              </div>
            </div>
            <style>
              @keyframes ping {
                75%, 100% {
                  transform: scale(2.5);
                  opacity: 0;
                }
              }
            </style>
          </div>
        </div>
      `;
    }

    // 3. Título del Producto
    root.querySelectorAll('h1').forEach(h1 => {
      h1.textContent = product.NAME;
    });
    
    root.querySelectorAll('.reversed-link__text, [data-product-title]').forEach(el => {
      el.textContent = product.NAME;
      if (el.getAttribute('data-product-title')) el.setAttribute('data-product-title', product.NAME);
      if (el.getAttribute('aria-label') === 'Logo Polo Red') el.setAttribute('aria-label', product.NAME);
    });

    // 4. Precios
    root.querySelectorAll('.price, .price-item, .price__regular span, .price__sale span, .product-card__price').forEach(el => {
      if (el.textContent?.includes('$') || el.textContent?.includes('CLP') || el.textContent?.trim() === '$0' || el.textContent?.trim() === '') {
        el.textContent = formattedPrice;
      }
    });

    // 5. Descripción y Custom Tabs
    // Eliminar el acordeón original
    root.querySelectorAll('accordion-component, .accordion, .block-accordion').forEach(el => el.remove());

    // Inyectar la descripción y las pestañas técnicas
    root.querySelectorAll('div[class*="product_description"]').forEach(el => {
      if ((el as any).dataset.yaxsellInjected) return;
      (el as any).dataset.yaxsellInjected = 'true';

      const customTabs = getCustomTabsFromFeatures(product.FEATURES) ?? {};
      const techDetails = customTabs.details || '';
      const usageInstructions = customTabs.usage || '';
      const ingredientsList = customTabs.ingredients || '';

      let specsHtml = '';
      if (techDetails || usageInstructions || ingredientsList) {
        specsHtml = `
          <div class="yaxsell-product-details-specs" style="margin-top: 32px; display: flex; flex-direction: column; gap: 20px; width: 100%;">
            <!-- Detalles del Producto -->
            ${techDetails ? `
              <div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1.5px solid #fbcfe8; border-radius: 18px; padding: 20px; box-shadow: 0 4px 20px rgba(219,39,119,0.03); transition: transform 0.2s ease;">
                <h3 style="font-size: 14px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #db2777;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  Detalles del Producto
                </h3>
                <div style="font-size: 13.5px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-line;">${techDetails}</div>
              </div>
            ` : ''}

            <!-- Modo de Uso -->
            ${usageInstructions ? `
              <div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1.5px solid #fbcfe8; border-radius: 18px; padding: 20px; box-shadow: 0 4px 20px rgba(219,39,119,0.03); transition: transform 0.2s ease;">
                <h3 style="font-size: 14px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #db2777;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  Modo de Uso
                </h3>
                <div style="font-size: 13.5px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-line;">${usageInstructions}</div>
              </div>
            ` : ''}

            <!-- Ingredientes -->
            ${ingredientsList ? `
              <div style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1.5px solid #fbcfe8; border-radius: 18px; padding: 20px; box-shadow: 0 4px 20px rgba(219,39,119,0.03); transition: transform 0.2s ease;">
                <h3 style="font-size: 14px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #db2777;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                  Ingredientes y Composición
                </h3>
                <div style="font-size: 13.5px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-line;">${ingredientsList}</div>
              </div>
            ` : ''}
          </div>
        `;
      }

      el.innerHTML = `
        <div class="product-description-content" style="font-size: 14px; line-height: 1.7; color: #374151; margin-bottom: 24px;">
          ${product.DESCRIPTION || ''}
        </div>
        ${specsHtml}
      `;
    });

    // 6. Imágenes de la Galería Principal
    const pImages = [product.IMAGEURL, product.IMAGEURL2, product.IMAGEURL3, product.IMAGEURL4, product.IMAGEURL5].filter(Boolean).map(v => resolveStorageImageUrl(v)) as string[];
    
    if (pImages.length > 0) {
      root.querySelectorAll('.product__media img, .global-media-settings img, img[src*="LogoPoloRed"]').forEach((img: any, idx) => {
        const targetImg = pImages[idx % pImages.length] || pImages[0];
        img.src = targetImg;
        if (img.srcset) {
          img.srcset = targetImg;
        }
        if (img.getAttribute('data-media-src')) {
          img.setAttribute('data-media-src', targetImg);
        }
        img.alt = product.NAME;
      });
      
      root.querySelectorAll('.thumbnail img, .thumbnail-list__item img, img[src*="LogoPoloRed"]').forEach((img: any, idx) => {
        const targetImg = pImages[idx % pImages.length] || pImages[0];
        img.src = targetImg;
        if (img.srcset) {
          img.srcset = targetImg;
        }
        img.alt = product.NAME;
      });
    }

    // 7. Tarjetas de Productos Relacionados (Desactivado)
    root.querySelectorAll('product-recommendations, .related-products').forEach((el: any) => el.remove());


    // 9. Reconstruir Breadcrumbs
    root.querySelectorAll('.breadcrumbs, nav[aria-label="breadcrumbs"]').forEach((nav: any) => {
      nav.innerHTML = `
        <a href="/" class="reversed-link">Inicio</a>
        <span aria-hidden="true" class="breadcrumbs__sep"></span>
        <a href="/productos" class="reversed-link">Productos</a>
        ${categoryName ? `
          <span aria-hidden="true" class="breadcrumbs__sep"></span>
          <a href="/productos?categoria=${encodeURIComponent(categoryName)}" class="reversed-link">${categoryName}</a>
        ` : ''}
        <span aria-hidden="true" class="breadcrumbs__sep breadcrumbs__sep--last"></span>
        <span class="breadcrumbs__last color-subtext text-ellipsis">${product.NAME}</span>
      `;
    });

    // Override quantity selector component buttons to prevent Shopify template restriction
    const qtyInput = root.querySelector('input[name="quantity"]') as HTMLInputElement;
    const minusBtn = root.querySelector('button[name="minus"]') as HTMLButtonElement | null;
    const plusBtn = root.querySelector('button[name="plus"]') as HTMLButtonElement | null;
    
    if (qtyInput) {
      const maxStock = isLimitedStock ? (displayProduct?.STOCK ?? 0) : 99999;
      qtyInput.dataset.maxStock = String(maxStock);
      qtyInput.setAttribute('max', String(maxStock));
      qtyInput.max = String(maxStock);
      
      if (isSoldOut) {
        qtyInput.value = '0';
        qtyInput.setAttribute('disabled', 'true');
        qtyInput.style.opacity = '0.5';
      } else {
        if (qtyInput.value === '0') qtyInput.value = '1';
        qtyInput.removeAttribute('disabled');
        qtyInput.style.opacity = '1';
      }

      if (minusBtn && plusBtn && !qtyInput.dataset.overrideBound) {
        qtyInput.dataset.overrideBound = '1';
        const newMinus = minusBtn.cloneNode(true) as HTMLButtonElement;
        const newPlus = plusBtn.cloneNode(true) as HTMLButtonElement;
        minusBtn.parentNode?.replaceChild(newMinus, minusBtn);
        plusBtn.parentNode?.replaceChild(newPlus, plusBtn);

        newMinus.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSoldOut) return;
          const currentVal = parseInt(qtyInput.value) || 1;
          if (currentVal > 1) {
            qtyInput.value = String(currentVal - 1);
            qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        newPlus.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSoldOut) return;
          const currentVal = parseInt(qtyInput.value) || 1;
          const maxLimit = parseInt(qtyInput.dataset.maxStock || '99999') || 99999;
          if (currentVal < maxLimit) {
            qtyInput.value = String(currentVal + 1);
            qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        qtyInput.addEventListener('input', () => {
          let val = parseInt(qtyInput.value) || 1;
          const maxLimit = parseInt(qtyInput.dataset.maxStock || '99999') || 99999;
          if (val < 1) val = 1;
          if (val > maxLimit) val = maxLimit;
          qtyInput.value = String(val);
        });
      }
    }

    // 10. Integrar el Botón de Añadir al Carrito
    const addToCartBtn = root.querySelector('.add-to-cart-button') as HTMLButtonElement | null;
    if (addToCartBtn) {
      if (isSoldOut) {
        addToCartBtn.setAttribute('disabled', 'true');
        addToCartBtn.style.opacity = '0.5';
        addToCartBtn.style.cursor = 'not-allowed';
        const textContent = addToCartBtn.querySelector('.add-to-cart-text__content');
        if (textContent) {
          textContent.textContent = 'Agotado';
        }
      } else {
        addToCartBtn.removeAttribute('disabled');
        addToCartBtn.style.opacity = '1';
        addToCartBtn.style.cursor = 'pointer';
        const textContent = addToCartBtn.querySelector('.add-to-cart-text__content');
        if (textContent) {
          textContent.textContent = 'Añadir al carrito';
        }
      }

      if (!addToCartBtn.dataset.cartBound) {
        addToCartBtn.dataset.cartBound = '1';
        const newBtn = addToCartBtn.cloneNode(true) as HTMLButtonElement;
        addToCartBtn.parentNode?.replaceChild(newBtn, addToCartBtn);
        
        newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const currentProduct = (activeVariantId && activeVariantId !== product.$id)
            ? (linkedProducts.find(lp => lp.$id === activeVariantId) || product)
            : product;
          
          const isCurrentSoldOut = (currentProduct.STOCK !== undefined && currentProduct.STOCK !== null && currentProduct.STOCK < 99999) && currentProduct.STOCK <= 0;
          if (isCurrentSoldOut) return;

          const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
          addItem(currentProduct, qty, activeOffer?.discountPrice, activeOffer ? (getExpiresAtEpochSeconds(activeOffer) || 0) * 1000 : undefined);
          
          const textContent = newBtn.querySelector('.add-to-cart-text__content');
          if (textContent) {
            const originalText = textContent.textContent;
            textContent.textContent = '¡Añadido al Carrito!';
            setTimeout(() => {
              textContent.textContent = originalText;
            }, 2000);
          }
        });
      }
    }

    // Unhide the accelerated checkout blocks
    root.querySelectorAll('.accelerated-checkout-block').forEach((el: any) => {
      el.classList.remove('no-js-hidden');
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('opacity', '1', 'important');
    });

    // 11. Integrar el Botón de Comprar Ahora (Buy it now)
    const paymentButtonContainer = root.querySelector('.shopify-payment-button') as HTMLElement | null;
    if (paymentButtonContainer) {
      // Si el contenedor existe, asegurémonos de que esté visible
      paymentButtonContainer.style.setProperty('display', 'block', 'important');
      paymentButtonContainer.style.setProperty('visibility', 'visible', 'important');
      paymentButtonContainer.style.setProperty('opacity', '1', 'important');
      
      // Busquemos si ya tenemos nuestro botón inyectado
        let customBuyBtn = paymentButtonContainer.querySelector('.yaxsell-custom-buy-button') as HTMLButtonElement | null;
        if (!customBuyBtn) {
          paymentButtonContainer.innerHTML = '';
          customBuyBtn = document.createElement('button');
          customBuyBtn.type = 'button';
          
          customBuyBtn.className = 'shopify-payment-button__button shopify-payment-button__button--unbranded yaxsell-custom-buy-button';
          customBuyBtn.textContent = 'Comprar ahora';
          
          customBuyBtn.style.width = '100%';
          customBuyBtn.style.background = '#000000';
          customBuyBtn.style.color = '#ffffff';
          customBuyBtn.style.border = '1px solid #000000';
          
          // Make it match the size and shape of the Add to Cart button
          const addToCartBtn = root.querySelector('.add-to-cart-button') as HTMLElement | null;
          if (addToCartBtn) {
            const computedStyle = window.getComputedStyle(addToCartBtn);
            customBuyBtn.style.borderRadius = computedStyle.borderRadius || '40px';
            customBuyBtn.style.minHeight = computedStyle.minHeight;
            customBuyBtn.style.height = computedStyle.height;
            customBuyBtn.style.padding = computedStyle.padding;
            customBuyBtn.style.fontSize = computedStyle.fontSize;
            customBuyBtn.style.fontWeight = computedStyle.fontWeight;
            customBuyBtn.style.letterSpacing = computedStyle.letterSpacing;
            customBuyBtn.style.fontFamily = computedStyle.fontFamily;
          } else {
            customBuyBtn.style.borderRadius = '40px';
            customBuyBtn.style.padding = '14px 20px';
            customBuyBtn.style.fontSize = '15px';
            customBuyBtn.style.fontWeight = '400';
          }
          
          customBuyBtn.style.cursor = 'pointer';
          customBuyBtn.style.transition = 'all 0.2s ease';
          customBuyBtn.style.marginTop = '10px';
          customBuyBtn.style.display = 'block';

          customBuyBtn.onmouseenter = () => {
            customBuyBtn!.style.background = '#ffffff';
            customBuyBtn!.style.color = '#000000';
          };
          customBuyBtn.onmouseleave = () => {
            customBuyBtn!.style.background = '#000000';
            customBuyBtn!.style.color = '#ffffff';
          };
          
          paymentButtonContainer.appendChild(customBuyBtn);
          
          customBuyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const qtyInput = root.querySelector('input[name="quantity"]') as HTMLInputElement;
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            // Use the currently active variant product
            const currentProduct = (activeVariantId && activeVariantId !== product.$id)
              ? (linkedProducts.find(lp => lp.$id === activeVariantId) || product)
              : product;
            addItem(currentProduct, qty, activeOffer?.discountPrice, activeOffer ? (getExpiresAtEpochSeconds(activeOffer) || 0) * 1000 : undefined);
            
            router.push('/carrito');
          });
        }
        
        if (isSoldOut) {
          customBuyBtn.style.setProperty('display', 'none', 'important');
        } else {
          customBuyBtn.style.setProperty('display', 'block', 'important');
        }

        let reqBtn = paymentButtonContainer.querySelector('.yaxsell-request-stock-btn') as HTMLButtonElement | null;
        if (reqBtn) {
          reqBtn.remove();
        }
    }

    // Inject global pack countdown timer if product has active offer
    if (activeOffer && activeOffer.endDateTime) {
      const priceContainer = root.querySelector('.price') || root.querySelector('.product__info-container .price');
      if (priceContainer && !root.querySelector('#yaxsell-product-countdown')) {
        const timerWrapper = document.createElement('div');
        timerWrapper.id = 'yaxsell-product-countdown';
        timerWrapper.style.cssText = 'background: #fdf2f8; border: 1.5px solid #fce7f3; border-radius: 16px; padding: 12px 16px; margin: 16px 0; display: flex; flex-direction: column; gap: 8px; max-width: 320px;';
        
        timerWrapper.innerHTML = `
          <div style="font-size: 11px; font-weight: 800; color: #db2777; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
            <span style="animation: pulse 1.5s infinite;">⏳</span> Oferta por tiempo limitado
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 6px 10px; min-width: 45px; text-align: center; box-shadow: 0 4px 10px rgba(219,39,119,0.05);">
              <span id="p-days" style="font-size: 18px; font-weight: 800; color: #111827;">00</span>
              <span style="display: block; font-size: 9px; font-weight: 700; color: #db2777; text-transform: uppercase; margin-top: 2px;">días</span>
            </div>
            <span style="font-weight: 800; color: #db2777;">:</span>
            <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 6px 10px; min-width: 45px; text-align: center; box-shadow: 0 4px 10px rgba(219,39,119,0.05);">
              <span id="p-hours" style="font-size: 18px; font-weight: 800; color: #111827;">00</span>
              <span style="display: block; font-size: 9px; font-weight: 700; color: #db2777; text-transform: uppercase; margin-top: 2px;">horas</span>
            </div>
            <span style="font-weight: 800; color: #db2777;">:</span>
            <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 6px 10px; min-width: 45px; text-align: center; box-shadow: 0 4px 10px rgba(219,39,119,0.05);">
              <span id="p-minutes" style="font-size: 18px; font-weight: 800; color: #111827;">00</span>
              <span style="display: block; font-size: 9px; font-weight: 700; color: #db2777; text-transform: uppercase; margin-top: 2px;">min</span>
            </div>
            <span style="font-weight: 800; color: #db2777;">:</span>
            <div style="background: rgba(255,255,255,0.9); border-radius: 8px; padding: 6px 10px; min-width: 45px; text-align: center; box-shadow: 0 4px 10px rgba(219,39,119,0.05);">
              <span id="p-seconds" style="font-size: 18px; font-weight: 800; color: #db2777;">00</span>
              <span style="display: block; font-size: 9px; font-weight: 700; color: #db2777; text-transform: uppercase; margin-top: 2px;">seg</span>
            </div>
          </div>
        `;
        priceContainer.parentNode?.insertBefore(timerWrapper, priceContainer.nextSibling);
      }
    }

    // Indicar que Yaxsell está listo
    root.dataset.yaxsellReady = 'true';
  };

  /* ── Set innerHTML on load and do immediate pre-injection replacements ── */
  useEffect(() => {
    if (!bodyHtml || !product || !refElement) return;
    
    const root = refElement;
    
    // Resolve prices
    const priceResolved = activeOffer ? {
      displayPrice: activeOffer.discountPrice,
      originalPrice: activeOffer.originalPrice,
      hasDiscount: true,
      discountPercent: activeOffer.discountPercentage,
      fromApertura: false
    } : resolveProductDisplayPrice(product, apertura);
    const displayPrice = priceResolved.displayPrice;
    const formattedPrice = formatPrice(displayPrice);

    if (!root.dataset.htmlSet) {
      // Reemplazar imágenes principales y texto del producto en el string HTML crudo antes de la inyección
      let processedHtml = bodyHtml;
      
      processedHtml = processedHtml.replaceAll('Logo Polo Red', product.NAME);
      processedHtml = processedHtml.replaceAll('$45.00', formattedPrice);
      
      // Realizar todos los reemplazos de traducción en el HTML crudo directamente
      processedHtml = processedHtml.replace(/Pebble\s*Little/gi, 'Yaxsell');
      processedHtml = processedHtml.replace(/pebble-little/gi, 'yaxsell');
      processedHtml = processedHtml.replaceAll('Home', 'Inicio');
      processedHtml = processedHtml.replaceAll('Accessories', categoryName || 'Productos');
      processedHtml = processedHtml.replaceAll('New', 'Nuevo');
      processedHtml = processedHtml.replaceAll('Popular', 'Popular');
      processedHtml = processedHtml.replaceAll('Regular price $0', 'Precio normal');
      processedHtml = processedHtml.replaceAll('Regular price', 'Precio normal');
      processedHtml = processedHtml.replaceAll('Sale price', 'Precio oferta');
      processedHtml = processedHtml.replaceAll('Color: Red', 'Color: Seleccionado');
      processedHtml = processedHtml.replaceAll('Size: 3Y', 'Talla: Seleccionada');
      processedHtml = processedHtml.replaceAll('Size Guide', 'Guía de tallas');
      processedHtml = processedHtml.replaceAll('In - stock and ready to ship', 'Stock disponible');
      processedHtml = processedHtml.replaceAll('In-stock and ready to ship', 'Stock disponible');
      processedHtml = processedHtml.replaceAll('Quantity', 'Cantidad');
      processedHtml = processedHtml.replaceAll('Add to cart', 'Agregar al carrito');
      processedHtml = processedHtml.replaceAll('Buy it now', 'Comprar ahora');
      processedHtml = processedHtml.replaceAll('Free shipping', 'Envío gratis');
      processedHtml = processedHtml.replaceAll('Easy return', 'Devolución gratis');
      processedHtml = processedHtml.replaceAll('Safe checkout', 'Compra Protegida');
      processedHtml = processedHtml.replaceAll('Product Details', 'Detalles del Producto');
      processedHtml = processedHtml.replaceAll('Video Feedbacks', 'Opiniones en Video');
      processedHtml = processedHtml.replaceAll('Materials', 'Materiales');
      processedHtml = processedHtml.replaceAll('Shipping & Returns', 'Envíos y Devoluciones');
      processedHtml = processedHtml.replaceAll('Share:', 'Compartir:');
      processedHtml = processedHtml.replaceAll('Share on Facebook', 'Compartir en Facebook');
      processedHtml = processedHtml.replaceAll('Share on Pinterest', 'Compartir en Pinterest');
      processedHtml = processedHtml.replaceAll('Share on X (Twitter)', 'Compartir en X (Twitter)');
      processedHtml = processedHtml.replaceAll('Need help ?', '¿Necesitas ayuda?');
      processedHtml = processedHtml.replaceAll('Need help?', '¿Necesitas ayuda?');
      processedHtml = processedHtml.replaceAll('Outfit Inspiration', 'Inspiración de Atuendos');
      processedHtml = processedHtml.replaceAll('Ideas to refresh your everyday wardrobe', 'Ideas para renovar tu armario todos los días');
      processedHtml = processedHtml.replaceAll('Over 500 Happy Reviews', 'Más de 500 opiniones felices');
      
      const pImages = [product.IMAGEURL, product.IMAGEURL2, product.IMAGEURL3, product.IMAGEURL4, product.IMAGEURL5].filter(Boolean).map(v => resolveStorageImageUrl(v)) as string[];
      if (pImages.length > 0) {
        // Expresión regular para borrar de raíz cualquier URL con tamaños o v= del polo rojo de Pebble Little
        processedHtml = processedHtml.replace(/(https?:)?\/\/pebble-little\.myshopify\.com\/cdn\/shop\/files\/LogoPoloRed-12([1-5])[^"'\s,]*/g, (match, p1) => {
          const idx = parseInt(p1) - 1;
          return pImages[idx] || pImages[0];
        });
        processedHtml = processedHtml.replace(/(https?:)?\/\/pebble-little\.myshopify\.com\/cdn\/shop\/files\/LogoPoloRed[^"'\s,]*/g, pImages[0]);
      }

      root.innerHTML = processedHtml;
      root.dataset.htmlSet = '1';
      // Remove leftover Shopify elements
      root.querySelectorAll('.fusion-overlay-custom, .fusion-scroll-top, .quickView-popup').forEach(el => el.remove());
    }

    // Apply replacements immediately
    applyYaxsellData();
  }, [bodyHtml, product, refElement]);

  /* ── Force data updates on elements (cascade to override late-loading custom element lifecycle) ── */
  useEffect(() => {
    if (!product || !bodyHtml) return;
    
    // Run immediately
    applyYaxsellData();
    
    // Run cascade of timeouts to override late custom element boots
    const t1 = setTimeout(applyYaxsellData, 100);
    const t2 = setTimeout(applyYaxsellData, 300);
    const t3 = setTimeout(applyYaxsellData, 600);
    const t4 = setTimeout(applyYaxsellData, 1200);
    const t5 = setTimeout(applyYaxsellData, 2500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [product, bodyHtml, categoryName, related, refElement, activeVariantId, linkedProducts, variantLabels]);

  // Product Page countdown timer loop
  useEffect(() => {
    if (!activeOffer || !activeOffer.endDateTime) return;
    const targetTime = new Date(activeOffer.endDateTime).getTime();

    const updateTimer = () => {
      if (!refElement) return;
      const dEl = refElement.querySelector('#p-days');
      const hEl = refElement.querySelector('#p-hours');
      const mEl = refElement.querySelector('#p-minutes');
      const sEl = refElement.querySelector('#p-seconds');

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

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [activeOffer, refElement]);

  /* ── Inject window.Shopify stub BEFORE loading JS ── */
  useEffect(() => {
    // Global error listener to suppress matchAll and Appwrite non-critical console errors
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes("matchAll") || msg.includes('AppwriteException') || msg.includes('recommendations') || msg.includes('removeDesignModeListener')) {
        event.preventDefault(); // Suppress the console logging
      }
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      if (reason.includes('AppwriteException') || reason.includes('401') || reason.includes('404')) {
        event.preventDefault(); // Suppress the console logging
      }
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Suppress console.error for Shopify recommendations
    const origConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('Product recommendations error') || msg.includes('removeDesignModeListener')) return;
      origConsoleError(...args);
    };

    // Polyfill Shopify design mode methods that cause crashes on unmount
    if (typeof HTMLElement !== 'undefined' && !(HTMLElement.prototype as any).removeDesignModeListener) {
      (HTMLElement.prototype as any).removeDesignModeListener = function() {};
    }
    if (typeof HTMLElement !== 'undefined' && !(HTMLElement.prototype as any).addDesignModeListener) {
      (HTMLElement.prototype as any).addDesignModeListener = function() {};
    }

    document.body.classList.remove('page-loading');

    if ((window as any).Shopify) return;
    (window as any).Shopify = {
      shop: 'pebble-little.myshopify.com',
      country: 'US',
      currency: 'USD',
      locale: 'es',
      theme: { name: 'Captured Theme', id: '22' },
      routes: { root_url: '/', cart_url: '/cart', search_url: '/productos' },
      customerAccountsEnabled: false,
    };

    const origFetch = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      
      // Intercept Shopify recommendations requests to silence 404 logs and load placeholder cleanly
      if (url.includes('/recommendations/products')) {
        const urlObj = new URL(url, window.location.origin);
        const sectionId = urlObj.searchParams.get('section_id') || 'template--20816638607498__recommendations';
        const id = `Recommendations-${sectionId}`;
        const mockHtml = `<product-recommendations id="${id}"><div style="display:none">Mocked recommendations</div></product-recommendations>`;
        return Promise.resolve(new Response(mockHtml, { 
          status: 200, 
          headers: { 'Content-Type': 'text/html' } 
        }));
      }

      if ((url.startsWith('/products/') || url.includes('/products/')) && !url.includes('/shopify/') && !url.includes('appwrite')) {
        return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      
      // Let standard Appwrite API traffic flow so backend features work!
      return origFetch(input, init);
    };

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  /* ── Load JS scripts sequentially after HTML is rendered ── */
  useEffect(() => {
    if (!bodyHtml) return;
    if ((window as any).__tpl5ScriptsLoaded) return;
    (window as any).__tpl5ScriptsLoaded = true;

    const loadOne = (file: JsFile) => new Promise<void>((resolve) => {
      if (document.querySelector(`script[data-tpl5="${file.src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = file.src;
      if (file.module) s.type = 'module';
      else s.async = false;
      s.setAttribute('data-tpl5', file.src);
      const done = () => resolve();
      s.onload = done;
      s.onerror = () => { console.warn('[Plantilla5] Failed to load:', file.src); done(); };
      document.body.appendChild(s);
    });

    const forceInView = () => {
      document.querySelectorAll('.animation-element, .animation-wrapper, .scroll-trigger, .animate--slide-in, .animate--fade-in').forEach(el => {
        el.classList.add('in-view');
        el.classList.add('scroll-trigger--in-view');
      });
      document.querySelectorAll('split-hero video, .split-hero video').forEach(el => {
        const video = el as HTMLVideoElement;
        video.muted = true;
        video.play().catch(() => {});
      });
      document.querySelectorAll('.split-hero-column__media').forEach(el => {
        if (!el.classList.contains('is-collapsed')) {
          el.classList.add('is-collapsed');
        }
      });
      document.querySelectorAll('split-hero').forEach(el => {
        try { (el as any).initParallaxScrollAnimation(); } catch(e) {}
      });
    };

    (async () => {
      for (const f of JS_FILES) {
        await loadOne(f);
      }

      setTimeout(() => {
        forceInView();
        applyYaxsellData(); // Enforce Yaxsell replacements again once all custom elements boot
        try {
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: false }));
          window.dispatchEvent(new Event('load'));
        } catch (e) {
          console.warn('[Plantilla5] dispatch DOMContentLoaded/load failed:', e);
        }
      }, 500);
    })();

    return () => { (window as any).__tpl5ScriptsLoaded = false; };
  }, [bodyHtml]);

  /* ── Loading/error states ── */
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error cargando la plantilla</h2>
        <p style={{ color: '#666' }}>No se pudo cargar <code>/shopify/plantilla5/body-clean.html</code>.</p>
        <p style={{ color: '#999', fontSize: 13, marginTop: 12 }}>Detalle: {loadError}</p>
      </div>
    );
  }

  /* ── Submit Stock Request ── */
  const handleStockRequest = async () => {
    if (!user || !product) return;
    setIsRequestingStock(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.createDocument(
        databaseId,
        STOCK_REQUESTS_COLLECTION,
        'unique()',
        {
          productId: product.$id,
          productName: product.NAME,
          userId: user.id,
          userEmail: user.email || '',
          requestedQuantity: stockRequestQty,
          status: 'pending',
        }
      );
      setHasPendingRequest(true);
      setIsStockRequestModalOpen(false);
      alert('Tu solicitud ha sido enviada con éxito. Te notificaremos cuando tengamos más stock.');
    } catch (err: any) {
      console.error('Error submitting stock request:', err);
      if (err?.message?.includes('could not be found')) {
        alert('La función de solicitud de stock no está disponible en este momento.');
      } else {
        alert('Hubo un error al enviar tu solicitud. Intenta nuevamente.');
      }
    } finally {
      setIsRequestingStock(false);
    }
  };

  if (isLoading || !bodyHtml) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center', padding: 80, fontFamily: 'system-ui, sans-serif', color: '#e396bf', background: '#fffcfd', minHeight: '100vh' }}>
        <div style={{ border: '4px solid #fce7f3', borderTop: '4px solid #e396bf', borderRadius: '50%', width: 50, height: 50, animation: 'spin 1s linear infinite', marginBottom: 20 }} />
        <span style={{ fontSize: 16, fontWeight: 500 }}>Cargando detalles del producto...</span>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="tpl5-page-wrapper" style={{ background: '#fff' }}>
      <style>{`
        /* Ocultar el navbar original de Pebble Little */
        #shopify-section-sections--20816632447114__header {
          display: none !important;
        }

        /* Ocultar imágenes originales y tarjetas de producto hasta que Yaxsell esté listo */
        .tpl5-shopify-root:not([data-yaxsell-ready="true"]) img,
        .tpl5-shopify-root:not([data-yaxsell-ready="true"]) product-card,
        .tpl5-shopify-root:not([data-yaxsell-ready="true"]) .product-card {
          opacity: 0 !important;
          visibility: hidden !important;
        }

        /* Transición suave cuando ya esté cargado */
        .tpl5-shopify-root img,
        .tpl5-shopify-root product-card,
        .tpl5-shopify-root .product-card {
          transition: opacity 0.4s ease, visibility 0.4s ease;
        }

        /* Forzar visualización de todos los contenedores y animaciones de Shopify Dawn */
        .scroll-trigger,
        .scroll-trigger--in-view,
        .animate--slide-in,
        .animate--fade-in,
        .shopify-section,
        .shopify-section--full-width,
        .no-js-hidden,
        .product-media,
        .media,
        .media-zoom-reveal,
        .image-zoom-reveal,
        .media__image,
        #MainContent,
        .main-content,
        .product-information,
        .product-information__grid,
        .product-information__media,
        media-gallery,
        carousel-slider,
        .product__info-container,
        product-form,
        .product-form {
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
          transition: none !important;
        }

        /* Ocultar / Eliminar de raíz el overlay loader de Shopify */
        page-transition,
        .page-transition,
        #page-transition,
        [is="page-transition"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Prevenir que la clase page-loading oculte el contenido */
        body.page-loading #MainContent,
        body.page-loading .main-content,
        body.page-loading .tpl5-shopify-root {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Request stock button custom styling (forces white background, black text on initial load, inverse on hover) */
        .tpl5-page-wrapper button.yaxsell-request-stock-btn,
        .tpl5-page-wrapper .yaxsell-request-stock-btn {
          background: #ffffff !important;
          color: #000000 !important;
          border: 1px solid #000000 !important;
          transition: all 0.2s ease !important;
        }
        .tpl5-page-wrapper button.yaxsell-request-stock-btn:hover,
        .tpl5-page-wrapper .yaxsell-request-stock-btn:hover {
          background: #000000 !important;
          color: #ffffff !important;
          border: 1px solid #000000 !important;
        }
        .tpl5-page-wrapper button.yaxsell-request-stock-btn[disabled],
        .tpl5-page-wrapper .yaxsell-request-stock-btn.is-pending {
          background: #f3f4f6 !important;
          color: #9ca3af !important;
          border: 1px solid #d1d5db !important;
          cursor: not-allowed !important;
        }

        /* Fix mobile thumbnails shifting to the right and keep them compact */
        @media (max-width: 767.98px) {
          .media-gallery__carousel {
            position: relative !important;
            overflow: hidden !important;
          }
          .media-gallery__carousel-thumbnails--inside.md\:hidden,
          .media-gallery__carousel-thumbnails {
            display: block !important;
            position: relative !important;
            margin: 16px auto 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            left: 0 !important;
            transform: none !important;
            overflow: visible !important;
          }
          .media-gallery__carousel-thumbnails .carousel__thumbnails-swiper {
            overflow: visible !important;
          }
          .media-gallery__carousel-thumbnails .swiper-wrapper {
            display: flex !important;
            justify-content: center !important;
            gap: 10px !important;
            flex-wrap: nowrap !important;
            transform: none !important;
            width: auto !important;
          }
          .media-gallery__carousel-thumbnails .carousel__thumbnail {
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            border: 2px solid #e5e7eb !important;
            overflow: hidden !important;
            cursor: pointer !important;
            flex-shrink: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
            opacity: 0.65 !important;
            background: #ffffff !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
          }
          .media-gallery__carousel-thumbnails .carousel__thumbnail img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 50% !important;
          }
          /* Highlight active slide with pink color matching template aesthetic */
          .media-gallery__carousel-thumbnails .swiper-slide-active,
          .media-gallery__carousel-thumbnails .carousel__thumbnail:hover {
            border-color: #db2777 !important;
            transform: scale(1.15) !important;
            opacity: 1 !important;
            box-shadow: 0 4px 10px rgba(219, 39, 119, 0.2) !important;
          }
        }
      `}</style>
      <div
        ref={setRefElement}
        className="tpl5-shopify-root template-product"
      />
      
      {/* Secciones de React nativas en la parte inferior */}
      {product && (
        <div style={{ maxWidth: 1200, margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #fce7f3', margin: '40px 0' }} />
          
          <ReviewSection productId={product.$id} rating={product.RATING ?? 0} numReviews={product.NUMREVIEWS ?? 0} />
          
          <hr style={{ border: 'none', borderTop: '1px solid #fce7f3', margin: '40px 0' }} />
          
          <ProductQuestions productId={product.$id} />
        </div>
      )}

    </div>
  );
}
