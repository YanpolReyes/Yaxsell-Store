'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, SUPPORT_TICKETS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { SupportTicket } from '@/types/admin';
import { RefreshCw, AlertTriangle, HeadphonesIcon, MessageCircle, ChevronDown, Send, Search, X, Download } from 'lucide-react';

const STATUS_CFG = {
  open:        { label: 'Abierto',      bg: 'bg-amber-100',   text: 'text-amber-700' },
  in_progress: { label: 'En proceso',   bg: 'bg-blue-100',    text: 'text-blue-700' },
  closed:      { label: 'Cerrado',      bg: 'bg-gray-100',    text: 'text-gray-500' },
};

const PRIORITY_CFG = {
  low:    { label: 'Baja',   bg: 'bg-gray-100',    text: 'text-gray-600' },
  medium: { label: 'Media',  bg: 'bg-amber-100',   text: 'text-amber-700' },
  high:   { label: 'Alta',   bg: 'bg-red-100',     text: 'text-red-700' },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; text: string } | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [bulkClosing, setBulkClosing] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
      if (filter !== 'all') queries.push(Query.equal('status', filter));
      const resp = await databases.listDocuments(databaseId, SUPPORT_TICKETS_COLLECTION_ID, queries);
      setTickets(resp.documents as unknown as SupportTicket[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async (id: string) => {
    if (!editingNote || editingNote.id !== id) return;
    setSavingNoteId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, SUPPORT_TICKETS_COLLECTION_ID, id, { adminNotes: editingNote.text });
      setTickets(prev => prev.map(t => t.$id === id ? { ...t, adminNotes: editingNote.text } as SupportTicket : t));
      setEditingNote(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingNoteId(null); }
  };

  const updatePriority = async (id: string, priority: string) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, SUPPORT_TICKETS_COLLECTION_ID, id, { priority });
      setTickets(prev => prev.map(t => t.$id === id ? { ...t, priority: priority as SupportTicket['priority'] } : t));
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const bulkCloseAll = async () => {
    const openTickets = filtered.filter(t => t.status !== 'closed');
    if (openTickets.length === 0 || !confirm(`¿Cerrar ${openTickets.length} ticket(s) abiertos?`)) return;
    setBulkClosing(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(openTickets.map(t => databases.updateDocument(databaseId, SUPPORT_TICKETS_COLLECTION_ID, t.$id, { status: 'closed' })));
      setTickets(prev => prev.map(t => openTickets.some(o => o.$id === t.$id) ? { ...t, status: 'closed' } : t));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setBulkClosing(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, SUPPORT_TICKETS_COLLECTION_ID, id, { status });
      setTickets(prev => prev.map(t => t.$id === id ? { ...t, status: status as SupportTicket['status'] } : t));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setUpdatingId(null); }
  };

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const filtered = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.subject?.toLowerCase().includes(q) || t.message?.toLowerCase().includes(q) || t.userId?.toLowerCase().includes(q) || t.adminNotes?.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority || 'low'] ?? 2) - (PRIORITY_ORDER[b.priority || 'low'] ?? 2);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const exportCSV = () => {
    const headers = ['Asunto', 'Usuario ID', 'Estado', 'Prioridad', 'Antigüedad (días)', 'Notas Admin', 'Fecha'];
    const rows = filtered.map(t => [
      t.subject || '',
      t.userId || '',
      STATUS_CFG[t.status]?.label || t.status,
      PRIORITY_CFG[t.priority as keyof typeof PRIORITY_CFG]?.label || t.priority || '',
      Math.floor((Date.now() - new Date(t.$createdAt).getTime()) / 86400000),
      t.adminNotes || '',
      new Date(t.$createdAt).toLocaleString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `soporte_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m`;
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-500">{filtered.length} tickets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          {filtered.some(t => t.status !== 'closed') && (
            <button onClick={bulkCloseAll} disabled={bulkClosing}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-60">
              {bulkClosing ? 'Cerrando...' : `Cerrar todos (${filtered.filter(t => t.status !== 'closed').length})`}
            </button>
          )}
          <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por asunto, mensaje, usuario o notas..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {([['date','Recientes'],['priority','Prioridad'],['status','Estado']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {(['open', 'in_progress', 'closed'] as const).map(s => {
          const cfg = STATUS_CFG[s];
          const count = tickets.filter(t => t.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`bg-white rounded-2xl border p-4 text-left shadow-sm hover:shadow-md transition-all ${filter === s ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-100'}`}>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
            </button>
          );
        })}
        {(() => {
          const closed = tickets.filter(t => t.status === 'closed' && t.$updatedAt && t.$createdAt);
          if (closed.length === 0) return null;
          const avgMs = closed.reduce((s, t) => s + (new Date(t.$updatedAt).getTime() - new Date(t.$createdAt).getTime()), 0) / closed.length;
          const avgH = Math.round(avgMs / 3600000);
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{avgH < 24 ? `${avgH}h` : `${Math.round(avgH / 24)}d`}</p>
              <span className="text-xs font-medium text-gray-500">Tiempo promedio cierre</span>
            </div>
          );
        })()}
      </div>

      {!isLoading && tickets.length > 0 && (() => {
        const high = tickets.filter(t => t.priority === 'high').length;
        const medium = tickets.filter(t => t.priority === 'medium').length;
        const low = tickets.filter(t => t.priority === 'low').length;
        const total = tickets.length;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Distribución por prioridad</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {high > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(high / total) * 100}%` }} title={`Alta: ${high}`} />}
              {medium > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${(medium / total) * 100}%` }} title={`Media: ${medium}`} />}
              {low > 0 && <div className="bg-gray-300 transition-all" style={{ width: `${(low / total) * 100}%` }} title={`Baja: ${low}`} />}
            </div>
            <div className="flex gap-4 mt-2">
              {[['Alta', high, 'text-red-600'], ['Media', medium, 'text-amber-600'], ['Baja', low, 'text-gray-500']] .map(([l, c, cls]) => (
                <span key={l as string} className={`text-xs font-medium ${cls}`}>{l}: {c}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <HeadphonesIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay tickets en esta categoría</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(t => {
              const stCfg = STATUS_CFG[t.status] || STATUS_CFG.open;
              const prCfg = PRIORITY_CFG[t.priority || 'low'];
              const isOpen = expanded === t.$id;
              return (
                <div key={t.$id} className={`border-l-2 ${t.priority === 'high' ? 'border-l-red-400' : t.priority === 'medium' ? 'border-l-amber-400' : 'border-l-transparent'}`}>
                  <button onClick={() => setExpanded(isOpen ? null : t.$id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left">
                    <MessageCircle className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{t.subject}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stCfg.bg} ${stCfg.text}`}>{stCfg.label}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prCfg.bg} ${prCfg.text}`}>{prCfg.label}</span>
                        {t.status !== 'closed' && (Date.now() - new Date(t.$createdAt).getTime()) > 2 * 86400000 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500 text-white rounded-full">
                            {Math.floor((Date.now() - new Date(t.$createdAt).getTime()) / 86400000)}d sin cerrar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {t.userId && <span className="font-mono mr-1.5">{t.userId.slice(0, 8)}…</span>}
                        {new Date(t.$createdAt).toLocaleString('es-CL')} · hace {timeAgo(t.$createdAt)}
                      </p>
                    </div>
                    {(t as any).adminReplies > 0 && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                        {(t as any).adminReplies} resp.
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 ml-8">
                      <div className="bg-gray-50 rounded-xl p-4 mb-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.message}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">Cambiar estado:</span>
                        <div className="flex gap-2">
                          {(['open', 'in_progress', 'closed'] as const).map(s => (
                            <button key={s} onClick={() => updateStatus(t.$id, s)} disabled={updatingId === t.$id || t.status === s}
                              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${t.status === s ? `${STATUS_CFG[s].bg} ${STATUS_CFG[s].text} opacity-60` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              {STATUS_CFG[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mt-2">
                        <span className="text-xs font-medium text-gray-500">Prioridad:</span>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map(p => (
                            <button key={p} onClick={() => updatePriority(t.$id, p)} disabled={t.priority === p}
                              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${(t.priority || 'low') === p ? `${PRIORITY_CFG[p].bg} ${PRIORITY_CFG[p].text} opacity-80` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              {PRIORITY_CFG[p].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Nota interna del admin:</p>
                        {editingNote?.id === t.$id ? (
                          <div className="flex gap-2">
                            <textarea
                              value={editingNote.text}
                              onChange={e => setEditingNote({ id: t.$id, text: e.target.value })}
                              rows={2}
                              className="flex-1 px-3 py-2 border border-indigo-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              placeholder="Escribe una nota interna..."
                            />
                            <button onClick={() => saveNote(t.$id)} disabled={savingNoteId === t.$id}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-1 self-start">
                              {savingNoteId === t.$id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
                              Guardar
                            </button>
                            <button onClick={() => setEditingNote(null)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition self-start">Cancelar</button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingNote({ id: t.$id, text: (t as any).adminNotes || '' })}
                            className="cursor-pointer px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 hover:bg-amber-100 transition min-h-[36px]">
                            {(t as any).adminNotes || <span className="text-gray-400 italic">Sin notas. Clic para agregar...</span>}
                          </div>
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
    </div>
  );
}
