'use client';

import { Product } from '@/types';

interface Props {
  product: Product;
  style?: React.CSSProperties;
}

export default function ProductBadges({ product, style }: Props) {
  const badges: { label: string; bg: string; color: string }[] = [];

  // New: created in last 7 days
  const createdAt = (product as any).$createdAt;
  if (createdAt) {
    const created = new Date(createdAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - created < sevenDays) {
      badges.push({ label: 'Nuevo', bg: 'linear-gradient(135deg,#f18e04,#f29718)', color: '#fff' });
    }
  }

  // Best seller: sold > 20
  if (product.SOLDQUANTITY && product.SOLDQUANTITY >= 20) {
    badges.push({ label: 'Más vendido', bg: '#ff6900', color: '#fff' });
  }

  // On sale
  if (product.CURRENTPRICE && product.CURRENTPRICE > 0 && product.CURRENTPRICE < product.PRICE) {
    const pct = Math.round(((product.PRICE - product.CURRENTPRICE) / product.PRICE) * 100);
    badges.push({ label: `-${pct}%`, bg: '#e53935', color: '#fff' });
  }

  // Low stock
  if (product.STOCK != null && product.STOCK > 0 && product.STOCK <= 5) {
    badges.push({ label: 'Últimas unidades', bg: '#f59e0b', color: '#fff' });
  }

  if (badges.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, ...style }}>
      {badges.map((b, i) => (
        <span key={i} style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4, background: b.bg, color: b.color,
          lineHeight: 1.4, whiteSpace: 'nowrap',
        }}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
