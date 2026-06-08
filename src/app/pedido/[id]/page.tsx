'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Upload, Copy, Check, AlertTriangle, MapPin, Package, Truck, Shield, FileText, RefreshCw, Pencil, X, Plus, Minus, Trash2, Search } from 'lucide-react';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION, PRODUCTS_COLLECTION, MEDIA_BUCKET_ID, formatPrice, Query, ID } from '@/lib/appwrite';
import { resolveStorageImageUrl } from '@/lib/product-images';
import { Order, OrderItem, Product } from '@/types';
import { generateOrderPdf } from '@/lib/generateOrderPdf';

const BANK_DEFAULTS = {
  bankAccountHolder: 'YESBELLA LTDA.',
  bankRut: '77.270.689-8',
  bankName: 'BCI',
  bankAccountType: 'Cuenta Corriente',
  bankAccountNumber: '32590547',
  bankEmail: 'kevincoco0819@gmail.com',
};

function getBankDetails(): Record<string, string> {
  try {
    const stored = localStorage.getItem('store_bank_details');
    const p = stored ? { ...BANK_DEFAULTS, ...JSON.parse(stored) } : BANK_DEFAULTS;
    return {
      'Titular': p.bankAccountHolder || 'No configurado',
      'RUT': p.bankRut || 'No configurado',
      'Banco': p.bankName || 'No configurado',
      'Tipo de cuenta': p.bankAccountType || 'Cuenta Vista',
      'N° de cuenta': p.bankAccountNumber || 'No configurado',
      'Email': p.bankEmail || 'No configurado',
    };
  } catch {
    return {
      'Titular': BANK_DEFAULTS.bankAccountHolder,
      'RUT': BANK_DEFAULTS.bankRut,
      'Banco': BANK_DEFAULTS.bankName,
      'Tipo de cuenta': BANK_DEFAULTS.bankAccountType,
      'N° de cuenta': BANK_DEFAULTS.bankAccountNumber,
      'Email': BANK_DEFAULTS.bankEmail,
    };
  }
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendiente de pago',  color: '#b45309', bg: '#fffbeb' },
  processing: { label: 'En proceso',         color: '#1558b0', bg: '#e8f0fe' },
  paid:       { label: 'Pago confirmado',    color: '#166534', bg: '#f0fdf4' },
  shipped:    { label: 'Despachado',         color: '#6b21a8', bg: '#faf5ff' },
  delivered:  { label: 'Entregado',          color: '#166534', bg: '#f0fdf4' },
  cancelled:  { label: 'Cancelado',          color: '#991b1b', bg: '#fff5f5' },
};

function Timer({ expiresAt }: { expiresAt: number }) {
  const [display, setDisplay] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setDisplay('Expirado'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 15 * 60000);
      setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: urgent ? '#dc2626' : '#d97706' }}>{display}</span>;
}

const MAX_CUSTOMER_EDITS = 2;

function getProductSku(p: any): string {
  const direct = p?.SKU || p?.sku || '';
  if (direct && String(direct).trim()) return String(direct).trim();
  const feats = Array.isArray(p?.FEATURES) ? p.FEATURES.join('\n') : (p?.FEATURES || '');
  const m = String(feats || '').match(/SKU:\s*(.+)/i);
  return m ? m[1].trim().split('\n')[0] : '';
}

