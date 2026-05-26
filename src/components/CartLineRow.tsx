'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus } from 'lucide-react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/lib/appwrite';
import { useCartItemPrice } from '@/hooks/useCartItemPrice';
import AperturaDiscountBadge from '@/components/AperturaDiscountBadge';

const PINK = '#e396bf';

type Props = {
  item: CartItem;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
};

export default function CartLineRow({ item, onUpdateQty, onRemove }: Props) {
  const p = item.product;
  const { unitPrice, pricing } = useCartItemPrice(item);
  const lineTotal = unitPrice * item.quantity;
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  return (
    <>
      <div className="cart-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
        {/* Remove X button — top right */}
        <button
          type="button"
          onClick={() => onRemove(p.$id)}
          style={{
            position: 'absolute', top: 6, right: 0,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#d1d5db', padding: 2, lineHeight: 1, transition: 'color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
        >
          <X size={14} />
        </button>

        {/* Image — click to zoom */}
        <div
          onClick={() => p.IMAGEURL && setZoomSrc(p.IMAGEURL)}
          style={{ flexShrink: 0, position: 'relative', width: 60, height: 60, background: '#fafafa', borderRadius: 12, overflow: 'hidden', cursor: p.IMAGEURL ? 'zoom-in' : 'default', border: '1px solid #f0f0f0' }}
        >
          {p.IMAGEURL
            ? <img src={p.IMAGEURL} alt={p.NAME} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4, position: 'absolute', inset: 0 }} />
            : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</span>}
          {pricing.hasDiscount && pricing.fromApertura && (
            <span style={{ position: 'absolute', top: 2, left: 2, zIndex: 2 }}>
              <AperturaDiscountBadge percent={pricing.discountPercent} size="sm" />
            </span>
          )}
        </div>

        {/* Name + Price — NO navigation */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#1a1a1a', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {pricing.hasDiscount && pricing.originalPrice != null && (
              <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(pricing.originalPrice)}</span>
            )}
            <span style={{ fontSize: 15, fontWeight: 700, color: pricing.fromApertura ? PINK : '#1a1a1a' }}>{formatPrice(unitPrice)}</span>
            {pricing.hasDiscount && !pricing.fromApertura && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '1px 5px', borderRadius: 5 }}>{pricing.discountPercent}% OFF</span>
            )}
            {pricing.fromApertura && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#be185d', background: '#fdf2f8', padding: '1px 5px', borderRadius: 5 }}>Promo</span>
            )}
          </div>

          {/* Qty + Line total */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity - 1)} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <Minus size={12} />
              </button>
              <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.quantity}</span>
              <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity + 1)} disabled={item.quantity >= p.STOCK} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: item.quantity >= p.STOCK ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.quantity >= p.STOCK ? '#d1d5db' : '#6b7280' }}>
                <Plus size={12} />
              </button>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{formatPrice(lineTotal)}</span>
          </div>
        </div>
      </div>

      {/* Zoom modal — no black frame, with "Ver más detalle" button */}
      {zoomSrc && (
        <div
          onClick={() => setZoomSrc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={zoomSrc}
            alt={p.NAME}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain',
              borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }} onClick={e => e.stopPropagation()}>
            <Link
              href={`/productos/${p.$id}`}
              onClick={() => setZoomSrc(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 24px', background: `linear-gradient(135deg, ${PINK}, #c0547a)`,
                color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(227,150,191,0.4)',
              }}
            >
              Ver más detalle del producto
            </Link>
            <button
              onClick={() => setZoomSrc(null)}
              style={{
                padding: '10px 20px', background: 'rgba(255,255,255,0.12)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

