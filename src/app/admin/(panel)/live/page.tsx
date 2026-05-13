'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, LIVE_STREAMS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Plus, Trash2, X, RefreshCw, AlertTriangle, Radio, Play, Square, Copy, CheckCircle, Pencil, Download, Search } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';

const LIVE_BUCKET_ID = '67f41e05000d0adb6f12';

interface LiveStream {
  $id: string;
  title: string;
  description?: string;
  isLive: boolean;
  streamUrl?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  $createdAt: string;
}

export default function LivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Partial<LiveStream> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [liveFilter, setLiveFilter] = useState<'all' | 'live' | 'offline'>('all');
  const [bulkDeletingOffline, setBulkDeletingOffline] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'viewers'>('date');

  const displayed = streams.filter(s => {
    if (liveFilter === 'live' && !s.isLive) return false;
    if (liveFilter === 'offline' && s.isLive) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'viewers') return (b.viewerCount || 0) - (a.viewerCount || 0);
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const bulkDeleteOffline = async () => {
    const offline = streams.filter(s => !s.isLive);
    if (offline.length === 0 || !confirm(`¿Eliminar ${offline.length} stream(s) offline?`)) return;
    setBulkDeletingOffline(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(offline.map(s => databases.deleteDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, s.$id)));
      setStreams(prev => prev.filter(s => s.isLive));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setBulkDeletingOffline(false); }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['Título', 'Descripción', 'Estado', 'Viewers', 'URL Stream', 'Fecha'];
    const rows = displayed.map(s => [
      s.title || '', s.description || '',
      s.isLive ? 'En vivo' : 'Offline',
      s.viewerCount || 0, s.streamUrl || '',
      new Date(s.$createdAt).toLocaleString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `streams_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const resp = await databases.listDocuments(databaseId, LIVE_STREAMS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'), Query.limit(50),
      ]);
      setStreams(resp.documents as unknown as LiveStream[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!modal?.title?.trim()) { alert('El título es requerido'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload = {
        title: modal.title, description: modal.description || '',
        streamUrl: modal.streamUrl || '', thumbnailUrl: modal.thumbnailUrl || '',
        isLive: modal.isLive ?? false,
      };
      if (modal.$id) {
        const doc = await databases.updateDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, modal.$id, payload);
        setStreams(prev => prev.map(s => s.$id === modal.$id ? doc as unknown as LiveStream : s));
      } else {
        const doc = await databases.createDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, ID.unique(), payload);
        setStreams(prev => [doc as unknown as LiveStream, ...prev]);
      }
      setModal(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSaving(false); }
  };

  const toggleLive = async (s: LiveStream) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, s.$id, { isLive: !s.isLive });
      setStreams(prev => prev.map(x => x.$id === s.$id ? { ...x, isLive: !x.isLive } : x));
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este stream?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, id);
      setStreams(prev => prev.filter(s => s.$id !== id));
    } catch (e: any) { alert('Error: ' + e.message); }
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Live Shopping</h1>
          <p className="text-sm text-gray-500">{streams.filter(s => s.isLive).length} en vivo · {streams.reduce((acc, s) => acc + (s.viewerCount || 0), 0)} viewers · {streams.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={streams.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setModal({ isLive: false })} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
            <Radio className="w-4 h-4" /> Nuevo Live
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar stream..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {([['all', 'Todos'], ['live', 'En Vivo'], ['offline', 'Offline']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setLiveFilter(v)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${liveFilter === v ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        {([['date','Recientes'],['viewers','Viewers']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        {streams.some(s => !s.isLive) && (
          <button onClick={bulkDeleteOffline} disabled={bulkDeletingOffline}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60">
            {bulkDeletingOffline ? 'Eliminando...' : `Limpiar offline (${streams.filter(s => !s.isLive).length})`}
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : streams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Radio className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay streams. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...displayed].sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0)).map(s => (
            <div key={s.$id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${s.isLive ? 'border-red-200 ring-2 ring-red-300' : 'border-gray-100'}`}>
              <div className="relative h-36 bg-gray-100">
                {s.thumbnailUrl ? (
                  <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                    <Radio className="w-8 h-8 text-red-300" />
                  </div>
                )}
                {s.isLive && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />EN VIVO
                  </div>
                )}
                {s.viewerCount !== undefined && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {s.viewerCount} viewers
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate mb-0.5">{s.title}</p>
                {s.description && <p className="text-xs text-gray-500 truncate mb-1">{s.description}</p>}
                <p className="text-[10px] text-gray-400 mb-2">
                  {(() => {
                    const diff = Date.now() - new Date(s.$createdAt).getTime();
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    if (s.isLive) return `🔴 En vivo hace ${h > 0 ? `${h}h ` : ''}${m}m`;
                    const d = Math.floor(diff / 86400000);
                    return d > 0 ? `Hace ${d}d` : `Hace ${h}h`;
                  })()}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleLive(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition ${s.isLive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {s.isLive ? <><Square className="w-3 h-3" />Detener</> : <><Play className="w-3 h-3" />Iniciar</>}
                  </button>
                  {s.streamUrl && (
                    <button onClick={() => copyUrl(s.$id, s.streamUrl!)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Copiar URL">
                      {copiedId === s.$id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button onClick={() => setModal({ ...s })} className="p-1.5 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(s.$id)} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.$id ? 'Editar Stream' : 'Nuevo Live'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {([
                { label: 'Título *', field: 'title' as keyof LiveStream },
                { label: 'Descripción', field: 'description' as keyof LiveStream },
                { label: 'URL del Stream', field: 'streamUrl' as keyof LiveStream },
              ] as { label: string; field: keyof LiveStream }[]).map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="text" value={(modal[field] as string) ?? ''}
                    onChange={e => setModal(m => m ? { ...m, [field]: e.target.value } : m)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <ImageUploadField label="Miniatura" bucketId={LIVE_BUCKET_ID}
                value={modal.thumbnailUrl || ''}
                onChange={v => setModal(m => m ? { ...m, thumbnailUrl: v } : m)} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isLive" checked={modal.isLive ?? false}
                  onChange={e => setModal(m => m ? { ...m, isLive: e.target.checked } : m)}
                  className="w-4 h-4 text-red-600 rounded" />
                <label htmlFor="isLive" className="text-sm text-gray-700">En vivo ahora</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={save} disabled={isSaving} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
                {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
