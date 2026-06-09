'use client';

import { useEffect, useState } from 'react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { Client, Query } from 'appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Sparkles, ShoppingCart, Check, X } from 'lucide-react';

export default function RecentProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    // 1. Fetch initial recent products with stock via cached API
    const loadRecent = async () => {
      try {
        const res = await fetch('/api/public-data/products?sortBy=newest');
        if (res.ok) {
          const data = await res.json();
          setProducts((data.products || []).slice(0, 12) as Product[]);
        }
      } catch (err) {
        console.error('[RecentProducts] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecent();

    // 2. Subscribe to Realtime Updates (WebSocket)
    // Avoids polling HTTP requests completely. Connects once, server pushes updates.
    const { endpoint, projectId, databaseId } = getAppwriteConfig();
    const realtimeClient = new Client().setEndpoint(endpoint).setProject(projectId);

    const unsubscribe = realtimeClient.subscribe(
      `databases.${databaseId}.collections.${PRODUCTS_COLLECTION}.documents`,
      (response: any) => {
        const events: string[] = response.events || [];
        const isCreate = events.some(e => e.endsWith('.create'));
        const isUpdate = events.some(e => e.endsWith('.update'));
        const isDelete = events.some(e => e.endsWith('.delete'));
        const doc = response.payload as any;

        if (isDelete) {
          setProducts(prev => prev.filter(p => p.$id !== doc.$id));
        } else if (isCreate || isUpdate) {
          if ((doc.STOCK || 0) <= 0 || doc.ISACTIVE === false) {
            // Remove from list if stock is gone or product deactivated
            setProducts(prev => prev.filter(p => p.$id !== doc.$id));
          } else {
            // Insert or update and sort
            setProducts(prev => {
              const filtered = prev.filter(p => p.$id !== doc.$id);
              const updated = [doc, ...filtered];
              return updated
                .sort((a, b) => {
                  const dateA = a.DATE_ADDED ? new Date(a.DATE_ADDED).getTime() : (a.$createdAt ? new Date(a.$createdAt).getTime() : 0);
                  const dateB = b.DATE_ADDED ? new Date(b.DATE_ADDED).getTime() : (b.$createdAt ? new Date(b.$createdAt).getTime() : 0);
                  return dateB - dateA;
                })
                .slice(0, 12);
            });
          }
        }
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.error('[RecentProducts] Unsubscribe error:', e);
      }
    };
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

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-xs text-black/40 mt-3 font-medium">Buscando novedades en stock...</p>
      </div>
    );
  }

  if (products.length === 0) return null;

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
          className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full transition-all flex items-center gap-1.5 shadow-lg hover:shadow-xl active:scale-95 flex-shrink-0"
        >
          Ver todo <span className="hidden sm:inline">el Live</span> 🛍️
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
                const displayPrice = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
                const hasDiscount = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
                const isAdding = addingId === p.$id;
                
                return (
                  <div key={`drawer-${p.$id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                    <a href={`/productos/${p.$id}`} className="block relative aspect-square bg-gray-50">
                      {p.IMAGEURL ? (
                        <img src={p.IMAGEURL} alt={p.NAME} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl bg-gray-100">📦</div>
                      )}
                    </a>
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <a href={`/productos/${p.$id}`}>
                        <h4 className="text-[11px] sm:text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 hover:text-pink-600 transition-colors">{p.NAME}</h4>
                      </a>
                      <div className="flex items-center justify-between gap-1 mt-auto">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">{formatPrice(displayPrice)}</span>
                          {hasDiscount && <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">{formatPrice(p.PRICE)}</span>}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, p)}
                          disabled={isAdding}
                          className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-colors ${
                            isAdding ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-pink-500 text-gray-700 hover:text-white'
                          }`}
                        >
                          {isAdding ? <Check size={14} /> : <ShoppingCart size={14} />}
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
        .recent-products-grid {
          display: flex !important;
          overflow-x: auto !important;
          gap: 12px !important;
          padding-bottom: 24px !important;
        }
        @media (min-width: 640px) {
          .recent-products-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: flex-start !important;
            overflow: visible !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
        .recent-product-card {
          width: 150px !important;
          flex-shrink: 0 !important;
        }
        @media (min-width: 640px) {
          .recent-product-card {
            width: 160px !important;
            margin-bottom: 12px !important;
          }
        }
      `}} />

      {/* Responsive layout: scrollable list on mobile, grid on desktop */}
      <div className="recent-products-grid scrollbar-hide snap-x snap-mandatory overscroll-x-contain sm:snap-none">
        {products.map(p => {
          const displayPrice = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
          const hasDiscount = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
          const discPct = hasDiscount ? Math.round(((p.PRICE - p.CURRENTPRICE!) / p.PRICE) * 100) : 0;
          const isAdding = addingId === p.$id;

          return (
            <div 
              key={p.$id} 
              className="recent-product-card snap-start bg-white rounded-none overflow-hidden border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-400 group flex flex-col justify-between transform hover:-translate-y-1"
            >
              <a href={`/productos/${p.$id}`} className="block relative overflow-hidden aspect-square bg-gray-50/50 p-1.5">
                <div className="w-full h-full rounded-none overflow-hidden relative shadow-inner">
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
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Badge top-left */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                  <span className="bg-white/95 backdrop-blur-sm text-gray-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 border border-gray-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                    Nuevo
                  </span>
                  {hasDiscount && (
                    <span className="bg-gradient-to-r from-rose-400 to-pink-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md">
                      -{discPct}% OFF
                    </span>
                  )}
                </div>

                {/* Badge top-right with Stock amount if low */}
                {p.STOCK > 0 && p.STOCK <= 5 && (
                  <span className="absolute top-2.5 right-2.5 bg-orange-500/95 backdrop-blur-sm text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-md z-10 animate-pulse">
                    ¡Solo {p.STOCK}!
                  </span>
                )}
              </a>

              {/* Product Info */}
              <div className="p-3.5 flex flex-col justify-between flex-grow bg-gradient-to-b from-transparent to-white/50">
                <div className="mb-2">
                  <a href={`/productos/${p.$id}`} className="block">
                    <h3 className="font-semibold text-xs sm:text-[13px] text-gray-800 group-hover:text-pink-500 line-clamp-2 transition-colors duration-200 min-h-[34px] leading-snug">
                      {p.NAME}
                    </h3>
                  </a>
                </div>

                {/* Price and Add button */}
                <div className="flex items-center justify-between gap-2 mt-auto pt-1.5 border-t border-gray-100/50">
                  <div className="flex flex-col">
                    <span className="font-black text-sm sm:text-base text-gray-900 tracking-tight">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-gray-400 line-through font-medium">
                        {formatPrice(p.PRICE)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(e, p)}
                    disabled={isAdding}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-300 shadow-md ${
                      isAdding 
                        ? 'bg-green-500 text-white scale-110 shadow-green-500/30' 
                        : 'bg-gray-900 text-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-400 hover:shadow-pink-500/40 active:scale-95'
                    }`}
                    title="Agregar al carrito"
                    aria-label="Agregar al carrito"
                  >
                    {isAdding ? <Check size={15} strokeWidth={3} /> : <ShoppingCart size={15} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
