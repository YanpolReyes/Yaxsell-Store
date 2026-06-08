'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, TIMED_OFFERS_COLLECTION_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { TimedOffer, Product } from '@/types/admin';
import { Plus, Pencil, Trash2, X, RefreshCw, AlertTriangle, Clock, ToggleLeft, ToggleRight, Search, Download, ChevronDown } from 'lucide-react';

export default function TimedOffersPage() {
  const [offers, setOffers] = useState<TimedOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; data: Partial<TimedOffer> } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPack, setIsSavingPack] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  
  const [packTimer, setPackTimer] = useState<{
    isActive: boolean;
    timeType: 'duration' | 'endDateTime';
    endDateTime?: string;
    durationHours?: number;
    $id?: string;
  }>({
    isActive: false,
    timeType: 'endDateTime',
    endDateTime: '',
  });

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      console.log('Loading timed offers and products from DB:', databaseId);

      const [or, pr] = await Promise.all([
        databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(100)])
          .catch(e => {
            console.warn('Offers query with order failed, falling back...', e);
            return databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION_ID, [Query.limit(100)]);
          }),
        databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(100)])
          .catch(e => {
            console.warn('Products query with order failed, falling back...', e);
            return databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [Query.limit(100)]);
          }),
      ]);

      console.log('Loaded offers:', or.documents.length, 'Loaded products:', pr.documents.length);

      setOffers(or.documents as unknown as TimedOffer[]);
      setProducts(pr.documents as unknown as Product[]);

      const packDoc = or.documents.find(d => d.$id === 'pack_timer_config' || d.offerType === 'pack_timer');
      if (packDoc) {
        setPackTimer({
          isActive: packDoc.isActive,
          timeType: packDoc.timeType as any,
          endDateTime: packDoc.endDateTime,
          durationHours: packDoc.durationHours,
          $id: packDoc.$id,
        });
      }
    } catch (e: any) { 
      console.error('CRITICAL ERROR loading data:', e);
      setError(e.message); 
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePackTimer = async (isActive: boolean, endDateTime: string) => {
    setIsSavingPack(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: any = {
        title: 'Cronómetro Global Pack',
        offerType: 'pack_timer',
        targetId: 'pack_timer',
        productName: 'pack_timer',
        originalPrice: 0,
        discountPrice: 0,
        discountPercentage: 0,
        customImagePath: '',
        timeType: 'endDateTime',
        endDateTime: new Date(endDateTime).toISOString(),
        status: 'active',
        isActive: isActive,
      };

      if (packTimer.$id || offers.some(o => o.$id === 'pack_timer_config')) {
        try {
          await databases.deleteDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, 'pack_timer_config');
        } catch (err) {}
      }
      const doc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, 'pack_timer_config', payload);
      setPackTimer({
        isActive: doc.isActive,
        timeType: doc.timeType as any,
        endDateTime: doc.endDateTime,
        $id: doc.$id
      });
      // Refresh offers list to ensure it is in sync
      const or = await databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(100)]);
      setOffers(or.documents as unknown as TimedOffer[]);
      alert('Cronómetro de pack guardado exitosamente');
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setIsSavingPack(false);
    }
  };

  const now = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const openAdd = () => setModal({ 
    mode: 'add', 
    data: { 
      title: '', 
      offerType: 'product', 
      targetId: '', 
      productName: '', 
      originalPrice: 0, 
      discountPrice: 0, 
      discountPercentage: 0,
      customImagePath: '', 
      timeType: 'endDateTime', 
      endDateTime: now(),
      status: 'draft', 
      isActive: false
    } 
  });

  const openEdit = (o: TimedOffer) => setModal({ mode: 'edit', data: { ...o } });

  const save = async () => {
    if (!modal) return;
    const d = modal.data;
    if (!d.targetId) { alert('Selecciona un producto'); return; }
    if (!d.title) { alert('El título es requerido'); return; }
    if (d.timeType === 'endDateTime' && !d.endDateTime) { alert('La fecha de fin es requerida'); return; }
    if (d.timeType === 'duration' && !d.durationHours) { alert('La duración es requerida'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const product = products.find(p => p.$id === d.targetId);
      // Build clean payload - exclude system fields like $id, $createdAt, $updatedAt
      const payload: any = {
        title: d.title,
        offerType: d.offerType || 'product',
        targetId: d.targetId,
        productName: d.productName || product?.NAME || '',
        originalPrice: d.originalPrice || product?.PRICE || 0,
        discountPrice: d.discountPrice || 0,
        discountPercentage: d.discountPercentage || 0,
        customImagePath: d.customImagePath || '',
        timeType: d.timeType || 'endDateTime',
        status: d.status || 'draft',
        isActive: d.isActive ?? false,
      };
      if (d.timeType === 'duration' && d.durationHours) {
        payload.durationHours = Number(d.durationHours);
      }
      if (d.timeType === 'endDateTime' && d.endDateTime) {
        payload.endDateTime = new Date(d.endDateTime).toISOString();
      }
      if (d.activatedAt) {
        payload.activatedAt = new Date(d.activatedAt).toISOString();
      }
      // Strip ALL system fields — never send these to Appwrite
      delete payload.$id;
      delete payload.$createdAt;
      delete payload.$updatedAt;
      delete payload.createdAt;
      delete payload.updatedAt;
      if (modal.mode === 'add') {
        const doc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, ID.unique(), payload);
        if (payload.isActive) {
          const { notifyTimedOfferActivated } = await import('@/services/notificationService');
          await notifyTimedOfferActivated(doc as unknown as TimedOffer).catch(() => {});
        }
        setOffers(prev => [doc as unknown as TimedOffer, ...prev]);
      } else {
        const docId = (d as TimedOffer).$id;
        // updateDocument fails due to Appwrite internal data issue — use delete+recreate with same ID
        await databases.deleteDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, docId);
        const doc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, docId, payload);
        setOffers(prev => prev.map(o => o.$id === docId ? doc as unknown as TimedOffer : o));
      }
      setModal(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    setDeleteId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, id);
      setOffers(prev => prev.filter(o => o.$id !== id));
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setDeleteId(null); }
  };

  const toggle = async (offer: TimedOffer) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      // Build clean payload — strict whitelist only
      const payload: any = {
        title: offer.title,
        offerType: offer.offerType,
        targetId: offer.targetId,
        productName: offer.productName,
        originalPrice: offer.originalPrice,
        discountPrice: offer.discountPrice,
        discountPercentage: offer.discountPercentage,
        customImagePath: offer.customImagePath || '',
        timeType: offer.timeType,
        status: offer.status,
        isActive: !offer.isActive,
      };
      if (offer.durationHours) payload.durationHours = offer.durationHours;
      if (offer.endDateTime) payload.endDateTime = offer.endDateTime;
      // Set activatedAt when enabling; preserve existing when disabling
      if (!offer.isActive) {
        payload.activatedAt = new Date().toISOString(); // activating now
      } else if (offer.activatedAt) {
        payload.activatedAt = offer.activatedAt; // preserve
      }
      // updateDocument fails due to Appwrite internal stored data issue;
      // workaround: delete + recreate with same $id (create always works)
      await databases.deleteDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, offer.$id);
      const newDoc = await databases.createDocument(databaseId, TIMED_OFFERS_COLLECTION_ID, offer.$id, payload);
      if (!offer.isActive) {
        const { notifyTimedOfferActivated } = await import('@/services/notificationService');
        await notifyTimedOfferActivated(newDoc as unknown as TimedOffer).catch(() => {});
      }
      // Update state with the full new document (includes activatedAt)
      setOffers(prev => prev.map(o => o.$id === offer.$id ? newDoc as unknown as TimedOffer : o));
    } catch (e: any) { 
      alert('Error al pausar/activar: ' + e.message); 
    }
  };

  const productName = (id: string) => products.find(p => p.$id === id)?.NAME || id.slice(0, 16) + '…';
  const fmt = (d: string) => new Date(d).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  const fmtCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  const isExpired = (o: TimedOffer) => {
    if (o.timeType === 'endDateTime' && o.endDateTime) {
      return new Date(o.endDateTime) < new Date();
    }
    if (o.timeType === 'duration' && o.activatedAt && o.durationHours) {
      const endTime = new Date(o.activatedAt).getTime() + (o.durationHours * 3600000);
      return endTime < Date.now();
    }
    return false;
  };

  const isActive = (o: TimedOffer) => o.isActive && !isExpired(o) && o.status === 'active';

  const getCountdown = (offer: TimedOffer) => {
    let endTime: number | null = null;
    if (offer.timeType === 'endDateTime' && offer.endDateTime) {
      endTime = new Date(offer.endDateTime).getTime();
    } else if (offer.timeType === 'duration' && offer.activatedAt && offer.durationHours) {
      endTime = new Date(offer.activatedAt).getTime() + (offer.durationHours * 3600000);
    }
    if (!endTime) return null;
    const ms = endTime - Date.now();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const exportCSV = () => {
    const headers = ['Título', 'Producto', 'Precio Original', 'Precio Oferta', 'Descuento %', 'Estado'];
    const rows = displayedOffers.map(o => [
      o.title,
      o.productName,
      o.originalPrice,
      o.discountPrice,
      o.discountPercentage,
      !o.isActive ? 'Pausada' : isExpired(o) ? 'Expirada' : isActive(o) ? 'Activa' : 'Pendiente',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ofertas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filteredOffersList = offers.filter(o => (o.offerType as string) !== 'pack_timer' && (o.offerType as string) !== 'destacado_temporal');

  const displayedOffers = filteredOffersList.filter(o => {
    const name = (o.productName || '').toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (statusFilter === 'active') return isActive(o);
    if (statusFilter === 'paused') return !isExpired(o) && !isActive(o);
    if (statusFilter === 'expired') return isExpired(o);
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ofertas por Tiempo Limitado</h1>
          <p className="text-sm text-gray-500">
            {filteredOffersList.length} ofertas
            {filteredOffersList.filter(o => isActive(o)).length > 0 && <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{filteredOffersList.filter(o => isActive(o)).length} activas</span>}
            {filteredOffersList.filter(o => isExpired(o)).length > 0 && <span className="ml-1 text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filteredOffersList.filter(o => isExpired(o)).length} expiradas</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={displayedOffers.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            <Plus className="w-4 h-4" /> Nueva Oferta
          </button>
        </div>
      </div>

      {/* PACK DE OFERTAS TEMPORALES Config Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900">PACK DE OFERTAS TEMPORALES (Cronómetro Global)</h2>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${packTimer.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
            {packTimer.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha y Hora de Término</label>
            <input 
              type="datetime-local" 
              value={packTimer.endDateTime ? packTimer.endDateTime.slice(0, 16) : ''}
              onChange={e => setPackTimer(prev => ({ ...prev, endDateTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => {
                const now = new Date();
                now.setDate(now.getDate() + 5);
                const offset = now.getTimezoneOffset() * 60000;
                const localISODate = new Date(now.getTime() - offset).toISOString().slice(0, 16);
                setPackTimer(prev => ({ ...prev, endDateTime: localISODate }));
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition"
            >
              +5 Días
            </button>
            <button 
              type="button"
              onClick={() => {
                const now = new Date();
                now.setDate(now.getDate() + 1);
                const offset = now.getTimezoneOffset() * 60000;
                const localISODate = new Date(now.getTime() - offset).toISOString().slice(0, 16);
                setPackTimer(prev => ({ ...prev, endDateTime: localISODate }));
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition"
            >
              +24 Horas
            </button>
          </div>
          <div className="flex items-center gap-4 justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="packTimerActive" 
                checked={packTimer.isActive}
                onChange={e => setPackTimer(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
              />
              <label htmlFor="packTimerActive" className="text-sm font-semibold text-gray-700 cursor-pointer">Sincronizar Cronómetro</label>
            </div>
            <button 
              onClick={() => {
                if (!packTimer.endDateTime) { alert('Selecciona una fecha de término primero'); return; }
                savePackTimer(packTimer.isActive, packTimer.endDateTime);
              }}
              disabled={isSavingPack}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow transition disabled:opacity-60"
            >
              {isSavingPack ? 'Guardando...' : 'Guardar Cronómetro'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
          {([['all','Todas'],['active','Activas'],['paused','Pausadas'],['expired','Expiradas']] as [string,string][]).map(([v,l]) => {
            const cnt = v === 'all' ? filteredOffersList.length : v === 'active' ? filteredOffersList.filter(o => isActive(o)).length : v === 'expired' ? filteredOffersList.filter(o => isExpired(o)).length : filteredOffersList.filter(o => !isActive(o) && !isExpired(o)).length;
            return (
            <button key={v} onClick={() => setStatusFilter(v as typeof statusFilter)}
              className={`px-3 py-1.5 text-xs font-medium transition ${statusFilter === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {l}{cnt > 0 && v !== 'all' ? ` (${cnt})` : ''}
            </button>
          );
          })}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Original</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Oferta</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descuento</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{[1,2,3,4,5,6,7].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : offers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400">No hay ofertas creadas</p>
                </td></tr>
              ) : displayedOffers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Sin resultados</p>
                </td></tr>
              ) : displayedOffers.map(o => {
                const active = isActive(o);
                const expired = isExpired(o);
                return (
                  <tr key={o.$id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.title}</p>
                      <p className="text-xs text-gray-400">{o.status}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{o.productName}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">{fmtCLP(o.originalPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-emerald-600">{fmtCLP(o.discountPrice)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-red-600">-{o.discountPercentage}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expired ? (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Expirada</span>
                      ) : active ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Activa
                          </span>
                          {getCountdown(o) && (
                            <span className="text-xs text-gray-400">{getCountdown(o)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pausada</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggle(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition" title={o.isActive ? 'Pausar' : 'Activar'}>
                          {o.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(o.$id)} disabled={deleteId === o.$id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">{modal.mode === 'add' ? 'Nueva Oferta' : 'Editar Oferta'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input type="text" value={modal.data.title || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, title: e.target.value } } : m)}
                  placeholder="Ej: Oferta Flash 50% OFF"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Producto *</label>
                <ProductSelector 
                  products={products} 
                  value={modal.data.targetId || ''} 
                  onChange={(id) => {
                    const product = products.find(p => p.$id === id);
                    setModal(m => m ? { 
                      ...m, 
                      data: { 
                        ...m.data, 
                        targetId: id,
                        productName: product?.NAME || '',
                        originalPrice: product?.PRICE || 0
                      } 
                    } : m);
                  }} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Precio Original (CLP)</label>
                <input type="number" min="0" value={modal.data.originalPrice || ''} 
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, originalPrice: e.target.value ? Number(e.target.value) : 0 } } : m)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Precio Oferta (CLP) *</label>
                <input type="number" min="0" value={modal.data.discountPrice || ''} 
                  onChange={e => {
                    const discountPrice = e.target.value ? Number(e.target.value) : 0;
                    const originalPrice = modal.data.originalPrice || 0;
                    const discountPercentage = originalPrice > 0 ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) : 0;
                    setModal(m => m ? { 
                      ...m, 
                      data: { 
                        ...m.data, 
                        discountPrice,
                        discountPercentage
                      } 
                    } : m);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (%)</label>
                <input type="number" min="0" max="100" value={modal.data.discountPercentage || ''} 
                  onChange={e => {
                    const discountPercentage = e.target.value ? Number(e.target.value) : 0;
                    const originalPrice = modal.data.originalPrice || 0;
                    const discountPrice = Math.round(originalPrice * (1 - discountPercentage / 100));
                    setModal(m => m ? { 
                      ...m, 
                      data: { 
                        ...m.data, 
                        discountPercentage,
                        discountPrice
                      } 
                    } : m);
                  }}
                  placeholder="Se calcula automáticamente"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Tiempo</label>
                <select value={modal.data.timeType || 'endDateTime'} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, timeType: e.target.value as 'duration' | 'endDateTime' } } : m)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="endDateTime">Fecha de fin específica</option>
                  <option value="duration">Duración en horas</option>
                </select>
              </div>
              {modal.data.timeType === 'endDateTime' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Fin *</label>
                  <input type="datetime-local" value={modal.data.endDateTime?.slice(0, 16) || ''}
                    onChange={e => setModal(m => m ? { ...m, data: { ...m.data, endDateTime: e.target.value } } : m)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duración (horas) *</label>
                  <input type="number" min="1" value={modal.data.durationHours || ''} 
                    onChange={e => setModal(m => m ? { ...m, data: { ...m.data, durationHours: e.target.value ? Number(e.target.value) : undefined } } : m)}
                    placeholder="Ej: 24"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                <select value={modal.data.status || 'draft'} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, status: e.target.value as TimedOffer['status'] } } : m)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="draft">Borrador</option>
                  <option value="scheduled">Programada</option>
                  <option value="active">Activa</option>
                  <option value="paused">Pausada</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="offerActive" checked={modal.data.isActive ?? false}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, isActive: e.target.checked } } : m)}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="offerActive" className="text-sm text-gray-700">Oferta activa</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
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

function ProductSelector({ products, value, onChange }: { products: Product[], value: string, onChange: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selected = products.find(p => p.$id === value);
  const filtered = products.filter(p => p.NAME.toLowerCase().includes(search.toLowerCase()) || p.$id.includes(search));

  const fmtCLP = (v: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(v);

  return (
    <div className="relative">
      <div 
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? (
          <div className="flex items-center gap-2 truncate">
            {selected.IMAGEURL ? <img src={selected.IMAGEURL} alt="" className="w-6 h-6 object-cover rounded shrink-0" /> : <div className="w-6 h-6 bg-gray-100 rounded shrink-0" />}
            <span className="truncate text-gray-800 font-medium">{selected.NAME}</span>
          </div>
        ) : (
          <span className="text-gray-500">Seleccionar producto...</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
            <div className="p-2 sticky top-0 bg-white border-b border-gray-100 z-10">
              <input 
                type="text" 
                autoFocus
                placeholder="Buscar por nombre..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {filtered.map(p => (
              <div 
                key={p.$id} 
                onClick={() => { onChange(p.$id); setIsOpen(false); setSearch(''); }}
                className={`p-2 flex items-center gap-3 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 ${value === p.$id ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {p.IMAGEURL && <img src={p.IMAGEURL} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate leading-tight">{p.NAME}</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1 items-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${p.STOCK > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      Stock: {p.STOCK}
                    </span>
                    <span className="font-medium text-gray-700">{fmtCLP(p.PRICE)}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-4 text-center text-sm text-gray-500">No se encontraron productos</div>}
          </div>
        </>
      )}
    </div>
  );
}
