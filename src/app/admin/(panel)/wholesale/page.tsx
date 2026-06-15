'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, WHOLESALE_REQUESTS_COLLECTION_ID, USERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { RefreshCw, AlertTriangle, Search, X, ChevronDown, Building2, MessageSquare, Save, XCircle, Download } from 'lucide-react';

interface WholesaleRequest {
  $id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  businessName?: string;
  companyName?: string;
  businessRut?: string;
  rut?: string;
  email?: string;
  phone?: string;
  message?: string;
  adminNotes?: string;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  $createdAt: string;
  $updatedAt: string;
}

const STATUS_CFG = {
  pending:  { label: 'Pendiente', bg: 'bg-amber-100',   text: 'text-amber-700' },
  approved: { label: 'Aprobado',  bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { label: 'Rechazado', bg: 'bg-red-100',     text: 'text-red-700' },
};

export default function WholesalePage() {
  const [requests, setRequests] = useState<WholesaleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'pending'>('date');
  const [rejecting, setRejecting] = useState(false);

  const exportCSV = () => {
    const headers = ['Empresa', 'RUT', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Mensaje', 'Razón rechazo', 'Notas admin', 'Días pendiente', 'Fecha'];
    const rows = requests.map(r => [
      r.businessName || r.companyName || '', r.businessRut || '', r.userName || '', r.userEmail || '',
      r.phone || '', r.status, r.message || '',
      r.rejectionReason || '', r.adminNotes || '',
      r.status === 'pending' ? Math.floor((Date.now() - new Date(r.$createdAt).getTime()) / 86400000) : '',
      new Date(r.$createdAt).toLocaleDateString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `mayoristas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const rejectWithReason = async () => {
    if (!rejectModal) return;
    setRejecting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, WHOLESALE_REQUESTS_COLLECTION_ID, rejectModal, {
        status: 'rejected',
        rejectionReason: rejectReason.trim() || null,
      });
      setRequests(prev => prev.map(r =>
        r.$id === rejectModal ? { ...r, status: 'rejected', rejectionReason: rejectReason.trim() || undefined } : r
      ));
      setRejectModal(null);
      setRejectReason('');
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setRejecting(false); }
  };

  const saveNote = async (id: string) => {
    setSavingNote(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, WHOLESALE_REQUESTS_COLLECTION_ID, id, { adminNotes: noteDraft });
      setRequests(prev => prev.map(r => r.$id === id ? { ...r, adminNotes: noteDraft } : r));
      setEditingNotes(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingNote(false); }
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
      if (filter !== 'all') queries.push(Query.equal('status', filter));
      const resp = await databases.listDocuments(databaseId, WHOLESALE_REQUESTS_COLLECTION_ID, queries);
      setRequests(resp.documents as unknown as WholesaleRequest[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      // Actualizar estado de la solicitud
      await databases.updateDocument(databaseId, WHOLESALE_REQUESTS_COLLECTION_ID, id, { status });
      
      // Si se aprueba, actualizar isWholesale del usuario
      if (status === 'approved') {
        const request = requests.find(r => r.$id === id);
        if (request?.userId) {
          try {
            // Buscar documento del usuario en la colección users
            const userDocs = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, [
              Query.equal('userId', request.userId)
            ]);
            
            if (userDocs.documents.length > 0) {
              // Actualizar isWholesale del usuario
              await databases.updateDocument(databaseId, USERS_COLLECTION_ID, userDocs.documents[0].$id, {
                isWholesale: true
              });
            } else {
              // Crear documento de usuario si no existe
              await databases.createDocument(databaseId, USERS_COLLECTION_ID, ID.unique(), {
                userId: request.userId,
                email: request.email || request.userEmail || '',
                name: request.companyName || request.userName || '',
                phone: request.phone || '',
                isWholesale: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } catch (userError) {
            console.error('Error updating user wholesale status:', userError);
            // No fallar la actualización de la solicitud si falla la actualización del usuario
          }
        }
      }
      
      setRequests(prev => prev.map(r => r.$id === id ? { ...r, status: status as WholesaleRequest['status'] } : r));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setUpdatingId(null); }
  };

  const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };

  const filtered = [...requests.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.businessName?.toLowerCase().includes(q) ||
      r.companyName?.toLowerCase().includes(q) ||
      r.businessRut?.includes(q)
    );
  })].sort((a, b) => {
    if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (sortBy === 'pending') return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const stats = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitudes Mayoristas</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} solicitudes
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length} pendientes
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={requests.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['pending', 'approved', 'rejected'] as const).map(s => {
          const cfg = STATUS_CFG[s];
          const pendingAmt = s === 'pending' ? requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + ((r as any).estimatedTotal || 0), 0) : 0;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`bg-white rounded-2xl border p-4 text-left shadow-sm hover:shadow-md transition-all ${filter === s ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-100'}`}>
              <p className="text-2xl font-bold text-gray-900">{stats[s]}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
              {s === 'pending' && pendingAmt > 0 && (
                <p className="text-xs text-gray-500 mt-1">${pendingAmt.toLocaleString('es-CL')}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email, RUT..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {([['date', 'Recientes'], ['status', 'Estado'], ['pending', 'Más antiguos']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay solicitudes en esta categoría</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(r => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
              const isOpen = expanded === r.$id;
              return (
                <div key={r.$id}>
                  <button onClick={() => setExpanded(isOpen ? null : r.$id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{r.businessName || r.companyName || r.userName || 'Sin nombre'}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.userEmail} {r.businessRut ? `· RUT: ${r.businessRut}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'pending' && (() => {
                        const days = Math.floor((Date.now() - new Date(r.$createdAt).getTime()) / 86400000);
                        return days > 0 ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${days >= 7 ? 'bg-red-100 text-red-700' : days >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {days}d pendiente
                          </span>
                        ) : null;
                      })()}
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(r.$createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 ml-12">
                      {r.phone && <p className="text-sm text-gray-600 mb-2">📞 {r.phone}</p>}
                      {r.message && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm text-gray-700 whitespace-pre-wrap">{r.message}</div>
                      )}
                      {r.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => updateStatus(r.$id, 'approved')} disabled={updatingId === r.$id}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition disabled:opacity-60"
                            title="Aprobar solicitud de mayorista">
                            ✓ Aprobar
                          </button>
                          <button onClick={() => { setRejectModal(r.$id); setRejectReason(''); }} disabled={updatingId === r.$id}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition disabled:opacity-60"
                            title="Rechazar con razón opcional">
                            ✗ Rechazar
                          </button>
                          {updatingId === r.$id && <span className="text-xs text-gray-400 self-center">Guardando...</span>}
                        </div>
                      )}
                      {r.status !== 'pending' && (
                        <button onClick={() => updateStatus(r.$id, 'pending')} disabled={updatingId === r.$id}
                          className="px-4 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition">
                          Revertir a Pendiente
                        </button>
                      )}

                      {/* Rejection reason display */}
                      {r.status === 'rejected' && r.rejectionReason && (
                        <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-0.5">Razón de rechazo</p>
                            <p className="text-xs text-red-600">{r.rejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-medium text-gray-600">Notas internas</span>
                          {editingNotes !== r.$id && (
                            <button onClick={() => { setEditingNotes(r.$id); setNoteDraft(r.adminNotes || ''); }}
                              className="text-xs text-indigo-500 hover:text-indigo-700 ml-auto">
                              {r.adminNotes ? 'Editar' : 'Agregar nota'}
                            </button>
                          )}
                        </div>
                        {editingNotes === r.$id ? (
                          <div className="space-y-2">
                            <textarea rows={3} value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              placeholder="Nota interna sobre esta solicitud..." />
                            <div className="flex gap-2">
                              <button onClick={() => saveNote(r.$id)} disabled={savingNote}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                                <Save className="w-3 h-3" />{savingNote ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs hover:bg-gray-50 transition">Cancelar</button>
                            </div>
                          </div>
                        ) : r.adminNotes ? (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-800 whitespace-pre-wrap">{r.adminNotes}</div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin notas</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <p className="font-bold text-gray-900">Rechazar solicitud</p>
              <button onClick={() => setRejectModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Razón de rechazo (opcional)</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Ej: Documentación incompleta, RUT no verificado..." />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={rejectWithReason} disabled={rejecting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60">
                <XCircle className="w-4 h-4" />{rejecting ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
