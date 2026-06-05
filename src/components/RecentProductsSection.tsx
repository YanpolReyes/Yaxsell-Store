'use client';

import { useEffect, useState } from 'react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { Client, Query } from 'appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Sparkles, ShoppingCart, Check } from 'lucide-react';

export default function RecentProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    // 1. Fetch initial recent products with stock
    const loadRecent = async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
          Query.greaterThan('STOCK', 0),
          Query.orderDesc('$createdAt'),
          Query.limit(12)
        ]);
        setProducts(res.documents as unknown as Product[]);
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
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Title block */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Recording indicator dot (Live recording style) */}
          <div className="relative flex items-center justify-center w-6 h-6">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-wider text-gray-900">
              LIVE SHOPPING
            </h2>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Live shopping productos en vivo
            </p>
          </div>
        </div>
      </div>

      {/* Responsive layout: scrollable list on mobile, grid on desktop */}
      <div className="flex overflow-x-auto gap-4 pb-4 px-1 -mx-4 sm:mx-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible scrollbar-hide">
        {products.map(p => {
          const displayPrice = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
          const hasDiscount = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
          const discPct = hasDiscount ? Math.round(((p.PRICE - p.CURRENTPRICE!) / p.PRICE) * 100) : 0;
          const isAdding = addingId === p.$id;

          return (
            <div 
              key={p.$id} 
              className="flex-shrink-0 w-[200px] sm:w-auto bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Product link wrapper */}
              <a href={`/productos/${p.$id}`} className="block relative overflow-hidden aspect-square bg-gray-50">
                {p.IMAGEURL ? (
                  <img 
                    src={p.IMAGEURL} 
                    alt={p.NAME} 
                    loading="lazy" 
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                    📦
                  </div>
                )}

                {/* Badge top-left */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                  <span className="bg-pink-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Nuevo
                  </span>
                  {hasDiscount && (
                    <span className="bg-green-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
                      -{discPct}%
                    </span>
                  )}
                </div>

                {/* Badge top-right with Stock amount if low */}
                {p.STOCK > 0 && p.STOCK <= 5 && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm z-10">
                    Últimas {p.STOCK}
                  </span>
                )}
              </a>

              {/* Product Info */}
              <div className="p-3 sm:p-4 flex flex-col justify-between flex-grow">
                <div className="mb-2">
                  <a href={`/productos/${p.$id}`} className="block">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-800 hover:text-pink-500 line-clamp-2 transition-colors duration-200 min-h-[32px] leading-tight">
                      {p.NAME}
                    </h3>
                  </a>
                </div>

                {/* Price and Add button */}
                <div className="flex items-center justify-between gap-1.5 mt-auto">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm sm:text-base text-gray-950">
                      {formatPrice(displayPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        {formatPrice(p.PRICE)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(e, p)}
                    disabled={isAdding}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-300 ${
                      isAdding 
                        ? 'bg-green-500 text-white scale-110' 
                        : 'bg-gray-950 text-white hover:bg-pink-500 shadow-sm hover:shadow active:scale-95'
                    }`}
                    title="Agregar al carrito"
                    aria-label="Agregar al carrito"
                  >
                    {isAdding ? <Check size={16} /> : <ShoppingCart size={16} />}
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
