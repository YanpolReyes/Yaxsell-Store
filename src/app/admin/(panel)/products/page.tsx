'use client';

import { useEffect, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, CATEGORIES_COLLECTION_ID, STOCK_ALERTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product, Category } from '@/types/admin';
import { Plus, Search, Pencil, Trash2, AlertTriangle, X, Package, RefreshCw, ChevronDown, ChevronUp, Download, Copy, Percent, Star, Boxes, Sparkles, OctagonX, MapPin } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { generateProductTitle, generateProductDescription } from '@/lib/aiAdmin';
import { getBarcodeFromFeatures, getSkuFromFeatures, setBarcodeInFeatures, setSkuInFeatures } from '@/lib/product-features';

type ProductModalData = Partial<Product> & { _barcode?: string; _sku?: string };

const PRODUCTS_BUCKET_ID = '67f41e05000d0adb6f12';

const EMPTY: Partial<Product> = { NAME: '', DESCRIPTION: '', PRICE: 0, STOCK: 0, COST: 0, WHOLESALEPRICE: 0, WHOLESALEMINQUANTITY: 0, IMAGEURL: '', IMAGEURL2: '', IMAGEURL3: '', IMAGEURL4: '', IMAGEURL5: '', CATEGORYID: '' };

const FieldInput = ({ label, field, type = 'text', value, onChange }: { label: string; field: string; type?: string; value: any; onChange: (val: any) => void }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} value={value ?? ''}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
  </div>
);

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'low' | 'out'>('instock');
  const [noImageOnly, setNoImageOnly] = useState(false);
  const [sort, setSort] = useState<{ key: 'NAME' | 'PRICE' | 'STOCK' | 'SOLDQUANTITY' | 'MARGIN' | 'CREATED'; dir: 'asc' | 'desc' }>({ key: 'CREATED', dir: 'desc' });
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; data: ProductModalData } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [priceModal, setPriceModal] = useState(false);
  const [priceAdj, setPriceAdj] = useState<{ type: 'percent' | 'fixed'; value: string }>({ type: 'percent', value: '' });
  const [applyingPrice, setApplyingPrice] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [stockAdj, setStockAdj] = useState<{ type: 'add' | 'set'; value: string }>({ type: 'add', value: '' });
  const [applyingStock, setApplyingStock] = useState(false);
  const [aiLoading, setAiLoading] = useState<'title' | 'desc' | null>(null);
  const [aiTitles, setAiTitles] = useState<string[]>([]);

  const applyBulkStock = async () => {
    const v = parseInt(stockAdj.value, 10);
    if (isNaN(v)) { alert('Ingresa un valor válido'); return; }
    if (stockAdj.type === 'set' && v < 0) { alert('El stock no puede ser negativo'); return; }
    if (!confirm(`¿Aplicar ajuste de stock a ${filtered.length} producto(s)?`)) return;
    setApplyingStock(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(filtered.map(p => {
        const newStock = stockAdj.type === 'set' ? v : Math.max(0, (p.STOCK ?? 0) + v);
        return databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, p.$id, { STOCK: newStock });
      }));
      setProducts(prev => prev.map(p => {
        if (!filtered.find(f => f.$id === p.$id)) return p;
        const newStock = stockAdj.type === 'set' ? v : Math.max(0, (p.STOCK ?? 0) + v);
        return { ...p, STOCK: newStock };
      }));
      setStockModal(false);
      setStockAdj({ type: 'add', value: '' });
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setApplyingStock(false); }
  };

  const applyBulkPrice = async () => {
    const v = parseFloat(priceAdj.value);
    if (isNaN(v) || v === 0) { alert('Ingresa un valor válido'); return; }
    if (!confirm(`¿Aplicar ajuste de precio a ${filtered.length} producto(s)?`)) return;
    setApplyingPrice(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await Promise.all(filtered.map(p => {
        const newPrice = priceAdj.type === 'percent'
          ? Math.round(p.PRICE * (1 + v / 100))
          : Math.round(p.PRICE + v);
        return databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, p.$id, { PRICE: Math.max(0, newPrice) });
      }));
      setProducts(prev => prev.map(p => {
        if (!filtered.find(f => f.$id === p.$id)) return p;
        const newPrice = priceAdj.type === 'percent'
          ? Math.round(p.PRICE * (1 + v / 100))
          : Math.round(p.PRICE + v);
        return { ...p, PRICE: Math.max(0, newPrice) };
      }));
      setPriceModal(false);
      setPriceAdj({ type: 'percent', value: '' });
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setApplyingPrice(false); }
  };

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      // Carga todos los productos con paginación eficiente
      const allProducts: Product[] = [];
      let cursor: string | undefined;
      while (true) {
        const queries: any[] = [Query.limit(500)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const resp: any = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, queries);
        const docs = resp.documents as unknown as Product[];
        if (!docs.length) break;
        allProducts.push(...docs);
        if (docs.length < 500) break;
        cursor = docs[docs.length - 1].$id;
      }
      allProducts.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
      const cr = await databases.listDocuments(databaseId, CATEGORIES_COLLECTION_ID, [Query.limit(100)]);
      setProducts(allProducts);
      setCategories(cr.documents as unknown as Category[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => setModal({ mode: 'add', data: { ...EMPTY, _barcode: '', _sku: '' } });
  const openEdit = (p: Product) => setModal({
    mode: 'edit',
    data: {
      ...p,
      _barcode: getBarcodeFromFeatures(p.FEATURES),
      _sku: getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id),
    },
  });

  const duplicate = async (p: Product) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload = {
        NAME: `${p.NAME} (copia)`, DESCRIPTION: p.DESCRIPTION || '',
        PRICE: p.PRICE, STOCK: 0, COST: p.COST || 0,
        WHOLESALEPRICE: p.WHOLESALEPRICE || 0, WHOLESALEMINQUANTITY: p.WHOLESALEMINQUANTITY || 0,
        IMAGEURL: p.IMAGEURL || '', IMAGEURL2: p.IMAGEURL2 || '',
        IMAGEURL3: p.IMAGEURL3 || '', IMAGEURL4: p.IMAGEURL4 || '',
        IMAGEURL5: p.IMAGEURL5 || '', CATEGORYID: p.CATEGORYID || '',
        TAGS: p.TAGS || '', FEATURES: p.FEATURES || '',
      };
      const doc = await databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
      setProducts(prev => [doc as unknown as Product, ...prev]);
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const save = async () => {
    if (!modal) return;
    const d = modal.data;
    if (!d.NAME?.trim()) { alert('El nombre es requerido'); return; }
    setIsSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: Record<string, any> = {
        NAME: d.NAME, DESCRIPTION: d.DESCRIPTION || '',
        PRICE: Number(d.PRICE) || 0, STOCK: Number(d.STOCK) || 0,
        COST: Number(d.COST) || 0,
        CURRENTPRICE: d.CURRENTPRICE ? Number(d.CURRENTPRICE) : null,
        WHOLESALEPRICE: Number(d.WHOLESALEPRICE) || 0,
        WHOLESALEMINQUANTITY: Number(d.WHOLESALEMINQUANTITY) || 0,
        IMAGEURL: d.IMAGEURL || '', IMAGEURL2: d.IMAGEURL2 || '',
        IMAGEURL3: d.IMAGEURL3 || '', IMAGEURL4: d.IMAGEURL4 || '',
        IMAGEURL5: d.IMAGEURL5 || '', CATEGORYID: d.CATEGORYID || '',
        TAGS: d.TAGS || '',
        FEATURES: (() => {
          let features = d.FEATURES || '';
          features = setSkuInFeatures(features, d._sku || '');
          features = setBarcodeInFeatures(features, d._barcode || '');
          return features;
        })(),
      };
      
      // Check if stock is being restocked (from 0 to >0) on edit
      let stockRestocked = false;
      const previousProduct = modal.mode === 'edit' ? products.find(p => p.$id === (d as Product).$id) : null;
      if (previousProduct && (previousProduct.STOCK ?? 0) === 0 && payload.STOCK > 0) {
        stockRestocked = true;
      }
      
      if (modal.mode === 'add') {
        const nameLower = (payload.NAME || '').toLowerCase().trim();
        const duplicate = products.find(p => p.NAME?.toLowerCase().trim() === nameLower);
        if (duplicate && !window.confirm(`Ya existe un producto con el nombre "${duplicate.NAME}". ¿Continuar de todas formas?`)) { setIsSaving(false); return; }
        const doc = await databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
        setProducts(prev => [doc as unknown as Product, ...prev]);
      } else {
        const doc = await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, (d as Product).$id, payload);
        setProducts(prev => prev.map(p => p.$id === (d as Product).$id ? doc as unknown as Product : p));
      }
      
      // Send stock alerts if product was restocked
      if (stockRestocked && (d as Product).$id) {
        try {
          const alertsRes = await databases.listDocuments(databaseId, STOCK_ALERTS_COLLECTION_ID, [
            Query.equal('PRODUCTID', (d as Product).$id),
            Query.equal('NOTIFIED', false),
          ]);
          
          for (const alert of alertsRes.documents) {
            // Create notification for the user
            await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
              USERID: alert.EMAIL,
              TYPE: 'stock',
              TITLE: '¡Stock disponible!',
              MESSAGE: `El producto "${d.NAME}" ya tiene stock disponible. ¡Compra ahora!`,
              LINK: `/productos/${(d as Product).$id}`,
              READ: false,
              CREATEDAT: Date.now(),
            });
            
            // Mark alert as notified
            await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, alert.$id, { NOTIFIED: true });
          }
          
          if (alertsRes.documents.length > 0) {
            console.log(`Se notificó a ${alertsRes.documents.length} usuarios sobre stock de "${d.NAME}"`);
          }
        } catch (alertErr) {
          console.error('Error sending stock alerts:', alertErr);
        }
      }
      
      setModal(null);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSaving(false); }
  };

  
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const deleteAll = async () => {
    if (!confirm(`⚠️ ¿Eliminar TODOS los ${products.length} productos? Esta acción no se puede deshacer.`)) return;
    const confirmText = window.prompt(`Escribe ELIMINAR para confirmar:`);
    if (confirmText !== 'ELIMINAR') { alert('Cancelado.'); return; }
    setIsDeletingAll(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      let deleted = 0;
      for (const p of products) {
        await databases.deleteDocument(databaseId, PRODUCTS_COLLECTION_ID, p.$id);
        deleted++;
      }
      setProducts([]);
      alert(`✅ ${deleted} productos eliminados.`);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsDeletingAll(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Realmente deseas eliminar este producto? Esta acción no se puede deshacer.')) return;
    setDeleteId(id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      console.log('Intentando eliminar producto:', id, 'en BD:', databaseId);
      
      await databases.deleteDocument(databaseId, PRODUCTS_COLLECTION_ID, id);
      setProducts(prev => prev.filter(p => p.$id !== id));
      
      // Opcional: mostrar un toast o alert de éxito silencioso
      console.log('Producto eliminado con éxito');
    } catch (e: any) {
      console.error('Error al eliminar producto:', e);
      alert('Error al eliminar: ' + (e.response?.message || e.message || 'Error desconocido de Appwrite'));
    } finally {
      setDeleteId(null);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
  const catName = (id?: string) => categories.find(c => c.$id === id)?.name || '—';

  const exportCSV = () => {
    const headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Categoría', 'Costo', 'Margen %', 'Precio Mayorista', 'Mín. Mayorista', 'Vendidos', 'Destacado', 'URL Imagen'];
    const rows = filtered.map(p => [
      p.$id, p.NAME || '', p.DESCRIPTION || '',
      p.PRICE, p.STOCK ?? 0, catName(p.CATEGORYID),
      p.COST || 0,
      p.COST && p.PRICE ? Math.round(((p.PRICE - p.COST) / p.PRICE) * 100) : '',
      p.WHOLESALEPRICE || 0, p.WHOLESALEMINQUANTITY || 0,
      p.SOLDQUANTITY || 0, p.IMAGEURL || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `productos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const getSku = (p: Product) =>
    getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id) || p.$id;

  const getBarcode = (p: Product) => getBarcodeFromFeatures(p.FEATURES);

  const getSection = (p: Product): { section: number; gondola: string } | null => {
    const m = p.FEATURES?.match(/Section:\s*(\d+)/i);
    if (!m) return null;
    const sec = parseInt(m[1], 10);
    let gon = '?';
    if (sec >= 1 && sec <= 9) gon = 'A';
    else if (sec >= 10 && sec <= 18) gon = 'B';
    else if (sec >= 19 && sec <= 27) gon = 'C';
    else if (sec >= 28 && sec <= 36) gon = 'D';
    return { section: sec, gondola: gon };
  };

  const exportXLSX = () => {
    const data = filtered.map(p => ({
      SKU: getSku(p), 'Código de barras': getBarcode(p) || '', ID: p.$id, Nombre: p.NAME || '', Descripción: p.DESCRIPTION || '',
      Precio: p.PRICE, Stock: p.STOCK ?? 0, Categoría: catName(p.CATEGORYID),
      Costo: p.COST || 0,
      'Margen %': p.COST && p.PRICE ? Math.round(((p.PRICE - p.COST) / p.PRICE) * 100) : '',
      'Precio Mayorista': p.WHOLESALEPRICE || 0,
      'Mín. Mayorista': p.WHOLESALEMINQUANTITY || 0,
      Vendidos: p.SOLDQUANTITY || 0,
      'URL Imagen': p.IMAGEURL || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `productos_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleSort = (key: typeof sort.key) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      p.NAME?.toLowerCase().includes(q) ||
      p.DESCRIPTION?.toLowerCase().includes(q) ||
      p.TAGS?.toLowerCase().includes(q) ||
      getSku(p).toLowerCase().includes(q) ||
      getBarcode(p).toLowerCase().includes(q) ||
      p.FEATURES?.toLowerCase().includes(q)
    );
    const matchCat = !catFilter || p.CATEGORYID === catFilter;
    const matchStock = stockFilter === 'all' ? true
      : stockFilter === 'instock' ? (p.STOCK ?? 0) > 0
      : stockFilter === 'out' ? (p.STOCK ?? 0) === 0
      : (p.STOCK ?? 0) > 0 && (p.STOCK ?? 0) <= 10;
    const matchNoImage = !noImageOnly || !p.IMAGEURL;
    return matchSearch && matchCat && matchStock && matchNoImage;
  }).sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sort.key === 'MARGIN') {
      av = (a.COST && a.PRICE) ? ((a.PRICE - a.COST) / a.PRICE) : -1;
      bv = (b.COST && b.PRICE) ? ((b.PRICE - b.COST) / b.PRICE) : -1;
    } else if (sort.key === 'CREATED') {
      av = new Date(a.$createdAt).getTime();
      bv = new Date(b.$createdAt).getTime();
    } else {
      av = a[sort.key] ?? 0; bv = b[sort.key] ?? 0;
    }
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">{filtered.length} de {products.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStockModal(true)} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50" title="Ajuste masivo de stock">
            <Boxes className="w-4 h-4" />
          </button>
          <button onClick={() => setPriceModal(true)} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50" title="Ajuste masivo de precios">
            <Percent className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
            <Download className="w-4 h-4" />CSV
          </button>
          <button onClick={exportXLSX} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition disabled:opacity-50">
            <Download className="w-4 h-4" />XLSX
          </button>
          <button onClick={load} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={deleteAll} disabled={isDeletingAll || products.length === 0}
            title="Borrar todos los productos"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition disabled:opacity-50">
            <OctagonX className={`w-4 h-4 ${isDeletingAll ? 'animate-spin' : ''}`} />
            {isDeletingAll ? 'Borrando...' : 'Borrar todo'}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Stock quick filter */}
      <div className="flex gap-2 flex-wrap">
        {([['all','Todos'], ['instock','En stock'], ['low','Stock bajo'], ['out','Agotados']] as const).map(([k, label]) => {
          const cnt = k === 'all' ? products.length : k === 'instock' ? products.filter(p => (p.STOCK ?? 0) > 0).length : k === 'low' ? products.filter(p => (p.STOCK ?? 0) > 0 && (p.STOCK ?? 0) <= 10).length : products.filter(p => (p.STOCK ?? 0) === 0).length;
          return (
            <button key={k} onClick={() => setStockFilter(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                stockFilter === k ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
              {cnt > 0 && k !== 'all' && <span className={`text-[10px] font-bold px-1 rounded-full ${stockFilter === k ? 'bg-white/20 text-white' : k === 'out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{cnt}</span>}
            </button>
          );
        })}
                <button onClick={() => setNoImageOnly(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            noImageOnly ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}>
          Sin imagen
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        <div className="relative">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCatFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${!catFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Todas
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.CATEGORYID === c.$id).length;
            if (count === 0) return null;
            return (
              <button key={c.$id} onClick={() => setCatFilter(catFilter === c.$id ? '' : c.$id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${catFilter === c.$id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {c.name}
                <span className={`text-xs ${catFilter === c.$id ? 'text-indigo-200' : 'text-gray-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Cód. barras</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => toggleSort('PRICE')}>Precio {sort.key === 'PRICE' ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <></>}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer" onClick={() => toggleSort('STOCK')}>Stock {sort.key === 'STOCK' ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <></>}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell cursor-pointer" onClick={() => toggleSort('SOLDQUANTITY')}>Vendidos {sort.key === 'SOLDQUANTITY' ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <></>}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell cursor-pointer" onClick={() => toggleSort('MARGIN')}>Margen {sort.key === 'MARGIN' ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <></>}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No se encontraron productos</td></tr>
              ) : filtered.map(p => (
                <tr key={p.$id} className={`hover:bg-gray-50 transition-colors ${(p.STOCK ?? 0) === 0 ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden">
                          {p.IMAGEURL ? <img src={p.IMAGEURL} alt={p.NAME} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />}
                        </div>
                        {(() => { const cnt = [p.IMAGEURL, p.IMAGEURL2, p.IMAGEURL3, (p as any).IMAGEURL4, (p as any).IMAGEURL5].filter(Boolean).length; return cnt > 1 ? <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{cnt}</span> : null; })()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-gray-900 truncate max-w-[170px]">{p.NAME}</p>
                        </div>
                        {p.TAGS && <div className="flex flex-wrap gap-1 mt-0.5">{p.TAGS.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map(t => <button key={t} onClick={e => { e.stopPropagation(); setSearch(t); }} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition cursor-pointer">{t}</button>)}</div>}
                        {p.WHOLESALEPRICE ? <p className="text-xs text-violet-600">Mayor: {fmt(p.WHOLESALEPRICE)} × {p.WHOLESALEMINQUANTITY}</p> : null}
                        {!p.IMAGEURL && <p className="text-[10px] text-amber-500 font-medium">sin imagen</p>}
                        {getSku(p) && getSku(p) !== p.$id && (
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {getSku(p)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {getBarcode(p) ? (
                      <span className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{getBarcode(p)}</span>
                    ) : (
                      <span className="text-[10px] text-amber-500">sin código</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{catName(p.CATEGORYID)}</td>
                  <td className="px-4 py-3 text-right">
                    {p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE ? (
                      <div>
                        <span className="font-semibold text-red-600">{fmt(p.CURRENTPRICE)}</span>
                        <span className="text-xs text-gray-400 line-through ml-1">{fmt(p.PRICE)}</span>
                        <span className="ml-1 text-xs font-bold text-white bg-red-500 px-1 py-0.5 rounded">
                          -{Math.round((1 - p.CURRENTPRICE / p.PRICE) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-900">{fmt(p.PRICE)}</span>
                    )}
                    {p.COST && p.COST > 0 && p.PRICE > 0 ? (
                      <p className="text-[10px] text-gray-400 mt-0.5 text-right">{Math.round(((p.PRICE - p.COST) / p.PRICE) * 100)}% margen</p>
                    ) : (
                      <p className="text-[10px] text-amber-500 mt-0.5 text-right">sin costo</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.STOCK === 0 ? 'bg-red-100 text-red-700' : p.STOCK <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {p.STOCK}
                      </span>
                      {(() => {
                        const loc = getSection(p);
                        return loc ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600">
                            <MapPin className="w-2.5 h-2.5" />G{loc.gondola} S{loc.section}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{p.SOLDQUANTITY ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => duplicate(p)} className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(p.$id)} disabled={deleteId === p.$id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-50" title="Eliminar">
                        {deleteId === p.$id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <span><span className="font-semibold text-gray-700">{filtered.length}</span> productos</span>
            <span>Stock total: <span className="font-semibold text-gray-700">{filtered.reduce((s, p) => s + (p.STOCK ?? 0), 0).toLocaleString('es-CL')} un.</span></span>
            <span>Valor inventario: <span className="font-semibold text-gray-700">{fmt(filtered.reduce((s, p) => s + (p.STOCK ?? 0) * p.PRICE, 0))}</span></span>
            {filtered.some(p => p.COST) && (
              <span>Valor a costo: <span className="font-semibold text-gray-700">{fmt(filtered.reduce((s, p) => s + (p.STOCK ?? 0) * (p.COST || 0), 0))}</span></span>
            )}
            {(() => { const noCost = filtered.filter(p => !p.COST || p.COST === 0).length; return noCost > 0 ? <span className="text-amber-600 font-medium">{noCost} sin costo</span> : null; })()}
            {(() => { const noImg = filtered.filter(p => !p.IMAGEURL).length; return noImg > 0 ? <span className="text-amber-500 font-medium">{noImg} sin imagen</span> : null; })()}
            {(() => { const withMargin = filtered.filter(p => p.COST && p.COST > 0); if (withMargin.length === 0) return null; const avg = Math.round(withMargin.reduce((s, p) => s + ((p.PRICE - (p.COST || 0)) / p.PRICE) * 100, 0) / withMargin.length); return <span className="ml-auto text-indigo-600 font-semibold">Margen promedio: {avg}%</span>; })()}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.mode === 'add' ? 'Agregar Producto' : 'Editar Producto'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Nombre *</label>
                  <button type="button" disabled={aiLoading === 'title'} onClick={async () => {
                    setAiLoading('title'); setAiTitles([]);
                    try {
                      const catName = categories.find(c => c.$id === modal.data.CATEGORYID)?.name || '';
                      const titles = await generateProductTitle(modal.data.DESCRIPTION || modal.data.NAME || '', catName);
                      setAiTitles(titles);
                    } catch (e: any) { alert(e.message); }
                    finally { setAiLoading(null); }
                  }} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    <Sparkles className="w-3 h-3" /> {aiLoading === 'title' ? 'Generando...' : 'Sugerir con IA'}
                  </button>
                </div>
                <input value={modal.data.NAME || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, NAME: e.target.value } } : m)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {aiTitles.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {aiTitles.map((t, i) => (
                      <button key={i} type="button" onClick={() => { setModal(m => m ? { ...m, data: { ...m.data, NAME: t } } : m); setAiTitles([]); }}
                        className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-colors truncate max-w-full">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Descripción</label>
                  <button type="button" disabled={aiLoading === 'desc'} onClick={async () => {
                    setAiLoading('desc');
                    try {
                      const catName = categories.find(c => c.$id === modal.data.CATEGORYID)?.name || '';
                      const desc = await generateProductDescription(modal.data.NAME || '', catName, modal.data.DESCRIPTION || '');
                      setModal(m => m ? { ...m, data: { ...m.data, DESCRIPTION: desc } } : m);
                    } catch (e: any) { alert(e.message); }
                    finally { setAiLoading(null); }
                  }} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    <Sparkles className="w-3 h-3" /> {aiLoading === 'desc' ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>
                <textarea value={modal.data.DESCRIPTION || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, DESCRIPTION: e.target.value } } : m)}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <FieldInput label="Precio Normal (CLP)" field="PRICE" type="number" value={modal?.data.PRICE} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, PRICE: v } } : m)} />
              <div>
                <FieldInput label="Stock" field="STOCK" type="number" value={modal?.data.STOCK} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, STOCK: v } } : m)} />
                {Number(modal.data.STOCK) === 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> Stock en 0 — este producto aparecerá como agotado
                  </p>
                )}
                {Number(modal.data.STOCK) > 0 && Number(modal.data.STOCK) <= 5 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> Stock muy bajo ({modal.data.STOCK} unidades)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Precio Oferta <span className="text-gray-400">(vacío = sin descuento)</span></label>
                <input type="number" min="0"
                  value={modal.data.CURRENTPRICE ?? ''}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, CURRENTPRICE: e.target.value === '' ? undefined : Number(e.target.value) } } : m)}
                  placeholder="Ej: 8990"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <FieldInput label="Costo" field="COST" type="number" value={modal?.data.COST} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, COST: v } } : m)} />
                {(() => {
                  const price = Number(modal.data.CURRENTPRICE || modal.data.PRICE) || 0;
                  const cost = Number(modal.data.COST) || 0;
                  if (!price || !cost) return null;
                  const margin = Math.round(((price - cost) / price) * 100);
                  const profit = price - cost;
                  return (
                    <p className={`text-xs mt-1 font-medium ${margin >= 40 ? 'text-emerald-600' : margin >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
                      Margen: {margin}% · Ganancia: ${profit.toLocaleString('es-CL')}
                    </p>
                  );
                })()}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                <div className="relative">
                  <select value={modal.data.CATEGORYID || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, CATEGORYID: e.target.value } } : m)}
                    className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.$id} value={c.$id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <FieldInput label="Precio Mayorista" field="WHOLESALEPRICE" type="number" value={modal?.data.WHOLESALEPRICE} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, WHOLESALEPRICE: v } } : m)} />
              <FieldInput label="Cant. Mínima Mayorista" field="WHOLESALEMINQUANTITY" type="number" value={modal?.data.WHOLESALEMINQUANTITY} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, WHOLESALEMINQUANTITY: v } } : m)} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                <input type="text" value={modal.data._sku ?? ''}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, _sku: e.target.value } } : m)}
                  placeholder="Código interno del producto"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código de barras</label>
                <input type="text" value={modal.data._barcode ?? ''}
                  onChange={e => setModal(m => m ? { ...m, data: { ...m.data, _barcode: e.target.value } } : m)}
                  placeholder="EAN / UPC / código escaneado"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="sm:col-span-2">
                <ImageUploadField label="Imagen Principal" bucketId={PRODUCTS_BUCKET_ID}
                  value={modal.data.IMAGEURL || ''}
                  onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL: v } } : m)} />
              </div>
              <ImageUploadField label="Imagen 2" bucketId={PRODUCTS_BUCKET_ID}
                value={modal.data.IMAGEURL2 || ''}
                onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL2: v } } : m)} />
              <ImageUploadField label="Imagen 3" bucketId={PRODUCTS_BUCKET_ID}
                value={modal.data.IMAGEURL3 || ''}
                onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL3: v } } : m)} />
              <ImageUploadField label="Imagen 4" bucketId={PRODUCTS_BUCKET_ID}
                value={modal.data.IMAGEURL4 || ''}
                onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL4: v } } : m)} />
              <ImageUploadField label="Imagen 5" bucketId={PRODUCTS_BUCKET_ID}
                value={modal.data.IMAGEURL5 || ''}
                onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL5: v } } : m)} />
              <div className="sm:col-span-2"><FieldInput label="Tags (separados por coma)" field="TAGS" value={modal?.data.TAGS} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, TAGS: v } } : m)} /></div>
              <div className="sm:col-span-2">
                <FieldInput label="Características (otras)" field="FEATURES" value={modal?.data.FEATURES} onChange={v => setModal(m => m ? { ...m, data: { ...m.data, FEATURES: v } } : m)} />
                <p className="text-[10px] text-gray-400 mt-1">SKU y código de barras se guardan en los campos de arriba.</p>
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

      {/* Bulk price modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Ajuste masivo de precios</p>
                <p className="text-xs text-gray-500 mt-0.5">Se aplica a {filtered.length} producto(s) visible(s)</p>
              </div>
              <button onClick={() => setPriceModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de ajuste</label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {([['percent', '% Porcentaje'], ['fixed', '$ Monto fijo']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setPriceAdj(a => ({ ...a, type: v }))}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${priceAdj.type === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {priceAdj.type === 'percent' ? 'Porcentaje (ej: +10 o -5)' : 'Monto en CLP (ej: +500 o -1000)'}
                </label>
                <input type="number" value={priceAdj.value} onChange={e => setPriceAdj(a => ({ ...a, value: e.target.value }))}
                  placeholder={priceAdj.type === 'percent' ? 'ej: 10' : 'ej: 500'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <p className="text-xs text-gray-400 mt-1">Usa valores negativos para reducir precios</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setPriceModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={applyBulkPrice} disabled={applyingPrice || !priceAdj.value}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                {applyingPrice ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Percent className="w-4 h-4" />}
                {applyingPrice ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk stock modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Ajuste masivo de stock</p>
                <p className="text-xs text-gray-500 mt-0.5">Se aplica a {filtered.length} producto(s) visible(s)</p>
              </div>
              <button onClick={() => setStockModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de ajuste</label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {([['add', '+ Agregar / Restar'], ['set', '= Establecer valor']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setStockAdj(a => ({ ...a, type: v }))}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${stockAdj.type === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {stockAdj.type === 'add' ? 'Cantidad a agregar (negativo para restar)' : 'Stock exacto a establecer'}
                </label>
                <input type="number" value={stockAdj.value} onChange={e => setStockAdj(a => ({ ...a, value: e.target.value }))}
                  placeholder={stockAdj.type === 'add' ? 'ej: 50 o -10' : 'ej: 100'}
                  min={stockAdj.type === 'set' ? 0 : undefined}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {stockAdj.type === 'add' && <p className="text-xs text-gray-400 mt-1">Usa valores negativos para reducir stock</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setStockModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={applyBulkStock} disabled={applyingStock || !stockAdj.value}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                {applyingStock ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Boxes className="w-4 h-4" />}
                {applyingStock ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
