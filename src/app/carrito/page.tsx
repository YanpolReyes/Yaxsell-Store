'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Tag, Truck, Shield, ChevronRight, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import LottieCart from '@/components/LottieCart';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/appwrite';
import RecentlyViewed from '@/components/RecentlyViewed';
import CartLineRow from '@/components/CartLineRow';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Coupon } from '@/types';
import { MINIMUM_ORDER_CLP, isBelowMinimumOrder, minimumOrderMessage } from '@/lib/order-rules';

const PINK = '#f18e04';
const FF = '"DM Sans",system-ui,sans-serif';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, subtotal, totalItems, aperturaSavings } = useCart();
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
  const belowMinimum = isBelowMinimumOrder(total);

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
    <>
      <style>{`
        @keyframes cartFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .cart-empty-card { animation: cartFadeUp .5s ease both; }
        .cart-empty-card:nth-child(2) { animation-delay: .1s; }
        @media (max-width: 768px) {
          .cart-page-wrap { padding: 12px 12px calc(72px + env(safe-area-inset-bottom, 0px)) !important; }
          .cart-empty-layout { flex-direction: column !important; gap: 12px !important; }
          .cart-empty-main { flex-direction: column !important; text-align: center !important; padding: 32px 20px 28px !important; min-width: 0 !important; width: 100% !important; border-radius: 20px !important; gap: 16px !important; }
          .cart-empty-main > div:first-child { margin: 0 auto !important; width: 100px !important; height: 100px !important; }
          .cart-empty-main p:first-child { font-size: 20px !important; }
          .cart-empty-main p:nth-child(2) { font-size: 14px !important; }
          .cart-empty-summary { width: 100% !important; border-radius: 20px !important; padding: 20px 18px !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: FF }}>
        <div className="cart-page-wrap" style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '24px 5%', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20 }}>
            <Link href="/" style={{ color: PINK, textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
            <ChevronRight size={12} color="#9ca3af" />
            <span style={{ color: '#6b7280' }}>Carrito de compras</span>
          </div>

          <div className="cart-empty-layout" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="cart-empty-main cart-empty-card" style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: '48px 36px', display: 'flex', alignItems: 'center', gap: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <LottieCart size={140} />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>Tu carrito está vacío</p>
                <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6b7280', lineHeight: 1.55 }}>Agrega productos y consigue envío gratis en tu primera compra.</p>
                <Link href="/productos" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: `linear-gradient(135deg,${PINK},#ea580c)`, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(241,142,4,0.3)', transition: 'transform .2s, box-shadow .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(241,142,4,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(241,142,4,0.3)'; }}>
                  <ShoppingCart size={16} /> Explorar productos
                </Link>
              </div>
            </div>
            <div className="cart-empty-summary cart-empty-card" style={{ width: 280, flexShrink: 0, background: '#fff', borderRadius: 20, padding: '24px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Resumen de compra</p>
              <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', lineHeight: 1.5 }}>Aquí verás los importes de tu compra una vez que agregues productos.</p>
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <RecentlyViewed />
          </div>
        </div>
      </div>
    </>
  );

  /* ── FILLED STATE ── */
  return (
    <>
      <style>{`
        @keyframes cartSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .cart-items-box { animation: cartSlideUp .4s ease both; }
        .cart-summary-col > div { animation: cartSlideUp .4s ease both; }
        .cart-summary-col > div:nth-child(2) { animation-delay: .08s; }
        .cart-summary-col > div:nth-child(3) { animation-delay: .16s; }

        @media (max-width: 768px) {
          .cart-page-wrap { padding: 12px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important; }
          .cart-layout { flex-direction: column !important; gap: 12px !important; }
          .cart-items-col { min-width: 0 !important; width: 100% !important; }
          .cart-summary-col { width: 100% !important; max-width: none !important; position: sticky !important; bottom: 68px !important; z-index: 5 !important; }
          .cart-shipping-banner { padding: 10px 14px !important; font-size: 13px !important; border-radius: 14px !important; }
          .cart-items-box { padding: 0 14px !important; border-radius: 18px !important; }
          .cart-items-box h1 { font-size: 17px !important; }
          .cart-item { gap: 10px !important; padding: 12px 0 !important; }
          .cart-item > a { width: 72px !important; height: 72px !important; border-radius: 12px !important; }
          .cart-item > div:nth-child(2) p:first-child { font-size: 13px !important; }
          .cart-item > div:last-child { display: none !important; }
          .cart-summary-card { padding: 16px 16px !important; border-radius: 18px !important; }
          .cart-summary-card h2 { font-size: 16px !important; }
          .cart-summary-card .cart-total-row span:last-child { font-size: 20px !important; }
          .cart-coupon-card { padding: 14px 16px !important; border-radius: 18px !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: FF }}>
        <div className="cart-page-wrap" style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '24px 5%' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
            <Link href="/" style={{ color: PINK, textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
            <ChevronRight size={12} color="#9ca3af" />
            <span style={{ color: '#6b7280' }}>Carrito de compras</span>
          </div>

          <div className="cart-layout" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── LEFT: items ── */}
            <div className="cart-items-col" style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="cart-shipping-banner" style={{ background: '#fff', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff8ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={15} color={PINK} />
                </div>
                <span style={{ fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>Envío disponible a todo Chile</span>
              </div>

              <div className="cart-items-box" style={{ background: '#fff', borderRadius: 18, padding: '0 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '16px 0 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                    <ShoppingCart size={18} color={PINK} />
                    {totalItems === 1 ? '1 producto' : `${totalItems} productos`}
                  </h1>
                </div>

                {items.map(item => (
                  <CartLineRow
                    key={item.product.$id}
                    item={item}
                    onUpdateQty={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </div>

            {/* ── RIGHT: summary ── */}
            <div className="cart-summary-col" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div className="cart-summary-card" style={{ background: '#fff', borderRadius: 18, padding: '20px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.01em' }}>Resumen de compra</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>Productos ({totalItems})</span>
                  <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                </div>

                {aperturaSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#c2410c', display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={12} /> Promoción apertura</span>
                    <span style={{ color: '#c2410c', fontWeight: 700 }}>-{formatPrice(aperturaSavings)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#16a34a' }}>Descuento cupón</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, color: '#9ca3af' }}>
                  <span>Envío</span>
                  <span>A calcular</span>
                </div>

                <div className="cart-total-row" style={{ borderTop: '2px solid #f3f4f6', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Total</span>
                  <span style={{ fontSize: 26, fontWeight: 800, color: PINK, letterSpacing: '-0.02em' }}>{formatPrice(total)}</span>
                </div>

                {belowMinimum && (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', lineHeight: 1.45 }}>
                    ⚠ {minimumOrderMessage(total)}
                  </p>
                )}

                {belowMinimum ? (
                  <span
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', background: '#e5e7eb', color: '#9ca3af', textAlign: 'center', borderRadius: 12, fontSize: 15, fontWeight: 700, boxSizing: 'border-box', cursor: 'not-allowed' }}
                  >
                    Mínimo {formatPrice(MINIMUM_ORDER_CLP)}
                  </span>
                ) : (
                  <Link href={`/checkout${couponData ? `?coupon=${couponData.$id}&discount=${discount}` : ''}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '15px 0', background: `linear-gradient(135deg,${PINK},#ea580c)`, color: '#fff', textAlign: 'center', borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 6px 20px rgba(241,142,4,0.35)', transition: 'all 0.2s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}
                  >Continuar compra</Link>
                )}

                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
                  <Shield size={14} color={PINK} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                    <strong style={{ color: PINK }}>Compra Protegida</strong> — recibe el producto o te devolvemos el dinero.
                  </span>
                </div>
              </div>

              <div className="cart-coupon-card" style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} color={PINK} /> ¿Tienes un cupón?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej: DESCUENTO10"
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', color: '#1a1a1a', background: '#fafafa', fontFamily: FF, transition: 'border-color .15s' }} />
                  <button onClick={applyCoupon} disabled={loadingCoupon}
                    style={{ padding: '10px 16px', background: '#fff8ed', color: PINK, border: '1px solid rgba(241,142,4,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, opacity: loadingCoupon ? 0.6 : 1, fontFamily: FF, transition: 'background .15s' }}>
                    {loadingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#ef4444' }}>{couponError}</p>}
                {couponData && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Cupón aplicado: -{couponData.type === 'percentage' ? `${couponData.value}%` : formatPrice(couponData.value)}</p>}
              </div>

              <Link href="/productos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: PINK, textDecoration: 'none', padding: '8px 0', fontWeight: 600 }}>
                <ArrowLeft size={14} /> Seguir comprando
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
