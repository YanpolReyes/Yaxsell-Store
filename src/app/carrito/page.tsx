'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Tag, Truck, Shield, ChevronRight, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/appwrite';
import RecentlyViewed from '@/components/RecentlyViewed';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Coupon } from '@/types';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  const discount = couponData
    ? couponData.type === 'percentage'
      ? (subtotal * couponData.value) / 100
      : couponData.value
    : 0;
  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setLoadingCoupon(true); setCouponError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const { Query } = await import('appwrite');
      const res = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
        Query.equal('code', couponCode.toUpperCase()), Query.limit(1),
      ]);
      if (res.total === 0) { setCouponError('Cupón no válido'); return; }
      const c = res.documents[0] as unknown as Coupon;
      if (!c.isActive) { setCouponError('Cupón inactivo'); return; }
      if (c.maxUses && (c.usedCount || 0) >= c.maxUses) { setCouponError('Cupón agotado'); return; }
      setCouponData(c);
    } catch { setCouponError('Error al validar cupón'); }
    finally { setLoadingCoupon(false); }
  }

  /* ── EMPTY STATE ── */
  if (totalItems === 0) return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '24px 5%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#3483fa', textDecoration: 'none' }}>Inicio</Link>
          <ChevronRight size={12} color="#999" />
          <span style={{ color: '#666' }}>Carrito de compras</span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Empty cart card */}
          <div style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 4, padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flexShrink: 0, opacity: 0.35 }}>
              <ShoppingCart size={64} color="#666" />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, color: '#333' }}>Tu carrito está vacío</p>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#666' }}>Agrega productos del mismo vendedor y consigue envío gratis.</p>
              <Link href="/productos" style={{ color: '#3483fa', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Descubrir productos</Link>
            </div>
          </div>
          {/* Summary placeholder */}
          <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRadius: 4, padding: '20px 18px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#333' }}>Resumen de compra</p>
            <p style={{ margin: 0, fontSize: 13, color: '#999', lineHeight: 1.5 }}>Aquí verás los importes de tu compra una vez que agregues productos.</p>
          </div>
        </div>

        {/* Recently viewed products suggestion */}
        <div style={{ marginTop: 20 }}>
          <RecentlyViewed />
        </div>
      </div>
    </div>
  );

  /* ── FILLED STATE ── */
  return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '24px 5%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#3483fa', textDecoration: 'none' }}>Inicio</Link>
          <ChevronRight size={12} color="#999" />
          <span style={{ color: '#666' }}>Carrito de compras</span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── LEFT: items ── */}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Shipping notice */}
            <div style={{ background: '#fff', borderRadius: 4, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck size={18} color="#00a650" />
              <span style={{ fontSize: 14, color: '#00a650', fontWeight: 500 }}>Envío disponible a todo Chile</span>
            </div>

            {/* Items card */}
            <div style={{ background: '#fff', borderRadius: 4, padding: '0 18px' }}>
              <div style={{ padding: '16px 0 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#333' }}>
                  {totalItems === 1 ? '1 producto' : `${totalItems} productos`}
                </h1>
              </div>

              {items.map((item, idx) => {
                const p = item.product;
                const price = p.CURRENTPRICE && p.CURRENTPRICE > 0 ? p.CURRENTPRICE : p.PRICE;
                const hasDisc = !!(p.CURRENTPRICE && p.CURRENTPRICE < p.PRICE);
                const discPct = hasDisc ? Math.round(((p.PRICE - p.CURRENTPRICE!) / p.PRICE) * 100) : 0;
                const lineTotal = price * item.quantity;
                return (
                  <div key={p.$id} style={{ padding: '20px 0', borderBottom: idx < items.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Image */}
                    <Link href={`/productos/${p.$id}`} style={{ flexShrink: 0, position: 'relative', width: 96, height: 96, background: '#f9f9f9', borderRadius: 4, overflow: 'hidden', display: 'block' }}>
                      {p.IMAGEURL
                        ? <Image src={p.IMAGEURL} alt={p.NAME} fill style={{ objectFit: 'contain', padding: 4 }} />
                        : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📦</span>}
                    </Link>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#333', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
                      </Link>
                      {hasDisc && (
                        <p style={{ margin: '0 0 2px', fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>{formatPrice(p.PRICE)}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20, fontWeight: 300, color: '#333' }}>{formatPrice(price)}</span>
                        {hasDisc && <span style={{ fontSize: 13, fontWeight: 600, color: '#00a650' }}>{discPct}% OFF</span>}
                      </div>

                      {/* Quantity controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                          <button onClick={() => updateQuantity(p.$id, item.quantity - 1)}
                            style={{ width: 36, height: 36, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#3483fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 500, borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(p.$id, item.quantity + 1)} disabled={item.quantity >= p.STOCK}
                            style={{ width: 36, height: 36, border: 'none', background: 'none', fontSize: 18, cursor: item.quantity >= p.STOCK ? 'not-allowed' : 'pointer', color: item.quantity >= p.STOCK ? '#ccc' : '#3483fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <button onClick={() => removeItem(p.$id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#3483fa', fontSize: 13, padding: 0 }}>
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: '#333' }}>{formatPrice(lineTotal)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: summary ── */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Summary */}
            <div style={{ background: '#fff', borderRadius: 4, padding: '20px 18px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#333' }}>Resumen de compra</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 15 }}>
                <span style={{ color: '#666' }}>Productos ({totalItems})</span>
                <span style={{ color: '#333' }}>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 15 }}>
                  <span style={{ color: '#00a650' }}>Descuento cupón</span>
                  <span style={{ color: '#00a650', fontWeight: 600 }}>-{formatPrice(discount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: '#999' }}>
                <span>Envío</span>
                <span>A calcular</span>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#333' }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 300, color: '#333' }}>{formatPrice(total)}</span>
              </div>

              <Link href={`/checkout${couponData ? `?coupon=${couponData.$id}&discount=${discount}` : ''}`}
                style={{ display: 'block', width: '100%', padding: '14px 0', background: '#3483fa', color: '#fff', textAlign: 'center', borderRadius: 6, fontSize: 16, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#2968c8')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#3483fa')}
              >Continuar compra</Link>

              {/* Trust badge */}
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <Shield size={14} color="#00a650" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                  <strong style={{ color: '#00a650' }}>Compra Protegida</strong> — recibe el producto o te devolvemos el dinero.
                </span>
              </div>
            </div>

            {/* Coupon */}
            <div style={{ background: '#fff', borderRadius: 4, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={14} color="#3483fa" /> ¿Tienes un cupón?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ej: DESCUENTO10"
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, outline: 'none', color: '#333', background: '#fff' }} />
                <button onClick={applyCoupon} disabled={loadingCoupon}
                  style={{ padding: '8px 12px', background: '#fff', color: '#3483fa', border: '1px solid #3483fa', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: loadingCoupon ? 0.6 : 1 }}>
                  {loadingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e53935' }}>{couponError}</p>}
              {couponData && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#00a650' }}>✓ Cupón aplicado: -{couponData.type === 'percentage' ? `${couponData.value}%` : formatPrice(couponData.value)}</p>}
            </div>

            <Link href="/productos" style={{ textAlign: 'center', display: 'block', fontSize: 13, color: '#3483fa', textDecoration: 'none', padding: '4px 0' }}>
              ← Seguir comprando
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
