'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, INVENTORY_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product } from '@/types/admin';
import { RefreshCw, AlertTriangle, Package, Search, X, TrendingDown, DollarSign, Download, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';

type StockLevel = 'all' | 'out' | 'critical' | 'low' | 'ok';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<StockLevel>('all');
  const [editingStock, setEditingStock] = useState<{ id: string; value: string } | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [needsRestockOnly, setNeedsRestockOnly] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<{ id: string; value: string } | null>(null);
  const [savingThresholdId, setSavingThresholdId] = useState<string | null>(null);
  const [bulkThresholdModal, setBulkThresholdModal] = useState(false);
  const [bulkThresholdValue, setBulkThresholdValue] = useState('');
  const [applyingBulkThreshold, setApplyingBulkThreshold] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'sold'>('name');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const applyBulkThreshold = async () => {
    const val = bulkThresholdValue === '' ? null : parseInt(bulkThresholdValue, 10);
    if (val !== null && (isNaN(val) || val < 0)) return;
    setApplyingBulkThreshold(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(filtered.map(p =>
        databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, p.$id, { RESTOCKTHRESHOLD: val })
      ));
      setProducts(prev => prev.map(p =>
        filtered.some(f => f.$id === p.$id) ? { ...p, RESTOCKTHRESHOLD: val ?? undefined } : p
      ));
      setBulkThresholdModal(false);
      setBulkThresholdValue('');
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setApplyingBulkThreshold(false); }
  };

  const saveThreshold = async (productId: string) => {
    if (!editingThreshold || editingThreshold.id !== productId) return;
    const val = editingThreshold.value === '' ? null : parseInt(editingThreshold.value, 10);
    if (val !== null && (isNaN(val) || val < 0)) { setEditingThreshold(null); return; }
    setSavingThresholdId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, { RESTOCKTHRESHOLD: val });
      setProducts(prev => prev.map(p => p.$id === productId ? { ...p, RESTOCKTHRESHOLD: val ?? undefined } : p));
      setEditingThreshold(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingThresholdId(null); }
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      // Pagina hasta cargar todos los productos, filtra client-side
      const all: Product[] = [];
      let cursor: string | undefined;
      while (true) {
        const queries = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const resp: any = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, queries);
        const docs = resp.documents as unknown as Product[];
        if (!docs.length) break;
        all.push(...docs);
        if (docs.length < 100) break;
        cursor = (docs[docs.length - 1] as any).$id;
      }
      setProducts(all.filter(p => p.ISACTIVE !== false));
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  const deleteProduct = async (productId: string) => {
    setDeletingId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      // Only delete from inventory_products collection
      await databases.deleteDocument(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, productId);
      
      setProducts(prev => prev.filter(p => p.$id !== productId));
      setDeleteConfirm(null);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const saveStock = async (productId: string) => {
    if (!editingStock || editingStock.id !== productId) return;
    const newStock = parseInt(editingStock.value, 10);
    if (isNaN(newStock) || newStock < 0) { setEditingStock(null); return; }
    setSavingStockId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, { STOCK: newStock });
      setProducts(prev => prev.map(p => p.$id === productId ? { ...p, STOCK: newStock } : p));
      setEditingStock(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSavingStockId(null); }
  };

  useEffect(() => { load(); }, [load]);

  const getLevel = (stock: number): StockLevel => {
    if (stock === 0) return 'out';
    if (stock <= 2) return 'critical';
    if (stock <= 10) return 'low';
    return 'ok';
  };

  const LEVEL_CONFIG: Record<StockLevel, { label: string; bg: string; text: string }> = {
    all:      { label: 'Todos',     bg: 'bg-gray-100',    text: 'text-gray-700' },
    out:      { label: 'Agotado',   bg: 'bg-red-100',     text: 'text-red-700' },
    critical: { label: 'Crítico',   bg: 'bg-orange-100',  text: 'text-orange-700' },
    low:      { label: 'Stock Bajo', bg: 'bg-amber-100',  text: 'text-amber-700' },
    ok:       { label: 'Normal',    bg: 'bg-emerald-100', text: 'text-emerald-700' },
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.NAME?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = level === 'all' || getLevel(p.STOCK ?? 0) === level;
    const matchRestock = !needsRestockOnly || (p.RESTOCKTHRESHOLD !== undefined && (p.STOCK ?? 0) <= p.RESTOCKTHRESHOLD);
    return matchSearch && matchLevel && matchRestock;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.NAME || '').localeCompare(b.NAME || '');
    if (sortBy === 'value') return ((b.STOCK ?? 0) * b.PRICE) - ((a.STOCK ?? 0) * a.PRICE);
    if (sortBy === 'sold') return (b.SOLDQUANTITY ?? 0) - (a.SOLDQUANTITY ?? 0);
    return (a.STOCK ?? 0) - (b.STOCK ?? 0);
  });

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  const stats = {
    out: products.filter(p => (p.STOCK ?? 0) === 0).length,
    critical: products.filter(p => (p.STOCK ?? 0) > 0 && (p.STOCK ?? 0) <= 2).length,
    low: products.filter(p => (p.STOCK ?? 0) > 2 && (p.STOCK ?? 0) <= 10).length,
    ok: products.filter(p => (p.STOCK ?? 0) > 10).length,
    totalUnits: products.reduce((s, p) => s + (p.STOCK ?? 0), 0),
    valueAtPrice: products.reduce((s, p) => s + (p.STOCK ?? 0) * p.PRICE, 0),
    valueAtCost: products.reduce((s, p) => s + (p.STOCK ?? 0) * (p.COST || 0), 0),
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Categoría', 'Stock', 'Vendidos', 'Precio', 'Costo', 'Margen %', 'Valor en Stock', 'Umbral Restock', 'Estado'];
    const rows = filtered.map(p => [
      p.NAME || '', (p as any).CATEGORY || '', p.STOCK ?? 0, p.SOLDQUANTITY ?? 0,
      p.PRICE, p.COST || 0,
      p.COST && p.PRICE ? Math.round(((p.PRICE - p.COST) / p.PRICE) * 100) : '',
      (p.STOCK ?? 0) * p.PRICE,
      p.RESTOCKTHRESHOLD ?? '',
      LEVEL_CONFIG[getLevel(p.STOCK ?? 0)].label,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} de {products.length} productos
            {stats.out > 0 && <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{stats.out} agotados ({Math.round((stats.out / products.length) * 100)}%)</span>}
            {stats.critical > 0 && <span className="ml-1 text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">{stats.critical} críticos</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={() => setBulkThresholdModal(true)} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            Umbral masivo
          </button>
          <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />Actualizar
          </button>
        </div>
      </div>

      {/* Value Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Unidades Totales', value: stats.totalUnits.toLocaleString('es-CL'), icon: Package, color: 'bg-indigo-500' },
          { label: 'Valor a Precio Venta', value: fmt(stats.valueAtPrice), icon: DollarSign, color: 'bg-emerald-500' },
          { label: 'Valor a Costo', value: fmt(stats.valueAtCost), icon: DollarSign, color: 'bg-violet-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'out',      label: 'Agotados',    value: stats.out,      color: 'bg-red-500' },
          { key: 'critical', label: 'Críticos',    value: stats.critical, color: 'bg-orange-500' },
          { key: 'low',      label: 'Stock Bajo',  value: stats.low,      color: 'bg-amber-500' },
          { key: 'ok',       label: 'Normal',      value: stats.ok,       color: 'bg-emerald-500' },
        ].map(s => (
          <button key={s.key} onClick={() => setLevel(level === s.key as StockLevel ? 'all' : s.key as StockLevel)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all shadow-sm hover:shadow-md ${level === s.key ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-gray-100'}`}>
            <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Category breakdown */}
      {!isLoading && products.length > 0 && (() => {
        const catMap: Record<string, { units: number; value: number }> = {};
        for (const p of products) {
          const cat = (p as any).CATEGORY || 'Sin categoría';
          if (!catMap[cat]) catMap[cat] = { units: 0, value: 0 };
          catMap[cat].units += p.STOCK ?? 0;
          catMap[cat].value += (p.STOCK ?? 0) * p.PRICE;
        }
        const cats = Object.entries(catMap).sort((a, b) => b[1].value - a[1].value).slice(0, 6);
        if (cats.length < 2) return null;
        const maxVal = Math.max(...cats.map(c => c[1].value), 1);
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Valor por Categoría</h2>
            <div className="space-y-2">
              {cats.map(([name, data]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-32 truncate shrink-0">{name}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(data.value / maxVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right shrink-0">{fmt(data.value)}</span>
                  <span className="text-xs text-gray-400 w-16 text-right shrink-0">{data.units.toLocaleString('es-CL')} un.</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setNeedsRestockOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              needsRestockOnly ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            ⚠ Necesita restock
          </button>
          {(Object.keys(LEVEL_CONFIG) as StockLevel[]).map(k => (
            <button key={k} onClick={() => setLevel(k)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${level === k ? 'bg-indigo-600 text-white' : `${LEVEL_CONFIG[k].bg} ${LEVEL_CONFIG[k].text} hover:opacity-80`}`}>
              {LEVEL_CONFIG[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {([['stock','Menor stock'],['value','Mayor valor'],['sold','Más vendidos'],['name','Nombre']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition ${sortBy === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Vendidos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Margen</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Restock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No se encontraron productos</td></tr>
              ) : filtered.map(p => {
                const lv = getLevel(p.STOCK ?? 0);
                const cfg = LEVEL_CONFIG[lv];
                              return (
                  <tr key={p.$id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 group cursor-pointer">
                          {p.IMAGEURL ? (
                            <img 
                              src={p.IMAGEURL} 
                              alt={p.NAME} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150 group-hover:z-10 group-hover:shadow-lg"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                          )}
                        </div>
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.NAME}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingStock?.id === p.$id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number" min="0"
                            value={editingStock.value}
                            onChange={e => setEditingStock({ id: p.$id, value: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') saveStock(p.$id); if (e.key === 'Escape') setEditingStock(null); }}
                            autoFocus
                            className="w-16 px-2 py-1 text-center border border-indigo-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button onClick={() => saveStock(p.$id)} disabled={savingStockId === p.$id}
                            className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60">
                            {savingStockId === p.$id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingStock({ id: p.$id, value: String(p.STOCK ?? 0) })}
                          className={`text-base font-bold hover:underline cursor-pointer ${lv === 'out' ? 'text-red-600' : lv === 'critical' ? 'text-orange-600' : lv === 'low' ? 'text-amber-600' : 'text-gray-900'}`}
                          title="Clic para editar stock">
                          {p.STOCK ?? 0}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{p.SOLDQUANTITY ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-gray-900">{fmt(p.PRICE)}</p>
                      <p className="text-xs text-gray-400">{fmt((p.STOCK ?? 0) * p.PRICE)}</p>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      {p.COST && p.COST > 0 && p.PRICE > 0 ? (
                        <span className={`text-sm font-semibold ${
                          ((p.PRICE - p.COST) / p.PRICE) >= 0.4 ? 'text-emerald-600' :
                          ((p.PRICE - p.COST) / p.PRICE) >= 0.2 ? 'text-amber-600' : 'text-red-600'
                        }`}>{Math.round(((p.PRICE - p.COST) / p.PRICE) * 100)}%</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {editingThreshold?.id === p.$id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input type="number" min="0" value={editingThreshold.value}
                            onChange={e => setEditingThreshold({ id: p.$id, value: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') saveThreshold(p.$id); if (e.key === 'Escape') setEditingThreshold(null); }}
                            autoFocus
                            className="w-14 px-2 py-1 text-center border border-amber-400 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
                          <button onClick={() => saveThreshold(p.$id)} disabled={savingThresholdId === p.$id}
                            className="p-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-60">
                            {savingThresholdId === p.$id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingThreshold({ id: p.$id, value: String(p.RESTOCKTHRESHOLD ?? '') })}
                          className={`text-xs font-medium rounded-full px-2.5 py-0.5 cursor-pointer hover:opacity-80 transition ${
                            p.RESTOCKTHRESHOLD && (p.STOCK ?? 0) <= p.RESTOCKTHRESHOLD
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          title="Clic para editar umbral de reabastecimiento">
                          {p.RESTOCKTHRESHOLD ?? '—'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href="/products" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Editar</Link>
                        <button
                          onClick={() => setDeleteConfirm({ id: p.$id, name: p.NAME || 'Producto' })}
                          disabled={deletingId === p.$id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (() => {
          const totalUnits = filtered.reduce((s, p) => s + (p.STOCK ?? 0), 0);
          const totalValue = filtered.reduce((s, p) => s + (p.STOCK ?? 0) * p.PRICE, 0);
          const avgPerUnit = totalUnits > 0 ? Math.round(totalValue / totalUnits) : 0;
          return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span><span className="font-semibold text-gray-700">{filtered.length}</span> productos en vista</span>
              <span>Unidades: <span className="font-semibold text-gray-700">{totalUnits.toLocaleString('es-CL')}</span></span>
              <span>Valor: <span className="font-semibold text-gray-700">{fmt(totalValue)}</span></span>
              {avgPerUnit > 0 && <span>Precio promedio/un: <span className="font-semibold text-indigo-600">{fmt(avgPerUnit)}</span></span>}
              {(() => {
                const totalSold = filtered.reduce((s, p) => s + (p.SOLDQUANTITY ?? 0), 0);
                const withSold = filtered.filter(p => (p.SOLDQUANTITY ?? 0) > 0);
                if (withSold.length === 0) return null;
                return <span className="ml-auto text-violet-600 font-medium">{totalSold.toLocaleString('es-CL')} unidades vendidas (histórico)</span>;
              })()}
            </div>
          );
        })()}
      </div>

      {/* Bulk Threshold Modal */}
      {bulkThresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Umbral de Restock Masivo</h3>
              <button onClick={() => setBulkThresholdModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Aplica el umbral a <span className="font-semibold text-gray-700">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</span> (vista actual).
              Dejar vacío para quitar el umbral.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Umbral (unidades)</label>
              <input
                type="number" min="0" value={bulkThresholdValue}
                onChange={e => setBulkThresholdValue(e.target.value)}
                placeholder="Ej: 5"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkThresholdModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={applyBulkThreshold} disabled={applyingBulkThreshold}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">
                {applyingBulkThreshold ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Eliminar producto</h3>
            </div>
            <p className="text-sm text-gray-600">
              ¿Estás seguro de eliminar <span className="font-semibold text-gray-900">"{deleteConfirm.name}"</span>?
              <br /><br />
              Esta acción eliminará el producto de <strong>Inventory Products</strong>. No se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={() => deleteProduct(deleteConfirm.id)} disabled={deletingId === deleteConfirm.id}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60">
                {deletingId === deleteConfirm.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
