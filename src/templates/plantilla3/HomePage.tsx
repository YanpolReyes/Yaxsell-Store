'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, ChevronRight, Truck, Shield, Star, ChevronDown } from 'lucide-react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, TIMED_OFFERS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Product, Category, TimedOffer } from '@/types';
import { useCart } from '@/context/CartContext';

export default function HomePage3() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<TimedOffer[]>([]);
  const [configError, setConfigError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      const { endpoint, projectId, databaseId } = getAppwriteConfig();
      if (!projectId || !endpoint || !databaseId) { setConfigError(true); return; }
      try {
        const { databases } = getServices();
        const [prodRes, catRes, offRes] = await Promise.all([
          databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(16)]),
          databases.listDocuments(databaseId, CATEGORIES_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(12)]),
          databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [Query.limit(4)]),
        ]);
        setProducts(prodRes.documents as unknown as Product[]);
        setCategories(catRes.documents as unknown as Category[]);
        const now = Date.now();
        setOffers((offRes.documents as unknown as TimedOffer[]).filter(o => o.endDateTime ? new Date(o.endDateTime).getTime() > now : false));
      } catch (e) { console.error(e); setConfigError(true); }
    }
    load();
  }, []);

  const filtered = activeCategory
    ? products.filter(p => p.CATEGORYID === activeCategory)
    : products;

  if (configError) return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <p className="text-lg font-bold mb-2">Tienda no configurada</p>
      <Link href="/configurar" className="bg-[#F96302] text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-[#c94d00]">Configurar</Link>
    </div>
  );

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg,#F96302,#c94d00)' }} className="mb-4">
        <div className="max-w-7xl mx-auto px-4 py-10 flex items-center justify-between">
          <div className="text-white">
            <div className="text-sm font-medium mb-1 text-orange-200">Bienvenido a tu tienda</div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight uppercase tracking-tight">
              Todo para<br />tu hogar y más
            </h1>
            <p className="text-orange-100 mb-5 text-sm max-w-sm">Encuentra todo lo que necesitas. Envío express a todo Chile.</p>
            <Link href="/productos" className="inline-flex items-center gap-2 bg-white text-[#F96302] font-black px-6 py-3 rounded text-sm hover:bg-gray-100 transition-colors uppercase tracking-wide">
              Ver catálogo <ChevronRight size={16}/>
            </Link>
          </div>
          <div className="hidden lg:block text-8xl">🏠</div>
        </div>
      </div>

      {/* Promo strip */}
      <div className="bg-[#1a1a2e] mb-4">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-8 overflow-x-auto whitespace-nowrap">
          {[
            { icon: <Truck size={13}/>, text: 'Despacho a domicilio' },
            { icon: <Shield size={13}/>, text: 'Garantía en todos los productos' },
            { icon: <Star size={13}/>, text: 'Calidad certificada' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-gray-300 text-xs shrink-0">
              {f.icon} {f.text}
            </div>
          ))}
          {offers.length > 0 && (
            <Link href="/ofertas" className="ml-auto text-[#F96302] text-xs font-bold flex items-center gap-1 shrink-0 hover:text-orange-400">
              🔥 {offers.length} Ofertas activas <ChevronRight size={12}/>
            </Link>
          )}
        </div>
      </div>

      {/* Main layout: Sidebar + Products */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex gap-4 items-start">
          {/* Sidebar */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
              <div className="bg-[#1a1a2e] text-white text-xs font-bold px-3 py-2.5 uppercase tracking-wide flex items-center gap-1.5">
                <ChevronDown size={13}/> Departamentos
              </div>
              <nav className="py-1">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left text-xs px-3 py-2 transition-colors flex items-center justify-between group ${
                    !activeCategory ? 'bg-orange-50 text-[#F96302] font-semibold border-r-2 border-[#F96302]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos los productos
                  <ChevronRight size={12} className="text-gray-400 group-hover:text-[#F96302]" />
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.$id}
                    onClick={() => setActiveCategory(cat.$id === activeCategory ? null : cat.$id)}
                    className={`w-full text-left text-xs px-3 py-2 transition-colors flex items-center justify-between group ${
                      activeCategory === cat.$id
                        ? 'bg-orange-50 text-[#F96302] font-semibold border-r-2 border-[#F96302]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-1">{cat.name}</span>
                    <ChevronRight size={12} className="text-gray-400 shrink-0 group-hover:text-[#F96302]" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Offers quick access */}
            {offers.length > 0 && (
              <Link href="/ofertas" className="mt-3 flex items-center justify-between bg-[#F96302] text-white text-xs font-bold px-3 py-2.5 rounded hover:bg-[#c94d00] transition-colors">
                🔥 Ofertas especiales <ChevronRight size={13}/>
              </Link>
            )}
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {activeCategory ? categories.find(c => c.$id === activeCategory)?.name || 'Productos' : 'Todos los productos'}
                <span className="ml-2 text-gray-500 font-normal normal-case">({filtered.length})</span>
              </h2>
              <Link href="/productos" className="text-xs text-[#F96302] hover:underline font-medium flex items-center gap-0.5">
                Ver catálogo completo <ChevronRight size={12}/>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(filtered.length > 0 ? filtered : products).map(product => {
                const price = product.CURRENTPRICE && product.CURRENTPRICE > 0 ? product.CURRENTPRICE : product.PRICE;
                const hasDisc = product.CURRENTPRICE && product.CURRENTPRICE < product.PRICE;
                const disc = hasDisc ? Math.round(((product.PRICE - (product.CURRENTPRICE ?? 0)) / product.PRICE) * 100) : 0;

                return (
                  <div key={product.$id} className="bg-white border border-gray-200 rounded hover:shadow-md transition-shadow group overflow-hidden">
                    <Link href={`/productos/${product.$id}`}>
                      <div className="relative h-36 bg-gray-50">
                        {product.IMAGEURL
                          ? <Image src={product.IMAGEURL} alt={product.NAME} fill className="object-contain p-2" />
                          : <div className="flex items-center justify-center h-full text-4xl">📦</div>}
                        {hasDisc && (
                          <span className="absolute top-1 right-1 bg-[#F96302] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{disc}%</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/productos/${product.$id}`}>
                        <p className="text-xs text-gray-700 line-clamp-2 leading-tight mb-2 group-hover:text-[#F96302] transition-colors min-h-[2.5rem]">
                          {product.NAME}
                        </p>
                      </Link>
                      {hasDisc && (
                        <p className="text-xs text-gray-400 line-through mb-0.5">{formatPrice(product.PRICE)}</p>
                      )}
                      <p className="font-black text-gray-900 text-base">{formatPrice(price)}</p>
                      {product.STOCK > 0 ? (
                        <button
                          onClick={() => addItem(product, 1)}
                          className="mt-2 w-full text-xs py-2 rounded font-black bg-[#F96302] hover:bg-[#c94d00] text-white transition-colors flex items-center justify-center gap-1 uppercase tracking-wide"
                        >
                          <ShoppingCart size={12}/> Agregar
                        </button>
                      ) : (
                        <p className="mt-2 text-center text-xs text-red-500 font-medium">Sin stock</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(filtered.length === 0 && products.length === 0) && (
              <div className="text-center py-16 bg-white rounded border border-gray-200">
                <p className="text-gray-400 text-sm">No hay productos disponibles aún</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
