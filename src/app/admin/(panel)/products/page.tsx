'use client';

import { useEffect, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION_ID, CATEGORIES_COLLECTION_ID, STOCK_ALERTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID, SUBCATEGORIES_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Product, Category, Subcategory } from '@/types/admin';
import { Plus, Search, Pencil, Trash2, AlertTriangle, X, Package, RefreshCw, ChevronDown, ChevronUp, Download, Copy, Percent, Star, Boxes, Sparkles, OctagonX, MapPin, ArrowLeft, MessageSquare, Loader2, ImagePlus, ImageOff } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { generateProductTitle, generateProductDescription } from '@/lib/aiAdmin';
import { getBarcodeFromFeatures, getSkuFromFeatures, setBarcodeInFeatures, setSkuInFeatures, getWarehouseLocationFromFeatures, setSectionInFeatures } from '@/lib/product-features';
import Lottie from 'lottie-react';
import iaAnimation from '@/ia.json';

type ProductModalData = Partial<Product> & { _barcode?: string; _sku?: string };

import { MEDIA_BUCKET_ID, MEDIA_PREFIXES } from '@/lib/appwrite';
import { invalidateProductCache, cached, TTL } from '@/lib/cache';

const PRODUCTS_BUCKET_ID = MEDIA_BUCKET_ID; // Backward compatibility

