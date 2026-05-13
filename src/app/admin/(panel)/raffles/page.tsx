'use client';

import { useState, useEffect, useCallback } from 'react';
import { getServices, getAppwriteConfig, RAFFLES_COLLECTION_ID, RAFFLE_PARTICIPANTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Query, ID } from 'appwrite';
import { Loader2, Plus, Trash2, Trophy, Users, Search, X, Eye, EyeOff } from 'lucide-react';

interface Raffle {
  $id: string;
  $createdAt: string;
  title: string;
  description?: string;
  prize: string;
  prizeImageUrl?: string;
  status: string;
  scheduledAt?: number;
  winnerId?: string;
  winnerName?: string;
}

interface Participant {
  $id: string;
  raffleId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Próximo', color: '#3b82f6' },
  active:   { label: 'En vivo', color: '#22c55e' },
  drawing:  { label: 'Sorteando', color: '#f59e0b' },
  completed:{ label: 'Finalizado', color: '#94a3b8' },
};

const EMPTY: Partial<Raffle> = { title: '', description: '', prize: '', prizeImageUrl: '', status: 'upcoming' };

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Raffle> | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewParticipants, setViewParticipants] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, RAFFLES_COLLECTION_ID, [
        Query.orderDesc('$createdAt'), Query.limit(50),
      ]);
      setRaffles(res.documents as unknown as Raffle[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadParticipants(raffleId: string) {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, RAFFLE_PARTICIPANTS_COLLECTION_ID, [
        Query.equal('raffleId', raffleId), Query.limit(200),
      ]);
      setParticipants(prev => ({ ...prev, [raffleId]: res.documents as unknown as Participant[] }));
      setViewParticipants(raffleId);
    } catch (e) { console.error(e); }
  }

  async function handleSave() {
    if (!editing || !editing.title?.trim() || !editing.prize?.trim()) return;
    setSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const data: any = {
        title: editing.title.trim(),
        description: editing.description?.trim() || undefined,
        prize: editing.prize.trim(),
        prizeImageUrl: editing.prizeImageUrl?.trim() || undefined,
        status: editing.status || 'upcoming',
      };
      if (editing.$id) {
        await databases.updateDocument(databaseId, RAFFLES_COLLECTION_ID, editing.$id, data);
      } else {
        await databases.createDocument(databaseId, RAFFLES_COLLECTION_ID, ID.unique(), data);
      }
      setEditing(null);
      await load();
    } catch (e) { console.error(e); alert('Error al guardar'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este sorteo?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, RAFFLES_COLLECTION_ID, id);
      await load();
    } catch (e) { console.error(e); }
  }

  async function drawWinner(raffleId: string) {
    const parts = participants[raffleId];
    if (!parts || parts.length === 0) { alert('No hay participantes'); return; }
    const winner = parts[Math.floor(Math.random() * parts.length)];
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, RAFFLES_COLLECTION_ID, raffleId, {
        status: 'completed', winnerId: winner.userId, winnerName: winner.userName,
      });
      alert(`¡Ganador: ${winner.userName}!`);
      await load();
    } catch (e) { console.error(e); }
  }

  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #333', borderRadius: 6, background: '#1a1a2e', color: '#e0e0e0', fontSize: 13, outline: 'none' };
  const label: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 3, textTransform: 'uppercase' };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Sorteos</h1>
        <button onClick={() => setEditing({ ...EMPTY })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Nuevo sorteo
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
      ) : raffles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <Trophy size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>No hay sorteos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {raffles.map(r => {
            const st = STATUS_LABELS[r.status] || { label: r.status, color: '#888' };
            return (
              <div key={r.$id} style={{ background: '#1a1a2e', borderRadius: 10, padding: '14px 18px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: 14 }}>
                {r.prizeImageUrl ? (
                  <img src={r.prizeImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: '#2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={24} color="#666" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600 }}>{r.title}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Premio: {r.prize}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: `${st.color}20`, padding: '2px 8px', borderRadius: 10 }}>{st.label}</span>
                    {r.winnerName && <span style={{ fontSize: 11, color: '#f59e0b' }}>🏆 {r.winnerName}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => loadParticipants(r.$id)}
                    style={{ padding: '6px 10px', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> Ver
                  </button>
                  {r.status !== 'completed' && (
                    <button onClick={() => { loadParticipants(r.$id).then(() => drawWinner(r.$id)); }}
                      style={{ padding: '6px 10px', background: '#f59e0b20', color: '#f59e0b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                      Sortear
                    </button>
                  )}
                  <button onClick={() => setEditing({ ...r })}
                    style={{ padding: '6px 10px', background: '#2a2a4a', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(r.$id)}
                    style={{ padding: '6px 10px', background: '#2a2a4a', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participants panel */}
      {viewParticipants && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewParticipants(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#12121f', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400, maxHeight: '80vh', overflow: 'auto', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Participantes ({(participants[viewParticipants] || []).length})</h3>
              <button onClick={() => setViewParticipants(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
            {(participants[viewParticipants] || []).length === 0 ? (
              <p style={{ color: '#666', fontSize: 13 }}>Sin participantes aún</p>
            ) : (
              (participants[viewParticipants] || []).map(p => (
                <div key={p.$id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {p.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.userName}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#666' }}>{new Date(p.joinedAt).toLocaleString('es-CL')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#12121f', borderRadius: 12, padding: 24, width: '100%', maxWidth: 440, border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editing.$id ? 'Editar sorteo' : 'Nuevo sorteo'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={label}>Título *</label>
                <input style={input} value={editing.title || ''} onChange={e => setEditing(p => ({ ...p!, title: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Premio *</label>
                <input style={input} value={editing.prize || ''} onChange={e => setEditing(p => ({ ...p!, prize: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Imagen del premio</label>
                <input style={input} value={editing.prizeImageUrl || ''} onChange={e => setEditing(p => ({ ...p!, prizeImageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label style={label}>Descripción</label>
                <textarea style={{ ...input, minHeight: 50, resize: 'vertical' }} value={editing.description || ''} onChange={e => setEditing(p => ({ ...p!, description: e.target.value }))} />
              </div>
              <div>
                <label style={label}>Estado</label>
                <select style={input} value={editing.status || 'upcoming'} onChange={e => setEditing(p => ({ ...p!, status: e.target.value }))}>
                  <option value="upcoming">Próximo</option>
                  <option value="active">En vivo</option>
                  <option value="completed">Finalizado</option>
                </select>
              </div>
              <button onClick={handleSave} disabled={saving || !editing.title?.trim() || !editing.prize?.trim()}
                style={{ padding: '10px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : editing.$id ? 'Actualizar' : 'Crear sorteo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
