'use client';

import Link from 'next/link';
import { Trash2, Minus, Plus } from 'lucide-react';
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

  return (
    <div className="cart-item" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
      <Link href={`/productos/${p.$id}`} style={{ flexShrink: 0, position: 'relative', width: 90, height: 90, background: '#fafafa', borderRadius: 14, overflow: 'hidden', display: 'block', border: '1px solid #f0f0f0' }}>
        {p.IMAGEURL
          ? <img src={p.IMAGEURL} alt={p.NAME} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6, position: 'absolute', inset: 0 }} />
          : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</span>}
        {pricing.hasDiscount && pricing.fromApertura && (
          <span style={{ position: 'absolute', top: 4, left: 4, zIndex: 2 }}>
            <AperturaDiscountBadge percent={pricing.discountPercent} size="sm" />
          </span>
        )}
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#1a1a1a', fontWeight: 600, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
        </Link>
        {pricing.hasDiscount && pricing.originalPrice != null && (
          <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(pricing.originalPrice)}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: pricing.fromApertura ? PINK : '#1a1a1a' }}>{formatPrice(unitPrice)}</span>
          {pricing.hasDiscount && !pricing.fromApertura && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: 6 }}>{pricing.discountPercent}% OFF</span>
          )}
          {pricing.fromApertura && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#be185d', background: '#fdf2f8', padding: '2px 6px', borderRadius: 6 }}>Promo</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fafafa', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity - 1)} style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'color .15s' }}>
              <Minus size={14} />
            </button>
            <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{item.quantity}</span>
            <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity + 1)} disabled={item.quantity >= p.STOCK} style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: item.quantity >= p.STOCK ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.quantity >= p.STOCK ? '#d1d5db' : '#6b7280', transition: 'color .15s' }}>
              <Plus size={14} />
            </button>
          </div>
          <button type="button" onClick={() => onRemove(p.$id)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: '4px 0', fontWeight: 500, transition: 'color .15s' }}>
            <Trash2 size={13} /> Quitar
          </button>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>{formatPrice(lineTotal)}</p>
      </div>
    </div>
  );
}

