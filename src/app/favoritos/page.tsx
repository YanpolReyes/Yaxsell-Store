'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Share2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/appwrite';
import { Product } from '@/types';
import RecentlyViewed from '@/components/RecentlyViewed';

const FF = '"Proxima Nova",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';

export default function FavoritosPage() {
  const { favoriteProducts, toggleFavorite, loading } = useFavorites();
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  function handleAdd(p: Product) {
    addItem(p, 1);
    setAdded(p.$id);
    setTimeout(() => setAdded(null), 1500);
  }

  const displayPrice = (p: Product) => p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
  const favs = favoriteProducts;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: '#ffe600', padding: '18px 5% 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={18} color="#333" />
            <span style={{ fontSize: 13, color: '#333' }}>Volver</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={22} color="#e53935" fill="#e53935" /> Mis Favoritos
              {favs.length > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#666' }}>({favs.length})</span>}
            </h1>
            {favs.length > 0 && (
              <button onClick={() => {
                const data = btoa(JSON.stringify({ name: 'Lista de deseos', ids: favs.map(p => p.$id) }));
                const url = `${window.location.origin}/lista/${data}`;
                if (navigator.share) { navigator.share({ title: 'Mi lista de deseos', url }).catch(() => {}); }
                else { navigator.clipboard.writeText(url); alert('Enlace copiado al portapapeles'); }
              }}
                style={{ padding: '6px 14px', background: '#fff', border: '1px solid #3483fa', borderRadius: 6, color: '#3483fa', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Share2 size={14} /> Compartir lista
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 12px 60px' }}>
        {favs.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Heart size={48} color="#f87171" style={{ opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#333', margin: '0 0 8px' }}>Tu lista de favoritos está vacía</p>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              Explora productos y toca el ❤️ para guardar los que te gusten. ¡Los encontrarás aquí!
            </p>
            <Link href="/productos" style={{ display: 'inline-block', padding: '12px 32px', background: '#3483fa', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15, boxShadow: '0 2px 8px rgba(52,131,250,.3)' }}>
              Descubrir productos
            </Link>
            <div style={{ marginTop: 40 }}>
              <RecentlyViewed />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {favs.map(p => {
              const price = displayPrice(p);
              const hasDiscount = p.CURRENTPRICE && p.CURRENTPRICE > 0 && p.CURRENTPRICE < p.PRICE;
              const pct = hasDiscount ? Math.round((1 - p.CURRENTPRICE! / p.PRICE) * 100) : 0;
              return (
                <div key={p.$id} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column' }}>
                  {/* Image */}
                  <Link href={`/productos/${p.$id}`} style={{ display: 'block', position: 'relative' }}>
                    <div style={{ height: 160, background: '#f8f8f8', overflow: 'hidden' }}>
                      {p.IMAGEURL
                        ? <img src={p.IMAGEURL} alt={p.NAME} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={36} color="#e0e0e0" /></div>
                      }
                    </div>
                    {pct > 0 && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>-{pct}%</span>
                    )}
                  </Link>

                  <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: '#333', fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
                    </Link>

                    <div style={{ marginBottom: 10 }}>
                      {hasDiscount && <p style={{ margin: '0 0 1px', fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>{formatPrice(p.PRICE)}</p>}
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#333' }}>{formatPrice(price)}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <button onClick={() => handleAdd(p)}
                        style={{ flex: 1, padding: '8px 0', background: added === p.$id ? '#2e7d32' : '#3483fa', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'background .2s' }}>
                        <ShoppingCart size={13} />
                        {added === p.$id ? '¡Listo!' : 'Agregar'}
                      </button>
                      <button onClick={() => toggleFavorite(p.$id)}
                        style={{ width: 34, height: 34, background: '#fff8f8', border: '1px solid #ffe0e0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={14} color="#e53935" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
