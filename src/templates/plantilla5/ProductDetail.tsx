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
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, TIMED_OFFERS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { normalizeProductImages, resolveStorageImageUrl } from '@/lib/product-images';
import { Query } from 'appwrite';
import { Product, TimedOffer } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import ReviewSection from '@/components/ReviewSection';
import ProductQuestions from '@/components/ProductQuestions';

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

  /* ── Fetch Product from Appwrite ── */
  useEffect(() => {
    async function load() {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const doc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, id);
        const p = normalizeProductImages(doc as unknown as Product);
        setProduct(p);

        // Fetch linked products (Variantes / Modelos)
        if (p.GROUPID) {
          try {
            const linkedRes = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
              Query.equal('GROUPID', p.GROUPID),
              Query.limit(20)
            ]);
            const linked = linkedRes.documents as unknown as Product[];
            setLinkedProducts(linked);
            setActiveVariantId(p.$id);

            // Try to fetch group metadata (GROUP_NAME, VARIANT_LABELS) from product_groups collection
            try {
              const grpRes = await databases.listDocuments(databaseId, 'product_groups', [
                Query.equal('GROUPID', p.GROUPID),
                Query.limit(1)
              ]);
              if (grpRes.documents.length > 0) {
                const grpDoc = grpRes.documents[0] as any;
                if (grpDoc.VARIANT_LABELS) {
                  try {
                    const labels = JSON.parse(grpDoc.VARIANT_LABELS);
                    setVariantLabels(labels);
                  } catch {}
                }
              }
            } catch (grpErr) {
              // product_groups lookup failed gracefully
            }
          } catch (linkErr) {
            console.warn('Error fetching linked products:', linkErr);
          }
        } else {
          setActiveVariantId(p.$id);
        }

        // Fetch category name and related products
        if (p.CATEGORYID) {
          try {
            const catDoc = await databases.getDocument(databaseId, CATEGORIES_COLLECTION, p.CATEGORYID);
            setCategoryName((catDoc as any).name || '');
            
            const relRes = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
              Query.equal('CATEGORYID', p.CATEGORYID),
              Query.limit(9),
            ]);
            setRelated((relRes.documents as unknown as Product[]).filter(r => r.$id !== id).slice(0, 6));
          } catch (catErr) {
            console.warn('Error fetching category / related (handled gracefully):', catErr);
          }
        }

        // Fetch timed offers for this product
        try {
          const offerRes = await databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [
            Query.equal('targetId', p.$id),
            Query.equal('isActive', true),
            Query.equal('status', 'active'),
            Query.limit(1),
          ]);
          const active = (offerRes.documents as unknown as TimedOffer[]).filter(o => {
            if (!o.isActive || o.status !== 'active') return false;
            if (o.timeType === 'endDateTime' && o.endDateTime) {
              return new Date(o.endDateTime) > new Date();
            }
            if (o.timeType === 'duration' && o.durationHours) {
              const start = o.activatedAt || (o as any).$createdAt;
              if (start) {
                return (new Date(start).getTime() + o.durationHours * 3600000) > Date.now();
              }
            }
            return true;
          });
          if (active.length > 0) {
            setActiveOffer(active[0]);
          }
        } catch (offerErr) {
          console.warn('Error fetching timed offer (handled gracefully):', offerErr);
        }
      } catch (err) {
        console.warn('Error fetching product from Appwrite (handled gracefully):', err);
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

    // Update main gallery images
    root.querySelectorAll('.product__media img, .global-media-settings img, img[src*="LogoPoloRed"]').forEach((img: any, idx: number) => {
      const targetImg = vImages[idx % vImages.length] || vImages[0];
      img.src = targetImg;
      if (img.srcset) img.srcset = targetImg;
      if (img.getAttribute('data-media-src')) img.setAttribute('data-media-src', targetImg);
      img.alt = targetProduct.NAME;
    });
    root.querySelectorAll('.thumbnail img, .thumbnail-list__item img').forEach((img: any, idx: number) => {
      const targetImg = vImages[idx % vImages.length] || vImages[0];
      img.src = targetImg;
      if (img.srcset) img.srcset = targetImg;
      img.alt = targetProduct.NAME;
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
      btn.style.border = isActive ? '3px solid #111827' : '2px solid #e5e7eb';
      btn.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
      btn.style.boxShadow = isActive ? '0 0 0 2px #fff, 0 0 0 4px #111827' : 'none';
    });
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
        
        let variantsHtml = `<div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <span style="font-size: 13px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.05em;">Modelo:</span>
            <span id="yaxsell-variant-label" style="font-size: 13px; color: #6b7280;"></span>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
          
        linkedProducts.forEach(lp => {
          const isActive = lp.$id === currentActiveId;
          const label = variantLabels[lp.$id] || '';
          const imgUrl = resolveStorageImageUrl(lp.IMAGEURL);
          const borderStyle = isActive
            ? 'border: 3px solid #111827; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111827; transform: scale(1.1);'
            : 'border: 2px solid #e5e7eb; box-shadow: none; transform: scale(1);';
          variantsHtml += `
            <button 
              data-variant-btn="${lp.$id}"
              data-variant-label="${label}"
              style="display: block; width: 52px; height: 52px; border-radius: 50%; overflow: hidden; ${borderStyle} cursor: pointer; transition: all 0.2s ease; background: none; padding: 0; outline: none;"
              title="${label || lp.NAME}"
            >
              <img src="${imgUrl}" alt="${label || lp.NAME}" style="width: 100%; height: 100%; object-fit: cover;" />
            </button>
          `;
        });
        
        variantsHtml += `</div></div>`;
        el.innerHTML = variantsHtml;

        // Update the label display
        const labelEl = el.querySelector('#yaxsell-variant-label') as HTMLElement | null;
        if (labelEl) {
          const activeBtn = el.querySelector(`[data-variant-btn="${currentActiveId}"]`) as HTMLElement | null;
          labelEl.textContent = activeBtn?.dataset.variantLabel || '';
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
            // Update label display
            if (labelEl) labelEl.textContent = btn.dataset.variantLabel || '';
          });
        });

      } else {
        (el as HTMLElement).style.display = 'none';
      }
    });

    // 2. Inyectar Bloque Informativo de Envío y Stock (estilo Yaxsell / Plantilla 1) usando la estructura exacta de local-pickup
    const stock = product.STOCK ?? 0;
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

    // 5. Descripción
    root.querySelectorAll('div[class*="product_description"] p, div[class*="product_description"], .accordion__content, .rte').forEach(el => {
      if (el.textContent?.includes('boasts a rustic texture') || el.textContent?.includes('eco-friendly fabric') || el.textContent?.includes('Crafted from')) {
        el.innerHTML = product.DESCRIPTION || '';
      }
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

    // 7. Tarjetas de Productos Relacionados
    if (related && related.length > 0) {
      const cards = root.querySelectorAll('product-card, .product-card');
      cards.forEach((card: any, idx) => {
        const relProduct = related[idx % related.length];
        if (!relProduct) return;

        card.querySelectorAll('.product-card__link, a').forEach((link: any) => {
          link.href = `/productos/${relProduct.$id}`;
        });

        card.querySelectorAll('.reversed-link__text, .product-card__title').forEach((title: any) => {
          title.textContent = relProduct.NAME;
        });

        const formattedRelPrice = formatPrice(relProduct.PRICE);
        card.querySelectorAll('.price, .price-item').forEach((priceEl: any) => {
          priceEl.textContent = formattedRelPrice;
        });

        const relImageUrl = resolveStorageImageUrl(relProduct.IMAGEURL);
        if (relImageUrl) {
          card.querySelectorAll('img').forEach((img: any) => {
            img.src = relImageUrl;
            if (img.srcset) {
              img.srcset = relImageUrl;
            }
          });
        }
      });
    }

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

    // 10. Integrar el Botón de Añadir al Carrito
    const qtyInput = root.querySelector('input[name="quantity"]') as HTMLInputElement;
    const addToCartBtn = root.querySelector('.add-to-cart-button') as HTMLElement | null;
    if (addToCartBtn && !addToCartBtn.dataset.cartBound) {
      addToCartBtn.dataset.cartBound = '1';
      const newBtn = addToCartBtn.cloneNode(true) as HTMLButtonElement;
      addToCartBtn.parentNode?.replaceChild(newBtn, addToCartBtn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Use the currently active variant product
        const currentProduct = (activeVariantId && activeVariantId !== product.$id)
          ? (linkedProducts.find(lp => lp.$id === activeVariantId) || product)
          : product;
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
      routes: { root_url: '/', cart_url: '/cart', search_url: '/search' },
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
