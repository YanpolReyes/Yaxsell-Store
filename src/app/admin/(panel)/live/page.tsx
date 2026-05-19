'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, LIVE_STREAMS_COLLECTION_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Plus, Trash2, X, RefreshCw, AlertTriangle, Radio, Play, Square, Copy, CheckCircle, Pencil, Download, Search, Calendar, Settings, ShoppingBag, Eye, Clock, Monitor, VolumeX, Maximize2, Type, RotateCw, Percent } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import type { LiveStream } from '@/types';

const LIVE_BUCKET_ID = '67f41e05000d0adb6f12';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: '▶' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: 'f' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', icon: '📷' },
  { id: 'tiktok', label: 'TikTok', color: '#000000', icon: '♪' },
  { id: 'twitch', label: 'Twitch', color: '#9146FF', icon: '🎮' },
] as const;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Programado', color: '#2563eb', bg: '#eff6ff' },
  live: { label: 'En Vivo', color: '#dc2626', bg: '#fef2f2' },
  ended: { label: 'Finalizado', color: '#6b7280', bg: '#f9fafb' },
  cancelled: { label: 'Cancelado', color: '#d97706', bg: '#fffbeb' },
  error: { label: 'Error', color: '#dc2626', bg: '#fef2f2' },
};

type TabId = 'stream' | 'management' | 'shopping';

