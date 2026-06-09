'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import Image from 'next/image';
import {
  getServices, getAppwriteConfig,
  STOCK_REQUESTS_COLLECTION_ID,
  NOTIFICATIONS_COLLECTION_ID,
  PRODUCTS_COLLECTION_ID,
} from '@/lib/appwrite-admin';
import {
  RefreshCw, CheckCircle, Package, AlertTriangle,
  MapPin, Hash, User, Calendar, BoxesIcon, Pencil, X, Save,
} from 'lucide-react';
import {
  getSkuFromFeatures,
  getWarehouseLocationFromFeatures,
} from '@/lib/product-features';
import { Product } from '@/types/admin';

interface StockRequest {
  $id: string;
  productId: string;
  productName: string;
  userId: string;
  userEmail: string;
  requestedQuantity: number;
  status: 'pending' | 'fulfilled';
  $createdAt: string;
}

interface EnrichedRequest extends StockRequest {
  product: Product | null;
  sku: string;
  location: { section: number | null; gondola: string | null; label: string | null };
}

export default function StockRequestsPage() {
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'fulfilled' | 'all'>('pending');

  // Stock editing state: requestId -> { value, saving }
  const [stockEdits, setStockEdits] = useState<Record<string, { value: string; saving: boolean }>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      const res = await databases.listDocuments(databaseId, STOCK_REQUESTS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]);
      const raw = res.documents as unknown as StockRequest[];

      // Fetch all unique product IDs in one batched call
      const uniqueIds = [...new Set(raw.map(r => r.productId))];
      const productMap = new Map<string, Product>();

      // Fetch products in batches of 25
      for (let i = 0; i < uniqueIds.length; i += 25) {
        const batch = uniqueIds.slice(i, i + 25);
        try {
          const pRes = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
            Query.equal('$id', batch),
            Query.limit(25),
          ]);
          (pRes.documents as unknown as Product[]).forEach(p => productMap.set(p.$id, p));
        } catch { /* product not found - ok */ }
      }

      const enriched: EnrichedRequest[] = raw.map(r => {
        const p = productMap.get(r.productId) || null;
        const sku = p
          ? getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id, p.sku)
          : '';
        const location = p
          ? getWarehouseLocationFromFeatures(p.FEATURES, p.section ?? null)
          : { section: null, gondola: null, label: null };
        return { ...r, product: p, sku, location };
      });

      setRequests(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkFulfilled = async (req: EnrichedRequest) => {
    if (!confirm(`¿Marcar la solicitud de "${req.productName}" como completada? Se notificará al cliente.`)) return;
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
        userId: req.userId,
        title: '✅ ¡Stock añadido!',
        message: `Buenas noticias, hemos añadido el stock que solicitaste para "${req.productName}". ¡Ya puedes realizar tu compra!`,
        type: 'success',
        isRead: false,
      });
      await databases.updateDocument(databaseId, STOCK_REQUESTS_COLLECTION_ID, req.$id, { status: 'fulfilled' });
      setRequests(prev => prev.map(r => r.$id === req.$id ? { ...r, status: 'fulfilled' } : r));
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveStock = async (req: EnrichedRequest) => {
    if (!req.product) return;
    const edit = stockEdits[req.$id];
    if (!edit) return;
    const newStock = parseInt(edit.value, 10);
    if (isNaN(newStock) || newStock < 0) { alert('Stock inválido'); return; }

    setStockEdits(prev => ({ ...prev, [req.$id]: { ...prev[req.$id], saving: true } }));
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, req.product.$id, { STOCK: newStock });
      setRequests(prev => prev.map(r =>
        r.$id === req.$id ? { ...r, product: r.product ? { ...r.product, STOCK: newStock } : null } : r
      ));
      setStockEdits(prev => { const n = { ...prev }; delete n[req.$id]; return n; });
    } catch (e: any) {
      alert('Error al guardar stock: ' + e.message);
      setStockEdits(prev => ({ ...prev, [req.$id]: { ...prev[req.$id], saving: false } }));
    }
  };

  const filtered = requests.filter(r => tab === 'all' ? true : r.status === tab);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (isLoading) return (
    <div className="admin-main-content flex justify-center items-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw size={32} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-500">Cargando solicitudes...</p>
      </div>
    </div>
  );

  if (error) {
    const isMissingCollection = error.includes('could not be found');
    return (
      <div className="admin-main-content p-6 max-w-2xl">
        <div className={`border rounded-xl p-6 ${isMissingCollection ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className={isMissingCollection ? 'text-amber-500 mt-0.5 shrink-0' : 'text-red-500 mt-0.5 shrink-0'} />
            <div>
              {isMissingCollection ? (
                <>
                  <h2 className="font-bold text-amber-900 text-base mb-2">Colección &apos;stock_requests&apos; no encontrada</h2>
                  <p className="text-amber-800 text-sm">Debes crear esta colección en Appwrite con los atributos requeridos.</p>
                  <button onClick={load} className="mt-3 text-sm text-amber-700 underline">Reintentar</button>
                </>
              ) : (
                <span className="text-red-800 text-sm">{error}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-main-content p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Solicitudes de Stock
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Clientes esperando reposición de productos agotados.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm self-start md:self-auto">
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'pending', label: 'Pendientes', badge: pendingCount },
          { key: 'fulfilled', label: 'Completadas' },
          { key: 'all', label: 'Todas' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {'badge' in t && t.badge! > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <Package size={48} className="text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {tab === 'pending' ? 'Sin solicitudes pendientes' : 'No hay solicitudes'}
          </h3>
          <p className="text-gray-500 text-sm max-w-sm">
            {tab === 'pending' ? '¡Todo al día! No hay clientes esperando reposición.' : 'No se encontraron solicitudes.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(req => {
            const p = req.product;
            const edit = stockEdits[req.$id];
            const currentStock = p?.STOCK ?? null;
            const isFulfilled = req.status === 'fulfilled';

            return (
              <div
                key={req.$id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                  isFulfilled ? 'border-green-100 opacity-75' : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-0">
                  {/* Product image */}
                  <div className="relative w-full sm:w-28 h-28 sm:h-auto shrink-0 bg-gray-50 flex items-center justify-center">
                    {p?.IMAGEURL ? (
                      <img
                        src={p.IMAGEURL}
                        alt={p.NAME}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={32} className="text-gray-300" />
                    )}
                    {/* Status overlay badge */}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFulfilled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isFulfilled ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col gap-3">
                    {/* Row 1: Product info */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{req.productName}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {req.sku && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              <Hash size={10} /> {req.sku}
                            </span>
                          )}
                          {req.location.label && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                              <MapPin size={10} /> {req.location.label}
                            </span>
                          )}
                          {req.location.gondola && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md font-medium">
                              Gónd: {req.location.gondola} · Sec: {req.location.section}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <span className="text-[11px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <Calendar size={11} />
                        {new Date(req.$createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Row 2: Customer + stock info + actions */}
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex flex-wrap gap-3 items-center">
                        {/* Customer */}
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                          <User size={12} className="text-gray-400" />
                          {req.userEmail || req.userId}
                        </span>

                        {/* Requested qty */}
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-lg">
                          <BoxesIcon size={12} />
                          Solicita: {req.requestedQuantity}
                        </span>

                        {/* Current stock */}
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-lg border ${
                          currentStock === null
                            ? 'bg-gray-50 text-gray-400 border-gray-200'
                            : currentStock === 0
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          Stock actual: {currentStock ?? '—'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Inline stock editor */}
                        {p && !isFulfilled && (
                          edit ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={edit.value}
                                onChange={e => setStockEdits(prev => ({ ...prev, [req.$id]: { ...prev[req.$id], value: e.target.value } }))}
                                className="w-20 px-2 py-1.5 border border-indigo-300 rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={edit.saving}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveStock(req); if (e.key === 'Escape') setStockEdits(prev => { const n = { ...prev }; delete n[req.$id]; return n; }); }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveStock(req)}
                                disabled={edit.saving}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                                title="Guardar stock"
                              >
                                {edit.saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                              </button>
                              <button
                                onClick={() => setStockEdits(prev => { const n = { ...prev }; delete n[req.$id]; return n; })}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                                title="Cancelar"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setStockEdits(prev => ({ ...prev, [req.$id]: { value: String(p.STOCK ?? 0), saving: false } }))}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg transition"
                              title="Editar stock"
                            >
                              <Pencil size={12} /> Poner stock
                            </button>
                          )
                        )}

                        {/* Mark fulfilled */}
                        {!isFulfilled && (
                          <button
                            onClick={() => handleMarkFulfilled(req)}
                            disabled={processingId === req.$id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 shadow-sm"
                          >
                            {processingId === req.$id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle size={13} />
                            )}
                            Notificar cliente
                          </button>
                        )}

                        {isFulfilled && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                            <CheckCircle size={12} /> Completado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
