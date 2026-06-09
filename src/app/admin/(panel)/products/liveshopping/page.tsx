'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product } from '@/types/admin';
import { RefreshCw, AlertTriangle, Package, Pencil, Check, Trash2, Sparkles, ShoppingBag, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { getSkuFromFeatures } from '@/lib/product-features';

export default function LiveShoppingAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStock, setEditingStock] = useState<{ id: string; value: string } | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Helper to compute local 7am threshold
  const getLiveShoppingThreshold = (): Date => {
    const now = new Date();
    const today7Am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0);
    if (now.getTime() >= today7Am.getTime()) {
      return today7Am;
    } else {
      const yesterday7Am = new Date(today7Am);
      yesterday7Am.setDate(yesterday7Am.getDate() - 1);
      return yesterday7Am;
    }
  };

  const getLiveStatus = (p: Product, thresholdTime: number) => {
    if (!p.imported_at) return null;
    const createdTime = p.$createdAt ? new Date(p.$createdAt).getTime() : 0;
    if (createdTime >= thresholdTime) {
      return 'new';
    } else {
      return 'existing';
    }
  };

  const loadLiveProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const threshold = getLiveShoppingThreshold();

      // Retrieve all products modified/imported for today's Live Shopping
      const resp = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
        Query.greaterThanEqual('imported_at', threshold.toISOString()),
        Query.limit(200)
      ]);

      const docs = resp.documents as unknown as Product[];
      
      // Sort by imported_at descending
      const sorted = docs.sort((a, b) => {
        const timeA = a.imported_at ? new Date(a.imported_at).getTime() : 0;
        const timeB = b.imported_at ? new Date(b.imported_at).getTime() : 0;
        return timeB - timeA;
      });

      setProducts(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveStock = async (productId: string) => {
    if (!editingStock || editingStock.id !== productId) return;
    const newStock = parseInt(editingStock.value, 10);
    if (isNaN(newStock) || newStock < 0) {
      setEditingStock(null);
      return;
    }
    setSavingStockId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, { STOCK: newStock });
      setProducts(prev => prev.map(p => p.$id === productId ? { ...p, STOCK: newStock } : p));
      setEditingStock(null);
    } catch (e: any) {
      alert('Error al actualizar stock: ' + e.message);
    } finally {
      setSavingStockId(null);
    }
  };

  const removeFromLive = async (productId: string) => {
    if (!confirm('¿Seguro que deseas quitar este producto de la transmisión de Live Shopping de hoy?')) {
      return;
    }
    setRemovingId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      // Setting imported_at to null (or empty string/older date) removes it from the feed
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, { 
        imported_at: '1970-01-01T00:00:00.000Z' 
      });
      setProducts(prev => prev.filter(p => p.$id !== productId));
    } catch (e: any) {
      alert('Error al quitar de Live: ' + e.message);
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    loadLiveProducts();
  }, [loadLiveProducts]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  const thresholdTime = getLiveShoppingThreshold().getTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-pink-50 to-rose-50/30 p-6 rounded-2xl border border-pink-100/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 bg-rose-500 rounded-xl shadow-lg shadow-rose-200">
            <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-75"></span>
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Shopping de Hoy 🛍️</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Productos en transmisión en vivo (Añadidos/Actualizados hoy después de las 7:00 AM)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/bulk-add"
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold hover:bg-pink-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar más productos
          </Link>
          <button
            onClick={loadLiveProducts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-150 rounded-xl p-4 flex flex-wrap gap-6 items-center text-xs shadow-sm">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          Estados en el Live:
        </span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-pink-50 border border-pink-200 border-l-4 border-l-pink-400 block shrink-0" />
          <span className="text-gray-600 font-medium">Nuevos agregados hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-amber-50 border border-amber-250 border-l-4 border-l-amber-400 block shrink-0" />
          <span className="text-gray-600 font-medium">Ya existían, reactivados hoy</span>
        </div>
        <span className="text-gray-400 ml-auto">
          Total en vivo: <span className="font-bold text-gray-900">{products.length}</span> producto(s)
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Table block */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500 font-semibold text-xs uppercase">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Hora de carga</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                      <p className="font-medium">No hay productos en el Live de hoy todavía</p>
                      <p className="text-xs">Usa la opción "Agregar Masivamente" para subir tus productos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const liveStatus = getLiveStatus(p, thresholdTime);
                  const pSku = getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id, p.sku) || p.$id;
                  
                  let rowBgClass = '';
                  if (liveStatus === 'new') {
                    rowBgClass = 'bg-pink-50/50 hover:bg-pink-100/50 border-l-4 border-l-pink-400';
                  } else if (liveStatus === 'existing') {
                    rowBgClass = 'bg-amber-50/50 hover:bg-amber-100/50 border-l-4 border-l-amber-400';
                  }

                  return (
                    <tr key={p.$id} className={`transition-colors ${rowBgClass}`}>
                      {/* Product details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.IMAGEURL ? (
                              <img src={p.IMAGEURL} alt={p.NAME} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 truncate max-w-[280px]">{p.NAME}</p>
                              {liveStatus === 'new' && (
                                <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-500 text-white animate-pulse">
                                  Nuevo
                                </span>
                              )}
                              {liveStatus === 'existing' && (
                                <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                  Ya estaba
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span className="font-mono font-medium">SKU: {pSku}</span>
                              {p.PACKQTY && p.PACKQTY > 1 ? (
                                <>
                                  <span>•</span>
                                  <span className="text-pink-600 font-semibold">{p.PACKQTY} un/pack</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock inline editing */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {editingStock?.id === p.$id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={editingStock.value}
                                onChange={e => setEditingStock({ id: p.$id, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveStock(p.$id);
                                  if (e.key === 'Escape') setEditingStock(null);
                                }}
                                autoFocus
                                className="w-16 px-2.5 py-1 text-center border border-pink-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                              />
                              <button
                                onClick={() => saveStock(p.$id)}
                                disabled={savingStockId === p.$id}
                                className="p-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition disabled:opacity-60 flex items-center justify-center"
                              >
                                {savingStockId === p.$id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingStock({ id: p.$id, value: String(p.STOCK ?? 0) })}
                              className={`text-base font-bold px-3 py-1 rounded-full border border-dashed transition-all hover:bg-gray-50 ${
                                p.STOCK === 0
                                  ? 'text-red-600 bg-red-50 border-red-200'
                                  : p.STOCK <= 5
                                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                                  : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                              }`}
                              title="Haz click para cambiar el stock rápidamente"
                            >
                              {p.STOCK ?? 0}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Prices */}
                      <td className="px-6 py-4 text-right">
                        {p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE ? (
                          <div>
                            <span className="font-semibold text-rose-600">{fmt(p.CURRENTPRICE)}</span>
                            <span className="text-xs text-gray-400 line-through ml-1.5">{fmt(p.PRICE)}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">{fmt(p.PRICE)}</span>
                        )}
                        {p.WHOLESALEPRICE ? (
                          <p className="text-[10px] text-violet-500 font-semibold mt-0.5">
                            Pack: {fmt(p.WHOLESALEPRICE)}
                          </p>
                        ) : null}
                      </td>

                      {/* Imported Time */}
                      <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">
                        {p.imported_at ? (
                          new Date(p.imported_at).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/products?search=${pSku}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Ir a editar detalles en el catálogo general"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => removeFromLive(p.$id)}
                            disabled={removingId === p.$id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                            title="Quitar de este Live (El producto permanece en catálogo)"
                          >
                            {removingId === p.$id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
