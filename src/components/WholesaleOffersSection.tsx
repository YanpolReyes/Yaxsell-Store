'use client';

import { useEffect, useState } from 'react';
import { getServices, formatPrice } from '@/lib/appwrite';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Tag, ShoppingCart, Check, Percent, ArrowRight } from 'lucide-react';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';

export default function WholesaleOffersSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCart();
  const { settings: apertura } = useAperturaPromotion();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const configRes = await fetch('/api/ofertas');
        if (!configRes.ok) throw new Error();
        const configData = await configRes.json();
        const productIds: string[] = configData.productIds || [];

        if (productIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch product details for these IDs
        const prodRes = await fetch(`/api/public-data/products?ids=${productIds.join(',')}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          // Filter to show only active products with stock
          const filtered = (prodData.products || []).filter((p: Product) => p.STOCK !== undefined && p.STOCK > 0);
          setProducts(filtered);
        }
      } catch (err) {
        console.error('[WholesaleOffersSection] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product, quantity: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId) return;

    addItem(product, quantity);
    setAddingId(`${product.$id}-${quantity}`);

    setTimeout(() => {
      setAddingId(null);
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.setAttribute('data-hidden', 'false');
        cartDrawer.removeAttribute('inert');
        document.documentElement.style.overflow = 'hidden';
      }
    }, 800);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[250px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-pink-500"></div>
        <p className="text-xs text-gray-500 mt-4 font-semibold uppercase tracking-wider">Cargando ofertas al por mayor...</p>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-2">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-extrabold text-xs uppercase tracking-widest mb-1.5 bg-pink-50 border border-pink-100 rounded-full px-3.5 py-1 w-fit">
            <Percent size={13} className="animate-pulse" />
            Ofertas por Mayor
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight">
            Grandes Ofertas: Compra Más y Paga Menos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Precios especiales de mayorista a partir de las cantidades indicadas.
          </p>
        </div>
      </div>

      {/* Grid: 2 per row on large screens, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {products.map(p => {
          const pricing = resolveProductDisplayPrice(p, apertura);
          const normalDisplayPrice = pricing.displayPrice;
          
          const hasWholesale = p.WHOLESALEPRICE && p.WHOLESALEPRICE > 0 && 
                               p.WHOLESALEMINQUANTITY && p.WHOLESALEMINQUANTITY > 0;
          const wholesalePrice = p.WHOLESALEPRICE || 0;
          const wholesaleMinQty = p.WHOLESALEMINQUANTITY || 1;
          
          const discountPercent = hasWholesale 
            ? Math.round(((normalDisplayPrice - wholesalePrice) / normalDisplayPrice) * 100) 
            : 0;

          const isAddingSingle = addingId === `${p.$id}-1`;
          const isAddingWholesale = addingId === `${p.$id}-${wholesaleMinQty}`;

          return (
            <div 
              key={`wholesale-offer-${p.$id}`} 
              className="bg-white rounded-3xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 flex flex-col sm:flex-row overflow-hidden group min-h-[220px]"
            >
              {/* Product Image Column */}
              <div className="relative w-full sm:w-2/5 aspect-video sm:aspect-square bg-gray-50 overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100">
                {p.IMAGEURL ? (
                  <img 
                    src={p.IMAGEURL} 
                    alt={p.NAME} 
                    loading="lazy" 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
                )}
                
                {/* Floating Discount Tag */}
                {hasWholesale && discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-[10px] sm:text-xs px-3 py-1.5 rounded-2xl shadow-md z-10 flex items-center gap-1">
                    <Tag size={12} />
                    -{discountPercent}% POR MAYOR
                  </div>
                )}
              </div>

              {/* Product Info Column */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 min-w-0 bg-gradient-to-b from-transparent to-gray-50/20">
                <div className="space-y-2.5">
                  {p.SKU && (
                    <span className="font-mono text-[10px] font-bold text-gray-400 tracking-wider">
                      SKU: {p.SKU}
                    </span>
                  )}
                  <h3 className="font-black text-gray-900 text-base sm:text-lg hover:text-pink-600 line-clamp-2 transition-colors duration-200 leading-snug">
                    {p.NAME}
                  </h3>
                  
                  {/* Prices Display */}
                  <div className="flex flex-col gap-1.5 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold">Precio Unitario:</span>
                      <span className="font-bold text-gray-700 text-sm">
                        {formatPrice(normalDisplayPrice)}
                      </span>
                    </div>

                    {hasWholesale && (
                      <div className="bg-pink-50/50 border border-pink-100/50 rounded-2xl p-3 flex flex-col gap-0.5">
                        <span className="text-[10px] text-pink-700 font-black uppercase tracking-wider">
                          Super Oferta Mayorista:
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl sm:text-2xl font-black text-pink-600 tracking-tight">
                            {formatPrice(wholesalePrice)}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-pink-500">
                            c/u desde {wholesaleMinQty} unidades
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 mt-5">
                  {hasWholesale && (
                    <button
                      onClick={(e) => handleAddToCart(e, p, wholesaleMinQty)}
                      disabled={isAddingWholesale}
                      className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
                        isAddingWholesale
                          ? 'bg-green-500 text-white shadow-green-500/10'
                          : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-md hover:shadow-pink-500/10 active:scale-[0.98]'
                      }`}
                    >
                      {isAddingWholesale ? (
                        <>
                          <Check size={14} strokeWidth={3} />
                          Añadido al Carrito
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={14} strokeWidth={2.5} />
                          Llevar {wholesaleMinQty} un. (Mayorista)
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={(e) => handleAddToCart(e, p, 1)}
                    disabled={isAddingSingle}
                    className={`py-3 px-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border ${
                      isAddingSingle
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
                    } ${!hasWholesale ? 'flex-1' : ''}`}
                    title="Añadir 1 unidad"
                  >
                    {isAddingSingle ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        Llevar 1 un.
                      </>
                    )}
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
