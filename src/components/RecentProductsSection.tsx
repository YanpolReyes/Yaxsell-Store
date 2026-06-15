'use client';

import { useEffect, useState, useRef } from 'react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { Client, Query } from 'appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Sparkles, ShoppingCart, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { getSkuFromFeatures, getLiveLogicFromFeatures, isLiveLogicLimitedTimeActive } from '@/lib/product-features';

export default function RecentProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { addItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();

  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScrollPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -206, behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 206, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || products.length === 0) return;
    const { scrollLeft, scrollWidth } = container;
    const singleCopyWidth = scrollWidth / 3;

    if (scrollLeft < 10) {
      container.scrollLeft = singleCopyWidth + scrollLeft;
    } else if (scrollLeft >= singleCopyWidth * 2 - 10) {
      container.scrollLeft = scrollLeft - singleCopyWidth;
    }
  };

  // Autoplay effect
  useEffect(() => {
    if (products.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollBy({ left: 206, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [products, isHovered]);

  // Center scroll position on mount/update
  useEffect(() => {
    const container = containerRef.current;
    if (container && products.length > 0) {
      const timer = setTimeout(() => {
        const singleCopyWidth = container.scrollWidth / 3;
        container.scrollLeft = singleCopyWidth;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [products]);

  useEffect(() => {
    // Helper to compute local 7am threshold
    const getLiveShoppingThreshold = (): Date => {
      const now = new Date();
      const today7Am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0);
      if (now.getTime() >= today7Am.getTime()) {
        return today7Am;
      } else {
        const yesterday7Am = new Date(today7Am);
        yesterday7Am.setDate(yesterday7Am.getDate() - 1);
        return yesterday7Am;
      }
    };

    // 1. Fetch initial recent products with stock via API
    const loadRecent = async () => {
      try {
        const res = await fetch('/api/public-data/products?live=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProducts((data.products || []) as Product[]);
        }
      } catch (err) {
        console.error('[RecentProducts] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecent();
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId) return;

    addItem(product, 1);
    setAddingId(product.$id);

    // Dynamic cart drawer opening helper
    setTimeout(() => {
      setAddingId(null);
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.setAttribute('data-hidden', 'false');
        cartDrawer.removeAttribute('inert');
        document.documentElement.style.overflow = 'hidden';
      }
    }, 850);
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 relative overflow-hidden">

      {/* Title block with glassmorphism */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 bg-white/40 backdrop-blur-md border border-white/60 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          {/* Recording indicator dot (Live recording style) */}
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-red-50 rounded-full shadow-inner flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]"></span>
          </div>
          <div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight sm:tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 drop-shadow-sm uppercase">
              Live Shopping
            </h2>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-pink-600 font-bold uppercase tracking-wide sm:tracking-widest mt-0">
              Productos en vivo • Stock Reciente
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="group bg-white/70 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 hover:text-white hover:border-transparent text-pink-600 border border-pink-100/80 backdrop-blur-md font-extrabold text-[10px] sm:text-xs py-2 px-4 sm:px-6 rounded-full transition-all duration-300 flex items-center gap-1.5 sm:gap-2 shadow-[0_4px_12px_rgba(219,39,119,0.03)] hover:shadow-[0_8px_20px_rgba(219,39,119,0.18)] active:scale-95 flex-shrink-0 tracking-wider uppercase"
        >
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500 shadow-[0_0_8px_#ec4899] group-hover:bg-white group-hover:shadow-[0_0_8px_#fff] transition-colors duration-300"></span>
          </span>
          Ver todo <span className="hidden sm:inline">el Live</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.8" stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 group-hover:text-white transition-all duration-300 transform group-hover:scale-110">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
      </div>

      {/* Drawer */}
      <div 
        className={`fixed inset-0 z-[99999] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => setIsDrawerOpen(false)}
        />
        
        {/* Drawer Panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10 sticky top-0">
            <h3 className="font-black text-xl text-gray-900 tracking-tight">Productos del Live 🛍️</h3>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
            >
              <X size={24} />
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {products.map(p => {
                const liveLogicDrawer = getLiveLogicFromFeatures((p as any).FEATURES || '');
                const pricing = resolveProductDisplayPrice(p, apertura, liveLogicDrawer);
                const displayPrice = pricing.displayPrice;
                const hasDiscount = pricing.hasDiscount;
                const isAdding = addingId === p.$id;
                const isLimitedStock = p.STOCK !== undefined && p.STOCK !== null && p.STOCK < 99999;
                const isSoldOut = isLimitedStock && p.STOCK <= 0;
                
                return (
                  <div key={`drawer-${p.$id}`} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col ${isSoldOut ? 'opacity-80' : ''}`}>
                    <a href={`/productos/${p.$id}`} className="block relative aspect-square bg-gray-50">
                      {p.IMAGEURL ? (
                        <img src={p.IMAGEURL} alt={p.NAME} className={`w-full h-full object-cover ${isSoldOut ? 'grayscale brightness-[0.7]' : ''}`} loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl bg-gray-100">📦</div>
                      )}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-gray-950/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-white/95 backdrop-blur-md text-gray-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-white/20">
                            Agotado
                          </span>
                        </div>
                      )}
                      {/* Logic badge or discount badge */}
                      {(() => {
                        const liveLogic = getLiveLogicFromFeatures((p as any).FEATURES || '');
                        if (liveLogic?.limitedTime && isLiveLogicLimitedTimeActive(liveLogic)) {
                          return (
                            <span className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-md z-10">
                              ⏰ OFERTA
                            </span>
                          );
                        }
                        if (liveLogic?.minQty) {
                          return (
                            <span className="absolute top-2 right-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-md z-10">
                              📦 ×{liveLogic.minQty.qty}+
                            </span>
                          );
                        }
                        if (pricing.hasDiscount) {
                          return (
                            <span className="absolute top-2 right-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-md z-10">
                              -{pricing.discountPercent}% OFF
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </a>
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <a href={`/productos/${p.$id}`}>
                        <h4 className="text-[11px] sm:text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 hover:text-pink-600 transition-colors">{p.NAME}</h4>
                      </a>
                      {isLimitedStock && p.STOCK > 0 && (
                        <div className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md inline-block mt-1 self-start animate-pulse">
                          🔥 ¡Solo quedan {p.STOCK}!
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-auto pt-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs sm:text-sm live-price-red">{formatPrice(displayPrice)}</span>
                          {hasDiscount && pricing.originalPrice != null && <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">{formatPrice(pricing.originalPrice)}</span>}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, p)}
                          disabled={isAdding || isSoldOut}
                          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors ${
                            isAdding 
                              ? 'bg-green-500 text-white' 
                              : isSoldOut
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#e396bf] hover:bg-[#d685af] text-white'
                          }`}
                        >
                          {isAdding ? <Check size={14} /> : isSoldOut ? <X size={14} /> : <ShoppingCart size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <a href="/productos" className="flex items-center justify-center w-full py-3.5 bg-white border border-gray-900 text-gray-900 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
              Ir al catálogo completo
            </a>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes livePricePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .live-price-red {
          background: linear-gradient(135deg, #ff7e95 0%, #ff385c 100%) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          font-weight: 900 !important;
          filter: drop-shadow(0 2px 4px rgba(255, 56, 92, 0.15)) !important;
          animation: livePricePulse 2s infinite ease-in-out;
          display: inline-block;
          transform-origin: left center;
        }
        
        .recent-carousel-wrapper {
          position: relative;
          width: 100%;
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
        .recent-carousel-container {
          display: flex !important;
          overflow-x: auto !important;
          scroll-behavior: smooth !important;
          gap: 16px !important;
          padding: 12px 10px 24px !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .recent-carousel-container::-webkit-scrollbar {
          display: none !important;
        }
        .recent-product-card {
          width: 180px !important;
          flex-shrink: 0 !important;
        }
      `}} />

      {/* Carrusel horizontal infinito */}
      <div 
        className="recent-carousel-wrapper group/wrapper relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Botones de navegación (solo desktop) */}
        <button 
          onClick={handleScrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:bg-[#e396bf] hover:text-white transition-all duration-300 opacity-0 group-hover/wrapper:opacity-100 active:scale-95"
          aria-label="Anterior"
        >
          <ChevronLeft size={22} />
        </button>
        <button 
          onClick={handleScrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 cursor-pointer hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:bg-[#e396bf] hover:text-white transition-all duration-300 opacity-0 group-hover/wrapper:opacity-100 active:scale-95"
          aria-label="Siguiente"
        >
          <ChevronRight size={22} />
        </button>

        {/* Contenedor del scroll */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="recent-carousel-container scrollbar-hide snap-x snap-mandatory"
        >
          {[...products, ...products, ...products].map((p, idx) => {
            const pFeatures = Array.isArray(p.FEATURES) ? p.FEATURES.join('\n') : p.FEATURES;
            const pTags = Array.isArray(p.TAGS) ? p.TAGS.join(',') : p.TAGS;
            const cardSku = getSkuFromFeatures(pFeatures, pTags, (p as any).jumpseller_id, p.SKU || (p as any).sku);
            const liveLogicCard = getLiveLogicFromFeatures(pFeatures);
            const pricing = resolveProductDisplayPrice(p, apertura, liveLogicCard);
            const displayPrice = pricing.displayPrice;
            const hasDiscount = pricing.hasDiscount;
            const isAdding = addingId === p.$id;

            const isLimitedStock = p.STOCK !== undefined && p.STOCK !== null && p.STOCK < 99999;
            const isSoldOut = isLimitedStock && p.STOCK <= 0;

            return (
              <div 
                key={`carousel-${p.$id}-${idx}`} 
                className={`recent-product-card snap-start bg-white rounded-2xl overflow-hidden border border-gray-100/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] transition-all duration-300 group flex flex-col justify-between transform ${isSoldOut ? 'opacity-80' : 'hover:-translate-y-1'}`}
              >
                <a href={`/productos/${p.$id}`} className="block relative overflow-hidden aspect-square bg-gray-50/50 p-1.5">
                  <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner">
                    {p.IMAGEURL ? (
                      <img 
                        src={p.IMAGEURL} 
                        alt={p.NAME} 
                        loading="lazy" 
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isSoldOut ? 'grayscale brightness-[0.7]' : 'group-hover:scale-110'}`} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl bg-gray-100">
                        📦
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-gray-950/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-white/95 backdrop-blur-md text-gray-950 font-black text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white/20">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge top-left */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 border border-gray-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                      Nuevo
                    </span>
                  </div>

                  {/* Badge top-right: logic-aware */}
                  {(() => {
                    const liveLogic = getLiveLogicFromFeatures((p as any).FEATURES || '');
                    if (liveLogic?.limitedTime && isLiveLogicLimitedTimeActive(liveLogic)) {
                      return (
                        <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md z-10">
                          ⏰ OFERTA
                        </span>
                      );
                    }
                    if (liveLogic?.minQty) {
                      return (
                        <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md z-10">
                          📦 ×{liveLogic.minQty.qty}+
                        </span>
                      );
                    }
                    if (pricing.hasDiscount) {
                      return (
                        <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md z-10">
                          -{pricing.discountPercent}% OFF
                        </span>
                      );
                    }
                    return null;
                  })()}
                </a>

                {/* Product Info */}
                <div className="p-3.5 flex flex-col justify-between flex-grow bg-gradient-to-b from-transparent to-white/50">
                  <div className="mb-2">
                    {cardSku && <div className="text-[10px] text-gray-400 font-bold mb-1">SKU: {cardSku}</div>}
                    <a href={`/productos/${p.$id}`} className="block">
                      <h3 className="font-semibold text-xs sm:text-[13px] text-gray-800 group-hover:text-pink-500 line-clamp-2 transition-colors duration-200 min-h-[34px] leading-snug">
                        {p.NAME}
                      </h3>
                    </a>
                    {p.PACKQTY && p.PACKQTY > 1 ? (
                      <div style={{ fontSize: '10px', color: '#db2777', fontWeight: 800, marginTop: '2px' }}>
                        {p.PACKQTY} UNIDADES POR PAQUETE
                      </div>
                    ) : null}
                  </div>

                  {/* Price and Add button */}
                  {isLimitedStock && p.STOCK > 0 && (
                    <div className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md inline-block mb-2 self-start animate-pulse">
                      🔥 ¡Solo quedan {p.STOCK} un!
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-gray-100/50">
                    <div className="flex flex-col">
                      <span className="font-black text-sm sm:text-base tracking-tight live-price-red">
                        {formatPrice(displayPrice)}
                      </span>
                      {hasDiscount && pricing.originalPrice != null && (
                        <span className="text-[10px] text-gray-400 line-through font-medium">
                          {formatPrice(pricing.originalPrice)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, p)}
                      disabled={isAdding || isSoldOut}
                      className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300 shadow-md ${
                        isAdding 
                          ? 'bg-green-500 text-white scale-110 shadow-green-500/30' 
                          : isSoldOut
                            ? 'bg-gray-250 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-[#e396bf] text-white hover:bg-[#d685af] active:scale-95 shadow-pink-100'
                      }`}
                      title={isSoldOut ? "Agotado" : "Agregar al carrito"}
                      aria-label={isSoldOut ? "Agotado" : "Agregar al carrito"}
                    >
                      {isAdding ? <Check size={15} strokeWidth={3} /> : isSoldOut ? <X size={15} strokeWidth={2.5} /> : <ShoppingCart size={15} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
