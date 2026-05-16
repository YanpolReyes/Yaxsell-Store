'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, CATEGORIES_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product, Category } from '@/types/admin';
import { Search, Pencil, RefreshCw, Boxes, DollarSign, Package } from 'lucide-react';

export default function WholesaleProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      // Cargar categorías
      const catResp = await databases.listDocuments(databaseId, CATEGORIES_COLLECTION_ID, [Query.limit(100)]);
      setCategories(catResp.documents as unknown as Category[]);
      
      // Cargar solo productos con precio mayorista configurado
      const prodResp = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
        Query.greaterThan('WHOLESALEPRICE', 0)
      ]);
      setProducts(prodResp.documents as unknown as Product[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.NAME.toLowerCase().includes(q) || (p.DESCRIPTION || '').toLowerCase().includes(q);
  }).filter(p => {
    if (!catFilter) return true;
    return p.CATEGORYID === catFilter;
  });

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.$id === catId);
    return cat?.name || 'Sin categoría';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
  };

  const margin = (p: Product) => {
    if (!p.COST || p.COST === 0) return 0;
    const price = p.WHOLESALEPRICE || p.PRICE;
    return Math.round(((price - p.COST) / price) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Productos Mayoristas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''} con precio mayorista configurado
          </p>
        </div>
        <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <span className="text-xs text-gray-500">Total productos mayoristas</span>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.STOCK > 0).length}
          </p>
          <span className="text-xs text-gray-500">Con stock disponible</span>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => (p.STOCK || 0) <= 0).length}
          </p>
          <span className="text-xs text-gray-500">Sin stock</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              ×
            </button>
          )}
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.$id} value={cat.$id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay productos mayoristas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Precio Normal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Precio Mayorista</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Cant. Mínima</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.$id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.IMAGEURL && (
                          <img src={p.IMAGEURL} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.NAME}</p>
                          <p className="text-xs text-gray-500">{p.$id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getCategoryName(p.CATEGORYID || '')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(p.PRICE)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {formatPrice(p.WHOLESALEPRICE || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.WHOLESALEMINQUANTITY || 0}+ unidades</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        (p.STOCK || 0) > 10 ? 'bg-green-100 text-green-700' :
                        (p.STOCK || 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.STOCK || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{margin(p)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
