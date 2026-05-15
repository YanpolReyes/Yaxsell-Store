'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Grid3x3, List, ShoppingCart, X, Heart, SlidersHorizontal, Sparkles, ChevronDown } from 'lucide-react';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, SUBCATEGORIES_COLLECTION, formatPrice } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Product, Category, Subcategory } from '@/types';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import QuickView from '@/components/QuickView';
import ProductBadges from '@/components/ProductBadges';

const FF = '"DM Sans","Proxima Nova",-apple-system,BlinkMacSystemFont,sans-serif';

function ProductosInner() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('categoria') || '';
  const qParam = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(qParam);
  const [selectedCat, setSelectedCat] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [activePriceRange, setActivePriceRange] = useState<[number, number] | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // 1. Cargar categorías primero
      const catRes = await databases.listDocuments(databaseId, CATEGORIES_COLLECTION, [Query.orderAsc('$createdAt'), Query.limit(30)]);
      const cats = catRes.documents as unknown as Category[];
      setCategories(cats);

      // 2. Resolver nombre de categoría a ID
      let catIdToUse = selectedCat;
      if (catParam && !selectedCat) {
        const found = cats.find(c =>
          c.$id === catParam ||
          c.name?.toLowerCase() === catParam.toLowerCase()
        );
        catIdToUse = found?.$id || '';
        if (found) setSelectedCat(found.$id);
      }

      // 3. Cargar productos con el ID resuelto
      const queries: string[] = [Query.limit(100)];
      if (catIdToUse) queries.push(Query.equal('CATEGORYID', catIdToUse));
      if (selectedSubcat) queries.push(Query.equal('SUBCATEGORYID', selectedSubcat));
      if (sortBy === 'newest') queries.push(Query.orderDesc('$createdAt'));
      else if (sortBy === 'price_asc') queries.push(Query.orderAsc('PRICE'));
      else if (sortBy === 'price_desc') queries.push(Query.orderDesc('PRICE'));

      const prodRes = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, queries);
      setProducts((prodRes.documents as unknown as Product[]).filter(p => (p.STOCK || 0) > 0));

      // 4. Cargar subcategorías para la categoría seleccionada
      if (catIdToUse) {
        try {
          const subRes = await databases.listDocuments(databaseId, SUBCATEGORIES_COLLECTION, [
            Query.equal('categoryId', catIdToUse),
            Query.orderAsc('ORDER'),
            Query.limit(50),
          ]);
          setSubcategories(subRes.documents as unknown as Subcategory[]);
        } catch { setSubcategories([]); }
      } else {
        setSubcategories([]);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [catParam, selectedCat, selectedSubcat, sortBy]);

  useEffect(() => { load(); }, [load]);

  // Extract all unique tags from products
  const allTags = useMemo(() => Array.from(new Set(products.flatMap(p => {
    if (!p.TAGS) return [];
    if (typeof p.TAGS === 'string') return (p.TAGS as string).split(',').map(t => t.trim()).filter(Boolean);
    return (p.TAGS as string[]).filter(Boolean);
  }))).sort(), [products]);

  // Compute price range
  useEffect(() => {
    if (products.length === 0) return;
    const prices = products.map(p => (p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE)).filter(p => p > 0);
    if (prices.length === 0) return;
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    setPriceRange([min, max]);
    if (!activePriceRange) setActivePriceRange([min, max]);
  }, [products]);

  const filtered = products.filter(p => {
    // Tag filter
    if (selectedTag) {
      const pTags = !p.TAGS ? [] : typeof p.TAGS === 'string' ? (p.TAGS as string).split(',').map(t => t.trim()) : (p.TAGS as string[]);
      if (!pTags.some(t => t.toLowerCase() === selectedTag.toLowerCase())) return false;
    }
    // Price filter
    if (activePriceRange) {
      const price = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
      if (price < activePriceRange[0] || price > activePriceRange[1]) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return p.NAME.toLowerCase().includes(q) || (p.DESCRIPTION || '').toLowerCase().includes(q);
  });

  const hasActiveFilters = !!(selectedCat || selectedSubcat || selectedTag || search || (activePriceRange && (activePriceRange[0] !== priceRange[0] || activePriceRange[1] !== priceRange[1])));
  const clearAllFilters = () => {
    setSelectedCat(''); setSelectedSubcat(''); setSelectedTag(''); setSearch('');
    setActivePriceRange(priceRange);
  };

  // Sidebar filters component (shared between desktop and mobile drawer)
  const FiltersSidebar = () => (
    <div style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1px solid #fce7f3', boxShadow: '0 4px 16px rgba(236,72,153,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
          <SlidersHorizontal size={16} color="#ec4899" /> Filtros
        </h3>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} style={{ fontSize: 11, fontWeight: 700, color: '#ec4899', background: '#fef2f8', border: 'none', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Categorías */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Categorías</p>
        <button onClick={() => { setSelectedCat(''); setSelectedSubcat(''); }}
          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: !selectedCat ? 700 : 500, color: !selectedCat ? '#ec4899' : '#6b7280', background: !selectedCat ? '#fef2f8' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s' }}>
          ✨ Todas
        </button>
        {categories.map(c => (
          <button key={c.$id} onClick={() => { setSelectedCat(c.$id); setSelectedSubcat(''); }}
            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: selectedCat === c.$id ? 700 : 500, color: selectedCat === c.$id ? '#ec4899' : '#6b7280', background: selectedCat === c.$id ? '#fef2f8' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s' }}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Subcategorías */}
      {subcategories.length > 0 && selectedCat && (
        <div style={{ marginBottom: 18, paddingTop: 14, borderTop: '1px solid #fce7f3' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Subcategorías</p>
          <button onClick={() => setSelectedSubcat('')}
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: !selectedSubcat ? 700 : 500, color: !selectedSubcat ? '#ec4899' : '#9ca3af', background: !selectedSubcat ? '#fef2f8' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 3 }}>
            Todas
          </button>
          {subcategories.map(sc => (
            <button key={sc.$id} onClick={() => setSelectedSubcat(sc.$id)}
              style={{ width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: selectedSubcat === sc.$id ? 700 : 500, color: selectedSubcat === sc.$id ? '#ec4899' : '#9ca3af', background: selectedSubcat === sc.$id ? '#fef2f8' : 'transparent', border: 'none', cursor: 'pointer', marginBottom: 3 }}>
              {sc.name}
            </button>
          ))}
        </div>
      )}

      {/* Precio */}
      {priceRange[1] > 0 && activePriceRange && (
        <div style={{ marginBottom: 18, paddingTop: 14, borderTop: '1px solid #fce7f3' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Precio</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#ec4899', marginBottom: 10 }}>
            <span>{formatPrice(activePriceRange[0])}</span>
            <span style={{ color: '#9ca3af', fontWeight: 400 }}>–</span>
            <span>{formatPrice(activePriceRange[1])}</span>
          </div>
          <input type="range" min={priceRange[0]} max={priceRange[1]} value={activePriceRange[1]}
            onChange={e => setActivePriceRange([activePriceRange[0], Number(e.target.value)])}
            style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="number" value={activePriceRange[0]} onChange={e => setActivePriceRange([Number(e.target.value) || 0, activePriceRange[1]])}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #fce7f3', fontSize: 12, color: '#111', outline: 'none', fontFamily: 'inherit' }} placeholder="Min" />
            <input type="number" value={activePriceRange[1]} onChange={e => setActivePriceRange([activePriceRange[0], Number(e.target.value) || 0])}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #fce7f3', fontSize: 12, color: '#111', outline: 'none', fontFamily: 'inherit' }} placeholder="Max" />
          </div>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div style={{ paddingTop: 14, borderTop: '1px solid #fce7f3' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Etiquetas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button onClick={() => setSelectedTag('')}
              style={{ padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: !selectedTag ? '#fff' : '#ec4899', background: !selectedTag ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : '#fef2f8', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              Todas
            </button>
            {allTags.slice(0, 20).map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)}
                style={{ padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: selectedTag === tag ? '#fff' : '#ec4899', background: selectedTag === tag ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : '#fef2f8', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: FF, background: 'linear-gradient(180deg,#fff5f8 0%,#fff 280px)', minHeight: '100vh' }}>
      <div className="pk-products-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Hero header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f8', color: '#ec4899', padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
            <Sparkles size={13} /> Nuestra tienda
          </div>
          <h1 className="pk-products-title" style={{ fontSize: 36, fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Productos
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0' }}>
            Descubrí nuestra selección de productos exclusivos
          </p>
        </div>

        {/* Top toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#ec4899' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              style={{ width: '100%', padding: '12px 38px 12px 42px', borderRadius: 14, border: '1.5px solid #fce7f3', background: '#fff', fontSize: 14, color: '#111', outline: 'none', boxShadow: '0 2px 8px rgba(236,72,153,0.05)', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(236,72,153,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#fce7f3'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(236,72,153,0.05)'; }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#fef2f8', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ec4899' }}><X size={14} /></button>}
          </div>

          <button onClick={() => setMobileFiltersOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderRadius: 14, border: '1.5px solid #fce7f3', background: '#fff', fontSize: 13, fontWeight: 700, color: '#ec4899', cursor: 'pointer', fontFamily: 'inherit' }} className="md:hidden">
            <SlidersHorizontal size={15} /> Filtros
          </button>

          <div style={{ position: 'relative' }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ appearance: 'none', padding: '12px 38px 12px 16px', borderRadius: 14, border: '1.5px solid #fce7f3', background: '#fff', fontSize: 13, color: '#111', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', minWidth: 180 }}>
              <option value="newest">✨ Más recientes</option>
              <option value="price_asc">↑ Precio: menor a mayor</option>
              <option value="price_desc">↓ Precio: mayor a menor</option>
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#ec4899', pointerEvents: 'none' }} />
          </div>

          <div style={{ display: 'flex', background: '#fff', borderRadius: 14, border: '1.5px solid #fce7f3', overflow: 'hidden' }}>
            <button onClick={() => setView('grid')} style={{ padding: '11px 13px', background: view === 'grid' ? '#fef2f8' : 'transparent', color: view === 'grid' ? '#ec4899' : '#9ca3af', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Grid3x3 size={16} /></button>
            <button onClick={() => setView('list')} style={{ padding: '11px 13px', background: view === 'list' ? '#fef2f8' : 'transparent', color: view === 'list' ? '#ec4899' : '#9ca3af', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><List size={16} /></button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {selectedCat && categories.find(c => c.$id === selectedCat) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: '#fef2f8', color: '#ec4899', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                {categories.find(c => c.$id === selectedCat)?.name}
                <button onClick={() => { setSelectedCat(''); setSelectedSubcat(''); }} style={{ background: 'transparent', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
              </span>
            )}
            {selectedTag && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: '#fef2f8', color: '#ec4899', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                #{selectedTag}
                <button onClick={() => setSelectedTag('')} style={{ background: 'transparent', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
              </span>
            )}
            {search && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 12px', background: '#fef2f8', color: '#ec4899', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                "{search}"
                <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
              </span>
            )}
          </div>
        )}

        <div className="pk-products-layout" style={{ display: 'flex', gap: 28 }}>
          {/* Desktop sidebar */}
          <aside className="hidden md:block" style={{ width: 260, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 20 }}>
              <FiltersSidebar />
            </div>
          </aside>

          {/* Mobile filters drawer */}
          {mobileFiltersOpen && (
            <>
              <div onClick={() => setMobileFiltersOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', zIndex: 998 }} />
              <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 320, maxWidth: '85vw', background: '#fff', zIndex: 999, padding: 20, overflowY: 'auto', boxShadow: '8px 0 32px rgba(0,0,0,0.15)', animation: 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
                <button onClick={() => setMobileFiltersOpen(false)} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: '#fef2f8', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                <FiltersSidebar />
              </div>
            </>
          )}

          {/* Products */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 14px', fontWeight: 600 }}>
              <span style={{ color: '#ec4899', fontWeight: 800 }}>{filtered.length}</span> producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>

            {isLoading ? (
              <div className="pk-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #fce7f3' }}>
                    <div style={{ aspectRatio: '1/1', background: 'linear-gradient(90deg,#fef2f8,#fce7f3,#fef2f8)', backgroundSize: '200% 100%', animation: 'pkShimmer 1.4s ease infinite' }} />
                    <div style={{ padding: 14 }}>
                      <div style={{ height: 14, width: '80%', background: '#fce7f3', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ height: 18, width: '50%', background: '#fce7f3', borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 20, border: '1px solid #fce7f3' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShoppingCart size={36} color="#ec4899" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>Sin resultados</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>No encontramos productos con esos filtros</p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#ec4899,#f9a8d4)', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(236,72,153,0.25)', fontFamily: 'inherit' }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className="pk-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
                {filtered.map(p => {
                  const price = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
                  const hasDisc = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
                  const disc = hasDisc ? Math.round(((p.PRICE - price) / p.PRICE) * 100) : 0;
                  const fav = isFavorite(p.$id);
                  return (
                    <div key={p.$id} className="pk-card" style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #fce7f3', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <Link href={`/productos/${p.$id}`} style={{ display: 'block', position: 'relative' }}>
                        <div style={{ position: 'relative', aspectRatio: '1/1', background: '#fef2f8', overflow: 'hidden' }}>
                          {p.IMAGEURL ? (
                            <Image src={p.IMAGEURL} alt={p.NAME} fill className="pk-card-img" style={{ objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' }} sizes="(max-width: 768px) 50vw, 25vw" />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48, color: '#fbcfe8' }}>📦</div>
                          )}
                          <ProductBadges product={p} style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }} />
                          {hasDisc && (
                            <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, zIndex: 2, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                              -{disc}%
                            </div>
                          )}
                          {p.STOCK === 0 && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                              <span style={{ padding: '6px 14px', background: '#fff', color: '#ef4444', borderRadius: 999, fontSize: 12, fontWeight: 800, border: '1.5px solid #fee2e2' }}>Sin stock</span>
                            </div>
                          )}
                          {/* Hover overlay buttons */}
                          <div className="pk-card-actions" style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%) translateY(20px)', opacity: 0, display: 'flex', gap: 6, zIndex: 4, transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(p); }}
                              title="Vista rápida"
                              style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                              <Search size={15} />
                            </button>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(p.$id); }}
                              title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                              style={{ width: 36, height: 36, borderRadius: '50%', background: fav ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : '#fff', border: 'none', color: fav ? '#fff' : '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                              <Heart size={15} fill={fav ? '#fff' : 'none'} />
                            </button>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); if (p.STOCK !== 0) addItem(p); }}
                              disabled={p.STOCK === 0}
                              title="Agregar al carrito"
                              style={{ width: 36, height: 36, borderRadius: '50%', background: p.STOCK === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#ec4899,#db2777)', border: 'none', color: '#fff', cursor: p.STOCK === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(236,72,153,0.35)', transition: 'all 0.2s' }}>
                              <ShoppingCart size={15} />
                            </button>
                          </div>
                        </div>
                      </Link>
                      <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36, lineHeight: 1.4, transition: 'color 0.2s' }}>
                            {p.NAME}
                          </p>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 'auto' }}>
                          <span style={{ fontSize: 19, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{formatPrice(price)}</span>
                          {hasDisc && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 500 }}>{formatPrice(p.PRICE)}</span>}
                        </div>
                        <button onClick={() => p.STOCK !== 0 && addItem(p)} disabled={p.STOCK === 0}
                          style={{ marginTop: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: p.STOCK === 0 ? '#f3f4f6' : 'linear-gradient(135deg,#ec4899,#f9a8d4)', color: p.STOCK === 0 ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 700, cursor: p.STOCK === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', boxShadow: p.STOCK === 0 ? 'none' : '0 4px 14px rgba(236,72,153,0.25)', fontFamily: 'inherit' }}>
                          <ShoppingCart size={13} /> {p.STOCK === 0 ? 'Sin stock' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(p => {
                  const price = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
                  const hasDisc = p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE;
                  const disc = hasDisc ? Math.round(((p.PRICE - price) / p.PRICE) * 100) : 0;
                  const fav = isFavorite(p.$id);
                  return (
                    <div key={p.$id} className="pk-card-list" style={{ background: '#fff', borderRadius: 18, border: '1px solid #fce7f3', display: 'flex', gap: 16, padding: 12, transition: 'all 0.2s', alignItems: 'center' }}>
                      <Link href={`/productos/${p.$id}`} style={{ position: 'relative', width: 110, height: 110, borderRadius: 14, overflow: 'hidden', background: '#fef2f8', flexShrink: 0 }}>
                        {p.IMAGEURL ? <Image src={p.IMAGEURL} alt={p.NAME} fill style={{ objectFit: 'cover' }} sizes="110px" /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 36 }}>📦</div>}
                        {hasDisc && <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 7px', background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>-{disc}%</div>}
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{p.NAME}</p>
                        </Link>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{p.DESCRIPTION}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{formatPrice(price)}</span>
                          {hasDisc && <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(p.PRICE)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => setQuickViewProduct(p)} title="Vista rápida"
                          style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f8', border: 'none', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Search size={16} />
                        </button>
                        <button onClick={() => toggleFavorite(p.$id)} title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          style={{ width: 40, height: 40, borderRadius: '50%', background: fav ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : '#fef2f8', border: 'none', color: fav ? '#fff' : '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={16} fill={fav ? '#fff' : 'none'} />
                        </button>
                        <button onClick={() => p.STOCK !== 0 && addItem(p)} disabled={p.STOCK === 0} title="Agregar al carrito"
                          style={{ width: 40, height: 40, borderRadius: '50%', background: p.STOCK === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#ec4899,#db2777)', border: 'none', color: '#fff', cursor: p.STOCK === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: p.STOCK === 0 ? 'none' : '0 4px 14px rgba(236,72,153,0.3)' }}>
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}

      <style>{`
        @keyframes pkShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .pk-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(236,72,153,0.15); border-color: #fbcfe8; }
        .pk-card:hover .pk-card-img { transform: scale(1.08); }
        .pk-card:hover .pk-card-actions { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; }
        .pk-card-actions button:hover { transform: scale(1.1); }
        .pk-card-list:hover { border-color: #fbcfe8; box-shadow: 0 8px 24px rgba(236,72,153,0.1); }

        /* ─── Mobile responsive ─── */
        @media (max-width: 900px) {
          .pk-products-layout { flex-direction: column !important; gap: 16px !important; }
        }
        @media (max-width: 700px) {
          .pk-products-container { padding: 20px 14px 50px !important; }
          .pk-products-title { font-size: 28px !important; }
          .pk-products-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          /* Show actions overlay on tap (mobile lacks hover) */
          .pk-card-actions { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; }
        }
        @media (max-width: 420px) {
          .pk-products-grid { gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: FF, background: 'linear-gradient(180deg,#fff5f8 0%,#fff 280px)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 60px' }}>
          <div style={{ height: 36, width: 200, background: '#fce7f3', borderRadius: 10, marginBottom: 30 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 320, background: '#fff', borderRadius: 18, border: '1px solid #fce7f3' }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductosInner />
    </Suspense>
  );
}
