'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, USERS_COLLECTION_ID, ORDERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { dedupeUserDocuments, isRegisteredUserProfile, listAllUserProfiles, type UserProfileDoc } from '@/lib/users-db';
import { RefreshCw, AlertTriangle, Search, X, Users, Phone, Mail, Calendar, Download, ShoppingCart, MessageSquare, Save, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface AppUser {
  $id: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  region?: string;
  comuna?: string;
  address?: string;
  isWholesale?: boolean;
  isBanned?: boolean;
  totalOrders?: number;
  adminNotes?: string;
  $createdAt: string;
}

function UsersPageInner() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('rut') || searchParams.get('search') || '');
  const [showWholesaleOnly, setShowWholesaleOnly] = useState(false);
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type' | 'orders'>('date');
  const [noteModal, setNoteModal] = useState<AppUser | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [togglingBanId, setTogglingBanId] = useState<string | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  const toggleBan = async (u: AppUser) => {
    setTogglingBanId(u.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, USERS_COLLECTION_ID, u.$id, { isBanned: !u.isBanned });
      setUsers(prev => prev.map(x => x.$id === u.$id ? { ...x, isBanned: !x.isBanned } : x));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setTogglingBanId(null); }
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setSavingNote(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, USERS_COLLECTION_ID, noteModal.$id, { adminNotes: noteDraft });
      setUsers(prev => prev.map(u => u.$id === noteModal.$id ? { ...u, adminNotes: noteDraft } : u));
      setNoteModal(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingNote(false); }
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const [rawUsers, ordersResp] = await Promise.all([
        listAllUserProfiles(500),
        databases.listDocuments(databaseId, ORDERS_COLLECTION_ID, [Query.limit(500)]),
      ]);
      const registered = dedupeUserDocuments(rawUsers as UserProfileDoc[])
        .filter(isRegisteredUserProfile) as AppUser[];
      setUsers(registered);
      const counts: Record<string, number> = {};
      for (const o of ordersResp.documents as any[]) {
        if (o.USERID) counts[o.USERID] = (counts[o.USERID] || 0) + 1;
      }
      setOrderCounts(counts);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = [...users.filter(u => {
    if (showWholesaleOnly && !u.isWholesale) return false;
    if (showBannedOnly && !u.isBanned) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.region?.toLowerCase().includes(q)
    );
  })].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'type') return (b.isWholesale ? 1 : 0) - (a.isWholesale ? 1 : 0);
    if (sortBy === 'orders') return (orderCounts[b.userId || b.$id] || 0) - (orderCounts[a.userId || a.$id] || 0);
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Región', 'Comuna', 'Tipo', 'Bloqueado', 'Pedidos', 'Notas admin', 'Registro'];
    const rows = filtered.map(u => [
      u.name || '', u.email || '', u.phone || '',
      u.region || '', u.comuna || '',
      u.isWholesale ? 'Mayorista' : 'Regular',
      u.isBanned ? 'Sí' : 'No',
      orderCounts[u.userId || u.$id] || 0,
      u.adminNotes || '',
      new Date(u.$createdAt).toLocaleDateString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `usuarios_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const stats = {
    total: users.length,
    wholesale: users.filter(u => u.isWholesale).length,
    banned: users.filter(u => u.isBanned).length,
    withPhone: users.filter(u => u.phone).length,
    withNotes: users.filter(u => u.adminNotes).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">{filtered.length} de {users.length} usuarios{stats.banned > 0 ? ` · ${stats.banned} bloqueado${stats.banned !== 1 ? 's' : ''}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowWholesaleOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition border ${
              showWholesaleOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}>
            Mayoristas
          </button>
          <button onClick={() => setShowBannedOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition border ${
              showBannedOnly ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}>
            Bloqueados
            {users.filter(u => u.isBanned).length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showBannedOnly ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                {users.filter(u => u.isBanned).length}
              </span>
            )}
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total',           value: stats.total,     color: 'bg-indigo-500' },
          { label: 'Mayoristas',      value: stats.wholesale, color: 'bg-amber-500' },
          { label: 'Con teléfono',    value: stats.withPhone, color: 'bg-emerald-500' },
          { label: 'Bloqueados',      value: stats.banned,    color: 'bg-red-500' },
          { label: 'Con notas',       value: stats.withNotes, color: 'bg-violet-500' },
          { label: 'Esta semana',     value: users.filter(u => Date.now() - new Date(u.$createdAt).getTime() < 7 * 86400000).length, color: 'bg-teal-500' },
        ].filter(s => s.value > 0 || s.label === 'Total').map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-7 h-7 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Region distribution */}
      {!isLoading && users.length > 0 && (() => {
        const regionMap: Record<string, number> = {};
        for (const u of users) { if (u.region) regionMap[u.region] = (regionMap[u.region] || 0) + 1; }
        const topRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
        if (topRegions.length < 2) return null;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 shrink-0">Regiones:</span>
            {topRegions.map(([r, c]) => (
              <span key={r} className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {r} <span className="text-gray-400">{c}</span>
              </span>
            ))}
          </div>
        );
      })()}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email, teléfono..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {([['date', 'Recientes'], ['name', 'Nombre'], ['type', 'Tipo'], ['orders', 'Por pedidos']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Región</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4,5].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
                </td></tr>
              ) : filtered.map(u => (
                <tr key={u.$id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{u.name || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" />{u.email || '—'}
                        </p>
                        {(() => { const cnt = orderCounts[u.userId || u.$id] || 0; return cnt > 0 ? (
                          <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                            <ShoppingCart className="w-3 h-3" />{cnt} pedido{cnt !== 1 ? 's' : ''}
                          </span>
                        ) : null; })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">
                    {u.phone ? (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm hidden md:table-cell">
                    {u.region ? `${u.region}${u.comuna ? ` · ${u.comuna}` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {u.isBanned && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Bloqueado</span>
                      )}
                      {u.isWholesale ? (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Mayorista</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Regular</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.$createdAt).toLocaleDateString('es-CL')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(u.userId || u.$id) && (
                        <Link href={`/orders?userId=${u.userId || u.$id}`}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition inline-flex" title="Ver pedidos">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <button onClick={() => { setNoteModal(u); setNoteDraft(u.adminNotes || ''); }}
                        className={`p-1.5 rounded-lg hover:bg-violet-50 transition inline-flex ${u.adminNotes ? 'text-violet-500' : 'text-gray-400 hover:text-violet-500'}`} title="Notas internas">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleBan(u)} disabled={togglingBanId === u.$id}
                        className={`p-1.5 rounded-lg transition inline-flex disabled:opacity-50 ${u.isBanned ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                        title={u.isBanned ? 'Desbloquear usuario' : 'Bloquear usuario'}>
                        {u.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Note edit modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Nota interna</p>
                <p className="text-xs text-gray-500 mt-0.5">{noteModal.name || noteModal.email || 'Usuario'}</p>
              </div>
              <button onClick={() => setNoteModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <textarea rows={5} value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Nota interna sobre este usuario..." />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setNoteModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={saveNote} disabled={savingNote}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                <Save className="w-4 h-4" />{savingNote ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-10 bg-gray-100 rounded-xl" /><div className="h-64 bg-gray-100 rounded-2xl" /></div>}>
      <UsersPageInner />
    </Suspense>
  );
}
