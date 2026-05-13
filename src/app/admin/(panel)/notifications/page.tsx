'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, NOTIFICATIONS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { AdminNotification } from '@/types/admin';
import { Plus, Trash2, X, RefreshCw, AlertTriangle, Bell, Send, Download } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', userId: '' });
  const [isSending, setIsSending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const resp = await databases.listDocuments(databaseId, NOTIFICATIONS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'), Query.limit(100),
      ]);
      setNotifications(resp.documents as unknown as AdminNotification[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) { alert('Título y mensaje son requeridos'); return; }
    setIsSending(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: Record<string, any> = {
        title: form.title, message: form.message, type: form.type, isRead: false,
      };
      if (form.userId.trim()) payload.userId = form.userId.trim();
      const doc = await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), payload);
      setNotifications(prev => [doc as unknown as AdminNotification, ...prev]);
      setForm({ title: '', message: '', type: 'info', userId: '' });
      setShowForm(false);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSending(false); }
  };

  const exportCSV = () => {
    const headers = ['Título', 'Mensaje', 'Tipo', 'Leída', 'Usuario', 'Fecha'];
    const rows = displayed.map(n => [
      n.title || '', n.message || '', n.type || 'info',
      n.isRead ? 'Sí' : 'No', n.userId || 'broadcast',
      new Date(n.$createdAt).toLocaleString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `notificaciones_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const bulkDeleteSelected = async () => {
    if (selected.size === 0 || !confirm(`¿Eliminar ${selected.size} notificación(es)?`)) return;
    setBulkDeleting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all([...selected].map(id => databases.deleteDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, id)));
      setNotifications(prev => prev.filter(n => !selected.has(n.$id)));
      setSelected(new Set());
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setBulkDeleting(false); }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    setMarkingRead(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(unread.map(n => databases.updateDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, n.$id, { isRead: true })));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setMarkingRead(false); }
  };

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(s => s.size === displayed.length ? new Set() : new Set(displayed.map(n => n.$id)));

  const bulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selected.size} notificación(es)?`)) return;
    setBulkDeleting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all([...selected].map(id => databases.deleteDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, id)));
      setNotifications(prev => prev.filter(n => !selected.has(n.$id)));
      setSelected(new Set());
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setBulkDeleting(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    setDeleteId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, id);
      setNotifications(prev => prev.filter(n => n.$id !== id));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setDeleteId(null); }
  };

  const TYPES = ['all', 'info', 'success', 'warning', 'error', 'promo', 'order'];
  const TYPE_LABELS: Record<string, string> = { all: 'Todas', info: 'Info', success: 'Éxito', warning: 'Advertencia', error: 'Error', promo: 'Promo', order: 'Pedido' };

  const displayed = notifications.filter(n => {
    if (typeFilter !== 'all' && (n.type || 'info') !== typeFilter) return false;
    if (readFilter === 'unread' && n.isRead) return false;
    if (readFilter === 'read' && !n.isRead) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'type') return (a.type || 'info').localeCompare(b.type || 'info');
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const TYPE_COLORS: Record<string, string> = {
    info:    'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error:   'bg-red-100 text-red-700',
    promo:   'bg-violet-100 text-violet-700',
    order:   'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500">
            {notifications.length} notificaciones
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.isRead).length} sin leer
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={displayed.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          {notifications.some(n => !n.isRead) && (
            <button onClick={markAllRead} disabled={markingRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${markingRead ? 'animate-spin' : ''}`} />
              Marcar leídas
            </button>
          )}
          <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            <Plus className="w-4 h-4" /> Nueva
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
          <span className="text-indigo-700 font-medium">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
          <button onClick={bulkDeleteSelected} disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-60">
            {bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionadas'}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-indigo-600 hover:text-indigo-800 ml-auto">Cancelar</button>
        </div>
      )}

      {/* Type distribution bar */}
      {!isLoading && notifications.length > 0 && (() => {
        const types = ['info','success','warning','error','promo','order'] as const;
        const total = notifications.length;
        const colorMap: Record<string, string> = { info: 'bg-blue-400', success: 'bg-emerald-400', warning: 'bg-amber-400', error: 'bg-red-400', promo: 'bg-violet-400', order: 'bg-indigo-400' };
        const counts = types.map(t => ({ t, count: notifications.filter(n => (n.type || 'info') === t).length })).filter(x => x.count > 0);
        if (counts.length < 2) return null;
        return (
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {counts.map(({ t, count }) => (
              <div key={t} className={`${colorMap[t]} transition-all`} style={{ width: `${(count / total) * 100}%` }} title={`${TYPE_LABELS[t]}: ${count}`} />
            ))}
          </div>
        );
      })()}

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              typeFilter === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {TYPE_LABELS[t]}{t !== 'all' && notifications.filter(n => (n.type || 'info') === t).length > 0 ? ` (${notifications.filter(n => (n.type || 'info') === t).length})` : ''}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {([['all', 'Todas'], ['unread', `No leídas (${notifications.filter(n => !n.isRead).length})`], ['read', 'Leídas']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setReadFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${readFilter === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {([['date', 'Recientes'], ['type', 'Por tipo']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{displayed.length} notificacion{displayed.length !== 1 ? 'es' : ''}</span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-sm font-medium text-red-700">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
          <button onClick={bulkDelete} disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60">
            <Trash2 className="w-3.5 h-3.5" />{bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionadas'}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-red-500 hover:text-red-700">Cancelar</button>
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay notificaciones.</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Sin notificaciones del tipo «{TYPE_LABELS[typeFilter]}»</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(n => (
              <div key={n.$id} className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-l-2 ${!n.isRead ? 'bg-indigo-50/40 border-l-indigo-400' : 'border-l-transparent'} ${selected.has(n.$id) ? 'bg-red-50/60' : ''}`}>
                <input type="checkbox" checked={selected.has(n.$id)} onChange={() => toggleSelect(n.$id)}
                  className="mt-1 w-4 h-4 rounded text-red-600 border-gray-300 cursor-pointer shrink-0" />
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type || 'info'] || 'bg-gray-100 text-gray-600'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type || 'info'] || 'bg-gray-100 text-gray-600'}`}>{n.type || 'info'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.$createdAt).toLocaleString('es-CL')}{n.userId ? ` · Usuario: ${n.userId.slice(0, 10)}…` : ' · Global'}</p>
                </div>
                <button onClick={() => remove(n.$id)} disabled={deleteId === n.$id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Send className="w-4 h-4 text-indigo-500" />Crear Notificación</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título de la notificación" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3} placeholder="Contenido del mensaje..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="info">Info</option>
                  <option value="success">Éxito</option>
                  <option value="warning">Advertencia</option>
                  <option value="error">Error</option>
                  <option value="promo">Promoción</option>
                  <option value="order">Pedido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usuario ID (vacío = global)</label>
                <input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  placeholder="Dejar vacío para todos los usuarios" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={send} disabled={isSending} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2">
                {isSending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</> : <><Send className="w-4 h-4" />Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