function getProductBarcode(p: any): string {
  const direct = p?.BARCODE || p?.barcode || '';
  if (direct && String(direct).trim()) return String(direct).trim();
  const feats = Array.isArray(p?.FEATURES) ? p.FEATURES.join('\n') : (p?.FEATURES || '');
  const m = String(feats || '').match(/Barcode:\s*(.+)/i);
  return m ? m[1].trim().split('\n')[0] : '';
}

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [agencies, setAgencies] = useState<{ name: string }[]>([]);
  const [showAgencyChange, setShowAgencyChange] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState('');
  const [savingAgency, setSavingAgency] = useState(false);

  // ── Customer edit/cancel (max 2 cambios) ──
  const [editOpen, setEditOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<OrderItem[]>([]);
  const [originalQtyById, setOriginalQtyById] = useState<Record<string, number>>({});
  const [productStockById, setProductStockById] = useState<Record<string, number>>({});
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editError, setEditError] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [imageModal, setImageModal] = useState<{ src: string; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const doc = await databases.getDocument(databaseId, ORDERS_COLLECTION, id);
      const o = doc as unknown as Order;
      setOrder(o);
      if (o.PAYMENTPROOFURL) setUploaded(true);
      try { setItems(JSON.parse(o.ITEMS)); } catch {}
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Load agencies
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agencies');
        const data = await res.json();
        if (data.agencies) setAgencies(data.agencies);
      } catch {}
    })();
  }, []);

  async function handleChangeAgency() {
    if (!order || !selectedAgency || savingAgency) return;
    setSavingAgency(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, ORDERS_COLLECTION, id, {
        SHIPPINGAGENCY: selectedAgency,
        AGENCYCHANGED: true,
      });
      setOrder(prev => prev ? { ...prev, SHIPPINGAGENCY: selectedAgency, AGENCYCHANGED: true } : prev);
      setShowAgencyChange(false);
    } catch {
      alert('Error al cambiar la agencia. Intenta de nuevo.');
    } finally {
      setSavingAgency(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    try {
      const { storage, databases } = getServices();
      const { databaseId, endpoint, projectId } = getAppwriteConfig();
      const fileId = ID.unique();
      const up = await storage.createFile(MEDIA_BUCKET_ID, fileId, file);
      const url = `${endpoint}/storage/buckets/${MEDIA_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
      await databases.updateDocument(databaseId, ORDERS_COLLECTION, id, { PAYMENTPROOFURL: url, STATUS: 'processing' });
      setUploaded(true);
      await load();
    } catch { alert('Error al subir el comprobante. Intenta de nuevo.'); }
    finally { setUploading(false); }
  }

  function copyField(key: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
    const text = Object.entries(getBankDetails()).map(([k, v]) => `${k}: ${v}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(null), 2000);
  }

  function getCustomerEditCount(o: Order): number {
    const anyO = o as any;
    const v = anyO.CUSTOMEREDITCOUNT ?? anyO.customerEditCount ?? anyO.EDITCOUNT ?? anyO.editCount ?? 0;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  }

  function computeSubtotal(list: OrderItem[]) {
    return list.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0);
  }

  function getMaxQtyFor(productId: string, currentStockFallback?: number): number | null {
    const stock = productStockById[productId] ?? currentStockFallback;
    if (stock === undefined || !Number.isFinite(stock)) return null;
    const original = Number(originalQtyById[productId] ?? 0) || 0;
    // El stock actual ya tiene descontada la reserva del pedido; por eso el máximo posible es:
    // qty_original_en_pedido + stock_disponible_actual
    return Math.max(0, original + stock);
  }

  async function loadStocksFor(ids: string[]) {
    const uniq = Array.from(new Set(ids.filter(Boolean)));
    if (uniq.length === 0) return;
    setLoadingStocks(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const out: Record<string, number> = {};
      await Promise.all(uniq.map(async (pid) => {
        try {
          const doc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, pid);
          out[pid] = Number((doc as any).STOCK ?? 0);
        } catch {
          // si falla, dejamos sin stock (null) para no bloquear UI; el guardado validará igual
        }
      }));
      setProductStockById(prev => ({ ...prev, ...out }));
    } finally {
      setLoadingStocks(false);
    }
  }

  function openEditor() {
    if (!order) return;
    setEditError('');
    setProductSearch('');
    setProductResults([]);
    // Clonar items actuales como base
    const base = (items || []).map(it => ({ ...it, qty: Math.max(1, Number(it.qty) || 1) }));
    const orig: Record<string, number> = {};
    for (const it of base) orig[it.id] = Number(it.qty) || 0;
    setOriginalQtyById(orig);
    setDraftItems(base);
    loadStocksFor(base.map(i => i.id));
    setEditOpen(true);
  }

  function closeEditor() {
    setEditOpen(false);
    setEditError('');
    setProductSearch('');
    setProductResults([]);
  }

  // Cerrar modal de imagen con ESC
  useEffect(() => {
    if (!imageModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageModal(null);
    };
    document.addEventListener('keydown', onKeyDown);
    // bloquear scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageModal]);

  function setQty(productId: string, qty: number) {
    setDraftItems(prev => prev.map(it => {
      if (it.id !== productId) return it;
      const minQ = 1;
      const maxQ = getMaxQtyFor(productId, (it as any).stock);
      const next = Math.max(minQ, qty);
      const clamped = maxQ != null ? Math.min(next, maxQ) : next;
      const price = Number(it.price) || 0;
      return { ...it, qty: clamped, total: price * clamped };
    }));
  }

  function removeDraft(productId: string) {
    setDraftItems(prev => prev.filter(it => it.id !== productId));
  }

  async function searchProducts() {
    const q = productSearch.trim();
    if (q.length < 2) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Primero intentamos búsqueda nativa; si falla por permisos/índices, fallback a listar y filtrar.
      try {
        const seen = new Set<string>();
        const merged: Product[] = [];

        const resByName = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
          Query.search('NAME', q),
          Query.limit(20),
        ]);
        for (const d of (resByName.documents as any[])) {
          const id = String((d as any).$id || '');
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push(d as Product);
        }

        // Intentar también búsqueda por FEATURES (SKU/Barcode). Si no existe índice o falla, lo ignoramos.
        try {
          const resByFeatures = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
            Query.search('FEATURES', q),
            Query.limit(20),
          ]);
          for (const d of (resByFeatures.documents as any[])) {
            const id = String((d as any).$id || '');
            if (!id || seen.has(id)) continue;
            seen.add(id);
            merged.push(d as Product);
          }
        } catch {}

        const list = merged.slice(0, 20);
        setProductResults(list);
        // cachear stock para usarlo en límites de cantidad
        const stockMap: Record<string, number> = {};
        for (const p of list as any[]) {
          if (p?.$id && Number.isFinite(Number(p?.STOCK))) stockMap[String(p.$id)] = Number(p.STOCK);
        }
        if (Object.keys(stockMap).length) setProductStockById(prev => ({ ...prev, ...stockMap }));
      } catch {
        const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [Query.limit(80)]);
        const docs = (res.documents as unknown as Product[]) || [];
        const qq = q.toLowerCase();
        const list = docs
          .filter((p: any) => {
            const name = String(p?.NAME || '').toLowerCase();
            const sku = getProductSku(p).toLowerCase();
            const barcode = getProductBarcode(p).toLowerCase();
            const tags = Array.isArray(p?.TAGS) ? p.TAGS.join(',') : (p?.TAGS || '');
            const feats = Array.isArray(p?.FEATURES) ? p.FEATURES.join('\n') : (p?.FEATURES || '');
            const hay = `${name}\n${sku}\n${barcode}\n${String(tags).toLowerCase()}\n${String(feats).toLowerCase()}`;
            return hay.includes(qq);
          })
          .slice(0, 20);
        setProductResults(list);
        const stockMap: Record<string, number> = {};
        for (const p of list as any[]) {
          if (p?.$id && Number.isFinite(Number(p?.STOCK))) stockMap[String(p.$id)] = Number(p.STOCK);
        }
        if (Object.keys(stockMap).length) setProductStockById(prev => ({ ...prev, ...stockMap }));
      }
    } catch (e) {
      console.error(e);
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }

  function addProductToDraft(p: Product) {
    setDraftItems(prev => {
      const idx = prev.findIndex(x => x.id === p.$id);
      const price = (p.CURRENTPRICE ?? p.PRICE ?? 0) as number;
      const img = resolveStorageImageUrl(p.IMAGEURL);
      const pid = String((p as any).$id || '');
      const directStock = Number((p as any).STOCK ?? 0);
      if (idx >= 0) {
        const cur = prev[idx];
        const newQty = (cur.qty || 1) + 1;
        const curPrice = Number(cur.price) || 0;
        const maxQ = getMaxQtyFor(cur.id, directStock);
        if (maxQ != null && newQty > maxQ) {
          alert('No hay más stock disponible para este producto.');
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...cur, qty: newQty, total: curPrice * newQty };
        return next;
      }
      const maxNew = getMaxQtyFor(pid, directStock);
      if (maxNew != null && maxNew <= 0) {
        alert('Este producto no tiene stock disponible.');
        return prev;
      }
      return [
        ...prev,
        { id: p.$id, name: p.NAME, price, qty: 1, img, total: price, stock: directStock },
      ];
    });

    const pid = String((p as any).$id || '');
    const directStock = Number((p as any).STOCK ?? 0);
    if (pid && Number.isFinite(directStock)) {
      setProductStockById(s => ({ ...s, [pid]: directStock }));
    }
  }

  async function handleSaveEdits() {
    if (!order || savingEdit) return;
    if (draftItems.length === 0) { setEditError('El pedido debe tener al menos 1 producto.'); return; }

    setSavingEdit(true);
    setEditError('');

    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Releer doc para evitar carreras (estado/contador/stock)
      const latestDoc = await databases.getDocument(databaseId, ORDERS_COLLECTION, id);
      const latest = latestDoc as unknown as Order;

      const editCount = getCustomerEditCount(latest);
      if (latest.STATUS === 'paid' || latest.STATUS === 'shipped' || latest.STATUS === 'delivered' || latest.STATUS === 'cancelled') {
        alert('No puedes modificar el pedido si ya está pagado, despachado o anulado.');
        return;
      }

      let oldItems: OrderItem[] = [];
      try { oldItems = JSON.parse((latest as any).ITEMS || '[]'); } catch {}
      const oldQty = new Map<string, number>();
      for (const it of oldItems) oldQty.set(it.id, Number(it.qty) || 0);

      // Normalizar draft + recalcular totales por línea
      const normalizedDraft: OrderItem[] = draftItems.map(it => {
        const qty = Math.max(1, Number(it.qty) || 1);
        const price = Number(it.price) || 0;
        return { ...it, qty, price, total: price * qty };
      });

      // IDs a tocar en stock
      const ids = new Set<string>([...oldItems.map(i => i.id), ...normalizedDraft.map(i => i.id)]);

      // 1) Validar primero TODO (sin tocar stock)
      const validation: { pid: string; currentStock: number; prevQty: number; nextQty: number; delta: number; name: string }[] = [];
      for (const pid of ids) {
        const prevQty = oldQty.get(pid) || 0;
        const nextQty = normalizedDraft.find(x => x.id === pid)?.qty || 0;
        const delta = nextQty - prevQty;
        if (delta === 0) continue;
        const productDoc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, pid);
        const currentStock = Number((productDoc as any).STOCK ?? 0);
        const name = String((productDoc as any).NAME || pid);
        if (delta > 0 && currentStock < delta) {
          throw new Error(`Stock insuficiente para "${name}". Disponible: ${currentStock}, necesitas: ${delta}.`);
        }
        validation.push({ pid, currentStock, prevQty, nextQty, delta, name });
      }

      // 2) Aplicar cambios con rollback si algo falla a mitad
      const applied: { pid: string; prevStock: number }[] = [];
      try {
        for (const v of validation) {
          const newStock = v.currentStock - v.delta;
          applied.push({ pid: v.pid, prevStock: v.currentStock });
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION, v.pid, { STOCK: newStock });
        }
      } catch (err) {
        for (const a of applied) {
          try { await databases.updateDocument(databaseId, PRODUCTS_COLLECTION, a.pid, { STOCK: a.prevStock }); } catch {}
        }
        throw err;
      }

      const newSubtotal = computeSubtotal(normalizedDraft);
      const discount = Number((latest as any).DISCOUNT ?? 0) || 0;
      const newTotal = Math.max(0, newSubtotal - discount);

      try {
        await databases.updateDocument(databaseId, ORDERS_COLLECTION, id, {
          ITEMS: JSON.stringify(normalizedDraft),
          SUBTOTAL: newSubtotal,
          TOTAL: newTotal,
          UPDATEDAT: Date.now(),
          CUSTOMEREDITCOUNT: editCount + 1,
        });
      } catch (err) {
        // Si el update del pedido falla, revertimos stock ya aplicado
        for (const a of applied) {
          try { await databases.updateDocument(databaseId, PRODUCTS_COLLECTION, a.pid, { STOCK: a.prevStock }); } catch {}
        }
        throw err;
      }

      closeEditor();
      await load();
    } catch (e: any) {
      console.error(e);
      setEditError(e?.message || 'Error al guardar cambios. Intenta de nuevo.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCancelOrder() {
    if (!order || cancelling) return;
    if (!window.confirm('¿Seguro que quieres anular este pedido?')) return;

    setCancelling(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      const latestDoc = await databases.getDocument(databaseId, ORDERS_COLLECTION, id);
      const latest = latestDoc as unknown as Order;

      const editCount = getCustomerEditCount(latest);
      if (latest.STATUS === 'paid' || latest.STATUS === 'shipped' || latest.STATUS === 'delivered' || latest.STATUS === 'cancelled') {
        alert('No puedes anular el pedido si ya está pagado, despachado o anulado.');
        return;
      }

      let latestItems: OrderItem[] = [];
      try { latestItems = JSON.parse((latest as any).ITEMS || '[]'); } catch {}

      // Restituir stock
      for (const it of latestItems) {
        const pid = it.id;
        const qty = Number(it.qty) || 0;
        if (!pid || qty <= 0) continue;
        try {
          const productDoc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, pid);
          const currentStock = Number((productDoc as any).STOCK ?? 0);
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION, pid, { STOCK: currentStock + qty });
        } catch (err) {
          console.error('Error restaurando stock', pid, err);
        }
      }

      await databases.updateDocument(databaseId, ORDERS_COLLECTION, id, {
        STATUS: 'cancelled',
        UPDATEDAT: Date.now(),
        CUSTOMEREDITCOUNT: editCount + 1,
      });

      await load();
    } catch (e) {
      console.error(e);
      alert('Error al anular el pedido. Intenta de nuevo.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirmDelivery() {
    if (!order || confirming) return;
    if (!window.confirm('¿Confirmas que recibiste tu pedido correctamente?')) return;
    setConfirming(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, ORDERS_COLLECTION, id, {
        STATUS: 'delivered',
        UPDATEDAT: Date.now(),
      });
      setConfirmed(true);
      await load();
    } catch {
      alert('Error al confirmar la entrega. Intenta de nuevo.');
    } finally {
      setConfirming(false);
    }
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 4, padding: '20px 22px', marginBottom: 12 };

  if (isLoading) return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#999', fontSize: 15 }}>Cargando pedido...</p>
    </div>
  );

  if (!order) return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <AlertTriangle size={40} color="#e53935" />
      <p style={{ color: '#333', fontSize: 16 }}>Pedido no encontrado</p>
      <Link href="/" style={{ color: '#3483fa', textDecoration: 'none', fontSize: 14 }}>Ir al inicio</Link>
    </div>
  );

  const isPending = order.STATUS === 'pending';
  const BANK = getBankDetails();
  const status = STATUS_MAP[order.STATUS] || { label: order.STATUS, color: '#333', bg: '#f5f5f5' };
  const showTimer = isPending && order.EXPIRESAT && !uploaded;
  const isSuccess = uploaded || order.STATUS !== 'pending';
  const customerEditCount = getCustomerEditCount(order);
  const canCustomerModify = order.STATUS !== 'paid' && order.STATUS !== 'shipped' && order.STATUS !== 'delivered' && order.STATUS !== 'cancelled';

  return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '24px 5%', paddingBottom: 'calc(24px + 92px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Header success banner ── */}
        <div style={{ ...card, textAlign: 'center', padding: '32px 22px', borderTop: `4px solid ${isSuccess ? '#00a650' : '#f59e0b'}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: isSuccess ? '#f0fdf4' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {isSuccess
              ? <CheckCircle size={36} color="#00a650" />
              : <Clock size={36} color="#d97706" />}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#333' }}>
            {isSuccess ? '¡Pedido confirmado!' : '¡Pedido recibido!'}
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 15, color: '#666' }}>Código: <strong style={{ color: '#333' }}>{order.ORDERCODE}</strong></p>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: status.bg, color: status.color, fontSize: 13, fontWeight: 600 }}>{status.label}</span>
          {order.CUSTOMERNAME && <p style={{ margin: '12px 0 0', fontSize: 14, color: '#888' }}>Hola <strong style={{ color: '#333' }}>{order.CUSTOMERNAME}</strong>, gracias por tu compra.</p>}
        </div>

        {/* ── Order Timeline ── */}
        {(() => {
          const steps = [
            { key: 'pending',    label: 'Pedido recibido', icon: <Clock size={16} /> },
            { key: 'processing', label: 'Pago en revisión', icon: <Upload size={16} /> },
            { key: 'paid',       label: 'Pago confirmado', icon: <CheckCircle size={16} /> },
            { key: 'shipped',    label: 'Enviado', icon: <Truck size={16} /> },
            { key: 'delivered',  label: 'Entregado', icon: <Package size={16} /> },
          ];
          const statusOrder = ['pending', 'processing', 'paid', 'shipped', 'delivered'];
          const currentIdx = statusOrder.indexOf(order.STATUS);
          if (order.STATUS === 'cancelled') return null;
          return (
            <div style={{ ...card, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                {/* Line connector */}
                <div style={{ position: 'absolute', top: 16, left: 24, right: 24, height: 2, background: '#e5e7eb', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 16, left: 24, height: 2, background: '#3483fa', zIndex: 1, width: currentIdx >= 0 ? `${Math.min(100, (currentIdx / (steps.length - 1)) * 100)}%` : '0%', transition: 'width .5s ease' }} />
                {steps.map((step, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx;
                  return (
                    <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: done ? '#3483fa' : '#fff',
                        border: `2px solid ${done ? '#3483fa' : '#d1d5db'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: done ? '#fff' : '#9ca3af',
                        transition: 'all .3s',
                        boxShadow: active ? '0 0 0 4px rgba(52,131,250,0.2)' : 'none',
                      }}>
                        {step.icon}
                      </div>
                      <span style={{ marginTop: 6, fontSize: 11, fontWeight: active ? 700 : 500, color: done ? '#333' : '#9ca3af', textAlign: 'center', lineHeight: 1.2, maxWidth: 70 }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Timer ── */}
        {showTimer && (
          <div style={{ ...card, textAlign: 'center', border: '1px solid #fde68a', background: '#fffbeb' }}>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#92400e' }}>Tienes 3 horas para completar el pago</p>
            <Timer expiresAt={order.EXPIRESAT!} />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b45309' }}>Una vez transferido, sube tu comprobante abajo</p>
          </div>
        )}

        {/* ── Bank details ── */}
        {isPending && !uploaded && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#333' }}>Datos para transferir</h2>
              <button onClick={copyAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#555' }}>
                {copied === 'all' ? <><Check size={12} color="#00a650" /> Copiado</> : <><Copy size={12} /> Copiar todo</>}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(BANK).map(([key, val]) => (
                <button key={key} onClick={() => copyField(key, val)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: copied === key ? '#f0fdf4' : '#f9f9f9', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                  onMouseEnter={e => { if (copied !== key) (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (copied !== key) (e.currentTarget as HTMLElement).style.background = '#f9f9f9'; }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#999' }}>{key}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#333' }}>{val}</p>
                  </div>
                  <span style={{ fontSize: 11, color: copied === key ? '#00a650' : '#aaa', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {copied === key ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
                ⚠️ Transfiere exactamente <strong style={{ fontSize: 15 }}>{formatPrice(order.TOTAL)}</strong> y sube el comprobante abajo para confirmar tu pedido.
              </p>
            </div>
          </div>
        )}

        {/* ── Upload comprobante ── */}
        {(isPending || order.STATUS === 'processing') && (
          <div style={{ ...card, border: `1px solid ${uploaded ? '#bbf7d0' : '#fde68a'}` }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={17} color={uploaded ? '#00a650' : '#d97706'} />
              Comprobante de pago
            </h2>
            {uploaded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00a650', fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} /> Comprobante recibido correctamente
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>Sube tu comprobante de transferencia (imagen o PDF)</p>
                <label style={{ display: 'block', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  <input type="file" accept="image/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
                  <div style={{ border: '2px dashed #ddd', borderRadius: 8, padding: '24px 16px', textAlign: 'center', background: '#fafafa', transition: 'border-color .15s' }}
                    onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = '#3483fa'; }}
                    onMouseLeave={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = '#ddd'; }}>
                    {uploading ? (
                      <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Subiendo...</p>
                    ) : (
                      <>
                        <Upload size={28} color="#bbb" style={{ marginBottom: 8 }} />
                        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#555', fontWeight: 500 }}>Click para subir comprobante</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>JPG, PNG o PDF</p>
                      </>
                    )}
                  </div>
                </label>
              </>
            )}
          </div>
        )}

        {/* ── Order items ── */}
        <div style={card}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={17} color="#3483fa" /> Detalle del pedido
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < items.length - 1 ? 12 : 0, borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 14, color: '#333', fontWeight: 500 }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#999' }}>x{item.qty} · {formatPrice(item.price)} c/u</p>
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#333', flexShrink: 0 }}>{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#666' }}>
              <span>Subtotal</span><span>{formatPrice(order.SUBTOTAL)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#666' }}>
              <span>Envío</span><span style={{ color: '#00a650' }}>{order.SHIPPINGCOST > 0 ? formatPrice(order.SHIPPINGCOST) : 'A coordinar'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#333', paddingTop: 6, borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
              <span>Total</span><span>{formatPrice(order.TOTAL)}</span>
            </div>
          </div>
        </div>

        {/* ── Customer actions: editar/anular (máximo 2 veces) ── */}
        {order.STATUS !== 'cancelled' && (
          <div style={{ ...card, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>Gestionar pedido</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
                  Estado de edición: <strong>Ilimitado</strong> (hasta confirmar pago)
                </p>
              </div>
              {editOpen && (
                <button onClick={closeEditor}
                  style={{ padding: '8px 10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151' }}>
                  <X size={14} /> Cerrar
                </button>
              )}
            </div>

            {!canCustomerModify && (
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                El pedido ya está confirmado, despachado o cancelado y no puede ser modificado.
              </p>
            )}

            {canCustomerModify && !editOpen && (
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={openEditor}
                  style={{ flex: 1, minWidth: 220, padding: '12px 14px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Pencil size={14} /> Modificar productos
                </button>
                <button onClick={handleCancelOrder} disabled={cancelling}
                  style={{ flex: 1, minWidth: 220, padding: '12px 14px', background: cancelling ? '#fee2e2' : '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, cursor: cancelling ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Trash2 size={14} /> {cancelling ? 'Anulando...' : 'Anular pedido'}
                </button>
              </div>
            )}

            {editOpen && (
              <div style={{ marginTop: 12 }}>
                {editError && (
                  <div style={{ marginBottom: 10, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                    {editError}
                  </div>
                )}

                {/* Items editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {draftItems.map((it) => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px solid #eee', borderRadius: 10, background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const src = it.img ? resolveStorageImageUrl(it.img) : '';
                            if (src) setImageModal({ src, name: it.name });
                          }}
                          style={{ width: 46, height: 46, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0, border: '1px solid #eee', cursor: it.img ? 'pointer' : 'default', padding: 0 }}
                          title={it.img ? 'Ver imagen' : 'Sin imagen'}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.img ? (
                            <img src={resolveStorageImageUrl(it.img)} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={18} color="#9ca3af" />
                            </div>
                          )}
                        </button>

                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                            {formatPrice(it.price)} c/u · <span style={{ fontWeight: 800, color: '#111' }}>{formatPrice((Number(it.price) || 0) * (Number(it.qty) || 0))}</span>
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                          <button onClick={() => setQty(it.id, (it.qty || 1) - 1)} disabled={(it.qty || 1) <= 1 || loadingStocks}
                            style={{ width: 34, height: 32, border: 'none', background: '#fff', cursor: ((it.qty || 1) <= 1 || loadingStocks) ? 'not-allowed' : 'pointer', color: '#374151' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ width: 34, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#111' }}>{it.qty}</span>
                          <button onClick={() => setQty(it.id, (it.qty || 1) + 1)} disabled={loadingStocks}
                            style={{ width: 34, height: 32, border: 'none', background: '#fff', cursor: loadingStocks ? 'not-allowed' : 'pointer', color: '#374151' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <button onClick={() => removeDraft(it.id)}
                          style={{ padding: 8, border: '1px solid #fee2e2', background: '#fff', borderRadius: 10, cursor: 'pointer', color: '#dc2626' }}
                          title="Quitar del pedido">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add products */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search size={14} /> Agregar productos
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar por nombre, SKU o barcode..."
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none', fontSize: 13 }}
                    />
                    <button onClick={searchProducts} disabled={searchingProducts}
                      style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: searchingProducts ? '#f3f4f6' : '#fff', cursor: searchingProducts ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Search size={14} /> {searchingProducts ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>

                  {productResults.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {productResults.map(p => {
                        const stock = Number((p as any).STOCK ?? NaN);
                        const hasStock = Number.isFinite(stock) ? stock > 0 : true;
                        return (
                        <button
                          key={p.$id}
                          onClick={() => { if (hasStock) addProductToDraft(p); }}
                          disabled={!hasStock}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            cursor: hasStock ? 'pointer' : 'not-allowed',
                            opacity: hasStock ? 1 : 0.55,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                          title={!hasStock ? 'Sin stock disponible' : 'Agregar al pedido'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {((p as any).IMAGEURL) ? (
                                <img src={resolveStorageImageUrl((p as any).IMAGEURL)} alt={(p as any).NAME || 'Producto'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Package size={18} color="#9ca3af" />
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p as any).NAME}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(() => {
                                  const sku = getProductSku(p);
                                  const bc = getProductBarcode(p);
                                  if (sku) return `SKU: ${sku}`;
                                  if (bc) return `Barcode: ${bc}`;
                                  return 'SKU: —';
                                })()}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: hasStock ? '#6b7280' : '#b45309', fontWeight: 800 }}>
                                Stock: {Number.isFinite(stock) ? stock : '—'}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#111' }}>
                              {formatPrice(((p as any).CURRENTPRICE ?? (p as any).PRICE ?? 0) as number)}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: hasStock ? '#3483fa' : '#9ca3af' }}>
                              {hasStock ? '+ Agregar' : 'Sin stock'}
                            </span>
                          </div>
                        </button>
                      );})}
                    </div>
                  )}
                </div>

                {/* Summary + save */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                    <span>Nuevo subtotal</span>
                    <span style={{ fontWeight: 900, color: '#111' }}>{formatPrice(computeSubtotal(draftItems))}</span>
                  </div>
                  <button onClick={handleSaveEdits} disabled={savingEdit}
                    style={{ width: '100%', padding: '12px 0', background: savingEdit ? '#93c5fd' : '#3483fa', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 900, cursor: savingEdit ? 'not-allowed' : 'pointer' }}>
                    {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                    Nota: puedes realizar cambios de forma ilimitada mientras el pedido no esté confirmado como pagado.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: imagen completa */}
        {imageModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onMouseDown={() => setImageModal(null)}
          >
            <div
              style={{ width: '100%', maxWidth: 820, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.35)' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageModal.name}</p>
                <button onClick={() => setImageModal(null)} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 900 }}>
                  <X size={14} /> Cerrar
                </button>
              </div>
              <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageModal.src} alt={imageModal.name} style={{ width: '100%', height: 'auto', maxHeight: '82vh', objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Shipping info ── */}
        <div style={card}>
          <h2 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={17} color="#3483fa" /> Datos de envío
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 14, color: '#555' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#333', fontSize: 15 }}>{order.CUSTOMERNAME}</p>
            <p style={{ margin: 0 }}>{order.CUSTOMERPHONE}{order.CUSTOMEREMAIL ? ` · ${order.CUSTOMEREMAIL}` : ''}</p>
            <p style={{ margin: 0 }}>{order.ADDRESS}</p>
            <p style={{ margin: 0 }}>{order.COMUNA}, {order.REGION}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Truck size={13} color="#3483fa" />
              <span style={{ color: '#3483fa', fontWeight: 500 }}>{order.SHIPPINGAGENCY}</span>
              {order.AGENCYCHANGED && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#fffbeb', color: '#b45309', borderRadius: 8, border: '1px solid #fef08a' }}>Modificada</span>
              )}
            </div>
            {/* Agency change: only if not paid and not changed before */}
            {order.STATUS !== 'paid' && order.STATUS !== 'processing' && order.STATUS !== 'shipped' && order.STATUS !== 'delivered' && !order.AGENCYCHANGED && (
              showAgencyChange ? (
                <div style={{ marginTop: 10, padding: '12px 14px', background: '#f8f0ff', borderRadius: 12, border: '1px solid #e9d5ff' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6b21a8' }}>Selecciona nueva agencia de envío</p>
                  <select value={selectedAgency} onChange={e => setSelectedAgency(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d8b4fe', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#6b21a8', background: '#fff', marginBottom: 8, outline: 'none' }}>
                    <option value="">Seleccionar agencia</option>
                    {agencies.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleChangeAgency} disabled={!selectedAgency || savingAgency}
                      style={{ flex: 1, padding: '10px 0', background: savingAgency ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: savingAgency ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <RefreshCw size={13} />
                      {savingAgency ? 'Guardando...' : 'Confirmar cambio'}
                    </button>
                    <button onClick={() => setShowAgencyChange(false)}
                      style={{ padding: '10px 16px', background: '#fff', border: '1.5px solid #e9d5ff', borderRadius: 10, fontSize: 13, color: '#6b21a8', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#a78bfa' }}>⚠ Solo puedes cambiar la agencia 1 vez.</p>
                </div>
              ) : (
                <button onClick={() => { setShowAgencyChange(true); setSelectedAgency(order.SHIPPINGAGENCY || ''); }}
                  style={{ marginTop: 8, padding: '6px 12px', background: '#f8f0ff', border: '1.5px solid #d8b4fe', borderRadius: 10, fontSize: 12, color: '#7c3aed', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> Cambiar agencia
                </button>
              )
            )}

            {order.SHIPPINGPROOFURL && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Truck size={14} color="#6b21a8" /> Comprobante de envío
                </p>
                <button 
                  onClick={() => setImageModal({ src: order.SHIPPINGPROOFURL!, name: 'Comprobante de envío' })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f3e8ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#faf5ff')}
                >
                  <FileText size={16} /> Ver comprobante
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Delivery confirmation ── */}
        {order.STATUS === 'shipped' && !confirmed && (
          <div style={{ ...card, background: '#f0f5ff', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Truck size={20} color="#3483fa" />
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e40af' }}>Tu pedido fue despachado</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#3b82f6' }}>¿Ya lo recibiste? Confirma la entrega.</p>
              </div>
            </div>
            <button onClick={handleConfirmDelivery} disabled={confirming}
              style={{ width: '100%', padding: '12px 0', background: confirming ? '#93c5fd' : '#3483fa', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: confirming ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Package size={16} />
              {confirming ? 'Confirmando...' : 'Confirmar que recibí mi pedido'}
            </button>
          </div>
        )}
        {(order.STATUS === 'delivered' || confirmed) && (
          <div style={{ ...card, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
            <CheckCircle size={28} color="#16a34a" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#166534' }}>Entrega confirmada</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#22c55e' }}>Gracias por confirmar la recepción de tu pedido.</p>
          </div>
        )}

        {/* ── Trust + Actions ── */}
        <div style={{ ...card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Shield size={18} color="#00a650" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              <strong>Compra Protegida</strong> — Si tienes algún problema con tu pedido, te devolvemos el dinero.
            </p>
          </div>
        </div>

        {/* Download PDF */}
        <button onClick={() => generateOrderPdf(order, items)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 0', background: '#fff', color: '#333', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4, marginBottom: 4 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
          <FileText size={16} /> Descargar comprobante PDF
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Link href="/productos" style={{ flex: 1, display: 'block', padding: '13px 0', background: '#3483fa', color: '#fff', textAlign: 'center', borderRadius: 6, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#2968c8')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#3483fa')}>
            Seguir comprando
          </Link>
          <Link href="/cuenta/pedidos" style={{ flex: 1, display: 'block', padding: '13px 0', background: '#fff', color: '#3483fa', textAlign: 'center', borderRadius: 6, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid #3483fa' }}>
            Ver mis pedidos
          </Link>
        </div>

      </div>
    </div>
  );
}
