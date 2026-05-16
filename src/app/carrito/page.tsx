'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Tag, Truck, Shield, ChevronRight, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/appwrite';
import RecentlyViewed from '@/components/RecentlyViewed';
import CartLineRow from '@/components/CartLineRow';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Coupon } from '@/types';
import { MINIMUM_ORDER_CLP, isBelowMinimumOrder, minimumOrderMessage } from '@/lib/order-rules';

const PINK = '#ec4899';
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
        @keyframes cartFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media (max-width: 768px) {
          .cart-page-wrap { padding: 12px 12px calc(72px + env(safe-area-inset-bottom, 0px)) !important; }
          .cart-empty-layout { flex-direction: column !important; gap: 12px !important; }
          .cart-empty-main { flex-direction: column !important; text-align: center !important; padding: 28px 20px !important; min-width: 0 !important; width: 100% !important; border-radius: 16px !important; }
          .cart-empty-main > div:first-child { margin: 0 auto !important; width: 100px !important; height: 100px !important; }
          .cart-empty-summary { width: 100% !important; border-radius: 16px !important; padding: 18px 16px !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', position: 'relative', fontFamily: FF }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <img src="https://t3.ftcdn.net/jpg/06/09/87/00/360_F_609870090_K0ipmisbBngguMfDg2hwTrfjlSx0dZKS.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(1.1)', transform: 'scale(1.15)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,245,248,0.75) 0%,rgba(255,255,255,0.85) 100%)' }} />
        </div>
        <div className="cart-page-wrap" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '24px 5%', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24 }}>
            <Link href="/" style={{ color: PINK, textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
            <ChevronRight size={12} color="#9ca3af" />
            <span style={{ color: '#6b7280' }}>Carrito de compras</span>
          </div>

          <div className="cart-empty-layout" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div className="cart-empty-main" style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 18, padding: '40px 32px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ flexShrink: 0, width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#fef2f8,#fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(236,72,153,0.15)', animation: 'cartFloat 3s ease-in-out infinite' }}>
                <ShoppingCart size={56} color={PINK} style={{ opacity: 0.7 }} />
              </div>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>Tu carrito está vacío</p>
                <p style={{ margin: '0 0 16px', fontSize: 15, color: '#6b7280', lineHeight: 1.5 }}>Agrega productos y consigue envío gratis en tu primera compra.</p>
                <Link href="/productos" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: PINK, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}>Explorar productos</Link>
              </div>
            </div>
            <div className="cart-empty-summary" style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 18, padding: '24px 20px', border: '1px solid #f0f0f0' }}>
              <p style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Resumen de compra</p>
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
        .cart-item { display: flex; gap: 16px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; }
        .cart-item:last-child { border-bottom: none; }
        .cart-item:hover { background: #fef2f840; }
        .qty-btn { width: 36px; height: 36px; border: 1px solid #e5e7eb; background: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-family: ${FF}; }
        .qty-btn:hover { border-color: ${PINK}; color: ${PINK}; }
        .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 768px) {
          .cart-page-wrap { padding: 12px 12px calc(72px + env(safe-area-inset-bottom, 0px)) !important; }
          .cart-layout { flex-direction: column !important; gap: 12px !important; }
          .cart-items-col { min-width: 0 !important; width: 100% !important; }
          .cart-summary-col { width: 100% !important; max-width: none !important; }
          .cart-shipping-banner { padding: 12px 14px !important; font-size: 13px !important; }
          .cart-items-box { padding: 0 14px !important; border-radius: 16px !important; }
          .cart-items-box h1 { font-size: 17px !important; }
          .cart-item { flex-wrap: wrap !important; gap: 12px !important; padding: 14px 0 !important; }
          .cart-item > a { width: 88px !important; height: 88px !important; }
          .cart-item > div:nth-child(2) { flex: 1 1 calc(100% - 100px) !important; min-width: 0 !important; }
          .cart-item > div:last-child { width: 100% !important; text-align: left !important; display: flex !important; justify-content: space-between !important; align-items: center !important; border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 4px; }
          .cart-item > div:last-child p { font-size: 20px !important; }
          .cart-summary-card { padding: 18px 16px !important; border-radius: 16px !important; }
          .cart-summary-card h2 { font-size: 17px !important; }
          .cart-coupon-card { padding: 14px 16px !important; }
          .cart-empty-row { flex-direction: column !important; text-align: center !important; padding: 28px 20px !important; }
          .cart-empty-row > div:first-child { margin: 0 auto !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', position: 'relative', fontFamily: FF }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <img src="https://t3.ftcdn.net/jpg/06/09/87/00/360_F_609870090_K0ipmisbBngguMfDg2hwTrfjlSx0dZKS.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(1.1)', transform: 'scale(1.15)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,245,248,0.75) 0%,rgba(255,255,255,0.85) 100%)' }} />
        </div>
        <div className="cart-page-wrap" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '24px 5%' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20 }}>
            <Link href="/" style={{ color: PINK, textDecoration: 'none', fontWeight: 500 }}>Inicio</Link>
            <ChevronRight size={12} color="#9ca3af" />
            <span style={{ color: '#6b7280' }}>Carrito de compras</span>
          </div>

          <div className="cart-layout" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── LEFT: items ── */}
            <div className="cart-items-col" style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="cart-shipping-banner" style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Truck size={18} color={PINK} />
                <span style={{ fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>Envío disponible a todo Chile</span>
              </div>

              <div className="cart-items-box" style={{ background: '#fff', borderRadius: 14, padding: '0 20px', border: '1px solid #f0f0f0' }}>
                <div style={{ padding: '18px 0 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShoppingCart size={20} color={PINK} />
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
            <div className="cart-summary-col" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="cart-summary-card" style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>Resumen de compra</h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
                  <span style={{ color: '#6b7280' }}>Productos ({totalItems})</span>
                  <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                </div>

                {aperturaSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
                    <span style={{ color: '#be185d' }}>Promoción de apertura</span>
                    <span style={{ color: '#be185d', fontWeight: 700 }}>-{formatPrice(aperturaSavings)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
                    <span style={{ color: '#16a34a' }}>Descuento cupón</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, fontSize: 14, color: '#9ca3af' }}>
                  <span>Envío</span>
                  <span>A calcular</span>
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Total</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: PINK }}>{formatPrice(total)}</span>
                </div>

                {belowMinimum && (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', lineHeight: 1.45 }}>
                    ⚠ {minimumOrderMessage(total)}
                  </p>
                )}

                {belowMinimum ? (
                  <span
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', background: '#e5e7eb', color: '#9ca3af', textAlign: 'center', borderRadius: 12, fontSize: 16, fontWeight: 700, boxSizing: 'border-box', cursor: 'not-allowed' }}
                  >
                    Mínimo {formatPrice(MINIMUM_ORDER_CLP)}
                  </span>
                ) : (
                  <Link href={`/checkout${couponData ? `?coupon=${couponData.$id}&discount=${discount}` : ''}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', background: PINK, color: '#fff', textAlign: 'center', borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 6px 20px rgba(236,72,153,0.35)', transition: 'all 0.2s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}
                  >Continuar compra</Link>
                )}

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Shield size={14} color={PINK} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                    <strong style={{ color: PINK }}>Compra Protegida</strong> — recibe el producto o te devolvemos el dinero.
                  </span>
                </div>
              </div>

              <div className="cart-coupon-card" style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} color={PINK} /> ¿Tienes un cupón?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej: DESCUENTO10"
                    onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, outline: 'none', color: '#1a1a1a', background: '#fafafa', fontFamily: FF }} />
                  <button onClick={applyCoupon} disabled={loadingCoupon}
                    style={{ padding: '10px 14px', background: '#fef2f8', color: PINK, border: '1px solid rgba(236,72,153,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, opacity: loadingCoupon ? 0.6 : 1, fontFamily: FF }}>
                    {loadingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#ef4444' }}>{couponError}</p>}
                {couponData && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Cupón aplicado: -{couponData.type === 'percentage' ? `${couponData.value}%` : formatPrice(couponData.value)}</p>}
              </div>

              <Link href="/productos" style={{ textAlign: 'center', display: 'block', fontSize: 13, color: PINK, textDecoration: 'none', padding: '6px 0', fontWeight: 600 }}>
                ← Seguir comprando
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
