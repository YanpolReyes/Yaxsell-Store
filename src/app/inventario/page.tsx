'use client';

import { useState, useCallback, useEffect } from 'react';
import { Query, ID } from 'appwrite';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, CATEGORIES_COLLECTION_ID, SUBCATEGORIES_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product, Category, Subcategory } from '@/types/admin';
import {
  Upload, Search, Package, CheckCircle2, RefreshCw,
  X, FileSpreadsheet, ArrowUpCircle, Plus, Eye, EyeOff, Sparkles, Languages, FolderTree, Camera
} from 'lucide-react';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface InventoryRow {
  sku: string;
  barcode: string;
  categoryRaw: string;
  categoryEs: string;
  subcategory: string;
  nameEs: string;
  nameCn: string;
  nameTranslated: string;
  priceRetail: number;
  priceWholesale: number;
  currentStock: number;
  newStock: number;
  productId: string | null;
  matched: boolean;
  selected: boolean;
  imageUrl: string;
  isNew: boolean;
  translated: boolean;
}

const parsePrice = (v: any): number => {
  const s = String(v || '').replace(/[^\d.-]/g, '');
  return parseFloat(s) || 0;
};

function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

async function callGeminiBatch(items: { sku: string; nameCn: string; categoryRaw: string }[]): Promise<Record<string, { nameEs: string; category: string; subcategory: string }>> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key de Gemini no configurada. Ve a Configuración > AI.');

  const lines = items.map(i => `SKU:${i.sku}|NOMBRE:${i.nameCn}|CAT:${i.categoryRaw}`).join('\n');

  const prompt = `Eres un experto en cosméticos y productos de belleza. Traduce los siguientes productos del chino al español.
Para cada línea devuelve exactamente: SKU:xxx|NOMBRE:traducción_española|CAT:categoría_en_español|SUB:subcategoría_en_español

Reglas:
- Traduce NOMBRE al español (mantén marcas en su nombre original como SADOER, BIOAOUA, etc.)
- Para CAT: traduce si está en chino, o si está vacío infiere la categoría del nombre del producto
- Para SUB: infiere la subcategoría específica basada en el nombre (ej. Brillo Labial, Esmalte de Uñas, Mascarilla Facial, etc.)
- Categorías posibles: Maquillaje, Cuidado de la Piel, Cuerpo e Higiene, Cuidado Capilar, Manicure y Uñas, Aromaterapia, Accesorios de Belleza, Perfumería, Hogar y Decoración, Higiene Personal, Depilación, Electrónica, Varios
- Devuelve EXACTAMENTE el mismo número de líneas, en el mismo orden
- Sin explicaciones extra, solo las líneas con el formato pedido

${lines}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error('Error en la API de Gemini');
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const result: Record<string, { nameEs: string; category: string; subcategory: string }> = {};
  for (const line of text.split('\n')) {
    const skuMatch = line.match(/SKU:([^|]+)\|NOMBRE:([^|]+)\|CAT:([^|]+)\|SUB:(.+)/);
    if (skuMatch) {
      result[skuMatch[1].trim()] = {
        nameEs: skuMatch[2].trim(),
        category: skuMatch[3].trim(),
        subcategory: skuMatch[4].trim(),
      };
    }
  }
  return result;
}

export default function InventarioPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'new' | 'unmatched'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isCreatingCats, setIsCreatingCats] = useState(false);
  const [catResults, setCatResults] = useState<{ cats: number; subs: number; errors: number } | null>(null);
  const [saveResults, setSaveResults] = useState<{ updated: number; created: number; errors: number } | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState(0);
  const [migrateResults, setMigrateResults] = useState<{ activated: number; deactivated: number; errors: number } | null>(null);
  const [view, setView] = useState<'excel' | 'catalog' | 'withStock'>('excel');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [packQtyEdits, setPackQtyEdits] = useState<Record<string, string>>({});
  const [barcodeEdits, setBarcodeEdits] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'search' | string>('search');

  const handleBarcodeScan = (code: string) => {
    if (scanTarget === 'search') {
      setCatalogSearch(code);
      if (view !== 'catalog') setView('catalog');
    } else {
      setBarcodeEdits(prev => ({ ...prev, [scanTarget]: code }));
    }
    setShowScanner(false);
    setScanTarget('search');
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace('/admin/login');
  }, [authLoading, isLoggedIn, router]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      // Carga TODOS los productos (incluyendo inactivos) con paginación
      const allProds: Product[] = [];
      let cursor: string | undefined;
      while (true) {
        const queries: string[] = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const resp: any = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, queries);
        const docs = resp.documents as unknown as Product[];
        if (!docs.length) break;
        allProds.push(...docs);
        if (docs.length < 100) break;
        cursor = (docs[docs.length - 1] as any).$id;
      }
      const [cr, sr] = await Promise.all([
        databases.listDocuments(databaseId, CATEGORIES_COLLECTION_ID, [Query.limit(100)]),
        databases.listDocuments(databaseId, SUBCATEGORIES_COLLECTION_ID, [Query.limit(500)]),
      ]);
      setProducts(allProds);
      setCategories(cr.documents as unknown as Category[]);
      setSubcategories(sr.documents as unknown as Subcategory[]);
    } catch (e: any) { console.error(e); }
    finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const getSku = (p: Product): string => {
    const featMatch = p.FEATURES?.match(/SKU:\s*(.+)/i);
    if (featMatch) return featMatch[1].trim();
    const tagParts = (p.TAGS || '').split(',').map(t => t.trim());
    const skuTag = tagParts.find(t => /^[A-Z0-9]{4,}$/i.test(t));
    return p.jumpseller_id || skuTag || '';
  };

  const getBarcode = (p: Product): string => {
    const featMatch = p.FEATURES?.match(/Barcode:\s*(.+)/i);
    if (featMatch) return featMatch[1].trim();
    return '';
  };

  const findProduct = (sku: string): Product | undefined => {
    if (!sku) return undefined;
    const skuLower = sku.toLowerCase();
    return products.find(p => {
      const pSku = getSku(p);
      if (pSku && pSku.toLowerCase() === skuLower) return true;
      if (p.jumpseller_id?.toLowerCase() === skuLower) return true;
      return false;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsLoading(true);
    setSaveResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      const parsed: InventoryRow[] = jsonData.map((row) => {
        const sku = String(row['Codigo'] || '').trim();
        const barcode = String(row['Código Barra'] || '').trim();
        // Support both formats: translated (Categoria/Subcategoria) and raw Qianji
        const isTranslated = !!row['Nombre CN'] || !!row['Precio Retail'];
        const categoryRaw = String(row['Categoria'] || '').trim();
        const categoryEs = isTranslated ? categoryRaw : '';
        const subcategory = String(row['Subcategoria'] || '').trim();
        const nameEs = String(row['Nombre del producto 2'] || row['Nombre ES'] || '').trim();
        const nameCn = String(row['Nombre del producto 1'] || row['Nombre CN'] || '').trim();
        const nameTranslated = String(row['Nombre Traducido'] || '').trim();
        const priceRetail = parsePrice(row['Precio por paquete'] || row['Precio Retail']);
        const priceWholesale = parsePrice(row['Precio por caja'] || row['Precio Caja']);
        const imageUrl = String(row['Imagen URL'] || '').trim();

        const product = findProduct(sku);

        return {
          sku,
          barcode,
          categoryRaw: isTranslated ? '' : categoryRaw,
          categoryEs,
          subcategory,
          nameEs,
          nameCn,
          nameTranslated,
          priceRetail,
          priceWholesale,
          currentStock: product?.STOCK ?? 0,
          newStock: 0,
          productId: product?.$id || null,
          matched: !!product,
          selected: true,
          imageUrl: imageUrl || product?.IMAGEURL || '',
          isNew: !product,
          translated: isTranslated || !!nameTranslated,
        };
      });

      setRows(parsed);
    } catch (e: any) {
      alert('Error al leer el archivo: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    const needsTranslation = rows.filter(r => !r.translated && (r.nameCn || r.categoryRaw));
    if (needsTranslation.length === 0) { alert('Todos los productos ya están traducidos'); return; }
    if (!getApiKey()) { alert('Configura tu API key de Gemini en Admin > Configuración > AI'); return; }

    if (!confirm(`¿Traducir ${needsTranslation.length} productos con IA? Se procesarán en lotes de 200.`)) return;

    setIsTranslating(true);
    setTranslateProgress(0);
    const BATCH = 200;

    try {
      for (let i = 0; i < needsTranslation.length; i += BATCH) {
        const batch = needsTranslation.slice(i, i + BATCH);
        const items = batch.map(r => ({ sku: r.sku, nameCn: r.nameCn || r.nameEs, categoryRaw: r.categoryRaw }));

        const translations = await callGeminiBatch(items);

        setRows(prev => prev.map(r => {
          const t = translations[r.sku];
          if (!t) return r;
          return {
            ...r,
            nameTranslated: t.nameEs || r.nameEs,
            categoryEs: t.category || r.categoryRaw,
            subcategory: t.subcategory || r.subcategory,
            translated: true,
          };
        }));

        setTranslateProgress(Math.round(((i + BATCH) / needsTranslation.length) * 100));
        if (i + BATCH < needsTranslation.length) await new Promise(res => setTimeout(res, 800));
      }
    } catch (e: any) {
      alert('Error en traducción: ' + e.message);
    } finally {
      setIsTranslating(false);
      setTranslateProgress(0);
    }
  };

  const toggleRow = (idx: number) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = () => {
    const vis = filtered;
    const allSel = vis.every(r => r.selected);
    const visSkus = new Set(vis.map(r => r.sku));
    setRows(prev => prev.map(r => visSkus.has(r.sku) ? { ...r, selected: !allSel } : r));
  };

  const updateNewStock = (idx: number, value: number) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, newStock: Math.max(0, value) } : r));
  };

  const resolveCategoryIds = (categoryEs: string, subcategory: string): { catId: string; subId: string } => {
    if (!categoryEs) return { catId: '', subId: '' };
    const catFound = categories.find(c =>
      (c.name || '').toLowerCase().trim() === categoryEs.toLowerCase().trim()
    );
    const catId = catFound?.$id || '';
    if (!catId || !subcategory) return { catId, subId: '' };
    const subFound = subcategories.find(s =>
      s.categoryId === catId && (s.name || '').toLowerCase().trim() === subcategory.toLowerCase().trim()
    );
    return { catId, subId: subFound?.$id || '' };
  };

  const handleCreateCategories = async () => {
    const rowsWithCat = rows.filter(r => r.categoryEs);
    if (rowsWithCat.length === 0) { alert('No hay categorías para crear. Sube un Excel traducido primero.'); return; }

    // Collect unique category + subcategory pairs
    const catMap = new Map<string, Set<string>>();
    rowsWithCat.forEach(r => {
      if (!catMap.has(r.categoryEs)) catMap.set(r.categoryEs, new Set());
      if (r.subcategory) catMap.get(r.categoryEs)!.add(r.subcategory);
    });

    if (!confirm(`¿Crear ${catMap.size} categorías y sus subcategorías en Appwrite?`)) return;

    setIsCreatingCats(true);
    setCatResults(null);
    let catsCreated = 0, subsCreated = 0, errors = 0;

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      for (const [catName, subs] of catMap) {
        try {
          // Check if category already exists
          let catDoc = categories.find(c => (c.name || '').toLowerCase().trim() === catName.toLowerCase().trim());
          let catId = catDoc?.$id || '';

          if (!catDoc) {
            const doc = await databases.createDocument(databaseId, CATEGORIES_COLLECTION_ID, ID.unique(), {
              name: catName,
              iconUrl: '',
              order: categories.length + catsCreated,
            });
            catId = (doc as any).$id;
            catsCreated++;
          }

          // Create subcategories
          for (const subName of subs) {
            try {
              const subExists = subcategories.find(s =>
                s.categoryId === catId && (s.name || '').toLowerCase().trim() === subName.toLowerCase().trim()
              );
              if (!subExists) {
                await databases.createDocument(databaseId, SUBCATEGORIES_COLLECTION_ID, ID.unique(), {
                  name: subName,
                  categoryId: catId,
                  ORDER: 0,
                });
                subsCreated++;
              }
            } catch { errors++; }
            await new Promise(r => setTimeout(r, 500));
          }
        } catch { errors++; }
        await new Promise(r => setTimeout(r, 500));
      }

      setCatResults({ cats: catsCreated, subs: subsCreated, errors });
      // Reload categories and subcategories
      await loadProducts();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsCreatingCats(false); }
  };

  const handleMigrateActive = async () => {
    if (products.length === 0) { alert('No hay productos cargados'); return; }
    const stock0 = products.filter(p => (p.STOCK ?? 0) === 0);
    const stockOk = products.filter(p => (p.STOCK ?? 0) > 0);
    if (!confirm(`¿Migrar ${products.length} productos?\n\n• ${stock0.length} con stock 0 → INACTIVOS (ocultos)\n• ${stockOk.length} con stock > 0 → ACTIVOS (visibles)`)) return;

    setIsMigrating(true);
    setMigrateProgress(0);
    setMigrateResults(null);
    let activated = 0, deactivated = 0, errors = 0;

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const shouldBeActive = (p.STOCK ?? 0) > 0;
        if (p.ISACTIVE === shouldBeActive) {
          // Ya está en el estado correcto, saltar
          if (shouldBeActive) activated++; else deactivated++;
        } else {
          try {
            await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, p.$id, { ISACTIVE: shouldBeActive });
            if (shouldBeActive) activated++; else deactivated++;
          } catch { errors++; }
          await new Promise(r => setTimeout(r, 150));
        }
        setMigrateProgress(Math.round(((i + 1) / products.length) * 100));
      }
      setMigrateResults({ activated, deactivated, errors });
      await loadProducts();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsMigrating(false); }
  };

  const handleSave = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) { alert('No hay productos seleccionados'); return; }

    const existing = selected.filter(r => r.matched && r.productId);
    const newOnes = selected.filter(r => r.isNew);

    if (!confirm(`¿Procesar ${existing.length} existentes y crear ${newOnes.length} nuevos?`)) return;

    setIsSaving(true);
    setSaveResults(null);
    let updated = 0, created = 0, errors = 0;

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      for (const row of existing) {
        try {
          const payload: any = {};
          if (row.priceRetail) payload.PRICE = row.priceRetail;
          if (row.priceWholesale) payload.WHOLESALEPRICE = row.priceWholesale;
          if (row.imageUrl) payload.IMAGEURL = row.imageUrl;
          const { catId, subId } = resolveCategoryIds(row.categoryEs, row.subcategory);
          if (catId) payload.CATEGORYID = catId;
          if (subId) payload.SUBCATEGORYID = subId;
          // Si se está asignando stock > 0, activar el producto
          if (row.newStock > 0) {
            payload.STOCK = row.newStock;
            payload.ISACTIVE = true;
          }
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, row.productId!, payload);
          updated++;
          setRows(prev => prev.map(r => r.productId === row.productId ? { ...r, currentStock: row.newStock } : r));
          await new Promise(r => setTimeout(r, 200));
        } catch { errors++; await new Promise(r => setTimeout(r, 200)); }
      }

      for (const row of newOnes) {
        try {
          const nameDisplay = row.nameEs || row.nameTranslated || row.nameCn;
          const { catId, subId } = resolveCategoryIds(row.categoryEs, row.subcategory);
          const payload: any = {
            NAME: nameDisplay,
            DESCRIPTION: row.nameEs || '',
            PRICE: row.priceRetail,
            STOCK: row.newStock,
            COST: row.priceWholesale,
            WHOLESALEPRICE: row.priceWholesale,
            WHOLESALEMINQUANTITY: 0,
            IMAGEURL: row.imageUrl || '', IMAGEURL2: '', IMAGEURL3: '', IMAGEURL4: '', IMAGEURL5: '',
            CATEGORYID: catId,
            SUBCATEGORYID: subId,
            TAGS: row.sku,
            FEATURES: `SKU: ${row.sku}${row.barcode ? `\nBarcode: ${row.barcode}` : ''}${row.nameCn ? `\nZH: ${row.nameCn}` : ''}${row.nameTranslated ? `\nES: ${row.nameTranslated}` : ''}`,
            ISACTIVE: row.newStock > 0,
          };
          const doc = await databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
          created++;
          setRows(prev => prev.map(r => r.sku === row.sku ? {
            ...r, productId: (doc as any).$id, matched: true, isNew: false, currentStock: row.newStock,
          } : r));
          await new Promise(r => setTimeout(r, 200));
        } catch { errors++; await new Promise(r => setTimeout(r, 200)); }
      }

      setSaveResults({ updated, created, errors });
      loadProducts();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setIsSaving(false); }
  };

  const assignStock = async (productId: string) => {
    const product = products.find(p => p.$id === productId);
    if (!product) return;

    const pkgRaw = stockEdits[productId];
    const pkgs = parseInt(pkgRaw, 10);
    if (isNaN(pkgs) || pkgs <= 0) return;

    // Determine PACKQTY: existing on product OR entered inline
    let packQty = product.PACKQTY || 0;
    const inlinePackQtyRaw = packQtyEdits[productId];
    const inlinePackQty = parseInt(inlinePackQtyRaw, 10);
    const needsSavePackQty = !packQty && !isNaN(inlinePackQty) && inlinePackQty > 0;
    if (needsSavePackQty) packQty = inlinePackQty;

    if (!packQty || packQty <= 0) {
      alert('Debes establecer la cantidad por paquete primero.');
      return;
    }

    const finalStock = pkgs * packQty;

    setSavingStockId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: Record<string, any> = {
        STOCK: finalStock,
        ISACTIVE: finalStock > 0,
      };
      if (needsSavePackQty) payload.PACKQTY = packQty;

      // Save inline barcode if provided
      const inlineBarcode = barcodeEdits[productId]?.trim();
      const existingBarcode = getBarcode(product);
      if (!existingBarcode && inlineBarcode) {
        const features = product.FEATURES || '';
        payload.FEATURES = features ? `${features}\nBarcode: ${inlineBarcode}` : `Barcode: ${inlineBarcode}`;
      }

      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, payload);
      setProducts(prev => prev.map(p => p.$id === productId
        ? { ...p, STOCK: finalStock, ISACTIVE: finalStock > 0, PACKQTY: packQty, FEATURES: payload.FEATURES || p.FEATURES }
        : p));
      setStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      setPackQtyEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      setBarcodeEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSavingStockId(null);
    }
  };

  const saveProductEdits = async (productId: string) => {
    const product = products.find(p => p.$id === productId);
    if (!product) return;

    const inlineBarcode = barcodeEdits[productId]?.trim();
    const inlinePackQty = packQtyEdits[productId]?.trim();
    const parsedPackQty = parseInt(inlinePackQty, 10);

    if (!inlineBarcode && (isNaN(parsedPackQty) || parsedPackQty <= 0)) {
      alert('No hay cambios para guardar.');
      return;
    }

    setSavingStockId(productId);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: Record<string, any> = {};

      // Save barcode if provided and product doesn't have one
      const existingBarcode = getBarcode(product);
      if (!existingBarcode && inlineBarcode) {
        const features = product.FEATURES || '';
        payload.FEATURES = features ? `${features}\nBarcode: ${inlineBarcode}` : `Barcode: ${inlineBarcode}`;
      }

      // Save pack qty if provided and product doesn't have one
      if (!product.PACKQTY && !isNaN(parsedPackQty) && parsedPackQty > 0) {
        payload.PACKQTY = parsedPackQty;
      }

      if (Object.keys(payload).length === 0) {
        alert('No hay cambios para guardar.');
        setSavingStockId(null);
        return;
      }

      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, productId, payload);
      setProducts(prev => prev.map(p => p.$id === productId
        ? { ...p, ...payload }
        : p));
      setBarcodeEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      setPackQtyEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSavingStockId(null);
    }
  };

  const zeroStockProducts = products.filter(p => (p.STOCK || 0) === 0);
  const withStockProducts = products.filter(p => (p.STOCK || 0) > 0);
  const catalogFiltered = zeroStockProducts.filter(p => {
    if (!catalogSearch) return true;
    const q = catalogSearch.toLowerCase();
    const sku = getSku(p).toLowerCase();
    const barcode = getBarcode(p).toLowerCase();
    const name = (p.NAME || '').toLowerCase();
    return sku.includes(q) || name.includes(q) || barcode.includes(q);
  });
  const withStockFiltered = withStockProducts.filter(p => {
    if (!catalogSearch) return true;
    const q = catalogSearch.toLowerCase();
    const sku = getSku(p).toLowerCase();
    const barcode = getBarcode(p).toLowerCase();
    const name = (p.NAME || '').toLowerCase();
    return sku.includes(q) || name.includes(q) || barcode.includes(q);
  });

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.sku.toLowerCase().includes(q) || r.nameEs.toLowerCase().includes(q) || r.nameTranslated.toLowerCase().includes(q) || r.nameCn.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' ? true
      : filterStatus === 'matched' ? (r.matched && !r.isNew)
      : filterStatus === 'new' ? r.isNew
      : (!r.matched && !r.isNew);
    return matchSearch && matchStatus;
  });

  const matchedCount = rows.filter(r => r.matched && !r.isNew).length;
  const newCount = rows.filter(r => r.isNew).length;
  const selectedCount = rows.filter(r => r.selected).length;
  const translatedCount = rows.filter(r => r.translated).length;

  if (authLoading || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
          <button className="absolute top-6 right-6 text-white/70 hover:text-white"><X size={28} /></button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-gray-900">Inventario</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Excel → Traduce con IA → Sincroniza con Yaxsel</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">{products.length} productos</span>
              <button onClick={handleMigrateActive} disabled={isMigrating || loadingProducts}
                title="Migrar: marcar productos con stock=0 como inactivos"
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-medium transition">
                {isMigrating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Migrar</span>
              </button>
              <button onClick={loadProducts} disabled={loadingProducts}
                className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('excel')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition ${view === 'excel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Subir Excel
            </button>
            <button onClick={() => setView('catalog')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition ${view === 'catalog' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Sin stock ({zeroStockProducts.length})
            </button>
            <button onClick={() => setView('withStock')}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition ${view === 'withStock' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Con stock ({withStockProducts.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {view === 'catalog' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1">Catálogo sin stock</h2>
                <p className="text-xs text-gray-500">{zeroStockProducts.length} productos sin stock</p>
              </div>
              <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Nombre, SKU o código de barras..."
                  className="w-full pl-9 pr-16 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                    title="Limpiar búsqueda">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => { setScanTarget('search'); setShowScanner(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition"
                  title="Escanear código de barras">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
            {loadingProducts ? (
              <div className="p-10 text-center text-sm text-gray-500">Cargando...</div>
            ) : catalogFiltered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                {catalogSearch ? 'No hay productos que coincidan con la búsqueda.' : '¡No hay productos sin stock!'}
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="px-4 py-2.5 w-16">Img</th>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5 w-32">SKU</th>
                      <th className="px-4 py-2.5 w-24">Precio</th>
                      <th className="px-4 py-2.5 w-48">Asignar stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {catalogFiltered.slice(0, 200).map(p => {
                      const sku = getSku(p);
                      const barcode = getBarcode(p);
                      const editing = stockEdits[p.$id] ?? '';
                      const inlinePack = packQtyEdits[p.$id] ?? '';
                      const inlineBarcode = barcodeEdits[p.$id] ?? '';
                      const saving = savingStockId === p.$id;
                      const hasPack = !!(p.PACKQTY && p.PACKQTY > 0);
                      const hasBarcode = !!barcode;
                      const effectivePack = hasPack ? p.PACKQTY! : (parseInt(inlinePack, 10) || 0);
                      const pkgs = parseInt(editing, 10) || 0;
                      const totalUnits = pkgs * effectivePack;
                      return (
                        <tr key={p.$id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {p.IMAGEURL ? (
                              <img src={p.IMAGEURL} alt="" className="w-10 h-10 object-cover rounded cursor-pointer"
                                onClick={() => setPreviewImg(p.IMAGEURL || null)} />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 line-clamp-1">{p.NAME || '—'}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">{p.DESCRIPTION || ''}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {hasPack ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded">
                                  <Package className="w-3 h-3" />{p.PACKQTY} u/paquete
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded">
                                  Sin paquete
                                </span>
                              )}
                              {hasBarcode ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">BC: {barcode}</span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-medium rounded">Sin código</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-600">{sku || '—'}</td>
                          <td className="px-4 py-2 text-gray-700">${(p.PRICE || 0).toLocaleString('es-CL')}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1.5">
                              {!hasBarcode && (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={inlineBarcode}
                                    onChange={e => setBarcodeEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                    placeholder="Código de barras"
                                    title="Añadir código de barras"
                                    className="flex-1 px-2 py-1.5 text-sm border border-rose-300 bg-rose-50 rounded focus:outline-none focus:border-rose-500 font-mono"
                                  />
                                  <button onClick={() => { setScanTarget(p.$id); setShowScanner(true); }}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                                    title="Escanear código de barras">
                                    <Camera className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {!hasPack && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={inlinePack}
                                    onChange={e => setPackQtyEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                    placeholder="u/pkg"
                                    title="Unidades por paquete"
                                    className="w-16 px-2 py-1.5 text-sm border border-amber-300 bg-amber-50 rounded focus:outline-none focus:border-amber-500"
                                  />
                                )}
                                <input
                                  type="number"
                                  min={0}
                                  value={editing}
                                  onChange={e => setStockEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') assignStock(p.$id); }}
                                  placeholder="paq."
                                  title="Cantidad de paquetes"
                                  className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => assignStock(p.$id)}
                                  disabled={saving || !editing || pkgs <= 0 || (!hasPack && (!inlinePack || parseInt(inlinePack, 10) <= 0))}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium rounded transition">
                                  {saving ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                  Activar
                                </button>
                                {((!hasBarcode && inlineBarcode) || (!hasPack && inlinePack && parseInt(inlinePack, 10) > 0)) && (
                                  <button
                                    onClick={() => saveProductEdits(p.$id)}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium rounded transition">
                                    {saving ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Guardar
                                  </button>
                                )}
                              </div>
                              {totalUnits > 0 && (
                                <div className="text-[11px] text-gray-500">= {totalUnits} unidades</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {catalogFiltered.slice(0, 200).map(p => {
                    const sku = getSku(p);
                    const barcode = getBarcode(p);
                    const editing = stockEdits[p.$id] ?? '';
                    const inlinePack = packQtyEdits[p.$id] ?? '';
                    const inlineBarcode = barcodeEdits[p.$id] ?? '';
                    const saving = savingStockId === p.$id;
                    const hasPack = !!(p.PACKQTY && p.PACKQTY > 0);
                    const hasBarcode = !!barcode;
                    const effectivePack = hasPack ? p.PACKQTY! : (parseInt(inlinePack, 10) || 0);
                    const pkgs = parseInt(editing, 10) || 0;
                    const totalUnits = pkgs * effectivePack;
                    return (
                      <div key={p.$id} className="p-4">
                        <div className="flex gap-3">
                          <div className="shrink-0">
                            {p.IMAGEURL ? (
                              <img src={p.IMAGEURL} alt="" className="w-14 h-14 object-cover rounded-lg cursor-pointer"
                                onClick={() => setPreviewImg(p.IMAGEURL || null)} />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm line-clamp-1">{p.NAME || '—'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {sku && <span className="font-mono mr-2">SKU: {sku}</span>}
                              {hasBarcode && <span className="font-mono text-gray-400">BC: {barcode}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-sm text-gray-700">${(p.PRICE || 0).toLocaleString('es-CL')}</span>
                              {hasPack ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-medium rounded-full">
                                  <Package className="w-3 h-3" />{p.PACKQTY} u/paquete
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded-full">
                                  ⚠ Sin paquete
                                </span>
                              )}
                              {!hasBarcode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 text-[11px] font-medium rounded-full">
                                  ⚠ Sin código
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline inputs — stacked with clear labels */}
                        <div className="mt-3 space-y-2">
                          {!hasBarcode && (
                            <div>
                              <label className="text-[10px] text-rose-600 font-semibold uppercase tracking-wide mb-0.5 block">Código de barras</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={inlineBarcode}
                                  onChange={e => setBarcodeEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                  placeholder="Escanear o escribir código..."
                                  title="Añadir código de barras"
                                  className="flex-1 px-3 py-2 text-sm border border-rose-300 bg-rose-50 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                                />
                                <button onClick={() => { setScanTarget(p.$id); setShowScanner(true); }}
                                  className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-rose-200"
                                  title="Escanear código de barras">
                                  <Camera className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex items-end gap-2">
                            {!hasPack && (
                              <div className="flex-1">
                                <label className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-0.5 block">Und. por paquete</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={inlinePack}
                                  onChange={e => setPackQtyEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                  placeholder="Ej: 12"
                                  title="Unidades por paquete"
                                  className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50 rounded-lg focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5 block">Paquetes</label>
                              <input
                                type="number"
                                min={0}
                                value={editing}
                                onChange={e => setStockEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') assignStock(p.$id); }}
                                placeholder="Ej: 3"
                                title="Cantidad de paquetes"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <button
                              onClick={() => assignStock(p.$id)}
                              disabled={saving || !editing || pkgs <= 0 || (!hasPack && (!inlinePack || parseInt(inlinePack, 10) <= 0))}
                              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition shrink-0">
                              {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              Activar
                            </button>
                            {((!hasBarcode && inlineBarcode) || (!hasPack && inlinePack && parseInt(inlinePack, 10) > 0)) && (
                              <button
                                onClick={() => saveProductEdits(p.$id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition shrink-0">
                                {saving ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Guardar
                              </button>
                            )}
                          </div>
                          {totalUnits > 0 && (
                            <div className="text-xs text-gray-500 font-medium">= {totalUnits} unidades totales</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {catalogFiltered.length > 200 && (
                  <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100">
                    Mostrando primeros 200 de {catalogFiltered.length}. Refina la búsqueda para ver más.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'withStock' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-0.5 sm:mb-1">Productos con stock</h2>
                <p className="text-xs text-gray-500">{withStockProducts.length} productos activos</p>
              </div>
              <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Nombre, SKU o código de barras..."
                  className="w-full pl-9 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')}
                    className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                    title="Limpiar búsqueda">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => { setScanTarget('search'); setShowScanner(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition"
                  title="Escanear código de barras">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
            {loadingProducts ? (
              <div className="p-10 text-center text-sm text-gray-500">Cargando...</div>
            ) : withStockFiltered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                {catalogSearch ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos con stock.'}
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {/* Desktop table */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="px-4 py-2.5 w-16">Img</th>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5 w-32">SKU</th>
                      <th className="px-4 py-2.5 w-24">Stock</th>
                      <th className="px-4 py-2.5 w-24">Precio</th>
                      <th className="px-4 py-2.5 w-48">Editar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withStockFiltered.slice(0, 200).map(p => {
                      const sku = getSku(p);
                      const barcode = getBarcode(p);
                      const inlineBarcode = barcodeEdits[p.$id] ?? '';
                      const inlinePack = packQtyEdits[p.$id] ?? '';
                      const saving = savingStockId === p.$id;
                      const hasPack = !!(p.PACKQTY && p.PACKQTY > 0);
                      const hasBarcode = !!barcode;
                      return (
                        <tr key={p.$id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {p.IMAGEURL ? (
                              <img src={p.IMAGEURL} alt="" className="w-10 h-10 object-cover rounded cursor-pointer"
                                onClick={() => setPreviewImg(p.IMAGEURL || null)} />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900 line-clamp-1">{p.NAME || '—'}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {hasPack ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded">
                                  <Package className="w-3 h-3" />{p.PACKQTY} u/paquete
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded">
                                  Sin paquete
                                </span>
                              )}
                              {hasBarcode ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">BC: {barcode}</span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-medium rounded">Sin código</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-600">{sku || '—'}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-emerald-600">{p.STOCK || 0}</td>
                          <td className="px-4 py-2 text-gray-700">${(p.PRICE || 0).toLocaleString('es-CL')}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1.5">
                              {!hasBarcode && (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={inlineBarcode}
                                    onChange={e => setBarcodeEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                    placeholder="Código de barras"
                                    title="Añadir código de barras"
                                    className="flex-1 px-2 py-1.5 text-sm border border-rose-300 bg-rose-50 rounded focus:outline-none focus:border-rose-500 font-mono"
                                  />
                                  <button onClick={() => { setScanTarget(p.$id); setShowScanner(true); }}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                                    title="Escanear código de barras">
                                    <Camera className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {!hasPack && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={inlinePack}
                                    onChange={e => setPackQtyEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                    placeholder="u/pkg"
                                    title="Unidades por paquete"
                                    className="w-16 px-2 py-1.5 text-sm border border-amber-300 bg-amber-50 rounded focus:outline-none focus:border-amber-500"
                                  />
                                )}
                                {((!hasBarcode && inlineBarcode) || (!hasPack && inlinePack && parseInt(inlinePack, 10) > 0)) && (
                                  <button
                                    onClick={() => saveProductEdits(p.$id)}
                                    disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-medium rounded transition">
                                    {saving ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Guardar
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {withStockFiltered.slice(0, 200).map(p => {
                    const sku = getSku(p);
                    const barcode = getBarcode(p);
                    const inlineBarcode = barcodeEdits[p.$id] ?? '';
                    const inlinePack = packQtyEdits[p.$id] ?? '';
                    const saving = savingStockId === p.$id;
                    const hasPack = !!(p.PACKQTY && p.PACKQTY > 0);
                    const hasBarcode = !!barcode;
                    return (
                      <div key={p.$id} className="p-4">
                        <div className="flex gap-3">
                          <div className="shrink-0">
                            {p.IMAGEURL ? (
                              <img src={p.IMAGEURL} alt="" className="w-14 h-14 object-cover rounded-lg cursor-pointer"
                                onClick={() => setPreviewImg(p.IMAGEURL || null)} />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm line-clamp-1">{p.NAME || '—'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {sku && <span className="font-mono mr-2">SKU: {sku}</span>}
                              {hasBarcode && <span className="font-mono text-gray-400">BC: {barcode}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-sm font-semibold text-emerald-600">{p.STOCK} uds</span>
                              <span className="text-sm text-gray-700">${(p.PRICE || 0).toLocaleString('es-CL')}</span>
                              {hasPack ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-medium rounded-full">
                                  <Package className="w-3 h-3" />{p.PACKQTY} u/paquete
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded-full">
                                  ⚠ Sin paquete
                                </span>
                              )}
                              {!hasBarcode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 text-[11px] font-medium rounded-full">
                                  ⚠ Sin código
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Inline edits */}
                        {((!hasBarcode) || (!hasPack)) && (
                          <div className="mt-3 space-y-2">
                            {!hasBarcode && (
                              <div>
                                <label className="text-[10px] text-rose-600 font-semibold uppercase tracking-wide mb-0.5 block">Código de barras</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={inlineBarcode}
                                    onChange={e => setBarcodeEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                    placeholder="Escanear o escribir código..."
                                    title="Añadir código de barras"
                                    className="flex-1 px-3 py-2 text-sm border border-rose-300 bg-rose-50 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                                  />
                                  <button onClick={() => { setScanTarget(p.$id); setShowScanner(true); }}
                                    className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition border border-rose-200"
                                    title="Escanear código de barras">
                                    <Camera className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {!hasPack && (
                              <div>
                                <label className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-0.5 block">Und. por paquete</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={inlinePack}
                                  onChange={e => setPackQtyEdits(prev => ({ ...prev, [p.$id]: e.target.value }))}
                                  placeholder="Ej: 12"
                                  title="Unidades por paquete"
                                  className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50 rounded-lg focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            )}
                            {((!hasBarcode && inlineBarcode) || (!hasPack && inlinePack && parseInt(inlinePack, 10) > 0)) && (
                              <button
                                onClick={() => saveProductEdits(p.$id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition">
                                {saving ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Guardar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {withStockFiltered.length > 200 && (
                  <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100">
                    Mostrando primeros 200 de {withStockFiltered.length}. Refina la búsqueda para ver más.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'excel' && (
        <>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Subir Excel de Qianji</h2>
              <p className="text-xs text-gray-500">Formatos: Qianji crudo o productos_traducidos.xlsx · Codigo · Categoria · Subcategoria · Nombre · Precios · Stock</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" disabled={isLoading} />
              <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                {isLoading ? 'Procesando...' : 'Seleccionar archivo'}
              </div>
            </label>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="grid grid-cols-5 gap-3 flex-1">
              {[
                { label: 'Total', value: rows.length, color: 'text-gray-900' },
                { label: 'Ya existen', value: matchedCount, color: 'text-emerald-600' },
                { label: 'Nuevos', value: newCount, color: 'text-blue-600' },
                { label: 'Traducidos', value: translatedCount, color: 'text-violet-600' },
                { label: 'Con imagen', value: rows.filter(r => r.imageUrl).length, color: 'text-orange-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleTranslate} disabled={isTranslating}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition whitespace-nowrap">
                {isTranslating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traduciendo {translateProgress}%
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    Traducir con IA
                  </>
                )}
              </button>
              <button onClick={handleCreateCategories} disabled={isCreatingCats}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition whitespace-nowrap">
                {isCreatingCats ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <FolderTree className="w-4 h-4" />
                    Crear Categorías
                  </>
                )}
              </button>
              <button onClick={handleSave} disabled={isSaving || selectedCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition whitespace-nowrap">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    Aplicar ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isTranslating && (
          <div className="bg-white rounded-xl border border-violet-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-violet-700">Traduciendo con Gemini AI...</p>
              <p className="text-sm font-bold text-violet-600">{translateProgress}%</p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${translateProgress}%` }} />
            </div>
          </div>
        )}

        {saveResults && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-700">
              {saveResults.updated} actualizados · {saveResults.created} productos creados
              {saveResults.errors > 0 && ` · ${saveResults.errors} error(es)`}
            </p>
          </div>
        )}

        {catResults && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <FolderTree className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-700">
              {catResults.cats} categorías creadas · {catResults.subs} subcategorías creadas
              {catResults.errors > 0 && ` · ${catResults.errors} error(es)`}
            </p>
          </div>
        )}

        {isMigrating && (
          <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-rose-700">Migrando productos (activos / inactivos)...</p>
              <p className="text-sm font-bold text-rose-600">{migrateProgress}%</p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${migrateProgress}%` }} />
            </div>
          </div>
        )}

        {migrateResults && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <EyeOff className="w-5 h-5 text-rose-600" />
            <p className="text-sm text-rose-700">
              {migrateResults.activated} activos · {migrateResults.deactivated} inactivos (ocultos)
              {migrateResults.errors > 0 && ` · ${migrateResults.errors} error(es)`}
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por SKU o nombre..."
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
            </div>
            {(['all', 'matched', 'new', 'unmatched'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition ${filterStatus === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {f === 'all' ? 'Todos' : f === 'matched' ? 'Existentes' : f === 'new' ? 'Nuevos' : 'Sin match'}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} filas</span>
          </div>
        )}

        {rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-3">
                      <input type="checkbox"
                        checked={filtered.length > 0 && filtered.every(r => r.selected)}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Categoría</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Imagen</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock actual</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock a asignar</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Retail</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Caja</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => {
                    const realIdx = rows.indexOf(row);
                    const displayName = row.nameEs || row.nameTranslated || row.nameCn;
                    const displayNameSub = row.translated ? row.nameTranslated : row.nameCn;
                    return (
                      <tr key={realIdx} className={`transition-colors ${row.selected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={row.selected}
                            onChange={() => toggleRow(realIdx)}
                            className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 cursor-pointer relative group"
                              onClick={() => row.imageUrl && setPreviewImg(row.imageUrl)}>
                              {row.imageUrl ? (
                                <>
                                  <img src={row.imageUrl} alt={displayName}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                                    <Eye className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </>
                              ) : <Package className="w-4 h-4 text-gray-400 m-auto mt-2.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{displayName}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs text-gray-500 font-mono">{row.sku}</p>
                                {row.translated && (
                                  <span className="text-[10px] px-1 py-0.5 rounded bg-violet-100 text-violet-700 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" />ES
                                  </span>
                                )}
                              </div>
                              {displayNameSub && displayNameSub !== displayName && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{displayNameSub}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <div>
                            <span className="text-xs text-gray-600">
                              {row.categoryEs || row.categoryRaw || <span className="text-gray-400">—</span>}
                            </span>
                            {row.subcategory && (
                              <span className="text-[10px] text-gray-400 block">{row.subcategory}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                          {row.imageUrl ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden mx-auto cursor-pointer group relative"
                              onClick={() => setPreviewImg(row.imageUrl)}>
                              <img src={row.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-300" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                                <Eye className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300">sin img</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`font-bold ${row.currentStock === 0 ? 'text-gray-400' : row.currentStock <= 5 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {row.currentStock || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={row.newStock}
                            onChange={e => updateNewStock(realIdx, parseInt(e.target.value) || 0)}
                            placeholder="Stock"
                            className="w-20 px-2 py-1 text-center bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-700 hidden md:table-cell">
                          ${row.priceRetail.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-400 hidden md:table-cell">
                          ${row.priceWholesale.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.isNew ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                              <Plus className="w-3 h-3" />Nuevo
                            </span>
                          ) : row.matched ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Existe</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Sube un Excel de Qianji para comenzar</p>
            <p className="text-gray-400 text-sm mt-1">SKU · Código de Barras · Categoría · Nombre ES/CN · Precios</p>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
