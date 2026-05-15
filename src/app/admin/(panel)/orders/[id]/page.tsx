'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Order, OrderStatus } from '@/types/admin';
import {
  ArrowLeft, Package, User, MapPin, CreditCard, Truck, Clock, FileText,
  Phone, Mail, Hash, ChevronDown, Save, CheckCircle, Copy, Check,
  AlertTriangle, ExternalLink, Image as ImageIcon, MessageSquare, Calendar, DollarSign,
  Printer, Send, Ban, StickyNote, MapPinned, Receipt, Tag, XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: string }> = {
  pending:    { label: 'Pendiente de pago', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   icon: '🕐' },
  paid:       { label: 'Pagado',            bg: 'bg-emerald-50', text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-400', icon: '💰' },
  processing: { label: 'Procesando',        bg: 'bg-blue-50',    text: 'text-blue-700',     border: 'border-blue-200',    dot: 'bg-blue-400',    icon: '📦' },
  shipped:    { label: 'Enviado',           bg: 'bg-violet-50',  text: 'text-violet-700',   border: 'border-violet-200',  dot: 'bg-violet-400',  icon: '🚚' },
  delivered:  { label: 'Entregado',         bg: 'bg-green-50',   text: 'text-green-700',    border: 'border-green-200',   dot: 'bg-green-400',   icon: '✅' },
  cancelled:  { label: 'Cancelado',         bg: 'bg-red-50',     text: 'text-red-700',      border: 'border-red-200',     dot: 'bg-red-400',     icon: '❌' },
};

const STATUS_FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const fmtDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const [proofOpen, setProofOpen] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  // Auto-print when status changes to 'paid'
  useEffect(() => {
    if (!order) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = order.STATUS;
    if (prev && prev !== 'paid' && order.STATUS === 'paid') {
      setTimeout(() => window.print(), 500);
    }
  }, [order?.STATUS]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const doc = await databases.getDocument(databaseId, ORDERS_COLLECTION_ID, orderId);
      const o = doc as unknown as Order;
      setOrder(o);
      setAdminNotes(o.adminNotes || '');

      // Fetch product stocks
      let items: { id?: string }[] = [];
      try { items = JSON.parse(o.ITEMS || '[]'); } catch {}
      const productIds = items.map(it => it.id).filter((id): id is string => Boolean(id));
      if (productIds.length > 0) {
        const stocks: Record<string, number> = {};
        await Promise.all(productIds.map(async (pid) => {
          try {
            const product = await databases.getDocument(databaseId, PRODUCTS_COLLECTION_ID, pid);
            stocks[pid] = (product as any).STOCK || 0;
          } catch {}
        }));
        setProductStocks(stocks);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // If cancelling, restore stock
      if (newStatus === 'cancelled') {
        let items: { id?: string; qty?: number }[] = [];
        try { items = JSON.parse(order.ITEMS || '[]'); } catch {}
        for (const item of items) {
          if (item.id && item.qty) {
            try {
              const product = await databases.getDocument(databaseId, PRODUCTS_COLLECTION_ID, item.id);
              const currentStock = (product as any).STOCK || 0;
              await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, item.id, {
                STOCK: currentStock + item.qty,
              });
            } catch (err) { console.error('Error restoring stock for product', item.id, err); }
          }
        }
      }

      await databases.updateDocument(databaseId, ORDERS_COLLECTION_ID, order.$id, {
        STATUS: newStatus,
        UPDATEDAT: Date.now(),
      });
      setOrder(prev => prev ? { ...prev, STATUS: newStatus as OrderStatus } : prev);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!order) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, ORDERS_COLLECTION_ID, order.$id, {
        adminNotes: adminNotes.trim(),
      });
      setOrder(prev => prev ? { ...prev, adminNotes: adminNotes.trim() } : prev);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-semibold text-red-700">Error al cargar el pedido</p>
            <p className="text-sm text-red-600">{error || 'Pedido no encontrado'}</p>
          </div>
          <Link href="/admin/orders" className="ml-auto px-4 py-2 bg-white border border-red-200 rounded-xl text-sm text-red-700 hover:bg-red-50">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  let items: { name: string; qty: number; price: number; total: number; img?: string; id?: string; originalPrice?: number | null }[] = [];
  try { items = JSON.parse(order.ITEMS || '[]'); } catch {}
  const date = order.CREATEDAT ? new Date(order.CREATEDAT) : new Date(order.$createdAt);
  const ageMs = Date.now() - date.getTime();
  const isOverdue = order.STATUS === 'pending' && ageMs > 3 * 86400000;
  const sc = STATUS_CONFIG[order.STATUS] || STATUS_CONFIG.pending;
  const customerNote = (order as any).CUSTOMERNOTE;
  const isGift = (order as any).ISGIFT;
  const isLive = (order as any).PURCHASEDFROMLIVE;

  const currentStepIdx = STATUS_FLOW.indexOf(order.STATUS);
  const isCancelled = order.STATUS === 'cancelled';

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelled' && !confirm('¿Cancelar este pedido? El stock será devuelto.')) return;
    updateStatus(newStatus);
  };

  const totalItems = items.reduce((s, it) => s + it.qty, 0);
  const ageDays = Math.floor(ageMs / 86400000);
  const ageHours = Math.floor(ageMs / 3600000);
  const ageStr = ageDays > 0 ? `${ageDays}d` : `${ageHours}h`;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .print-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* Proof lightbox */}
      {proofOpen && order.PAYMENTPROOFURL && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setProofOpen(false)}>
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setProofOpen(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition">
              <XCircle className="w-8 h-8" />
            </button>
            <img src={order.PAYMENTPROOFURL} alt="Comprobante de pago" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

    <div className="print-area max-w-6xl mx-auto space-y-4 sm:space-y-5 px-1 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={() => router.push('/admin/orders')} className="no-print p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Pedido {order.ORDERCODE || '#' + order.$id.slice(-6)}</h1>
              <button onClick={() => { copyText(order.ORDERCODE || order.$id, 'code'); }} className="no-print text-gray-400 hover:text-indigo-500 transition flex-shrink-0">
                {copied === 'code' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {isOverdue && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded animate-pulse">VENCIDO</span>}
              {isLive && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded">🔴 LIVE</span>}
              {isGift && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded">🎁 REGALO</span>}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{fmtDate(date.getTime())} · {fmtTime(date.getTime())} · Hace {ageStr}</p>
          </div>
        </div>
        <div className="no-print flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 transition">
            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir</span>
          </button>
          {order.PAYMENTPROOFURL && (
            <button onClick={() => setProofOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-emerald-100 transition">
              <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Comprobante</span>
            </button>
          )}
          <button onClick={load} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-600 flex-shrink-0">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
          </button>
        </div>
      </div>

      {/* Summary cards (mobile-friendly) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{fmt(order.TOTAL)}</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Items</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{totalItems} <span className="text-xs font-normal text-gray-400">uds</span></p>
        </div>
        <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-center shadow-sm ${sc.bg} ${sc.border}`}>
          <p className={`text-[10px] sm:text-xs uppercase tracking-wide font-medium ${sc.text}`}>Estado</p>
          <p className={`text-sm sm:text-base font-bold mt-0.5 ${sc.text}`}>{sc.icon} {sc.label.split(' ')[0]}</p>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 text-center shadow-sm">
          <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Antigüedad</p>
          <p className={`text-lg sm:text-xl font-bold mt-0.5 ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>{ageStr}</p>
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelled ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 print-break">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">{sc.icon}</span>
              <p className={`text-xs sm:text-sm font-bold ${sc.text}`}>{sc.label}</p>
            </div>
            <div className="no-print relative">
              <select value={order.STATUS} onChange={e => handleStatusChange(e.target.value)} disabled={updating}
                className="appearance-none text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-7 sm:pr-8 bg-white text-gray-800 border-gray-200 disabled:opacity-50">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 sm:w-4 h-3 sm:h-4 pointer-events-none text-gray-400" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {STATUS_FLOW.map((step, i) => {
              const stepCfg = STATUS_CONFIG[step];
              const isCompleted = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-1">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${isCompleted ? `${stepCfg.bg} ${stepCfg.text} ${stepCfg.border} border` : 'bg-gray-100 text-gray-400 border border-gray-200'} ${isCurrent ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-indigo-300 scale-110' : ''}`}>
                      {isCompleted && i < currentStepIdx ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <span>{i + 1}</span>}
                    </div>
                    <span className={`text-[8px] sm:text-[9px] font-medium text-center leading-tight ${isCompleted ? stepCfg.text : 'text-gray-400'}`}>{stepCfg.label.split(' ')[0]}</span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full transition-all ${i < currentStepIdx ? stepCfg.dot : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {order.STATUS === 'pending' && (
            <p className="text-[10px] sm:text-xs text-amber-600 mt-2 sm:mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Expira en {Math.max(0, Math.floor(((order.EXPIRESAT || date.getTime() + 3*3600000) - Date.now()) / 3600000))}h
            </p>
          )}
        </div>
      ) : (
        /* Cancelled banner */
        <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 sm:p-5 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm sm:text-lg font-bold text-red-700">Pedido Cancelado</p>
              <p className="text-[10px] sm:text-xs text-red-500">Stock devuelto a los productos</p>
            </div>
          </div>
          <div className="no-print relative">
            <select value={order.STATUS} onChange={e => handleStatusChange(e.target.value)} disabled={updating}
              className="appearance-none text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-7 sm:pr-8 bg-white text-gray-800 border-gray-200">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-5">
          {/* Products */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-break">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Productos ({items.length})</p>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400">{totalItems} unidades</p>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((it, i) => {
                const currentStock = it.id ? (productStocks[it.id] ?? 0) : 0;
                const remainingStock = order.STATUS === 'pending' ? currentStock - it.qty : currentStock;
                return (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-gray-50/50 transition">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {it.img
                        ? <img src={it.img} alt="" className="w-full h-full object-contain p-0.5 sm:p-1" />
                        : <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{it.name}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                        <span className="text-[10px] sm:text-xs text-gray-500">{fmt(it.price)} c/u</span>
                        <span className="text-gray-300">×</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-700">{it.qty}</span>
                        {it.originalPrice && it.originalPrice !== it.price && (
                          <span className="text-[9px] sm:text-[10px] line-through text-gray-300">{fmt(it.originalPrice)}</span>
                        )}
                      </div>
                      {it.id && (
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap no-print">
                          <span className={`text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded ${remainingStock <= 0 ? 'bg-red-100 text-red-600' : remainingStock <= 5 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                            Stock: {currentStock}
                          </span>
                          {order.STATUS === 'pending' && (
                            <span className={`text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded ${remainingStock <= 0 ? 'bg-red-100 text-red-600' : remainingStock <= 5 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              → {remainingStock}
                            </span>
                          )}
                          {order.STATUS !== 'pending' && (
                            <span className="text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">
                              {remainingStock} disp
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0">{fmt(it.total || it.price * it.qty)}</p>
                  </div>
                );
              })}
            </div>
            {/* Totals */}
            <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{fmt(order.SUBTOTAL || order.TOTAL)}</span>
              </div>
              {order.SHIPPINGCOST > 0 ? (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Envío</span>
                  <span className="text-gray-700">{fmt(order.SHIPPINGCOST)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Truck className="w-3 h-3" /> Envío</span>
                  <span className="text-emerald-600 text-[10px] sm:text-xs font-medium">A coordinar</span>
                </div>
              )}
              {order.DISCOUNTAMOUNT && order.DISCOUNTAMOUNT > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-emerald-600 flex items-center gap-1"><Tag className="w-3 h-3" /> Descuento {order.COUPONCODE && <span className="font-mono text-[10px] sm:text-xs">({order.COUPONCODE})</span>}</span>
                  <span className="text-emerald-600 font-medium">-{fmt(order.DISCOUNTAMOUNT)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold pt-1.5 sm:pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{fmt(order.TOTAL)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Timeline */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-break">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-indigo-500" />
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">Notas y seguimiento</p>
            </div>
            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
              {customerNote && (
                <div className="p-2.5 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                  <p className="text-[10px] sm:text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Nota del cliente</p>
                  <p className="text-xs sm:text-sm text-amber-800 whitespace-pre-wrap">{customerNote}</p>
                </div>
              )}
              {isGift && (
                <div className="p-2.5 sm:p-3.5 bg-pink-50 border border-pink-200 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-pink-700 font-medium">🎁 Pedido marcado como regalo</p>
                </div>
              )}
              <div className="no-print">
                <label className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 block">Notas internas del admin</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                  rows={3} placeholder="Notas internas sobre este pedido..."
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                <div className="flex justify-end mt-1.5 sm:mt-2">
                  <button onClick={saveNotes}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition ${notesSaved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {notesSaved ? <><Check className="w-3 h-3" />Guardado</> : <><Save className="w-3 h-3" />Guardar</>}
                  </button>
                </div>
              </div>
              {/* Timeline */}
              <div className="border-t border-gray-100 pt-3 sm:pt-4">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-2 sm:mb-3 uppercase tracking-wide">Historial del pedido</p>
                <div className="relative ml-1.5 sm:ml-2 space-y-3 sm:space-y-4 border-l-2 border-gray-200 pl-3 sm:pl-4">
                  <TimelineEntry dot="bg-indigo-400" title="Pedido creado" date={`${fmtDate(date.getTime())} ${fmtTime(date.getTime())}`} />
                  {order.PAYMENTPROOFURL && (
                    <TimelineEntry dot="bg-emerald-400" title="Comprobante subido" icon={<ImageIcon className="w-3 h-3" />} />
                  )}
                  {order.UPDATEDAT && order.STATUS !== 'pending' && (
                    <TimelineEntry dot={STATUS_CONFIG[order.STATUS]?.dot || 'bg-gray-400'} title={`Estado → ${STATUS_CONFIG[order.STATUS]?.label}`} date={`${fmtDate(order.UPDATEDAT)} ${fmtTime(order.UPDATEDAT)}`} />
                  )}
                  {isCancelled && (
                    <TimelineEntry dot="bg-red-400" title="Pedido cancelado — stock devuelto" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3 sm:space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-break">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">Cliente</p>
            </div>
            <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
              <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Nombre" value={order.CUSTOMERNAME} onCopy={() => copyText(order.CUSTOMERNAME, 'name')} copied={copied === 'name'} />
              {order.CUSTOMERRUT && <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="RUT" value={order.CUSTOMERRUT} onCopy={() => copyText(order.CUSTOMERRUT!, 'rut')} copied={copied === 'rut'} />}
              {order.CUSTOMERPHONE && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={order.CUSTOMERPHONE} onCopy={() => copyText(order.CUSTOMERPHONE!, 'phone')} copied={copied === 'phone'} />}
              {order.CUSTOMEREMAIL && <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={order.CUSTOMEREMAIL} onCopy={() => copyText(order.CUSTOMEREMAIL!, 'email')} copied={copied === 'email'} />}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-break">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-indigo-500" />
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">Envío</p>
              {order.SHIPPINGAGENCY && (
                <span className="ml-auto text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{order.SHIPPINGAGENCY}</span>
              )}
            </div>
            <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{order.ADDRESS || 'Sin dirección'}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{order.COMUNA}{order.COMUNA && order.REGION ? ', ' : ''}{order.REGION}</p>
              {order.ADDITIONALINFO && (
                <div className="mt-1.5 sm:mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Info adicional</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">{order.ADDITIONALINFO}</p>
                </div>
              )}
              {(order as any).ADDRESSPHOTOURL && (
                <a href={(order as any).ADDRESSPHOTOURL} target="_blank" rel="noreferrer" className="block mt-1.5 sm:mt-2">
                  <img src={(order as any).ADDRESSPHOTOURL} alt="Foto dirección" className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200" />
                </a>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-break">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-500" />
              <p className="font-semibold text-gray-900 text-xs sm:text-sm">Pago</p>
              {order.PAYMENTMETHOD && (
                <span className="ml-auto text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{order.PAYMENTMETHOD}</span>
              )}
            </div>
            <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
              {order.COUPONCODE && (
                <div className="flex items-center justify-between p-2 sm:p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] sm:text-xs text-emerald-600 flex items-center gap-1"><Tag className="w-3 h-3" /> Cupón</span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-700">{order.COUPONCODE}</span>
                </div>
              )}
              {order.PAYMENTPROOFURL ? (
                <button onClick={() => setProofOpen(true)}
                  className="flex items-center gap-2 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl hover:bg-emerald-100 transition group w-full text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-emerald-700">Comprobante de pago</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-500">Click para ver</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>
              ) : order.STATUS === 'pending' ? (
                <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs text-amber-700 font-medium">Sin comprobante</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick actions */}
          <div className="no-print bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 space-y-1.5 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide">Acciones rápidas</p>
            {order.CUSTOMERPHONE && (
              <a href={`https://wa.me/${order.CUSTOMERPHONE.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 w-full p-2 sm:p-2.5 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-green-700 hover:bg-green-100 transition">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> WhatsApp
              </a>
            )}
            <button onClick={() => {
              const text = `Pedido: ${order.ORDERCODE}\nCliente: ${order.CUSTOMERNAME}\nRUT: ${order.CUSTOMERRUT || '-'}\nTeléfono: ${order.CUSTOMERPHONE || '-'}\nDirección: ${order.ADDRESS}, ${order.COMUNA}, ${order.REGION}\nAgencia: ${order.SHIPPINGAGENCY || '-'}\nTotal: ${fmt(order.TOTAL)}\nEstado: ${STATUS_CONFIG[order.STATUS]?.label}`;
              copyText(text, 'all');
            }}
              className="flex items-center gap-2 w-full p-2 sm:p-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              {copied === 'all' ? <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Copiar datos</>}
            </button>
            {order.STATUS !== 'cancelled' && (
              <button onClick={() => handleStatusChange('cancelled')}
                className="flex items-center gap-2 w-full p-2 sm:p-2.5 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-red-600 hover:bg-red-100 transition">
                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Cancelar pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function InfoRow({ icon, label, value, onCopy, copied }: { icon: React.ReactNode; label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{value}</p>
        </div>
      </div>
      <button onClick={onCopy}
        className="no-print p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

function TimelineEntry({ dot, title, date, icon }: { dot: string; title: string; date?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 sm:gap-3 relative">
      <div className={`absolute -left-[17px] sm:-left-[21px] w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${dot} border-2 border-white top-0.5`} />
      <div className="flex-1">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {icon}
          <p className="text-xs sm:text-sm text-gray-700 font-medium">{title}</p>
        </div>
        {date && <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{date}</p>}
      </div>
    </div>
  );
}
