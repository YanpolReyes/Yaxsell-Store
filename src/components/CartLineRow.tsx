'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/lib/appwrite';
import { useCartItemPrice } from '@/hooks/useCartItemPrice';
import AperturaDiscountBadge from '@/components/AperturaDiscountBadge';

const PINK = '#ec4899';

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
    <div className="cart-item">
      <Link href={`/productos/${p.$id}`} style={{ flexShrink: 0, position: 'relative', width: 96, height: 96, background: '#fafafa', borderRadius: 12, overflow: 'hidden', display: 'block', border: '1px solid #f0f0f0' }}>
        {p.IMAGEURL
          ? <Image src={p.IMAGEURL} alt={p.NAME} fill style={{ objectFit: 'contain', padding: 4 }} />
          : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📦</span>}
        {pricing.hasDiscount && pricing.fromApertura && (
          <span style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
            <AperturaDiscountBadge percent={pricing.discountPercent} size="sm" />
          </span>
        )}
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/productos/${p.$id}`} style={{ textDecoration: 'none' }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#1a1a1a', fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.NAME}</p>
        </Link>
        {pricing.hasDiscount && pricing.originalPrice != null && (
          <p style={{ margin: '0 0 2px', fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>{formatPrice(pricing.originalPrice)}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: pricing.fromApertura ? PINK : '#1a1a1a' }}>{formatPrice(unitPrice)}</span>
          {pricing.hasDiscount && !pricing.fromApertura && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{pricing.discountPercent}% OFF</span>
          )}
          {pricing.fromApertura && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#be185d' }}>Promo apertura</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity - 1)} className="qty-btn" style={{ borderRight: 'none', borderRadius: '10px 0 0 10px' }}>-</button>
            <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 600, background: '#fafafa', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
            <button type="button" onClick={() => onUpdateQty(p.$id, item.quantity + 1)} disabled={item.quantity >= p.STOCK} className="qty-btn" style={{ borderLeft: 'none', borderRadius: '0 10px 10px 0' }}>+</button>
          </div>
          <button type="button" onClick={() => onRemove(p.$id)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, padding: 0, fontWeight: 500 }}>
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{formatPrice(lineTotal)}</p>
      </div>
    </div>
  );
}

