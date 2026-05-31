'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Upload, Copy, Check, AlertTriangle, MapPin, Package, Truck, Shield, FileText } from 'lucide-react';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION, MEDIA_BUCKET_ID, MEDIA_PREFIXES, formatPrice } from '@/lib/appwrite';
import { ID } from '@/lib/appwrite';
import { Order, OrderItem } from '@/types';
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

  return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '24px 5%' }}>
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
            </div>
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
