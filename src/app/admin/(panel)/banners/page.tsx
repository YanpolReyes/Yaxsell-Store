'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, BANNERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Banner } from '@/types/admin';
import { Plus, Pencil, Trash2, X, RefreshCw, AlertTriangle, Image, Eye, EyeOff, ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';

import { MEDIA_BUCKET_ID, MEDIA_PREFIXES } from '@/lib/appwrite';
import { invalidateBannerCache } from '@/lib/cache';

const BANNERS_BUCKET_ID = MEDIA_BUCKET_ID; // Backward compatibility

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; data: Partial<Banner> } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Banner | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const displayed = search
    ? banners.filter(b => (b.TITLE || '').toLowerCase().includes(search.toLowerCase()))
    : banners;

  const toggleSelect = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const bulkDelete = async () => {
    if (selected.size === 0 || !confirm(`¿Eliminar ${selected.size} banner(s)?`)) return;
    setBulkDeleting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all([...selected].map(id => databases.deleteDocument(databaseId, BANNERS_COLLECTION_ID, id)));
      setBanners(prev => prev.filter(b => !selected.has(b.$id)));
      setSelected(new Set());
      invalidateBannerCache();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setBulkDeleting(false); }
  };

  const moveBanner = async (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= banners.length) return;
    const updated = [...banners];
    [updated[idx], updated[next]] = [updated[next], updated[idx]];
    const reassigned = updated.map((b, i) => ({ ...b, DISPLAYORDER: i }));
    setBanners(reassigned);
    const a = reassigned[idx], b2 = reassigned[next];
    setReordering(a.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all([
        databases.updateDocument(databaseId, BANNERS_COLLECTION_ID, a.$id, { DISPLAYORDER: a.DISPLAYORDER }),
        databases.updateDocument(databaseId, BANNERS_COLLECTION_ID, b2.$id, { DISPLAYORDER: b2.DISPLAYORDER }),
      ]);
    } catch (e: any) { alert('Error al reordenar: ' + e.message); load(); }
    finally { setReordering(null); }
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const resp = await databases.listDocuments(databaseId, BANNERS_COLLECTION_ID, [Query.orderAsc('$createdAt'), Query.limit(50)]);
      setBanners(resp.documents as unknown as Banner[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => setModal({ mode: 'add', data: { TITLE: '', IMAGEURL: '', LINKURL: '', DISPLAYORDER: banners.length, ISACTIVE: true } });
  const openEdit = (b: Banner) => setModal({ mode: 'edit', data: { ...b } });

  const save = async () => {
    if (!modal) return;
    const d = modal.data;
    if (!d.IMAGEURL?.trim()) { alert('La URL de imagen es requerida'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload = {
        IMAGEURL: d.IMAGEURL,
      };
      if (modal.mode === 'add') {
        const doc = await databases.createDocument(databaseId, BANNERS_COLLECTION_ID, ID.unique(), payload);
        setBanners(prev => [...prev, doc as unknown as Banner]);
      } else {
        const doc = await databases.updateDocument(databaseId, BANNERS_COLLECTION_ID, (d as Banner).$id, payload);
        setBanners(prev => prev.map(b => b.$id === (d as Banner).$id ? doc as unknown as Banner : b));
      }
      setModal(null);
      invalidateBannerCache();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    setDeleteId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, BANNERS_COLLECTION_ID, id);
      setBanners(prev => prev.filter(b => b.$id !== id));
      invalidateBannerCache();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setDeleteId(null); }
  };

  const toggleActive = async (b: Banner) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, BANNERS_COLLECTION_ID, b.$id, { ISACTIVE: !b.ISACTIVE });
      setBanners(prev => prev.map(x => x.$id === b.$id ? { ...x, ISACTIVE: !x.ISACTIVE } : x));
      invalidateBannerCache();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const exportCSV = () => {
    const headers = ['Título', 'Link', 'Orden', 'Activo', 'Fecha'];
    const rows = displayed.map(b => [
      b.TITLE || '', b.LINKURL || '', b.DISPLAYORDER ?? '', b.ISACTIVE ? 'Sí' : 'No',
      new Date(b.$createdAt).toLocaleDateString('es-CL'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `banners_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">{displayed.length} de {banners.length} banners · {banners.filter(b => b.ISACTIVE).length} activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={banners.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar banner por título..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-sm font-medium text-red-700">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
          <button onClick={bulkDelete} disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60">
            <Trash2 className="w-3.5 h-3.5" />{bulkDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-red-500 hover:text-red-700">Cancelar</button>
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {/* Banner Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay banners. Agrega el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((b, idx) => (
            <div key={b.$id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${b.ISACTIVE ? 'border-gray-100' : 'border-gray-200 opacity-60'} ${selected.has(b.$id) ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="relative h-40 bg-gray-100 cursor-pointer" onClick={() => setPreview(b)}>
                <div className="absolute top-2 left-2 z-10" onClick={e => { e.stopPropagation(); toggleSelect(b.$id); }}>
                  <input type="checkbox" checked={selected.has(b.$id)} onChange={() => toggleSelect(b.$id)}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 cursor-pointer shadow" />
                </div>
                {b.IMAGEURL ? (
                  <img src={b.IMAGEURL} alt={b.TITLE || 'Banner'} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Ver</span>
                </div>
                {!b.ISACTIVE && (
                  <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-0.5 rounded-full">Inactivo</div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{b.TITLE || 'Sin título'}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">#{b.DISPLAYORDER ?? '—'}</span>
                </div>
                {b.LINKURL && <p className="text-xs text-indigo-600 truncate mb-2">{b.LINKURL}</p>}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5 mr-0.5">
                    <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0 || reordering === b.$id}
                      className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1 || reordering === b.$id}
                      className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => toggleActive(b)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition ${b.ISACTIVE ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {b.ISACTIVE ? <><Eye className="w-3.5 h-3.5" />Activo</> : <><EyeOff className="w-3.5 h-3.5" />Inactivo</>}
                  </button>
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(b.$id)} disabled={deleteId === b.$id} className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"><X className="w-5 h-5" /></button>
            <img src={preview.IMAGEURL} alt={preview.TITLE || ''} className="w-full rounded-2xl" />
            {preview.TITLE && <p className="text-white text-center mt-3 font-medium">{preview.TITLE}</p>}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.mode === 'add' ? 'Nuevo Banner' : 'Editar Banner'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <ImageUploadField label="Imagen del Banner *" bucketId={BANNERS_BUCKET_ID}
                value={modal.data.IMAGEURL || ''}
                onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL: v } } : m)} />
              {([
                { label: 'Título', field: 'TITLE' as keyof Banner },
                { label: 'URL de destino (link)', field: 'LINKURL' as keyof Banner },
              ] as { label: string; field: keyof Banner }[]).map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="text" value={(modal.data[field] as string) ?? ''}
                    onChange={e => setModal(m => m ? { ...m, data: { ...m.data, [field]: e.target.value } } : m)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
                <input type="number" value={modal.data.DISPLAYORDER ?? 0}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, DISPLAYORDER: Number(e.target.value) } } : m)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ISACTIVE" checked={modal.data.ISACTIVE ?? true}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, ISACTIVE: e.target.checked } } : m)}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="ISACTIVE" className="text-sm text-gray-700">Banner activo</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={save} disabled={isSaving} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2">
                {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
