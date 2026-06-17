'use client';

import { useEffect, useState, useRef } from 'react';
import { formatPrice } from '@/lib/appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Sparkles, ShoppingCart, Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';

export default function LatestProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();

  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getScrollAmount = () => {
    const container = containerRef.current;
    if (!container) return 206;
    const card = container.querySelector<HTMLElement>('[data-latest-card]');
    if (!card) return 206;
    const styles = window.getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '16') || 16;
    return card.offsetWidth + gap;
  };

  const handleScrollPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
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

  // Autoplay
  useEffect(() => {
    if (products.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
      }
    }, 3500);
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
    const loadNewest = async () => {
      try {
        const res = await fetch('/api/public-data/products?sortBy=updated&limit=24');
        if (res.ok) {
          const data = await res.json();
          // Filter to show active products with stock
          const activeProducts = (data.products || []).filter((p: Product) => p.STOCK !== undefined && p.STOCK > 0);
          setProducts(activeProducts);
        }
      } catch (err) {
        console.error('[LatestProducts] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNewest();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(product.$id);
    addItem(product);
    setTimeout(() => {
      setAddingId(null);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e396bf]"></div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 relative">
      {/* Title section */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-1 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <Sparkles size={14} className="animate-pulse" />
            Novedades y Reingresos
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            Últimos Agregados y Stock Renovado
          </h2>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .latest-carousel-wrapper {
          position: relative;
          width: 100%;
        }
        .latest-carousel-wrapper::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 24px;
          background: linear-gradient(to right, #fcfcfd, transparent);
          z-index: 10;
          pointer-events: none;
        }
        .latest-carousel-wrapper::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 24px;
          background: linear-gradient(to left, #fcfcfd, transparent);
          z-index: 10;
          pointer-events: none;
        }
        .latest-carousel-container {
          display: flex !important;
          overflow-x: auto !important;
          scroll-behavior: smooth !important;
          gap: 16px !important;
          padding: 12px 10px 24px !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .latest-carousel-container::-webkit-scrollbar {
          display: none !important;
        }
        .latest-product-card {
          width: clamp(165px, 16vw, 226px) !important;
          flex-shrink: 0 !important;
        }
        .animate-spin-slow {
          animation: spin 1.8s linear infinite;
        }
      `}} />

      {/* Carousel */}
      <div 
        className="latest-carousel-wrapper group/wrapper relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Buttons */}
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

        {/* Scroll Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="latest-carousel-container scrollbar-hide snap-x snap-mandatory"
        >
          {[...products, ...products, ...products].map((p, idx) => {
            const pricing = resolveProductDisplayPrice(p, apertura);
            const displayPrice = pricing.displayPrice;
            const hasDiscount = pricing.hasDiscount;
            const isAdding = addingId === p.$id;

            const prodIdx = idx % products.length;
            const createdAt = new Date(p.$createdAt || '').getTime();
            const now = Date.now();
            
            const isNew = (now - createdAt < 7 * 24 * 60 * 60 * 1000) || (prodIdx < 4);
            const isRestocked = !isNew && p.STOCK > 0;

            return (
              <div 
                key={`latest-carousel-${p.$id}-${idx}`} 
                data-latest-card
                className="latest-product-card snap-start group"
              >
                <div className="relative h-full rounded-2xl bg-gradient-to-br from-pink-500/35 via-fuchsia-500/10 to-violet-500/35 p-[1px] shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_14px_40px_rgba(0,0,0,0.10)] hover:-translate-y-1 will-change-transform">
                  <div className="h-full rounded-[15px] bg-white/95 backdrop-blur overflow-hidden flex flex-col justify-between border border-white/60">
                    <a href={`/productos/${p.$id}`} className="block relative overflow-hidden aspect-square bg-gradient-to-br from-pink-50 via-white to-violet-50 p-1.5">
                      <div className="w-full h-full rounded-xl overflow-hidden relative">
                        {p.IMAGEURL ? (
                          <img 
                            src={p.IMAGEURL} 
                            alt={p.NAME} 
                            loading="lazy" 
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl bg-gray-100">
                            📦
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                        {isNew ? (
                          <span className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md flex items-center gap-1 border border-white/25">
                            <Sparkles size={8} /> Nuevo
                          </span>
                        ) : (
                          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md flex items-center gap-1 border border-white/25">
                            <RefreshCw size={8} className="animate-spin-slow" /> Reingreso
                          </span>
                        )}
                      </div>

                      {pricing.hasDiscount && (
                        <span className="absolute top-2.5 right-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md z-10 border border-white/25">
                          -{pricing.discountPercent}% OFF
                        </span>
                      )}
                    </a>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-[11px] leading-[14px] h-[28px] line-clamp-2 mb-1.5 group-hover:text-fuchsia-700 transition-colors">
                          {p.NAME}
                        </h3>

                        <div className="flex flex-col gap-0.5 mb-2.5">
                          {hasDiscount && (
                            <span className="text-[10px] text-gray-400 line-through leading-none">
                              {formatPrice(p.PRICE)}
                            </span>
                          )}
                          <div className="flex items-end gap-1.5">
                            <span className="font-black text-gray-950 text-sm leading-none">
                              {formatPrice(displayPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(e, p)}
                        className={`w-full py-2.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                          isAdding
                            ? 'bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)]'
                            : 'bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] hover:from-pink-500 hover:to-violet-500'
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <Check size={12} strokeWidth={3} />
                            Listo
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={11} />
                            Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
