'use client';

import { useState, useEffect, useCallback } from 'react';
import { getServices, getAppwriteConfig, CLIPS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Query, ID } from 'appwrite';
import { Loader2, Plus, Trash2, Eye, EyeOff, Play, Search, X } from 'lucide-react';

interface Clip {
  $id: string;
  $createdAt: string;
  TITLE: string;
  DESCRIPTION?: string;
  VIDEOURL: string;
  THUMBNAILURL?: string;
  PRODUCTID?: string;
  PRODUCTNAME?: string;
  PRODUCTPRICE?: number;
  PRODUCTIMAGEURL?: string;
  USERID?: string;
  USERNAME?: string;
  LIKES?: number;
  VIEWS?: number;
  ISACTIVE?: boolean;
  CREATEDAT?: number;
}

const EMPTY: Partial<Clip> = { TITLE: '', DESCRIPTION: '', VIDEOURL: '', THUMBNAILURL: '', PRODUCTID: '', PRODUCTNAME: '', ISACTIVE: true };

export default function AdminClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<Clip> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, CLIPS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'), Query.limit(100),
      ]);
      setClips(res.documents as unknown as Clip[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!editing || !editing.TITLE?.trim() || !editing.VIDEOURL?.trim()) return;
    setSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const data: any = {
        TITLE: editing.TITLE.trim(),
        DESCRIPTION: editing.DESCRIPTION?.trim() || undefined,
        VIDEOURL: editing.VIDEOURL.trim(),
        THUMBNAILURL: editing.THUMBNAILURL?.trim() || undefined,
        PRODUCTID: editing.PRODUCTID?.trim() || undefined,
        PRODUCTNAME: editing.PRODUCTNAME?.trim() || undefined,
        ISACTIVE: editing.ISACTIVE ?? true,
      };
      if (editing.$id) {
        await databases.updateDocument(databaseId, CLIPS_COLLECTION_ID, editing.$id, data);
      } else {
        data.CREATEDAT = Math.floor(Date.now() / 1000);
        data.LIKES = 0;
        data.VIEWS = 0;
        await databases.createDocument(databaseId, CLIPS_COLLECTION_ID, ID.unique(), data);
      }
      setEditing(null);
      await load();
    } catch (e) { console.error(e); alert('Error al guardar'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este clip?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, CLIPS_COLLECTION_ID, id);
      await load();
    } catch (e) { console.error(e); }
  }

  async function toggleActive(clip: Clip) {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, CLIPS_COLLECTION_ID, clip.$id, { ISACTIVE: !clip.ISACTIVE });
      await load();
    } catch (e) { console.error(e); }
  }

  const filtered = clips.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.TITLE.toLowerCase().includes(q) || (c.PRODUCTNAME || '').toLowerCase().includes(q);
  });

  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #333', borderRadius: 6, background: '#1a1a2e', color: '#e0e0e0', fontSize: 13, outline: 'none' };
  const label: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 3, textTransform: 'uppercase' };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Clips / Videos</h1>
        <button onClick={() => setEditing({ ...EMPTY })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Nuevo clip
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar clips..."
          style={{ ...input, paddingLeft: 32 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Total</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{clips.length}</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Activos</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{clips.filter(c => c.ISACTIVE !== false).length}</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Total views</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{clips.reduce((s, c) => s + (c.VIEWS || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <Play size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>No hay clips</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map(clip => (
            <div key={clip.$id} style={{ background: '#1a1a2e', borderRadius: 10, overflow: 'hidden', border: '1px solid #333', opacity: clip.ISACTIVE === false ? 0.5 : 1 }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', height: 160, background: '#0d0d1a' }}>
                {clip.THUMBNAILURL ? (
                  <img src={clip.THUMBNAILURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Play size={32} color="#444" />
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 4 }}>
                  <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>👁 {clip.VIEWS || 0}</span>
                  <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>❤ {clip.LIKES || 0}</span>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.TITLE}</p>
                {clip.PRODUCTNAME && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888' }}>Producto: {clip.PRODUCTNAME}</p>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditing({ ...clip })}
                    style={{ flex: 1, padding: '5px 0', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={() => toggleActive(clip)}
                    style={{ padding: '5px 8px', background: '#2a2a4a', color: clip.ISACTIVE !== false ? '#22c55e' : '#666', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    {clip.ISACTIVE !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => handleDelete(clip.$id)}
                    style={{ padding: '5px 8px', background: '#2a2a4a', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#12121f', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editing.$id ? 'Editar clip' : 'Nuevo clip'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={label}>Título *</label>
                <input style={input} value={editing.TITLE || ''} onChange={e => setEditing(p => ({ ...p!, TITLE: e.target.value }))} />
              </div>
              <div>
                <label style={label}>URL del video *</label>
                <input style={input} value={editing.VIDEOURL || ''} onChange={e => setEditing(p => ({ ...p!, VIDEOURL: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label style={label}>URL thumbnail</label>
                <input style={input} value={editing.THUMBNAILURL || ''} onChange={e => setEditing(p => ({ ...p!, THUMBNAILURL: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Descripción</label>
                <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={editing.DESCRIPTION || ''} onChange={e => setEditing(p => ({ ...p!, DESCRIPTION: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>Product ID</label>
                  <input style={input} value={editing.PRODUCTID || ''} onChange={e => setEditing(p => ({ ...p!, PRODUCTID: e.target.value }))} />
                </div>
                <div>
                  <label style={label}>Product Name</label>
                  <input style={input} value={editing.PRODUCTNAME || ''} onChange={e => setEditing(p => ({ ...p!, PRODUCTNAME: e.target.value }))} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.ISACTIVE !== false} onChange={e => setEditing(p => ({ ...p!, ISACTIVE: e.target.checked }))} />
                Activo (visible en tienda)
              </label>
              <button onClick={handleSave} disabled={saving || !editing.TITLE?.trim() || !editing.VIDEOURL?.trim()}
                style={{ padding: '10px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : editing.$id ? 'Actualizar' : 'Crear clip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
