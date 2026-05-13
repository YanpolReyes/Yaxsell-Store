'use client';

import { useState, useEffect, useCallback } from 'react';
import { getServices, getAppwriteConfig, REVIEWS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Query } from 'appwrite';
import { Loader2, Trash2, Star, Search, X, MessageSquare } from 'lucide-react';

interface Review {
  $id: string;
  $createdAt: string;
  PRODUCTID: string;
  USERID: string;
  RATING: number;
  COMMENT: string;
  USERNAME?: string;
  CREATEDAT?: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const queries: string[] = [Query.orderDesc('$createdAt'), Query.limit(100)];
      if (filterRating) queries.push(Query.equal('RATING', filterRating));
      const res = await databases.listDocuments(databaseId, REVIEWS_COLLECTION_ID, queries);
      setReviews(res.documents as unknown as Review[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRating]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, REVIEWS_COLLECTION_ID, id);
      await load();
    } catch (e) { console.error(e); }
  }

  const filtered = reviews.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.COMMENT.toLowerCase().includes(q) || (r.USERNAME || '').toLowerCase().includes(q) || r.PRODUCTID.toLowerCase().includes(q);
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.RATING, 0) / reviews.length).toFixed(1) : '0';
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({ stars: n, count: reviews.filter(r => r.RATING === n).length }));

  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #333', borderRadius: 6, background: '#1a1a2e', color: '#e0e0e0', fontSize: 13, outline: 'none' };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900 }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Reseñas</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{avgRating}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '4px 0' }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= Math.round(Number(avgRating)) ? '#f6a500' : 'none'} color="#f6a500" />)}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{reviews.length} reseñas</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
          {ratingDist.map(d => (
            <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 11, width: 12, textAlign: 'right', color: '#888' }}>{d.stars}</span>
              <Star size={10} fill="#f6a500" color="#f6a500" />
              <div style={{ flex: 1, height: 6, background: '#2a2a4a', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f6a500', borderRadius: 3, width: reviews.length > 0 ? `${(d.count / reviews.length) * 100}%` : '0%' }} />
              </div>
              <span style={{ fontSize: 10, color: '#666', width: 20, textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por comentario, usuario o producto..."
            style={{ ...input, paddingLeft: 32 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setFilterRating(null)}
            style={{ padding: '6px 12px', background: filterRating === null ? '#6366f1' : '#1a1a2e', color: filterRating === null ? '#fff' : '#888', border: '1px solid #333', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Todas
          </button>
          {[5, 4, 3, 2, 1].map(n => (
            <button key={n} onClick={() => setFilterRating(n)}
              style={{ padding: '6px 10px', background: filterRating === n ? '#6366f1' : '#1a1a2e', color: filterRating === n ? '#fff' : '#888', border: '1px solid #333', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              {n} <Star size={10} fill="#f6a500" color="#f6a500" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>No hay reseñas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.$id} style={{ background: '#1a1a2e', borderRadius: 8, padding: '14px 18px', border: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={13} fill={i <= r.RATING ? '#f6a500' : 'none'} color="#f6a500" />)}
                    </div>
                    <span style={{ fontSize: 12, color: '#888' }}>{r.USERNAME || 'Anónimo'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#ccc', lineHeight: 1.4 }}>{r.COMMENT}</p>
                </div>
                <button onClick={() => handleDelete(r.$id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#666', marginTop: 6 }}>
                <span>Producto: {r.PRODUCTID.slice(0, 8)}...</span>
                <span>{new Date(r.$createdAt).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