export default function LivePage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<Partial<LiveStream> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'viewers'>('date');
  const [activeTab, setActiveTab] = useState<TabId>('management');
  const [modalTab, setModalTab] = useState<'basic' | 'player' | 'shopping' | 'schedule'>('basic');
  const [products, setProducts] = useState<{ $id: string; NAME: string; PRICE: number; IMAGEURL?: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const displayed = streams.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (sortBy === 'viewers') return (b.viewerCount || 0) - (a.viewerCount || 0);
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  const stats = {
    total: streams.length,
    live: streams.filter(s => s.status === 'live').length,
    scheduled: streams.filter(s => s.status === 'scheduled').length,
    ended: streams.filter(s => s.status === 'ended').length,
    viewers: streams.reduce((acc, s) => acc + (s.viewerCount || 0), 0),
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const resp = await databases.listDocuments(databaseId, LIVE_STREAMS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'), Query.limit(100),
      ]);
      setStreams(resp.documents as unknown as LiveStream[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const queries = [Query.limit(50), Query.orderDesc('$createdAt')];
      if (productSearch) queries.unshift(Query.contains('NAME', productSearch));
      const resp = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, queries);
      setProducts(resp.documents as any);
    } catch {}
  }, [productSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (modal && modalTab === 'shopping') loadProducts(); }, [modal, modalTab, loadProducts]);

  const save = async () => {
    if (!modal?.title?.trim()) { alert('El título es requerido'); return; }
    if (!modal.url?.trim()) { alert('La URL del stream es requerida'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        title: modal.title.trim(),
        description: modal.description || '',
        url: modal.url.trim(),
        platform: modal.platform || 'youtube',
        isActive: modal.isActive ?? false,
        status: modal.status || (modal.isActive ? 'live' : 'scheduled'),
        thumbnailUrl: modal.thumbnailUrl || '',
        bannerUrl: modal.bannerUrl || '',
        viewerCount: modal.viewerCount || 0,
        autoplay: modal.autoplay ?? true,
        muted: modal.muted ?? false,
        showText: modal.showText ?? false,
        allowFullscreen: modal.allowFullscreen ?? true,
        productIds: JSON.stringify(modal.productIds || []),
        pinnedProductId: modal.pinnedProductId || '',
        isRotationEnabled: modal.isRotationEnabled ?? false,
        rotationInterval: modal.rotationInterval || 30,
        defaultDiscount: modal.defaultDiscount || 0,
        errorMessage: '',
        createdBy: modal.createdBy || '',
      };
      if (modal.scheduledAt) payload.scheduledAt = modal.scheduledAt;
      if (modal.startAt) payload.startAt = modal.startAt;
      if (modal.endAt) payload.endAt = modal.endAt;

      if (modal.$id && modal.isActive && !streams.find(s => s.$id === modal.$id)?.isActive) {
        payload.status = 'live';
        payload.startAt = now;
      }
      if (modal.$id && !modal.isActive && streams.find(s => s.$id === modal.$id)?.isActive) {
        payload.status = 'ended';
        payload.endAt = now;
      }

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
      const now = new Date().toISOString();
      const goingLive = !s.isActive;
      await databases.updateDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, s.$id, {
        isActive: goingLive,
        status: goingLive ? 'live' : 'ended',
        startAt: goingLive ? now : s.startAt,
        endAt: goingLive ? '' : now,
      });
      setStreams(prev => prev.map(x => x.$id === s.$id ? { ...x, isActive: goingLive, status: goingLive ? 'live' : 'ended' } : x));
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

  const bulkDeleteEnded = async () => {
    const ended = streams.filter(s => s.status === 'ended' || s.status === 'cancelled');
    if (ended.length === 0 || !confirm(`¿Eliminar ${ended.length} stream(s) finalizados?`)) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(ended.map(s => databases.deleteDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, s.$id)));
      setStreams(prev => prev.filter(s => s.status !== 'ended' && s.status !== 'cancelled'));
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    const headers = ['Título', 'Plataforma', 'Estado', 'Viewers', 'URL', 'Programado', 'Inicio', 'Fin', 'Fecha'];
    const rows = displayed.map(s => [
      s.title, s.platform || '', STATUS_MAP[s.status]?.label || s.status,
      s.viewerCount || 0, s.url || '',
      s.scheduledAt ? new Date(s.scheduledAt).toLocaleString('es-CL') : '',
      s.startAt ? new Date(s.startAt).toLocaleString('es-CL') : '',
      s.endAt ? new Date(s.endAt).toLocaleString('es-CL') : '',
      new Date(s.$createdAt).toLocaleString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `streams_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const openNewModal = () => {
    setModal({
      isActive: false, status: 'scheduled', platform: 'youtube',
      autoplay: true, muted: false, showText: false, allowFullscreen: true,
      productIds: [], isRotationEnabled: false, rotationInterval: 30, defaultDiscount: 0,
    });
    setModalTab('basic');
  };

  const openEditModal = (s: LiveStream) => {
    setModal({
      ...s,
      productIds: typeof (s as any).productIds === 'string'
        ? JSON.parse((s as any).productIds || '[]')
        : (s.productIds || []),
    });
    setModalTab('basic');
  };

  const toggleProductInStream = (productId: string) => {
    if (!modal) return;
    const current = modal.productIds || [];
    const updated = current.includes(productId)
      ? current.filter((id: string) => id !== productId)
      : [...current, productId];
    setModal(m => m ? { ...m, productIds: updated } : m);
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'management', label: 'Streams', icon: Radio },
    { id: 'shopping', label: 'Live Shopping', icon: ShoppingBag },
    { id: 'stream', label: 'Config', icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            Live Shopping
          </h1>
          <p className="text-sm text-gray-500">
            {stats.live > 0 && <span className="text-red-600 font-semibold">{stats.live} en vivo · </span>}
            {stats.scheduled > 0 && <span>{stats.scheduled} programados · </span>}
            {stats.viewers > 0 && <span>{stats.viewers} viewers · </span>}
            {stats.total} total
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={streams.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
            <Radio className="w-4 h-4" /> Nuevo Live
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'En Vivo', value: stats.live, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Programados', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Finalizados', value: stats.ended, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Viewers', value: stats.viewers, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar stream..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        {(['all', 'live', 'scheduled', 'ended', 'cancelled'] as const).map(v => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${statusFilter === v ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {v === 'all' ? 'Todos' : STATUS_MAP[v]?.label || v}
          </button>
        ))}
        {([['date', 'Recientes'], ['viewers', 'Viewers']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        {stats.ended > 0 && (
          <button onClick={bulkDeleteEnded}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-red-600 hover:bg-red-50 transition">
            Limpiar finalizados ({stats.ended})
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {/* Management Tab */}
      {activeTab === 'management' && (
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Radio className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay streams. Crea el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(s => {
              const platform = PLATFORMS.find(p => p.id === s.platform);
              const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.ended;
              const duration = s.startAt && s.isActive
                ? Math.floor((Date.now() - new Date(s.startAt).getTime()) / 60000)
                : null;
              return (
                <div key={s.$id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${s.isActive ? 'border-red-200 ring-2 ring-red-300' : 'border-gray-100'}`}>
                  <div className="relative h-40 bg-gray-100">
                    {s.thumbnailUrl ? (
                      <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                        <Radio className="w-8 h-8 text-red-300" />
                      </div>
                    )}
                    {s.isActive && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />EN VIVO
                      </div>
                    )}
                    {!s.isActive && s.status !== 'ended' && (
                      <div className="absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                        {statusInfo.label}
                      </div>
                    )}
                    {platform && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 text-xs font-semibold px-2 py-1 rounded-full shadow-sm" style={{ color: platform.color }}>
                        <span>{platform.icon}</span>{platform.label}
                      </div>
                    )}
                    {(s.viewerCount !== undefined && s.viewerCount > 0) && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />{s.viewerCount}
                      </div>
                    )}
                    {duration !== null && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />{duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.title}</p>
                    {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{statusInfo.label}</span>
                      {s.scheduledAt && <span>· 📅 {new Date(s.scheduledAt).toLocaleDateString('es-CL')}</span>}
                      {s.startAt && <span>· ▶ {new Date(s.startAt).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                    {(s.productIds?.length || 0) > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-indigo-500">
                        <ShoppingBag className="w-3 h-3" />{Array.isArray(s.productIds) ? s.productIds.length : 0} productos
                        {s.pinnedProductId && <span className="ml-1 text-amber-500">★ Destacado</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button onClick={() => toggleLive(s)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition ${s.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                        {s.isActive ? <><Square className="w-3 h-3" />Detener</> : <><Play className="w-3 h-3" />Iniciar</>}
                      </button>
                      {s.url && (
                        <button onClick={() => copyUrl(s.$id, s.url)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Copiar URL">
                          {copiedId === s.$id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button onClick={() => openEditModal(s)} className="p-1.5 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(s.$id)} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Shopping Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-indigo-600" />Live Shopping</h2>
            <p className="text-sm text-gray-500 mb-4">Asocia productos a tus streams en vivo. Los productos destacados aparecen primero durante la transmisión.</p>
            {streams.filter(s => s.isActive || s.status === 'scheduled').length === 0 ? (
              <p className="text-sm text-gray-400">No hay streams activos o programados para configurar Live Shopping.</p>
            ) : (
              <div className="space-y-3">
                {streams.filter(s => s.isActive || s.status === 'scheduled').map(s => (
                  <div key={s.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.isActive ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(s.productIds) ? s.productIds.length : 0} productos
                          {s.pinnedProductId && ' · ★ Destacado'}
                          {s.isRotationEnabled && ` · Rotación ${s.rotationInterval}s`}
                          {s.defaultDiscount ? ` · ${s.defaultDiscount}% desc` : ''}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => openEditModal(s)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition">
                      Configurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'stream' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" />Configuración Rápida</h2>
          <p className="text-sm text-gray-500 mb-4">Edita la configuración del reproductor de streams activos.</p>
          {streams.filter(s => s.isActive).length === 0 ? (
            <p className="text-sm text-gray-400">No hay streams activos para configurar.</p>
          ) : (
            <div className="space-y-3">
              {streams.filter(s => s.isActive).map(s => (
                <div key={s.$id} className="p-4 bg-red-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      { key: 'autoplay', label: 'Autoplay', icon: Play },
                      { key: 'muted', label: 'Silenciado', icon: VolumeX },
                      { key: 'showText', label: 'Subtítulos', icon: Type },
                      { key: 'allowFullscreen', label: 'Pantalla completa', icon: Maximize2 },
                    ] as const).map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={async () => {
                        const { databases } = getServices();
                        const { databaseId } = getAppwriteConfig();
                        const newVal = !(s as any)[key];
                        await databases.updateDocument(databaseId, LIVE_STREAMS_COLLECTION_ID, s.$id, { [key]: newVal });
                        setStreams(prev => prev.map(x => x.$id === s.$id ? { ...x, [key]: newVal } : x));
                      }} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${(s as any)[key] ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-500">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5" />{modal.$id ? 'Editar Stream' : 'Nuevo Live'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex border-b border-gray-100">
              {([
                { id: 'basic' as const, label: 'General', icon: Radio },
                { id: 'player' as const, label: 'Reproductor', icon: Monitor },
                { id: 'shopping' as const, label: 'Productos', icon: ShoppingBag },
                { id: 'schedule' as const, label: 'Programación', icon: Calendar },
              ]).map(t => (
                <button key={t.id} onClick={() => setModalTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition border-b-2 ${modalTab === t.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {modalTab === 'basic' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                    <input type="text" value={modal.title || ''} onChange={e => setModal(m => m ? { ...m, title: e.target.value } : m)} placeholder="Nombre del live..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                    <textarea value={modal.description || ''} onChange={e => setModal(m => m ? { ...m, description: e.target.value } : m)} rows={2} placeholder="Descripción del stream..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL del Stream *</label>
                    <input type="url" value={modal.url || ''} onChange={e => setModal(m => m ? { ...m, url: e.target.value } : m)} placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Plataforma</label>
                    <div className="flex gap-2">
                      {PLATFORMS.map(p => (
                        <button key={p.id} onClick={() => setModal(m => m ? { ...m, platform: p.id } : m)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition border-2 ${modal.platform === p.id ? 'border-current shadow-sm' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                          style={modal.platform === p.id ? { color: p.color, borderColor: p.color, background: `${p.color}10` } : {}}>
                          <span>{p.icon}</span>{p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Estado</label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_MAP).map(([key, info]) => (
                        <button key={key} onClick={() => setModal(m => m ? { ...m, status: key as LiveStream['status'], isActive: key === 'live' } : m)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${modal.status === key ? 'ring-2 ring-offset-1' : 'opacity-50 hover:opacity-80'}`}
                          style={{ color: info.color, background: info.bg, ...(modal.status === key ? { ringColor: info.color } : {}) }}>
                          {info.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ImageUploadField label="Miniatura" bucketId={LIVE_BUCKET_ID}
                    value={modal.thumbnailUrl || ''}
                    onChange={v => setModal(m => m ? { ...m, thumbnailUrl: v } : m)} />
                  <ImageUploadField label="Banner" bucketId={LIVE_BUCKET_ID}
                    value={modal.bannerUrl || ''}
                    onChange={v => setModal(m => m ? { ...m, bannerUrl: v } : m)} />
                </>
              )}

              {modalTab === 'player' && (
                <>
                  <p className="text-xs text-gray-500">Configura cómo se reproduce el stream en la tienda.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'autoplay', label: 'Auto-reproducir', icon: Play, desc: 'Iniciar automáticamente' },
                      { key: 'muted', label: 'Silenciado', icon: VolumeX, desc: 'Sin audio por defecto' },
                      { key: 'showText', label: 'Subtítulos', icon: Type, desc: 'Mostrar texto sobre el video' },
                      { key: 'allowFullscreen', label: 'Pantalla completa', icon: Maximize2, desc: 'Permitir expandir' },
                    ] as const).map(({ key, label, icon: Icon, desc }) => (
                      <button key={key} onClick={() => setModal(m => m ? { ...m, [key]: !m[key] } : m)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border-2 transition text-left ${modal[key] ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <Icon className={`w-5 h-5 mt-0.5 ${modal[key] ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${modal[key] ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</p>
                          <p className="text-[10px] text-gray-400">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {modalTab === 'shopping' && (
                <>
                  <p className="text-xs text-gray-500">Asocia productos que se mostrarán durante el live. El producto destacado aparece en primer lugar.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" />Rotación</span>
                        <button onClick={() => setModal(m => m ? { ...m, isRotationEnabled: !m.isRotationEnabled } : m)}
                          className={`w-8 h-4 rounded-full transition-all ${modal.isRotationEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${modal.isRotationEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {modal.isRotationEnabled && (
                        <div className="flex items-center gap-2">
                          <input type="number" min={5} max={300} value={modal.rotationInterval || 30}
                            onChange={e => setModal(m => m ? { ...m, rotationInterval: parseInt(e.target.value) || 30 } : m)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center" />
                          <span className="text-xs text-gray-500">segundos</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1"><Percent className="w-3.5 h-3.5" />Descuento</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} max={99} value={modal.defaultDiscount || 0}
                          onChange={e => setModal(m => m ? { ...m, defaultDiscount: parseInt(e.target.value) || 0 } : m)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center" />
                        <span className="text-xs text-gray-500">% por defecto</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar productos..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {(modal.productIds?.length || 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Productos seleccionados ({modal.productIds?.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {modal.productIds?.map(pid => {
                          const prod = products.find(p => p.$id === pid);
                          return prod ? (
                            <span key={pid} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${modal.pinnedProductId === pid ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-indigo-50 text-indigo-700'}`}>
                              {modal.pinnedProductId === pid && '★ '}{prod.NAME}
                              <button onClick={() => toggleProductInStream(pid)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {products.filter(p => !(modal.productIds || []).includes(p.$id)).map(p => (
                      <button key={p.$id} onClick={() => toggleProductInStream(p.$id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition text-left">
                        {p.IMAGEURL ? (
                          <img src={p.IMAGEURL} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-gray-300" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{p.NAME}</p>
                          <p className="text-[10px] text-gray-400">${p.PRICE?.toLocaleString('es-CL')}</p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-300" />
                      </button>
                    ))}
                  </div>
                  {(modal.productIds?.length || 0) > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Producto destacado (★)</label>
                      <select value={modal.pinnedProductId || ''} onChange={e => setModal(m => m ? { ...m, pinnedProductId: e.target.value } : m)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">Ninguno</option>
                        {modal.productIds?.map(pid => {
                          const prod = products.find(p => p.$id === pid);
                          return prod ? <option key={pid} value={pid}>{prod.NAME}</option> : null;
                        })}
                      </select>
                    </div>
                  )}
                </>
              )}

              {modalTab === 'schedule' && (
                <>
                  <p className="text-xs text-gray-500">Programa cuándo comenzará y terminará el stream.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Fecha programada</label>
                      <input type="datetime-local" value={modal.scheduledAt ? modal.scheduledAt.slice(0, 16) : ''}
                        onChange={e => setModal(m => m ? { ...m, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : '' } : m)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Play className="w-3.5 h-3.5" />Hora de inicio</label>
                      <input type="datetime-local" value={modal.startAt ? modal.startAt.slice(0, 16) : ''}
                        onChange={e => setModal(m => m ? { ...m, startAt: e.target.value ? new Date(e.target.value).toISOString() : '' } : m)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Square className="w-3.5 h-3.5" />Hora de fin</label>
                      <input type="datetime-local" value={modal.endAt ? modal.endAt.slice(0, 16) : ''}
                        onChange={e => setModal(m => m ? { ...m, endAt: e.target.value ? new Date(e.target.value).toISOString() : '' } : m)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-white transition">Cancelar</button>
              <button onClick={save} disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2">
                {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : <><Radio className="w-4 h-4" />Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
