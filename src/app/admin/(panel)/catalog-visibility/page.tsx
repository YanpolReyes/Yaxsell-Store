'use client';

import { useState, useEffect, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, INVENTORY_PRODUCTS_COLLECTION_ID, CATALOG_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Eye, AlertTriangle, CheckCircle, Search, RefreshCw, Package, EyeOff, ChevronLeft, ChevronRight, Copy, ClipboardPaste } from 'lucide-react';

interface Report {
  totalPasted: number;
  matchedCount: number;
  notFoundSkus: string[];
  toImportCount: number;
  toActivateCount: number;
  toHideCount: number;
}

interface SyncData {
  toImport: any[];
  toActivate: any[];
  toHide: any[];
}

const norm = (s: string) => (s || '').trim().replace(/[\.\-]/g, '').toLowerCase();

const ALLOWED_PRODUCT_KEYS = [
  'NAME', 'DESCRIPTION', 'PRICE', 'CURRENTPRICE', 'COST', 'STOCK',
  'SOLDQUANTITY', 'CATEGORYID', 'SUBCATEGORYID', 'IMAGEURL', 'IMAGEURL2', 'IMAGEURL3',
  'RATING', 'NUMREVIEWS', 'WHOLESALEPRICE', 'WHOLESALEMINQUANTITY', 'ISFEATURED',
  'ISACTIVE', 'PACKQTY', 'RESTOCKTHRESHOLD', 'jumpseller_id', 'section',
  'sku', 'barcode', 'COMING_SOON', 'DATE_ADDED'
];

const executeWithRetry = async (fn: () => Promise<any>, maxRetries = 5, initialDelay = 1500) => {
  let retries = 0;
  let delay = initialDelay;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.code === 429 && retries < maxRetries) {
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        delay *= 2; // Exponential backoff
      } else {
        throw err; // throw if it's not a rate limit or we exceeded retries
      }
    }
  }
};

