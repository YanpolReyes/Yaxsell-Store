'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check, ChevronRight, Truck, Shield, RefreshCw, Heart, Sparkles, Star } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, STOCK_ALERTS_COLLECTION, formatPrice, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import ReviewSection from '@/components/ReviewSection';
import FavoriteButton from '@/components/FavoriteButton';
import RecentlyViewed, { trackView } from '@/components/RecentlyViewed';
import ImageZoom from '@/components/ImageZoom';
import ProductQuestions from '@/components/ProductQuestions';
import ProductTabs from '@/components/ProductTabs';
import StockIndicator from '@/components/StockIndicator';

// Paleta Kevin & Coco — rosa pastel
const PINK_PRIMARY = '#ec4899';
const PINK_LIGHT = '#f9a8d4';
const PINK_BG = '#fdf2f8';
const PINK_BG_DARK = '#fce7f3';
const TEXT_DARK = '#374151';
const TEXT_MUTED = '#6b7280';

export default function ProductDetailPlantilla1() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryBg, setCategoryBg] = useState('');
  const [categoryBgLoaded, setCategoryBgLoaded] = useState(false);
  const [categoryColor, setCategoryColor] = useState(PINK_PRIMARY);
  const [categoryIcon, setCategoryIcon] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { addItem } = useCart();

  // Keyboard navigation for image gallery
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!product) return;
      const imgs = [product.IMAGEURL, product.IMAGEURL2, product.IMAGEURL3, product.IMAGEURL4, product.IMAGEURL5].filter(Boolean);
      if (imgs.length <= 1) return;
      if (e.key === 'ArrowLeft') setSelectedImg(i => (i - 1 + imgs.length) % imgs.length);
      else if (e.key === 'ArrowRight') setSelectedImg(i => (i + 1) % imgs.length);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  useEffect(() => {
    async function load() {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const doc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, id);
        const p = doc as unknown as Product;
        setProduct(p);
        trackView(p.$id);
        if (p.CATEGORYID) {
          try {
            const [catDoc, relRes] = await Promise.all([
              databases.getDocument(databaseId, CATEGORIES_COLLECTION, p.CATEGORYID),
              databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
                Query.equal('CATEGORYID', p.CATEGORYID),
                Query.limit(9),
              ]),
            ]);
            const cat = catDoc as any;
            setCategoryName(cat.name || '');
            setCategoryBg(cat.BACKGROUND_IMAGE_URL || 'https://firebasestorage.googleapis.com/v0/b/geminai-449212.firebasestorage.app/o/KEVINCOCO%2Fyoung-asian-woman-sunglasses-going-shopping-holding-bags-from-malls-stores-smiling-standi.jpg?alt=media&token=515133e5-8477-4c58-948c-e28477f1f912');
            setCategoryColor(cat.COLOR || PINK_PRIMARY);
            setCategoryIcon(cat.iconUrl || '');
            setRelated((relRes.documents as unknown as Product[]).filter(r => r.$id !== id).slice(0, 6));
          } catch { /* non-critical */ }
        }
      } catch { router.push('/productos'); }
      finally { setIsLoading(false); }
    }
    load();
  }, [id, router]);

  // Dynamic SEO metadata
  useEffect(() => {
    if (!product) return;
    const price = product.CURRENTPRICE && product.CURRENTPRICE > 0 ? product.CURRENTPRICE : product.PRICE;
    document.title = `${product.NAME} - ${formatPrice(price)} | Kevin & Coco Chile`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); name.startsWith('og:') ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const desc = (product.DESCRIPTION || product.NAME).slice(0, 160);
    setMeta('description', desc);
    setMeta('og:title', product.NAME);
    setMeta('og:description', desc);
    setMeta('og:type', 'product');
    if (product.IMAGEURL) setMeta('og:image', product.IMAGEURL);
    setMeta('og:url', window.location.href);
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: window.location.origin },
            { '@type': 'ListItem', position: 2, name: 'Productos', item: `${window.location.origin}/productos` },
            ...(categoryName ? [{ '@type': 'ListItem', position: 3, name: categoryName, item: `${window.location.origin}/productos?categoria=${encodeURIComponent(categoryName)}` }] : []),
            { '@type': 'ListItem', position: categoryName ? 4 : 3, name: product.NAME, item: window.location.href },
          ],
        },
        {
          '@type': 'Product',
          name: product.NAME,
          description: desc,
          image: product.IMAGEURL || undefined,
          sku: product.$id,
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'CLP',
            availability: (product.STOCK ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: window.location.href,
          },
          ...(product.RATING ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.RATING, reviewCount: product.NUMREVIEWS || 1 } } : {}),
        },
      ],
    };
    let scriptEl = document.getElementById('product-jsonld');
    if (!scriptEl) { scriptEl = document.createElement('script'); scriptEl.id = 'product-jsonld'; scriptEl.setAttribute('type', 'application/ld+json'); document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(jsonLd);
    return () => { document.title = 'Kevin & Coco Chile'; const el = document.getElementById('product-jsonld'); if (el) el.remove(); };
  }, [product, categoryName]);

  if (isLoading) return (
    <div style={{ background: PINK_BG, minHeight: '100vh', padding: '32px 5%' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, boxShadow: '0 4px 30px rgba(236,72,153,0.08)' }}>
        <div style={{ width: 460, height: 460, background: PINK_BG_DARK, borderRadius: 16 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[70, 50, 30, 80, 40, 40].map((w, i) => <div key={i} style={{ height: 18, background: PINK_BG_DARK, borderRadius: 8, width: `${w}%` }} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const images = [product.IMAGEURL, product.IMAGEURL2, product.IMAGEURL3, product.IMAGEURL4, product.IMAGEURL5].filter(Boolean) as string[];
  const features = product.FEATURES ? (Array.isArray(product.FEATURES) ? product.FEATURES : (product.FEATURES as string).split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
  const tags = product.TAGS ? (Array.isArray(product.TAGS) ? product.TAGS : (product.TAGS as string).split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
  const displayPrice = product.CURRENTPRICE && product.CURRENTPRICE > 0 ? product.CURRENTPRICE : product.PRICE;
  const hasDisc = !!(product.CURRENTPRICE && product.CURRENTPRICE < product.PRICE);
  const discPct = hasDisc ? Math.round(((product.PRICE - product.CURRENTPRICE!) / product.PRICE) * 100) : 0;
  const hasWholesale = !!(product.WHOLESALEPRICE && product.WHOLESALEMINQUANTITY && product.WHOLESALEPRICE > 0);
  const isWholesaleQty = hasWholesale && qty >= (product.WHOLESALEMINQUANTITY || 0);
  const effectivePrice = isWholesaleQty ? product.WHOLESALEPRICE! : displayPrice;
  const lineTotal = effectivePrice * qty;
  const stock = product.STOCK ?? 0;
  const rating = product.RATING ?? 0;
  const numReviews = product.NUMREVIEWS ?? 0;
  const soldQty = product.SOLDQUANTITY ?? 0;
  const stockColor = stock > 10 ? '#10b981' : stock > 5 ? '#f59e0b' : stock > 0 ? '#ef4444' : '#9ca3af';
  const stockLabel = stock > 10 ? 'Stock disponible' : stock > 5 ? 'Stock limitado' : stock > 0 ? 'Últimas unidades' : 'Sin stock';
  const isBestSeller = soldQty >= 20;
  const hasOffer = hasDisc && discPct >= 10;

  function handleAdd() {
    addItem(product!, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const buyBoxContent = (className: string) => (
    <div className={className} style={{ position: 'sticky', top: 16, background: '#fff', border: `1.5px solid ${PINK_BG_DARK}`, borderRadius: 16, padding: '18px 18px 22px', boxShadow: '0 4px 16px rgba(236,72,153,0.08)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Truck size={15} /> Llega entre hoy y mañana
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: TEXT_MUTED }}>
        Envío disponible a todo Chile. <Link href="#" style={{ color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 500 }}>Más detalles</Link>
      </p>
      <div style={{ borderTop: `1px solid ${PINK_BG_DARK}`, paddingTop: 12, marginBottom: 12 }}>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: stockColor }}>{stockLabel}</p>
        {stock > 0 && stock <= 10 && <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>¡Solo quedan {stock}!</p>}
      </div>
      {stock > 0 ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: TEXT_MUTED }}>
              Cantidad: <strong style={{ color: TEXT_DARK }}>{qty} unidad{qty > 1 ? 'es' : ''}</strong>
              <span style={{ color: '#9ca3af' }}> ({stock} disp.)</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${PINK_BG_DARK}`, borderRadius: 8, width: 'fit-content', overflow: 'hidden' }}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, border: 'none', background: '#fff', fontSize: 18, cursor: 'pointer', color: PINK_PRIMARY, fontWeight: 600 }}>−</button>
              <span style={{ width: 44, textAlign: 'center', fontSize: 14, fontWeight: 600, color: TEXT_DARK, borderLeft: `1px solid ${PINK_BG_DARK}`, borderRight: `1px solid ${PINK_BG_DARK}` }}>{qty}</span>
              <button type="button" onClick={() => setQty(q => Math.min(stock, q + 1))} style={{ width: 40, height: 40, border: 'none', background: '#fff', fontSize: 18, cursor: 'pointer', color: PINK_PRIMARY, fontWeight: 600 }}>+</button>
            </div>
            {qty > 1 && <p style={{ margin: '8px 0 0', fontSize: 12, color: TEXT_MUTED }}>Total: <strong style={{ color: PINK_PRIMARY, fontSize: 14 }}>{formatPrice(lineTotal)}</strong></p>}
          </div>
          <button type="button" onClick={handleAdd} style={{ width: '100%', padding: '13px 18px', background: `linear-gradient(135deg, ${PINK_PRIMARY} 0%, ${PINK_LIGHT} 100%)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(236,72,153,0.3)', marginBottom: 8 }}>Comprar ahora</button>
          <button type="button" onClick={handleAdd} style={{ width: '100%', padding: '12px 18px', background: added ? '#ecfdf5' : '#f9fafb', color: added ? '#10b981' : PINK_PRIMARY, border: `1.5px solid ${added ? '#10b981' : PINK_LIGHT}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {added ? <><Check size={15} /> Agregado</> : <><ShoppingCart size={15} /> Agregar al carrito</>}
          </button>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${PINK_BG_DARK}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <RefreshCw size={13} color={PINK_PRIMARY} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong style={{ color: TEXT_DARK }}>Devolución gratis.</strong> 30 días desde que lo recibes.</span>
            </p>
            <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Shield size={13} color={PINK_PRIMARY} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong style={{ color: TEXT_DARK }}>Compra Protegida.</strong> Recibe el producto o te devolvemos el dinero.</span>
            </p>
          </div>
          <div style={{ marginTop: 12 }}><StockIndicator stock={product.STOCK} soldQuantity={product.SOLDQUANTITY} /></div>
        </>
      ) : (
        <div style={{ background: '#f9fafb', border: `1.5px solid ${PINK_BG_DARK}`, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: TEXT_MUTED }}>Sin stock por el momento</p>
          <button type="button" onClick={async () => {
            const email = prompt('Ingresa tu email para recibir una notificación cuando haya stock:');
            if (!email || !email.includes('@')) return;
            try {
              const { databases } = getServices();
              const { databaseId } = getAppwriteConfig();
              await databases.createDocument(databaseId, STOCK_ALERTS_COLLECTION, ID.unique(), {
                PRODUCTID: product.$id, PRODUCTNAME: product.NAME,
                EMAIL: email.toLowerCase().trim(), CREATEDAT: Date.now(), NOTIFIED: false,
              });
              alert('✅ Te avisaremos por email cuando haya stock disponible');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : '';
              if (msg.includes('already exists')) alert('Ya estás suscrito a esta alerta');
              else alert('Error al registrar alerta: ' + msg);
            }
          }} style={{ width: '100%', padding: '10px 18px', background: `linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🔔 Avisarme cuando haya stock
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="pd-page" style={{ background: '#f5f5f5', minHeight: '100vh', fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .pd-page { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }
          .pd-breadcrumb { top: 0 !important; padding: 10px 12px !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .pd-breadcrumb > div { font-size: 12px !important; flex-wrap: nowrap; min-width: min-content; }
          .pd-breadcrumb span { max-width: 110px !important; }
          .pd-category-banner { height: 150px !important; }
          .pd-container { margin-top: -64px !important; padding: 0 12px 20px !important; }
          .pd-main-grid { grid-template-columns: 1fr !important; padding: 18px 14px !important; gap: 18px !important; border-radius: 16px !important; }
          .pd-gallery { flex-direction: column !important; width: 100% !important; align-items: stretch !important; }
          .pd-h-scroll { overflow-x: auto !important; overflow-y: hidden !important; -webkit-overflow-scrolling: touch !important; scroll-snap-type: x proximity !important; touch-action: pan-x !important; scrollbar-width: none !important; -ms-overflow-style: none !important; padding-bottom: 0 !important; max-height: none !important; }
          .pd-h-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }
          .pd-gallery-thumbs { flex-direction: row !important; gap: 8px !important; width: 100% !important; }
          .pd-gallery-thumb-btn { flex-shrink: 0 !important; scroll-snap-align: start !important; }
          .pd-buy-box--mobile-inline { position: static !important; display: block !important; }
          .pd-features-grid { grid-template-columns: 1fr !important; }
          .pd-related-scroll { padding-bottom: 0 !important; }
          .pd-related-card { scroll-snap-align: start !important; }
          .pd-gallery-main { width: 100% !important; height: auto !important; aspect-ratio: 1 !important; max-height: min(82vw, 360px) !important; }
          .pd-gallery-main > div { width: 100% !important; height: 100% !important; min-height: 240px !important; }
          .pd-info h1 { font-size: 18px !important; }
          .pd-price-main { font-size: 28px !important; }
          .pd-buy-box.pd-buy-box--desktop { display: none !important; }
          .pd-section { padding: 18px 14px !important; border-radius: 14px !important; }
          .pd-section h2 { font-size: 17px !important; }
          .pd-related-scroll { gap: 10px !important; }
          .pd-related-card { width: 140px !important; }
          .pd-related-card > div:first-child { height: 112px !important; }
          .pd-mobile-bar { display: flex !important; }
        }
        @media (min-width: 769px) {
          .pd-mobile-bar, .pd-buy-box--mobile-inline { display: none !important; }
          .pd-gallery { flex-direction: row !important; align-items: flex-start !important; }
          .pd-gallery-main { order: 2 !important; }
          .pd-gallery-thumbs { order: 1 !important; flex-direction: column !important; }
        }
        .pd-mobile-bar {
          display: none; position: fixed; left: 0; right: 0;
          bottom: calc(56px + env(safe-area-inset-bottom, 0px));
          z-index: 9990; background: rgba(255,255,255,0.98);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid #fce7f3; padding: 10px 12px; gap: 10px;
          align-items: center; box-shadow: 0 -6px 24px rgba(236,72,153,0.1);
        }
        .pd-mobile-bar-info { flex-shrink: 0; min-width: 0; }
        .pd-mobile-bar-price { font-size: 19px; font-weight: 700; color: ${TEXT_DARK}; line-height: 1.1; }
        .pd-mobile-bar-meta { font-size: 10px; color: ${TEXT_MUTED}; margin-top: 2px; }
        .pd-mobile-bar-actions { display: flex; gap: 8px; flex: 1; min-width: 0; }
        .pd-mobile-bar-actions button { flex: 1; border-radius: 10px; font-size: 12px; font-weight: 700; padding: 11px 8px; cursor: pointer; }
        .pd-mbar-buy { border: none; background: linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT}); color: #fff; box-shadow: 0 4px 12px rgba(236,72,153,0.35); }
        .pd-mbar-cart { background: #fff; color: ${PINK_PRIMARY}; border: 1.5px solid ${PINK_LIGHT}; display: flex; align-items: center; justify-content: center; gap: 4px; }
      `}</style>

      {/* Breadcrumb */}
      <div className="pd-breadcrumb pd-h-scroll" style={{ background: '#fff', padding: '12px 2%', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 76, zIndex: 999 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Link href="/" style={{ color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
          <ChevronRight size={12} color={PINK_LIGHT} />
          <Link href="/productos" style={{ color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 500 }}>Productos</Link>
          {categoryName && <>
            <ChevronRight size={12} color={PINK_LIGHT} />
            <Link href={`/productos?categoria=${encodeURIComponent(categoryName)}`} style={{ color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 500 }}>{categoryName}</Link>
          </>}
          <ChevronRight size={12} color={PINK_LIGHT} />
          <span style={{ color: TEXT_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{product.NAME}</span>
        </div>
      </div>

      {/* Category Banner con gradiente rosa */}
      <div className="pd-category-banner" style={{
        position: 'relative', width: '100%', height: 600, overflow: 'hidden',
        background: categoryBg ? '#000' : `linear-gradient(135deg, ${PINK_PRIMARY} 0%, ${PINK_LIGHT} 50%, ${PINK_BG_DARK} 100%)`,
      }}>
        {categoryBg && !categoryBgLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#fef2f8,#fce7f3,#fef2f8)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s ease infinite' }} />
        )}
        {categoryBg
          ? <Image src={categoryBg} alt={categoryName} fill style={{ objectFit: 'cover', opacity: 0.9 }} onLoad={() => setCategoryBgLoaded(true)} />
          : null}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, transparent 50%, #f5f5f5 100%)` }} />
        <style>{`@keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>

      <div className="pd-container" style={{ maxWidth: 1400, margin: '-550px auto 0', padding: '0 16px 16px', position: 'relative', zIndex: 2 }}>

        {/* Category badge - above the main card */}
        {(categoryName || categoryIcon) && (
          <div className="pd-category-badge" style={{ marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.97)', borderRadius: 14,
              padding: '10px 18px',
              boxShadow: '0 8px 28px rgba(236,72,153,0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              {categoryIcon && (
                <Image src={categoryIcon} alt={categoryName} width={44} height={44} style={{ objectFit: 'contain' }} />
              )}
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT_DARK }}>{categoryName}</p>
                <Link href={`/productos?categoria=${encodeURIComponent(categoryName)}`} style={{ fontSize: 12, color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 600 }}>Ver todos los productos →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Main: 3-column ML-style layout */}
        <div className="pd-main-grid" style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', display: 'grid', gridTemplateColumns: 'auto 1fr 380px', gap: 40, marginBottom: 20, boxShadow: '0 10px 40px rgba(236,72,153,0.1)', alignItems: 'flex-start' }}>

          {/* Column 1: Image gallery (thumbs + main) */}
          <div className="pd-gallery" style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <div className="pd-gallery-main" style={{ position: 'relative', width: 420, height: 420, background: '#fff', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              {images[selectedImg]
                ? <ImageZoom src={images[selectedImg]} alt={product.NAME} width={420} height={420} />
                : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>💄</span>}
              {hasDisc && (
                <span style={{ position: 'absolute', top: 12, left: 12, background: `linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT})`, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 16, boxShadow: '0 3px 10px rgba(236,72,153,0.4)' }}>
                  -{discPct}% OFF
                </span>
              )}
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'flex', gap: 6 }}>
                <ShareButton title={product.NAME} text={`${product.NAME} - ${formatPrice(displayPrice)}`} image={product.IMAGEURL} />
                <FavoriteButton productId={product.$id} size={20} />
              </div>
            </div>
            {images.length > 1 && (
              <div className="pd-gallery-thumbs pd-h-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {images.map((img, i) => (
                  <button key={i} type="button" className="pd-gallery-thumb-btn"
                    onClick={() => setSelectedImg(i)}
                    style={{
                      width: 56, height: 56, border: `2px solid ${selectedImg === i ? PINK_PRIMARY : PINK_BG_DARK}`,
                      borderRadius: 8, background: '#fff', cursor: 'pointer', padding: 0, overflow: 'hidden',
                      transition: 'all .15s', boxShadow: selectedImg === i ? `0 0 0 1px ${PINK_PRIMARY}` : 'none',
                    }}>
                    <Image src={img} alt="" width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Info (title, rating, price, description) */}
          <div className="pd-info" style={{ minWidth: 0, paddingTop: 4 }}>
            {soldQty > 0 && (
              <p style={{ margin: '0 0 6px', fontSize: 13, color: TEXT_MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} color={PINK_PRIMARY} /> Nuevo · <strong style={{ color: TEXT_DARK }}>+{soldQty.toLocaleString()}</strong> vendidos
              </p>
            )}
            {isBestSeller && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, background: `linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT})`, padding: '4px 12px', borderRadius: 16, boxShadow: '0 3px 10px rgba(236,72,153,0.3)' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>⭐ MÁS VENDIDO</span>
              </div>
            )}
            <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 600, color: TEXT_DARK, lineHeight: 1.3, letterSpacing: -0.2 }}>{product.NAME}</h1>

            {/* Rating - always visible */}
            <div
              onClick={() => {
                const tabsEl = document.getElementById('product-tabs');
                if (tabsEl) {
                  tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.dispatchEvent(new CustomEvent('activate-tab', { detail: 'reviews' }));
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, cursor: 'pointer' }}
              title="Ver opiniones"
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(i => {
                  const isFull = i <= Math.floor(rating);
                  const isHalf = !isFull && i === Math.ceil(rating) && rating % 1 >= 0.5;
                  return (
                    <Star key={i} size={13} fill={isFull ? '#fbbf24' : isHalf ? 'url(#half-star)' : 'none'} color="#fbbf24" />
                  );
                })}
              </div>
              {numReviews > 0 && <span style={{ fontSize: 12, color: PINK_PRIMARY, fontWeight: 500 }}>({numReviews})</span>}
              {numReviews === 0 && <span style={{ fontSize: 12, color: TEXT_MUTED }}>(Sin opiniones)</span>}
            </div>

            {/* Price */}
            {hasOffer && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg, ${PINK_BG_DARK}, ${PINK_BG})`, border: `1px solid ${PINK_PRIMARY}`, borderRadius: 8, padding: '4px 10px', marginBottom: 10 }}>
                <Sparkles size={12} color={PINK_PRIMARY} />
                <span style={{ fontSize: 11, fontWeight: 800, color: PINK_PRIMARY, letterSpacing: 0.3 }}>OFERTA EXCLUSIVA</span>
              </div>
            )}
            <div style={{ marginBottom: 18 }}>
              {hasWholesale && <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: 0.5 }}>PRECIO MAYORISTA</p>}
              {(hasDisc && !isWholesaleQty) && (
                <p style={{ margin: '0 0 2px', fontSize: 14, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(product.PRICE)}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span className="pd-price-main" style={{ fontSize: 36, fontWeight: 400, color: TEXT_DARK, letterSpacing: -1, lineHeight: 1 }}>
                  {formatPrice(isWholesaleQty ? product.WHOLESALEPRICE! : effectivePrice)}
                </span>
                {(hasDisc && !isWholesaleQty) && (
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>{discPct}% OFF</span>
                )}
              </div>
              <button onClick={() => setPaymentModalOpen(true)} style={{ margin: '6px 0 0', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: PINK_PRIMARY, fontWeight: 600, textDecoration: 'underline', textDecorationStyle: 'dotted', display: 'block', textAlign: 'left' }}>Ver los medios de pago</button>
              {isWholesaleQty && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Precio mayorista aplicado</p>}
              {hasWholesale && !isWholesaleQty && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: PINK_PRIMARY, background: '#f9fafb', padding: '6px 10px', borderRadius: 6, border: `1px solid ${PINK_BG_DARK}` }}>
                  Comprando {product.WHOLESALEMINQUANTITY}+ unidades: <strong>{formatPrice(product.WHOLESALEPRICE!)}</strong> c/u
                </p>
              )}
            </div>

            {/* Características rápidas */}
            {features.length > 0 && (
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${PINK_BG_DARK}` }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>Lo que tienes que saber de este producto</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {features.slice(0, 6).map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', fontSize: 13, color: TEXT_MUTED }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: PINK_PRIMARY, marginTop: 7, flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description preview */}
            {product.DESCRIPTION && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>Descripción</h3>
                <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.DESCRIPTION}</p>
              </div>
            )}
          </div>

          {buyBoxContent('pd-buy-box pd-buy-box--mobile-inline')}

          {/* Column 3: Sticky buy box — desktop */}
          {buyBoxContent('pd-buy-box pd-buy-box--desktop')}
        </div>

        {/* Features + Description */}
        {((features.length > 0) || (tags.length > 0) || product.DESCRIPTION) && (
          <div className="pd-section" style={{ background: '#fff', borderRadius: 24, padding: '32px 36px', marginBottom: 20, boxShadow: '0 6px 24px rgba(236,72,153,0.06)' }}>
            {features.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={20} color={PINK_PRIMARY} /> Características del producto
                </h2>
                <div className="pd-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0, border: `1px solid ${PINK_BG_DARK}`, borderRadius: 14, overflow: 'hidden' }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: i % 2 === 0 ? '#f9fafb' : '#fff', borderBottom: `1px solid ${PINK_BG_DARK}` }}>
                      <Check size={15} color={PINK_PRIMARY} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: TEXT_DARK }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: TEXT_DARK }}>Etiquetas</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 13, color: PINK_PRIMARY, border: `1.5px solid ${PINK_LIGHT}`, background: '#f9fafb', padding: '5px 16px', borderRadius: 24, fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            {product.DESCRIPTION && (
              <div>
                <h2 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 700, color: TEXT_DARK }}>Descripción</h2>
                <p style={{ margin: 0, fontSize: 15, color: TEXT_MUTED, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{product.DESCRIPTION}</p>
              </div>
            )}
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <div className="pd-section" style={{ background: '#fff', borderRadius: 24, padding: '32px 36px', marginBottom: 20, boxShadow: '0 6px 24px rgba(236,72,153,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT_DARK }}>Productos relacionados</h2>
              {categoryName && (
                <Link href={`/productos?categoria=${encodeURIComponent(categoryName)}`} style={{ fontSize: 14, color: PINK_PRIMARY, textDecoration: 'none', fontWeight: 600 }}>Ver más →</Link>
              )}
            </div>
            <div className="pd-related-scroll pd-h-scroll" style={{ display: 'flex', gap: 18 }}>
              {related.map(p => {
                const rcp = p.CURRENTPRICE ?? 0;
                const rprice = rcp > 0 ? rcp : p.PRICE;
                const rhasDisc = rcp > 0 && rcp < p.PRICE;
                const rdisc = rhasDisc ? Math.round(((p.PRICE - rcp) / p.PRICE) * 100) : 0;
                return (
                  <Link key={p.$id} href={`/productos/${p.$id}`} className="pd-related-card" style={{ flexShrink: 0, width: 180, textDecoration: 'none', border: `1.5px solid ${PINK_BG_DARK}`, borderRadius: 16, overflow: 'hidden', background: '#fff', display: 'block', transition: 'all .25s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(236,72,153,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = PINK_LIGHT; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = PINK_BG_DARK; }}
                  >
                    <div style={{ position: 'relative', height: 158, background: '#fff' }}>
                      {p.IMAGEURL ? <Image src={p.IMAGEURL} alt={p.NAME} fill className="object-contain p-2" /> : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>💄</span>}
                      {rhasDisc && <span style={{ position: 'absolute', top: 8, left: 8, background: `linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT})`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12 }}>-{rdisc}%</span>}
                    </div>
                    <div style={{ padding: '12px 14px 16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: TEXT_DARK, lineHeight: 1.4, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
                      {rhasDisc && <p style={{ margin: '0 0 2px', fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(p.PRICE)}</p>}
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: PINK_PRIMARY }}>{formatPrice(rprice)}</p>
                      {rhasDisc && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#10b981', fontWeight: 700 }}>{rdisc}% OFF</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <ProductTabs tabs={[
          { id: 'desc', label: 'Descripción', content: (
            <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {product.DESCRIPTION || 'Sin descripción disponible.'}
              {features.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <p style={{ fontWeight: 700, color: TEXT_DARK, marginBottom: 10 }}>Características:</p>
                  <ul style={{ margin: 0, paddingLeft: 22 }}>
                    {features.map((f: string, i: number) => (
                      <li key={i} style={{ marginBottom: 6, color: TEXT_MUTED }}>{f.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )},
          { id: 'reviews', label: 'Opiniones', count: numReviews, content: (
            <ReviewSection productId={product.$id} rating={rating} numReviews={numReviews} />
          )},
          { id: 'questions', label: 'Preguntas', content: (
            <ProductQuestions productId={product.$id} />
          )},
        ]} />

        {/* Vistos recientemente */}
        <RecentlyViewed excludeId={product.$id} />

      </div>

      {/* Barra fija de compra — mobile */}
      {stock > 0 && (
        <div className="pd-mobile-bar">
          <div className="pd-mobile-bar-info">
            <div className="pd-mobile-bar-price">{formatPrice(effectivePrice)}</div>
            {(hasDisc && !isWholesaleQty) && <div className="pd-mobile-bar-meta">{discPct}% OFF · {stockLabel}</div>}
            {!(hasDisc && !isWholesaleQty) && <div className="pd-mobile-bar-meta">{stockLabel}</div>}
          </div>
          <div className="pd-mobile-bar-actions">
            <button type="button" className="pd-mbar-cart" onClick={handleAdd} aria-label="Agregar al carrito">
              <ShoppingCart size={16} />
              {added ? 'Listo' : 'Carrito'}
            </button>
            <button type="button" className="pd-mbar-buy" onClick={handleAdd}>Comprar</button>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {paymentModalOpen && (
        <div onClick={() => setPaymentModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TEXT_DARK }}>Medios de pago para este producto</h2>
              <button onClick={() => setPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#666', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ padding: '24px' }}>

              {/* Transferencia bancaria */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: TEXT_DARK }}>Transferencia bancaria</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_MUTED }}>Acreditación en 1-2 horas hábiles.</p>
                <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>¿Cómo realizar la transferencia?</p>
                  {[
                    { step: '1', text: 'Agrega los productos al carrito y ve al checkout.' },
                    { step: '2', text: 'Selecciona "Transferencia bancaria" como medio de pago.' },
                    { step: '3', text: 'Te mostraremos los datos de la cuenta para transferir.' },
                    { step: '4', text: 'Transfiere el monto exacto e indica tu nombre y número de orden como referencia.' },
                    { step: '5', text: 'Envía el comprobante por WhatsApp o email. Procesamos tu pedido al confirmar el pago.' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT})`, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{item.step}</div>
                      <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: '#f3f4f6', marginBottom: 28 }} />

              {/* Pasarelas de pago */}
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: TEXT_DARK }}>Pasarelas de pago</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: TEXT_MUTED }}>Pago seguro. Acreditación instantánea.</p>

                {/* Webpay */}
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, background: '#005A9C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 120 40" width="44" height="20" xmlns="http://www.w3.org/2000/svg"><text x="4" y="28" fontFamily="Arial" fontWeight="bold" fontSize="22" fill="white">Webpay</text></svg>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>Webpay Plus</p>
                    <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>Paga con tarjetas de crédito, débito y prepago Redcompra. Operado por Transbank.</p>
                  </div>
                </div>

                {/* MercadoPago */}
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, background: '#009EE3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 44 44" width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="white" opacity="0.15"/><path d="M22 8C14.27 8 8 14.27 8 22C8 29.73 14.27 36 22 36C29.73 36 36 29.73 36 22C36 14.27 29.73 8 22 8ZM28.5 19.5L22 26L15.5 19.5L17 18L22 23L27 18L28.5 19.5Z" fill="white"/></svg>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>Mercado Pago</p>
                    <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED }}>Paga con tu cuenta de Mercado Pago, tarjetas de crédito, débito o efectivo. Rápido y seguro.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