const EMPTY: Partial<Product> = { NAME: '', DESCRIPTION: '', PRICE: 0, STOCK: 0, COST: 0, WHOLESALEPRICE: 0, WHOLESALEMINQUANTITY: 0, PACKQTY: 0, IMAGEURL: '', IMAGEURL2: '', IMAGEURL3: '', CATEGORYID: '' };

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
  const [imageUrlModal, setImageUrlModal] = useState<{ productId: string; currentUrl: string; newUrl: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<'title' | 'desc' | null>(null);
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [yexyOpen, setYexyOpen] = useState(false);
  const [yexyMessages, setYexyMessages] = useState<{role: string; content: string}[]>([]);
  const [yexyInput, setYexyInput] = useState('');
  const [yexyLoading, setYexyLoading] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, string[]>>({});
  const [brokenOnly, setBrokenOnly] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ checked: 0, broken: 0 });

  // AI Categorization states
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [aiCategorizeModal, setAiCategorizeModal] = useState(false);
  const [aiCategorizeMode, setAiCategorizeMode] = useState<'uncategorized' | 'all'>('uncategorized');
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [aiCategorizeSuggestions, setAiCategorizeSuggestions] = useState<any[]>([]);
  const [aiCategorizeProgress, setAiCategorizeProgress] = useState({ current: 0, total: 0 });
  const [approvedSuggestions, setApprovedSuggestions] = useState<Record<string, boolean>>({});
  const [applyingCategorization, setApplyingCategorization] = useState(false);
  const [applyingProgress, setApplyingProgress] = useState({ current: 0, total: 0 });

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
      invalidateProductCache();
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
      invalidateProductCache();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setApplyingPrice(false); }
  };

  const startAiCategorization = async () => {
    // 1. Filter products based on mode
    let targets = products;
    if (aiCategorizeMode === 'uncategorized') {
      targets = products.filter(p => !p.CATEGORYID || p.CATEGORYID.trim() === '');
    }

    if (targets.length === 0) {
      alert(aiCategorizeMode === 'uncategorized' 
        ? 'No hay productos sin categoría asignada.' 
        : 'No hay productos para procesar.'
      );
      return;
    }

    setAiCategorizing(true);
    setAiCategorizeSuggestions([]);
    setAiCategorizeProgress({ current: 0, total: targets.length });

    const batchSize = 50;
    const suggestionsList: any[] = [];
    const defaultApproved: Record<string, boolean> = {};

    try {
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        setAiCategorizeProgress({ current: i, total: targets.length });

        const res = await fetch('/api/ai-categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch.map(p => ({ $id: p.$id, NAME: p.NAME, DESCRIPTION: p.DESCRIPTION })),
            categories: categories.map(c => ({ $id: c.$id, name: c.name })),
            subcategories: subcategories.map(s => ({ $id: s.$id, name: s.name, categoryId: s.categoryId })),
          }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.ok ? await res.json() : { success: false, error: 'Request failed' };
        if (data.success && data.suggestions) {
          data.suggestions.forEach((s: any) => {
            // Find matched product from targets
            const p = targets.find(t => t.$id === s.productId);
            if (p) {
              suggestionsList.push({
                productId: s.productId,
                productName: p.NAME,
                currentCategoryId: p.CATEGORYID,
                suggestedCategoryId: s.categoryId,
                suggestedSubcategoryId: s.subcategoryId,
                reason: s.reason,
              });
              // Approve suggestions that actually find a category
              if (s.categoryId) {
                defaultApproved[s.productId] = true;
              }
            }
          });
          setAiCategorizeSuggestions([...suggestionsList]);
          setApprovedSuggestions({ ...defaultApproved });
        }
      }
      setAiCategorizeProgress({ current: targets.length, total: targets.length });
    } catch (e: any) {
      alert('Error durante el análisis: ' + e.message);
    } finally {
      setAiCategorizing(false);
    }
  };

  const applyAiCategorization = async () => {
    const toApply = aiCategorizeSuggestions.filter(s => approvedSuggestions[s.productId]);
    if (toApply.length === 0) {
      alert('No hay sugerencias aprobadas para aplicar.');
      return;
    }

    setApplyingCategorization(true);
    setApplyingProgress({ current: 0, total: toApply.length });

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      for (let i = 0; i < toApply.length; i++) {
        const item = toApply[i];
        setApplyingProgress({ current: i, total: toApply.length });

        const payload: any = {};
        if (item.suggestedCategoryId) payload.CATEGORYID = item.suggestedCategoryId;
        if (item.suggestedSubcategoryId) payload.SUBCATEGORYID = item.suggestedSubcategoryId;

        if (Object.keys(payload).length > 0) {
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, item.productId, payload);
        }
      }

      setApplyingProgress({ current: toApply.length, total: toApply.length });
      invalidateProductCache();
      alert(`¡Se categorizaron exitosamente ${toApply.length} producto(s)!`);
      setAiCategorizeModal(false);
      setAiCategorizeSuggestions([]);
      setApprovedSuggestions({});
      load();
    } catch (e: any) {
      alert('Error al aplicar categorizaciones: ' + e.message);
    } finally {
      setApplyingCategorization(false);
    }
  };

  const [lastCursor, setLastCursor] = useState<string | null>(null);

  const load = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setProducts([]);
    }
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const queries: any[] = [Query.limit(50), Query.orderDesc('$createdAt')];
      if (isLoadMore && lastCursor) queries.push(Query.cursorAfter(lastCursor));
      
      const resp: any = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, queries);
      const docs = resp.documents as unknown as Product[];
      
      const [cr, subRes] = await Promise.all([
        cached('categories:all', TTL.categories, async () => {
          return await databases.listDocuments(databaseId, CATEGORIES_COLLECTION_ID, [Query.limit(100)]);
        }),
        cached('subcategories:all', TTL.categories, async () => {
          return await databases.listDocuments(databaseId, SUBCATEGORIES_COLLECTION_ID, [Query.limit(500)]);
        }),
      ]);
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...docs]);
      } else {
        setProducts(docs);
      }
      
      if (docs.length === 50) {
        setLastCursor((docs[docs.length - 1] as any).$id);
      } else {
        setLastCursor(null);
      }
      
      setCategories(cr.documents as unknown as Category[]);
      setSubcategories(subRes.documents as unknown as Subcategory[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, [lastCursor]);

  const triggerSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) {
      load(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      const queries = [
        [Query.equal('sku', q)],
        [Query.equal('jumpseller_id', q)],
        [Query.equal('barcode', q)],
        [Query.contains('NAME', q)],
      ];

      let found: Product[] = [];

      for (const qry of queries) {
        try {
          const resp = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [...qry, Query.limit(100)]);
          if (resp.documents.length > 0) {
            found.push(...(resp.documents as unknown as Product[]));
            break;
          }
        } catch {}
      }

      if (found.length > 0) {
        setProducts(found);
        setLastCursor(null);
      } else {
        setProducts([]);
        alert('No se encontraron productos en el catálogo con ese SKU, código de barra o nombre.');
      }
    } catch (e: any) {
      setError('Error al buscar: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    const handler = () => load(false);
    window.addEventListener('yaxsel-data-change', handler);
    return () => window.removeEventListener('yaxsel-data-change', handler);
  }, []);

  const sendYexyMessage = async () => {
    if (!yexyInput.trim() || yexyLoading) return;
    const userMsg = yexyInput.trim();
    setYexyInput('');
    const contextPrefix = modal ? `[Contexto: Estoy editando el producto "${modal.data.NAME}" (ID: ${(modal.data as Product).$id}, Precio: ${modal.data.PRICE}, Stock: ${modal.data.STOCK}, Categoría: ${categories.find(c => c.$id === modal.data.CATEGORYID)?.name || 'Sin categoría'})] ` : '';
    const newMessages = [...yexyMessages, { role: 'user', content: contextPrefix + userMsg }];
    setYexyMessages(newMessages);
    setYexyLoading(true);
    try {
      const res = await fetch('/api/ai-sidekick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const assistantMsg = data.text || data.response || data.message || 'No pude procesar la solicitud.';
      setYexyMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
      // Execute actions if present
      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === 'update' && modal) {
            // Apply updates to the current product being edited
            setModal(m => m ? { ...m, data: { ...m.data, ...action.data } } : m);
          }
        }
      }
      // Check for inline action tags and execute them
      const createMatch = assistantMsg.match(/\[ACTION:CREATE_PRODUCT\]([\s\S]*?)\[\/ACTION\]/);
      const updateMatch = assistantMsg.match(/\[ACTION:UPDATE_PRODUCT\]([\s\S]*?)\[\/ACTION\]/);
      const deleteMatch = assistantMsg.match(/\[ACTION:DELETE_PRODUCT\]([\s\S]*?)\[\/ACTION\]/);
      if (createMatch || updateMatch || deleteMatch) {
        try {
          if (createMatch) {
            const actionData = JSON.parse(createMatch[1]);
            const res = await fetch('/api/products/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: actionData.name,
                price: actionData.price || 0,
                description: actionData.description || '',
                category: actionData.category || '',
                stock: actionData.stock || 0,
                tags: actionData.tags || '',
                sku: actionData.sku || '',
                barcode: actionData.barcode || '',
              }),
            });
            const result = await res.json();
            if (result.success) {
              setYexyMessages(prev => [...prev, { role: 'assistant', content: `✅ Producto "${actionData.name}" creado exitosamente.` }]);
              load();
            } else {
              setYexyMessages(prev => [...prev, { role: 'assistant', content: `❌ Error al crear: ${result.error}` }]);
            }
          } else if (updateMatch) {
            const actionData = JSON.parse(updateMatch[1]);
            if (modal) {
              setModal(m => m ? { ...m, data: { ...m.data, ...actionData } } : m);
            } else if (actionData.name) {
              const res = await fetch('/api/products/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actionData),
              });
              const result = await res.json();
              if (result.success) {
                setYexyMessages(prev => [...prev, { role: 'assistant', content: `✅ Producto "${actionData.name}" actualizado.` }]);
              } else {
                setYexyMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${result.error}` }]);
              }
            }
            load();
          } else if (deleteMatch) {
            const actionData = JSON.parse(deleteMatch[1]);
            const res = await fetch('/api/products/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: actionData.name }),
            });
            const result = await res.json();
            if (result.success) {
              setYexyMessages(prev => [...prev, { role: 'assistant', content: `🗑️ Producto "${actionData.name}" eliminado.` }]);
              load();
            } else {
              setYexyMessages(prev => [...prev, { role: 'assistant', content: `❌ Error al eliminar: ${result.error}` }]);
            }
          }
        } catch (e) {
          console.error('Error executing inline action:', e);
        }
      }
    } catch {
      setYexyMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con Yexy.' }]);
    } finally {
      setYexyLoading(false);
    }
  };

  const openAdd = () => setModal({ mode: 'add', data: { ...EMPTY, _barcode: '', _sku: '' } });
  const openEdit = (p: Product) => setModal({
    mode: 'edit',
    data: {
      ...p,
      _barcode: getBarcodeFromFeatures(p.FEATURES, p.barcode),
      _sku: getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id, p.sku),
    },
  });

  const duplicate = async (p: Product) => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const payload: Record<string, any> = {
        NAME: `${p.NAME} (copia)`, DESCRIPTION: p.DESCRIPTION || '',
        PRICE: p.PRICE, STOCK: 0, COST: p.COST || 0,
        WHOLESALEPRICE: p.WHOLESALEPRICE || 0, WHOLESALEMINQUANTITY: p.WHOLESALEMINQUANTITY || 0,
        IMAGEURL: p.IMAGEURL || '', IMAGEURL2: p.IMAGEURL2 || '',
        IMAGEURL3: p.IMAGEURL3 || '',
        CATEGORYID: p.CATEGORYID || '',
        TAGS: p.TAGS || '', FEATURES: p.FEATURES || '',
      };
      // IMAGEURL4/5 no existen en el schema (límite plan gratuito) — no enviarlos
      const doc = await databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), payload);
      setProducts(prev => [doc as unknown as Product, ...prev]);
      invalidateProductCache();
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
        PRICE: Math.round(Number(d.PRICE)) || 0, STOCK: Math.round(Number(d.STOCK)) || 0,
        COST: Math.round(Number(d.COST)) || 0,
        CURRENTPRICE: d.CURRENTPRICE ? Math.round(Number(d.CURRENTPRICE)) : null,
        WHOLESALEPRICE: Math.round(Number(d.WHOLESALEPRICE)) || 0,
        WHOLESALEMINQUANTITY: Math.round(Number(d.WHOLESALEMINQUANTITY)) || 0,
        PACKQTY: Math.round(Number(d.PACKQTY)) || 0,
        IMAGEURL: d.IMAGEURL || '', IMAGEURL2: d.IMAGEURL2 || '',
        IMAGEURL3: d.IMAGEURL3 || '',
        CATEGORYID: d.CATEGORYID || '',
        TAGS: d.TAGS || '',
        FEATURES: (() => {
          let features = d.FEATURES || '';
          features = setSkuInFeatures(features, d._sku || '');
          features = setBarcodeInFeatures(features, d._barcode || '');
          if ((d as Product).section != null) {
            features = setSectionInFeatures(features, (d as Product).section!);
          }
          return features;
        })(),
      };
      // Campos opcionales que pueden no existir en el schema
      const optionalFields: Record<string, any> = {
        barcode: d._barcode || '',
        sku: d._sku || '',
      };
      if ((d as Product).section != null) optionalFields.section = (d as Product).section;
      // IMAGEURL4/5 no existen en el schema — no enviarlos
      
      // Check if stock is being restocked (from 0 to >0) on edit
      let stockRestocked = false;
      const previousProduct = modal.mode === 'edit' ? products.find(p => p.$id === (d as Product).$id) : null;
      if (previousProduct && (previousProduct.STOCK ?? 0) === 0 && payload.STOCK > 0) {
        stockRestocked = true;
      }

      // Intentar con campos opcionales; si falla por atributo desconocido, reintentar sin ellos
      const fullPayload = { ...payload, ...optionalFields };
      const doSave = async (data: Record<string, any>) => {
        if (modal.mode === 'add') {
          const nameLower = (data.NAME || '').toLowerCase().trim();
          const duplicate = products.find(p => p.NAME?.toLowerCase().trim() === nameLower);
          if (duplicate && !window.confirm(`Ya existe un producto con el nombre "${duplicate.NAME}". ¿Continuar de todas formas?`)) { setIsSaving(false); throw new Error('cancelled'); }
          const doc = await databases.createDocument(databaseId, PRODUCTS_COLLECTION_ID, ID.unique(), data);
          setProducts(prev => [doc as unknown as Product, ...prev]);
        } else {
          const doc = await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, (d as Product).$id, data);
          setProducts(prev => prev.map(p => p.$id === (d as Product).$id ? doc as unknown as Product : p));
        }
      };

      try {
        await doSave(fullPayload);
      } catch (err: any) {
        if (err?.message === 'cancelled') throw err;
        // Si falla por atributo desconocido, reintentar sin campos opcionales
        if (err?.message?.includes('Unknown attribute')) {
          await doSave(payload);
        } else {
          throw err;
        }
      }
      
      // Auto-add to cart & notify users who requested this product
      if (stockRestocked && (d as Product).$id) {
        try {
          const res = await fetch('/api/stock-alerts/auto-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: (d as Product).$id,
              productName: d.NAME,
              productImage: d.IMAGEURL || '',
              productPrice: d.PRICE || 0,
            }),
          });
          const data = await res.json();
          if (data.autoAdded > 0) {
            console.log(`✅ Auto-agregado al carrito de ${data.autoAdded} usuarios, producto "${d.NAME}"`);
          }
        } catch (alertErr) {
          console.error('Error auto-adding to cart:', alertErr);
        }
      }
      
      setModal(null);
      invalidateProductCache();
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
      invalidateProductCache();
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
      invalidateProductCache();
      
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

  const saveImageUrl = async () => {
    if (!imageUrlModal) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, imageUrlModal.productId, {
        IMAGEURL: imageUrlModal.newUrl,
      });
      setProducts(prev => prev.map(p => p.$id === imageUrlModal.productId ? { ...p, IMAGEURL: imageUrlModal.newUrl } : p));
      setImageUrlModal(null);
      invalidateProductCache();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

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
    getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id, p.sku) || p.$id;

  const getBarcode = (p: Product) => getBarcodeFromFeatures(p.FEATURES, p.barcode);

  const getSection = (p: Product): { section: number; gondola: string } | null => {
    const loc = getWarehouseLocationFromFeatures(p.FEATURES, p.section ?? null);
    if (loc.section === null) return null;
    return { section: loc.section, gondola: loc.gondola || '?' };
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

  const syncBrokenImages = async () => {
    if (products.length === 0) return;
    setSyncingImages(true);
    setBrokenImages({});
    setSyncProgress({ checked: 0, broken: 0 });
    const result: Record<string, string[]> = {};
    let checked = 0;
    let broken = 0;
    const BATCH = 10;
    const allImages = products.flatMap(p =>
      [p.IMAGEURL, p.IMAGEURL2, p.IMAGEURL3]
        .filter(Boolean)
        .map(url => ({ productId: p.$id, url: url! }))
    );
    for (let i = 0; i < allImages.length; i += BATCH) {
      const batch = allImages.slice(i, i + BATCH);
      await Promise.all(batch.map(async ({ productId, url }) => {
        try {
          const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          // no-cors always returns opaque, so we need a different approach
          // Use img tag loading via promise
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
              if (!result[productId]) result[productId] = [];
              result[productId].push(url);
              broken++;
              resolve();
            };
            img.src = url;
          });
        } catch {
          if (!result[productId]) result[productId] = [];
          result[productId].push(url);
          broken++;
        }
      }));
      checked += batch.length;
      setSyncProgress({ checked, broken });
      setBrokenImages({ ...result });
    }
    setSyncingImages(false);
  };

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
    const matchBroken = !brokenOnly || brokenImages[p.$id]?.length;
    return matchSearch && matchCat && matchStock && matchNoImage && matchBroken;
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

      {/* ═══════════════════════════════════════════════════════════════
          FULL-PAGE PRODUCT EDITOR (replaces table when modal is active)
         ═══════════════════════════════════════════════════════════════ */}
      {modal && (
        <div className="min-h-[calc(100vh-140px)]">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setModal(null); setYexyOpen(false); setYexyMessages([]); }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{modal.mode === 'add' ? 'Nuevo Producto' : 'Editar Producto'}</h1>
                {modal.mode === 'edit' && <p className="text-xs text-gray-400 mt-0.5">ID: {(modal.data as Product).$id}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setYexyOpen(!yexyOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${yexyOpen ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'}`}>
                <MessageSquare className="w-4 h-4" /> Preguntar a Yexy
              </button>
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={save} disabled={isSaving} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2">
                {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Main editor area */}
            <div className={`flex-1 space-y-6 ${yexyOpen ? 'max-w-[calc(100%-380px)]' : ''}`}>
              {/* Product image + basic info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex gap-6 flex-col lg:flex-row">
                  {/* Image section */}
                  <div className="lg:w-80 shrink-0 space-y-3">
                    <ImageUploadField label="Imagen Principal" bucketId={PRODUCTS_BUCKET_ID}
                      value={modal.data.IMAGEURL || ''}
                      onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL: v } } : m)} />
                    <div className="grid grid-cols-2 gap-2">
                      <ImageUploadField label="Imagen 2" bucketId={PRODUCTS_BUCKET_ID}
                        value={modal.data.IMAGEURL2 || ''}
                        onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL2: v } } : m)} />
                      <ImageUploadField label="Imagen 3" bucketId={PRODUCTS_BUCKET_ID}
                        value={modal.data.IMAGEURL3 || ''}
                        onChange={v => setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL3: v } } : m)} />
                    </div>
                  </div>
                  {/* Name + Description */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Nombre del producto *</label>
                        <button type="button" disabled={aiLoading === 'title'} onClick={async () => {
                          setAiLoading('title'); setAiTitles([]);
                          try {
                            const catName = categories.find(c => c.$id === modal.data.CATEGORYID)?.name || '';
                            const titles = await generateProductTitle(modal.data.DESCRIPTION || modal.data.NAME || '', catName);
                            setAiTitles(titles);
                          } catch (e: any) { alert(e.message); }
                          finally { setAiLoading(null); }
                        }} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                          <Sparkles className="w-3.5 h-3.5" /> {aiLoading === 'title' ? 'Generando...' : 'Sugerir con IA'}
                        </button>
                      </div>
                      <input value={modal.data.NAME || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, NAME: e.target.value } } : m)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre del producto" />
                      {aiTitles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {aiTitles.map((t, i) => (
                            <button key={i} type="button" onClick={() => { setModal(m => m ? { ...m, data: { ...m.data, NAME: t } } : m); setAiTitles([]); }}
                              className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-100 transition-colors truncate max-w-full">
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Descripción</label>
                        <button type="button" disabled={aiLoading === 'desc'} onClick={async () => {
                          setAiLoading('desc');
                          try {
                            const catName = categories.find(c => c.$id === modal.data.CATEGORYID)?.name || '';
                            const desc = await generateProductDescription(modal.data.NAME || '', catName, modal.data.DESCRIPTION || '');
                            setModal(m => m ? { ...m, data: { ...m.data, DESCRIPTION: desc } } : m);
                          } catch (e: any) { alert(e.message); }
                          finally { setAiLoading(null); }
                        }} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                          <Sparkles className="w-3.5 h-3.5" /> {aiLoading === 'desc' ? 'Generando...' : 'Generar con IA'}
                        </button>
                      </div>
                      <textarea value={modal.data.DESCRIPTION || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, DESCRIPTION: e.target.value } } : m)}
                        rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Describe tu producto..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Precios e Inventario
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio Normal (CLP)</label>
                    <input type="number" value={modal.data.PRICE ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, PRICE: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Costo</label>
                    <input type="number" value={modal.data.COST ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, COST: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                    <input type="number" value={modal.data.STOCK ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, STOCK: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {Number(modal.data.STOCK) === 0 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ Stock en 0 — agotado</p>
                    )}
                    {Number(modal.data.STOCK) > 0 && Number(modal.data.STOCK) <= 5 && (
                      <p className="text-xs text-amber-500 mt-1">⚠ Stock bajo ({modal.data.STOCK} un.)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Organization & Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Organización y Detalles
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio Mayorista</label>
                    <input type="number" value={modal.data.WHOLESALEPRICE ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, WHOLESALEPRICE: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cant. Mínima Mayorista</label>
                    <input type="number" value={modal.data.WHOLESALEMINQUANTITY ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, WHOLESALEMINQUANTITY: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cant. por paquete</label>
                    <input type="number" value={modal.data.PACKQTY ?? ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, PACKQTY: Number(e.target.value) } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                    <input type="text" value={modal.data._sku ?? ''}
                      onChange={e => setModal(m => m ? { ...m, data: { ...m.data, _sku: e.target.value } } : m)}
                      placeholder="Código interno"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código de barras</label>
                    <input type="text" value={modal.data._barcode ?? ''}
                      onChange={e => setModal(m => m ? { ...m, data: { ...m.data, _barcode: e.target.value } } : m)}
                      placeholder="EAN / UPC"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sección (ubicación)</label>
                    <input type="number" value={(modal.data as Product).section ?? ''}
                      onChange={e => setModal(m => m ? { ...m, data: { ...m.data, section: e.target.value ? Number(e.target.value) : undefined } } : m)}
                      placeholder="Ej: 5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags (separados por coma)</label>
                    <input type="text" value={modal.data.TAGS || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, TAGS: e.target.value } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="tag1, tag2, tag3" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Características (otras)</label>
                    <input type="text" value={modal.data.FEATURES || ''} onChange={e => setModal(m => m ? { ...m, data: { ...m.data, FEATURES: e.target.value } } : m)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-gray-400 mt-1">SKU y código de barras se guardan en los campos de arriba.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yexy side panel */}
            {yexyOpen && (
              <div className="w-[360px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">Y</div>
                    <span className="text-sm font-semibold text-gray-800">Yexy</span>
                    <span className="text-[10px] text-gray-400">para este producto</span>
                  </div>
                  <button onClick={() => setYexyOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {yexyMessages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto rounded-full bg-violet-50 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-violet-500" />
                      </div>
                      <p className="text-sm text-gray-500">Pregúntale algo sobre este producto</p>
                      <p className="text-xs text-gray-400 mt-1">Yexy ya sabe qué producto estás editando</p>
                      <div className="mt-4 space-y-2">
                        {['Mejora la descripción', 'Sugiere un precio competitivo', 'Genera tags para SEO'].map(s => (
                          <button key={s} onClick={() => { setYexyInput(s); }} className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-violet-50 text-gray-600 hover:text-violet-700 transition">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {yexyMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {yexyLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Pensando...
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input type="file" id="yexy-file-input" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setYexyLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        if (modal?.data?.$id) formData.append('productId', (modal.data as Product).$id);
                        formData.append('imageField', 'IMAGEURL');
                        const res = await fetch('/api/products/upload-image', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) {
                          setYexyMessages(prev => [...prev, { role: 'user', content: '📷 Imagen enviada' }, { role: 'assistant', content: '✅ Imagen subida y asignada al producto.' }]);
                          if (modal?.data) setModal(m => m ? { ...m, data: { ...m.data, IMAGEURL: data.imageUrl } } : m);
                          load();
                        } else {
                          setYexyMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }]);
                        }
                      } catch { setYexyMessages(prev => [...prev, { role: 'assistant', content: '❌ Error al subir imagen.' }]); }
                      finally { setYexyLoading(false); (e.target as HTMLInputElement).value = ''; }
                    }} />
                    <button onClick={() => document.getElementById('yexy-file-input')?.click()} disabled={yexyLoading}
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition disabled:opacity-50" title="Subir imagen">
                      <ImagePlus className="w-4 h-4" />
                    </button>
                    <input value={yexyInput} onChange={e => setYexyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendYexyMessage(); } }}
                      placeholder="Escribe tu pregunta..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <button onClick={sendYexyMessage} disabled={yexyLoading || !yexyInput.trim()}
                      className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT LIST (shown when modal is NOT active)
         ═══════════════════════════════════════════════════════════════ */}
      {!modal && (
        <>
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
          <button onClick={() => setAiCategorizeModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm" title="Categorizar productos usando IA">
            <Sparkles className="w-4 h-4" /> Categorizar con Yexy
          </button>
          <button onClick={() => load(false)} disabled={isLoading} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={syncBrokenImages} disabled={syncingImages || products.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
              syncingImages ? 'bg-amber-50 border border-amber-200 text-amber-700' :
              Object.keys(brokenImages).length > 0 ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100' :
              'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`} title="Verificar imágenes rotas">
            {syncingImages ? <><Loader2 className="w-4 h-4 animate-spin" />{syncProgress.checked}/{products.flatMap(p => [p.IMAGEURL, p.IMAGEURL2, p.IMAGEURL3].filter(Boolean)).length}</> :
             Object.keys(brokenImages).length > 0 ? <><ImageOff className="w-4 h-4" />{Object.keys(brokenImages).length} rotas</> :
             <><ImageOff className="w-4 h-4" />Verificar fotos</>}
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
        {Object.keys(brokenImages).length > 0 && (
          <button onClick={() => setBrokenOnly(v => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              brokenOnly ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}>
            <ImageOff className="w-3 h-3" />
            Fotos rotas
            <span className={`text-[10px] font-bold px-1 rounded-full ${brokenOnly ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{Object.keys(brokenImages).length}</span>
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                triggerSearch(search);
              }
            }}
            placeholder="SKU, barra o nombre (Enter para buscar en BD)..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && <button onClick={() => { setSearch(''); load(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
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
                      <button onClick={() => { openEdit(p); setTimeout(() => setYexyOpen(true), 100); }} className="relative shrink-0 group" title="Preguntar a Yexy AI">
                        <div className="w-10 h-10">
                          <Lottie animationData={iaAnimation} loop={true} autoplay={true} className="w-full h-full" />
                        </div>
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-violet-600 text-white rounded px-1 leading-tight">IA</span>
                      </button>
                      <div className="relative w-10 h-10 shrink-0 cursor-pointer group" onClick={() => setImageUrlModal({ productId: p.$id, currentUrl: p.IMAGEURL || '', newUrl: p.IMAGEURL || '' })} title="Click para cambiar imagen">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden">
                          {p.IMAGEURL ? <img src={p.IMAGEURL} alt={p.NAME} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />}
                        </div>
                        {brokenImages[p.$id]?.length && (
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title={`${brokenImages[p.$id].length} imagen(es) rota(s)`}>
                            <ImageOff className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3 h-3 text-white" />
                        </div>
                        {(() => { const cnt = [p.IMAGEURL, p.IMAGEURL2, p.IMAGEURL3].filter(Boolean).length; return cnt > 1 ? <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{cnt}</span> : null; })()}
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
                      {p.PACKQTY ? <span className="text-[9px] text-gray-400">×{p.PACKQTY}/pq</span> : null}
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

      {lastCursor && !isLoading && (
        <div className="flex justify-center my-4">
          <button
            onClick={() => load(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
          >
            Cargar más productos
          </button>
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

      {/* Image URL replacement modal */}
      {imageUrlModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <p className="font-bold text-gray-900">Cambiar imagen</p>
              <button onClick={() => setImageUrlModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
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
              <button onClick={saveImageUrl} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Categorization Modal (Yexy) */}
      {aiCategorizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">Categorización Inteligente con Yexy</p>
                  <p className="text-xs text-gray-500 mt-0.5">Organiza tu catálogo de forma automática usando Inteligencia Artificial</p>
                </div>
              </div>
              <button onClick={() => {
                if (aiCategorizing || applyingCategorization) return;
                setAiCategorizeModal(false);
                setAiCategorizeSuggestions([]);
              }} disabled={aiCategorizing || applyingCategorization} className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {/* State 1: Configuration */}
              {aiCategorizeSuggestions.length === 0 && !aiCategorizing && (
                <div className="space-y-6 max-w-lg mx-auto py-4">
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex gap-3 text-sm text-violet-800">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-violet-600" />
                    <div>
                      <p className="font-semibold">¿Cómo funciona?</p>
                      <p className="text-violet-700/95 mt-1 leading-relaxed text-xs">
                        Yexy analizará el título y la descripción de tus productos para recomendarte la categoría y la subcategoría que mejor se ajusten de entre las que tienes registradas. Luego podrás revisar las propuestas antes de aplicarlas.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">¿Qué productos quieres categorizar?</label>
                    <div className="grid grid-cols-1 gap-3">
                      <label className={`border rounded-xl p-4 flex items-start gap-3 cursor-pointer transition ${aiCategorizeMode === 'uncategorized' ? 'border-violet-600 bg-violet-50/40 ring-2 ring-violet-100' : 'border-gray-200 hover:bg-gray-50 bg-white'}`}>
                        <input type="radio" name="ai-mode" checked={aiCategorizeMode === 'uncategorized'} onChange={() => setAiCategorizeMode('uncategorized')} className="mt-1 text-violet-600 focus:ring-violet-500" />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">Solo productos sin categoría</p>
                          <p className="text-xs text-gray-500 mt-1">Recomendado. Procesará únicamente los productos que no tienen ninguna categoría asignada ({products.filter(p => !p.CATEGORYID || p.CATEGORYID.trim() === '').length} encontrados).</p>
                        </div>
                      </label>

                      <label className={`border rounded-xl p-4 flex items-start gap-3 cursor-pointer transition ${aiCategorizeMode === 'all' ? 'border-violet-600 bg-violet-50/40 ring-2 ring-violet-100' : 'border-gray-200 hover:bg-gray-50 bg-white'}`}>
                        <input type="radio" name="ai-mode" checked={aiCategorizeMode === 'all'} onChange={() => setAiCategorizeMode('all')} className="mt-1 text-violet-600 focus:ring-violet-500" />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">Todos los productos</p>
                          <p className="text-xs text-gray-500 mt-1">Procesará la totalidad de tu catálogo de productos ({products.length} productos) para re-evaluarlos.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <button onClick={startAiCategorization} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-100 transition duration-150">
                      <Sparkles className="w-5 h-5" /> Comenzar Análisis
                    </button>
                  </div>
                </div>
              )}

              {/* State 2: Categorizing (Progress) */}
              {aiCategorizing && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-gray-800 text-lg">Yexy está analizando tu catálogo...</p>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      Este proceso se realiza en lotes eficientes de 10 productos para garantizar la máxima precisión. Por favor, no cierres esta ventana.
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${(aiCategorizeProgress.current / aiCategorizeProgress.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                    {aiCategorizeProgress.current} de {aiCategorizeProgress.total} productos procesados
                  </span>
                </div>
              )}

              {/* State 3: Suggestion Review */}
              {aiCategorizeSuggestions.length > 0 && !aiCategorizing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2 bg-violet-50 border border-violet-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-violet-800">
                      <Sparkles className="w-4 h-4 shrink-0 text-violet-600" />
                      <span className="text-xs font-semibold">Se encontraron {aiCategorizeSuggestions.length} sugerencias. Desmarca las que no quieras aplicar.</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const next: Record<string, boolean> = {};
                        aiCategorizeSuggestions.forEach(s => { next[s.productId] = true; });
                        setApprovedSuggestions(next);
                      }} className="text-[11px] font-bold text-violet-700 hover:text-violet-800 bg-white border border-violet-200 px-2.5 py-1 rounded-lg transition">Marcar todo</button>
                      <button onClick={() => setApprovedSuggestions({})} className="text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg transition">Desmarcar todo</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto max-h-[45vh]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <th className="p-4 w-12 text-center">OK</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría Sugerida</th>
                            <th className="p-4">Subcategoría Sugerida</th>
                            <th className="p-4">Justificación de Yexy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {aiCategorizeSuggestions.map(s => {
                            const cat = categories.find(c => c.$id === s.suggestedCategoryId);
                            const sub = subcategories.find(sub => sub.$id === s.suggestedSubcategoryId);
                            return (
                              <tr key={s.productId} className={`hover:bg-gray-50/50 transition ${approvedSuggestions[s.productId] ? '' : 'opacity-60 bg-gray-50/20'}`}>
                                <td className="p-4 text-center">
                                  <input type="checkbox" checked={approvedSuggestions[s.productId] || false} onChange={e => setApprovedSuggestions(prev => ({ ...prev, [s.productId]: e.target.checked }))} className="rounded text-violet-600 focus:ring-violet-500" />
                                </td>
                                <td className="p-4 font-medium text-gray-900 max-w-[200px] truncate" title={s.productName}>{s.productName}</td>
                                <td className="p-4">
                                  {cat ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {cat.name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">No identificada</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {sub ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                                      {sub.name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Sin subcategoría</span>
                                  )}
                                </td>
                                <td className="p-4 text-xs text-gray-500 leading-relaxed max-w-[250px] truncate" title={s.reason}>{s.reason || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* State 4: Applying (Saving) */}
              {applyingCategorization && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-100 border-t-indigo-600 animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-gray-800 text-lg">Guardando categorizaciones...</p>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      Actualizando tu catálogo de productos en la base de datos de Appwrite. Por favor, no cierres esta ventana.
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${(applyingProgress.current / applyingProgress.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                    Actualizando: {applyingProgress.current} de {applyingProgress.total} productos
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-5 border-t border-gray-100 bg-gray-50">
              <div>
                {aiCategorizeSuggestions.length > 0 && !aiCategorizing && !applyingCategorization && (
                  <span className="text-xs font-medium text-gray-500">
                    Aprobados: <span className="font-bold text-violet-700">{aiCategorizeSuggestions.filter(s => approvedSuggestions[s.productId]).length}</span> de {aiCategorizeSuggestions.length} sugerencias
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  disabled={aiCategorizing || applyingCategorization}
                  onClick={() => {
                    setAiCategorizeModal(false);
                    setAiCategorizeSuggestions([]);
                    setApprovedSuggestions({});
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {aiCategorizeSuggestions.length > 0 ? 'Descartar todo' : 'Cerrar'}
                </button>

                {aiCategorizeSuggestions.length > 0 && !aiCategorizing && !applyingCategorization && (
                  <button
                    onClick={applyAiCategorization}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 shadow-md shadow-violet-100 transition"
                  >
                    <Sparkles className="w-4 h-4" /> Aplicar Categorizaciones
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