export default function CatalogVisibilityPage() {
  const [skuText, setSkuText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ total: number, done: number, activated: number, deactivated: number } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [totalCatalogProducts, setTotalCatalogProducts] = useState<number | null>(null);

  // Product listing state
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'visible' | 'hidden' | 'no-image' | 'broken-image'>('all');
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [productPage, setProductPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCT_PAGE_SIZE = 50;
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [imageUrlModal, setImageUrlModal] = useState<{ productId: string; currentUrl: string; newUrl: string; source: string } | null>(null);

  const [allProducts, setAllProducts] = useState<any[]>([]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const all: any[] = [];
      let cursor: string | undefined;
      while (true) {
        const queries: any[] = [Query.limit(500)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        try {
          const res = await databases.listDocuments(databaseId, CATALOG_PRODUCTS_COLLECTION_ID, queries);
          all.push(...res.documents.map((d: any) => ({ ...d, _source: 'catalog_products', ISACTIVE: d.ISACTIVE ?? true })));
          if (res.documents.length < 500) break;
          cursor = res.documents[res.documents.length - 1].$id;
        } catch { break; }
      }
      setAllProducts(all);
    } catch (e) {
      console.error('Error loading products', e);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = allProducts;
    
    if (activeFilter === 'visible') filtered = filtered.filter(p => p.ISACTIVE);
    else if (activeFilter === 'hidden') filtered = filtered.filter(p => !p.ISACTIVE);

    if (productSearch) {
      const s = productSearch.toLowerCase();
      filtered = filtered.filter(p => (p.NAME || '').toLowerCase().includes(s));
    }

    if (activeFilter === 'no-image') {
      filtered = filtered.filter(p => !p.IMAGEURL || p.IMAGEURL.trim() === '' || p.IMAGEURL.trim() === 'null' || p.IMAGEURL.trim() === 'undefined');
    } else if (activeFilter === 'broken-image') {
      filtered = filtered.filter(p => p.IMAGEURL && p.IMAGEURL.trim() !== '' && p.IMAGEURL.trim() !== 'null' && brokenImages.has(p.$id));
    }

    filtered.sort((a, b) => {
      const aActive = a.ISACTIVE ? 0 : 1;
      const bActive = b.ISACTIVE ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.NAME || '').localeCompare(b.NAME || '');
    });

    setTotalProducts(filtered.length);
    setProducts(filtered);
    // Only reset page if it's out of bounds to avoid resetting when new broken images are found on the same page
    setProductPage(prev => Math.min(prev, Math.max(0, Math.ceil(filtered.length / PRODUCT_PAGE_SIZE) - 1)));
  }, [allProducts, activeFilter, productSearch, brokenImages, PRODUCT_PAGE_SIZE]);

  const loadProducts = fetchProducts; // For the refresh button

  const toggleVisibility = async (product: any) => {
    setTogglingId(product.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const collectionId = product._source === 'catalog_products' ? CATALOG_PRODUCTS_COLLECTION_ID : PRODUCTS_COLLECTION_ID;
      const newActive = !product.ISACTIVE;
      await databases.updateDocument(databaseId, collectionId, product.$id, { ISACTIVE: newActive });
      setProducts(prev => prev.map(p => p.$id === product.$id ? { ...p, ISACTIVE: newActive } : p));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [Query.limit(1)]);
        setTotalCatalogProducts(res.total);
      } catch (err) {
        console.error('Error fetching total products', err);
      }
    };
    fetchTotal();
  }, []);

  const handleDownloadInventory = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setProgress({ total: 0, done: 0, activated: 0, deactivated: 0 });

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const allInventory: any[] = [];
      let offsetInv = 0;
      
      while (true) {
        const res = await databases.listDocuments(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, [
          Query.limit(100), Query.offset(offsetInv)
        ]);
        allInventory.push(...res.documents);
        setProgress({ total: res.total, done: allInventory.length, activated: 0, deactivated: 0 });
        if (res.documents.length < 100) break;
        offsetInv += 100;
      }
      
      const header = ['SKU', 'Nombre', 'Precio', 'Stock'].join(',');
      const rows = allInventory.map(p => {
        const sku = `"${(p.sku || p.SKU || '').replace(/"/g, '""')}"`;
        const name = `"${(p.NAME || '').replace(/"/g, '""')}"`;
        const price = p.PRICE || 0;
        const stock = p.STOCK || 0;
        return [sku, name, price, stock].join(',');
      });
      
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventario_bodegapp_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleAnalyze = async () => {
    if (!skuText.trim()) return;
    
    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setProgress(null);
    setReport(null);
    setSyncData(null);
    
    try {
      const skusArray = Array.from(new Set(skuText.split('\n').map(s => s.trim()).filter(Boolean)));
      
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      // 1. Fetch Inventory
      const allInventory: any[] = [];
      let offsetInv = 0;
      while (true) {
        const res = await databases.listDocuments(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, [
          Query.limit(100), Query.offset(offsetInv)
        ]);
        allInventory.push(...res.documents);
        if (res.documents.length < 100) break;
        offsetInv += 100;
      }
      
      // 2. Fetch Catalog (products WITH stock)
      const allCatalog: any[] = [];
      let offsetCat = 0;
      while (true) {
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
          Query.limit(100), Query.offset(offsetCat)
        ]);
        allCatalog.push(...res.documents);
        if (res.documents.length < 100) break;
        offsetCat += 100;
      }

      // 2b. Fetch Catalog Products (products WITHOUT stock = a pedido)
      const allCatalogProducts: any[] = [];
      let offsetCP = 0;
      while (true) {
        try {
          const res = await databases.listDocuments(databaseId, CATALOG_PRODUCTS_COLLECTION_ID, [
            Query.limit(100), Query.offset(offsetCP)
          ]);
          allCatalogProducts.push(...res.documents);
          if (res.documents.length < 100) break;
          offsetCP += 100;
        } catch {
          // catalog_products may not exist yet
          break;
        }
      }

      // 3. Map SKUs
      const invMap = new Map<string, any>();
      allInventory.forEach(d => {
        const s = norm(d.sku || d.SKU);
        if (s) invMap.set(s, d);
      });
      
      const catMap = new Map<string, any>();
      allCatalog.forEach(d => {
        const s = norm(d.sku || d.SKU);
        if (s) catMap.set(s, { ...d, _collection: 'products' });
      });
      allCatalogProducts.forEach(d => {
        const s = norm(d.sku || d.SKU);
        if (s) catMap.set(s, { ...d, _collection: 'catalog_products' });
      });

      // 4. Analyze
      const toImport: any[] = [];
      const toActivate: any[] = [];
      const notFoundSkus: string[] = [];
      const pastedNormSkus = new Set<string>();

      skusArray.forEach(originalSku => {
        const ns = norm(originalSku);
        if (!ns) return;
        pastedNormSkus.add(ns);
        
        if (invMap.has(ns)) {
          if (catMap.has(ns)) {
            toActivate.push(catMap.get(ns));
          } else {
            toImport.push(invMap.get(ns));
          }
        } else {
          notFoundSkus.push(originalSku);
        }
      });
      
      const toHide: any[] = [];
      catMap.forEach((doc, ns) => {
        if (!pastedNormSkus.has(ns)) {
          toHide.push(doc);
        }
      });
      
      setSyncData({ toImport, toActivate, toHide });
      setReport({
        totalPasted: skusArray.length,
        matchedCount: toActivate.length + toImport.length,
        notFoundSkus,
        toActivateCount: toActivate.length,
        toImportCount: toImport.length,
        toHideCount: toHide.length
      });
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!syncData) return;
    
    setIsProcessing(true);
    setError('');
    setSuccess(false);

    const totalOps = syncData.toImport.length + syncData.toActivate.length + syncData.toHide.length;
    setProgress({ total: totalOps, done: 0, activated: 0, deactivated: 0 });

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      
      let done = 0;
      let activated = 0;
      let deactivated = 0;

      // 1. Import
      for (const invDoc of syncData.toImport) {
        const productData: any = { ISACTIVE: true };
        for (const key of ALLOWED_PRODUCT_KEYS) {
          if (invDoc[key] !== undefined && invDoc[key] !== null) {
            productData[key] = invDoc[key];
          }
        }
        await executeWithRetry(() => databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), productData));
        activated++;
        done++;
        setProgress(p => ({ ...p!, done, activated, deactivated }));
        await new Promise(r => setTimeout(r, 100));
      }
      
      // 2. Activate
      for (const catDoc of syncData.toActivate) {
        const collectionId = catDoc._collection === 'catalog_products' ? CATALOG_PRODUCTS_COLLECTION_ID : PRODUCTS_COLLECTION_ID;
        if (catDoc.ISACTIVE !== true) {
          await executeWithRetry(() => databases.updateDocument(databaseId, collectionId, catDoc.$id, { ISACTIVE: true } as any));
        }
        activated++;
        done++;
        setProgress(p => ({ ...p!, done, activated, deactivated }));
        await new Promise(r => setTimeout(r, 100));
      }
      
      // 3. Hide
      for (const catDoc of syncData.toHide) {
        const collectionId = catDoc._collection === 'catalog_products' ? CATALOG_PRODUCTS_COLLECTION_ID : PRODUCTS_COLLECTION_ID;
        if (catDoc.ISACTIVE !== false) {
          await executeWithRetry(() => databases.updateDocument(databaseId, collectionId, catDoc.$id, { ISACTIVE: false } as any));
        }
        deactivated++;
        done++;
        setProgress(p => ({ ...p!, done, activated, deactivated }));
        await new Promise(r => setTimeout(r, 100));
      }

      setSuccess(true);
      // Refresh total count
      setTotalCatalogProducts(prev => (prev || 0) + syncData.toImport.length);
      setSyncData(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowAll = async () => {
    if (!confirm('¿Seguro que quieres hacer TODOS los productos visibles en el catálogo?')) return;
    
    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setProgress({ total: 0, done: 0, activated: 0, deactivated: 0 });

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const allCatalog: any[] = [];
      let offset = 0;
      while (true) {
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
          Query.limit(100), Query.offset(offset)
        ]);
        allCatalog.push(...res.documents);
        if (res.documents.length < 100) break;
        offset += 100;
      }

      const hiddenDocs = allCatalog.filter(d => d.ISACTIVE === false);
      setProgress(p => ({ ...p!, total: hiddenDocs.length }));

      let activated = 0;
      let done = 0;

      for (let i = 0; i < hiddenDocs.length; i++) {
        const doc = hiddenDocs[i];
        await executeWithRetry(() => databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, doc.$id, {
          ISACTIVE: true
        } as any));
        activated++;
        done++;
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (done % 10 === 0 || done === hiddenDocs.length) {
          setProgress(p => ({ ...p!, done, activated, deactivated: 0 }));
        }
      }

      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-main-content" style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Eye size={24} color="#6366f1" /> Control de Visibilidad del Catálogo
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0' }}>
          Pega una lista de SKUs. La herramienta los buscará en tu <strong>Inventario</strong>, importará los que falten y ocultará los demás del catálogo público.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle color="#ef4444" size={20} />
            <span style={{ color: '#991b1b', fontSize: 14 }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle color="#16a34a" size={20} />
            <span style={{ color: '#166534', fontSize: 14 }}>
              ¡Actualización completa! Catálogo sincronizado con éxito.
            </span>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Lista de SKUs (uno por línea)
          </label>
          <textarea
            value={skuText}
            onChange={e => { setSkuText(e.target.value); setReport(null); setSuccess(false); setProgress(null); setSyncData(null); }}
            disabled={isProcessing}
            placeholder="Ejemplo:&#10;SKU-001&#10;SKU-002&#10;SKU-003"
            style={{
              width: '100%', height: 200, padding: 12, borderRadius: 8, border: '1px solid #d1d5db',
              fontFamily: 'monospace', fontSize: 13, resize: 'vertical', outline: 'none'
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
            onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            onClick={handleAnalyze}
            disabled={isProcessing || !skuText.trim()}
            style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
              fontSize: 14, fontWeight: 600, cursor: isProcessing || !skuText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: isProcessing || !skuText.trim() ? 0.7 : 1
            }}
          >
            <Eye size={16} /> Analizar SKUs
          </button>

          <button
            onClick={handleShowAll}
            disabled={isProcessing}
            style={{
              background: '#fff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 20px',
              fontSize: 14, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: isProcessing ? 0.7 : 1
            }}
          >
            Mostrar Todos {totalCatalogProducts !== null ? `(${totalCatalogProducts})` : ''}
          </button>

          <button
            onClick={handleDownloadInventory}
            disabled={isProcessing}
            style={{
              background: '#fff', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 8, padding: '10px 20px',
              fontSize: 14, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: isProcessing ? 0.7 : 1, marginLeft: 'auto'
            }}
          >
            Descargar Todo Inventario (CSV)
          </button>
        </div>

        {report && syncData && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#0f172a', fontWeight: 700 }}>Resultados de la Sincronización:</h3>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: 20, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              <li>Total SKUs únicos ingresados: <strong>{report.totalPasted}</strong></li>
              <li>A importar desde Inventario (Nuevos): <strong style={{ color: report.toImportCount > 0 ? '#3b82f6' : '#16a34a' }}>{report.toImportCount}</strong></li>
              <li>A activar (Ya estaban en Catálogo): <strong style={{ color: '#16a34a' }}>{report.toActivateCount}</strong></li>
              <li>A ocultar del Catálogo público: <strong>{report.toHideCount}</strong></li>
              <li>No encontrados en el Inventario: <strong style={{ color: report.notFoundSkus.length > 0 ? '#dc2626' : '#16a34a' }}>{report.notFoundSkus.length}</strong></li>
            </ul>
            
            {report.notFoundSkus.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#ef4444' }}>SKUs que NO existen en BodegApp:</p>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 6, maxHeight: 120, overflowY: 'auto', fontSize: 12, fontFamily: 'monospace', color: '#991b1b', lineHeight: 1.5 }}>
                  {report.notFoundSkus.join(', ')}
                </div>
              </div>
            )}
            
            <button
              onClick={handleUpdate}
              disabled={isProcessing}
              style={{
                background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, opacity: isProcessing ? 0.7 : 1, width: '100%', justifyContent: 'center'
              }}
            >
              <CheckCircle size={18} /> Confirmar Importación y Actualización
            </button>
          </div>
        )}

        {isProcessing && progress && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4b5563', marginBottom: 6 }}>
              <span>Procesando operaciones...</span>
              <span>{progress.done} / {progress.total} operaciones</span>
            </div>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#6366f1', width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

      </div>

      {/* Product Listing */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Productos del Catálogo</h2>
          <button onClick={loadProducts} disabled={isLoadingProducts} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={14} color="#6b7280" style={{ animation: isLoadingProducts ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
            />
          </div>
          {(['all', 'visible', 'hidden', 'no-image', 'broken-image'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeFilter === f ? '#6366f1' : '#e5e7eb'}`,
              background: activeFilter === f ? '#eef2ff' : '#fff', color: activeFilter === f ? '#4f46e5' : '#6b7280',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
            }}>
              {f === 'all' ? 'Todos' : f === 'visible' ? 'Visibles' : f === 'hidden' ? 'Ocultos' : f === 'no-image' ? 'Sin Imagen' : 'Imagen Rota'}
            </button>
          ))}
          <button
            onClick={() => {
              const noImageSkus = allProducts
                .filter(p => {
                  const url = p.IMAGEURL ? p.IMAGEURL.trim().toLowerCase() : '';
                  return !url || url === 'null' || url === 'undefined' || brokenImages.has(p.$id);
                })
                .map(p => p.sku || p.SKU)
                .filter(Boolean);
              
              if (noImageSkus.length === 0) {
                alert('No hay productos sin imagen o con imagen rota.');
                return;
              }
              
              navigator.clipboard.writeText(noImageSkus.join('\n'))
                .then(() => alert(`¡${noImageSkus.length} SKUs copiados al portapapeles!`))
                .catch(err => alert('Error al copiar: ' + err));
            }}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', color: '#6b7280', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s'
            }}
            title="Copiar todos los SKUs de productos sin imagen o con imagen rota"
          >
            <Copy size={14} /> Sku Copy
          </button>
          <button
            id="btn-paste-skus"
            onClick={async () => {
              try {
                let text = '';
                try {
                  text = await navigator.clipboard.readText();
                } catch (err) {
                  const input = prompt("Pega aquí los SKUs con sus URLs (separados por tabulación o espacio):");
                  if (input) text = input;
                }
                
                if (!text || !text.trim()) {
                  alert("El portapapeles está vacío o no se pegó nada.");
                  return;
                }

                const btn = document.getElementById('btn-paste-skus');
                if (btn) btn.innerHTML = 'Procesando...';

                const lines = text.split('\n');
                let updated = 0;
                let notFound = 0;
                let emptyLines = 0;
                
                const { databases } = getServices();
                const { databaseId } = getAppwriteConfig();

                for (const line of lines) {
                  const raw = line.trim();
                  if (!raw) {
                    emptyLines++;
                    continue;
                  }
                  
                  let sku = '';
                  let url = '';
                  const parts = raw.split('\t');
                  
                  if (parts.length >= 2 && parts[1].trim().startsWith('http')) {
                    sku = parts[0].trim();
                    url = parts[1].trim();
                  } else {
                    const m = raw.match(/^(\S+)\s+(http.+)$/);
                    if (m) {
                      sku = m[1].trim();
                      url = m[2].trim();
                    }
                  }
                  
                  if (sku && url) {
                    const product = allProducts.find(p => (p.sku || p.SKU) === sku);
                    if (product) {
                      const collectionId = product._source === 'catalog_products' ? CATALOG_PRODUCTS_COLLECTION_ID : PRODUCTS_COLLECTION_ID;
                      await databases.updateDocument(databaseId, collectionId, product.$id, { IMAGEURL: url });
                      product.IMAGEURL = url;
                      setBrokenImages(prev => {
                        const next = new Set(prev);
                        next.delete(product.$id);
                        return next;
                      });
                      updated++;
                    } else {
                      notFound++;
                    }
                  } else {
                    // It might be a line with SKU but no image
                    emptyLines++;
                  }
                }
                
                if (btn) {
                  btn.innerHTML = 'Paste';
                  // re-append icon by react re-render is fine
                }
                
                alert(`¡Proceso completado!\nSe actualizaron ${updated} imágenes.\nNo encontrados: ${notFound}.`);
                // Forzar re-render de la lista
                setAllProducts([...allProducts]);
              } catch(e: any) {
                alert("Error al pegar o procesar: " + (e.message || e));
                const btn = document.getElementById('btn-paste-skus');
                if (btn) btn.innerHTML = 'Paste';
              }
            }}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', color: '#6b7280', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s'
            }}
            title="Pegar SKUs y URLs desde Excel"
          >
            <ClipboardPaste size={14} /> Paste
          </button>
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{totalProducts} productos</span>
        </div>

        {/* Table */}
        {isLoadingProducts ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 8, fontSize: 13 }}>Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Package size={32} color="#d1d5db" />
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>No se encontraron productos</p>
          </div>
        ) : (
          <>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Imagen</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>SKU</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Stock</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Visible</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(productPage * PRODUCT_PAGE_SIZE, (productPage + 1) * PRODUCT_PAGE_SIZE).map(p => (
                    <tr key={p.$id} style={{ borderBottom: '1px solid #f1f5f9', background: p.ISACTIVE ? '#fff' : '#fef2f2' }}>
                      <td style={{ padding: '6px 12px' }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => setImageUrlModal({ productId: p.$id, currentUrl: p.IMAGEURL || '', newUrl: p.IMAGEURL || '', source: p._source })} title="Click para cambiar imagen">
                        {p.IMAGEURL && !brokenImages.has(p.$id) ? (
                          <img src={p.IMAGEURL} alt={p.NAME} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} onError={() => setBrokenImages(prev => new Set(prev).add(p.$id))} />
                        ) : brokenImages.has(p.$id) ? (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Imagen rota">
                            <AlertTriangle size={14} color="#dc2626" />
                          </div>
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sin imagen">
                            <Package size={14} color="#9ca3af" />
                          </div>
                        )}
                        </div>
                      </td>
                      <td style={{ padding: '6px 12px', fontWeight: 600, color: '#111827', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.NAME || 'Sin nombre'}
                      </td>
                      <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>
                        {p.sku || p.SKU || '—'}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700, color: (p.STOCK ?? 0) > 0 ? '#16a34a' : '#dc2626' }}>
                        {p.STOCK ?? 0}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleVisibility(p)}
                          disabled={togglingId === p.$id}
                          title={p.ISACTIVE ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                          style={{
                            border: 'none', borderRadius: 8, padding: '5px 10px', cursor: togglingId === p.$id ? 'wait' : 'pointer',
                            background: p.ISACTIVE ? '#f0fdf4' : '#fef2f2', color: p.ISACTIVE ? '#16a34a' : '#dc2626',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, margin: '0 auto',
                          }}
                        >
                          {togglingId === p.$id ? '...' : p.ISACTIVE ? <><Eye size={12} /> Sí</> : <><EyeOff size={12} /> No</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalProducts > PRODUCT_PAGE_SIZE && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setProductPage(p => Math.max(0, p - 1))}
                  disabled={productPage === 0}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', background: '#fff', cursor: productPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                  Página {productPage + 1} de {Math.ceil(totalProducts / PRODUCT_PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setProductPage(p => Math.min(Math.ceil(totalProducts / PRODUCT_PAGE_SIZE) - 1, p + 1))}
                  disabled={productPage >= Math.ceil(totalProducts / PRODUCT_PAGE_SIZE) - 1}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image URL replacement modal */}
      {imageUrlModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setImageUrlModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <p className="font-bold text-gray-900">Cambiar imagen</p>
              <button onClick={() => setImageUrlModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {imageUrlModal.currentUrl && (
                <div className="w-full h-32 rounded-xl bg-gray-100 overflow-hidden">
                  <img src={imageUrlModal.currentUrl} alt="Actual" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL de la nueva imagen</label>
                <input type="url" value={imageUrlModal.newUrl} onChange={e => setImageUrlModal(m => m ? { ...m, newUrl: e.target.value } : null)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setImageUrlModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={async () => {
                if (!imageUrlModal) return;
                try {
                  const { databases } = getServices();
                  const { databaseId } = getAppwriteConfig();
                  const collectionId = imageUrlModal.source === 'catalog_products' ? CATALOG_PRODUCTS_COLLECTION_ID : PRODUCTS_COLLECTION_ID;
                  await databases.updateDocument(databaseId, collectionId, imageUrlModal.productId, { IMAGEURL: imageUrlModal.newUrl });
                  setProducts(prev => prev.map(p => p.$id === imageUrlModal.productId ? { ...p, IMAGEURL: imageUrlModal.newUrl } : p));
                  setBrokenImages(prev => {
                    const next = new Set(prev);
                    next.delete(imageUrlModal.productId);
                    return next;
                  });
                  setImageUrlModal(null);
                } catch (e: any) { alert('Error: ' + e.message); }
              }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
