'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/appwrite';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductCardPreview({ product, onClose }: Props) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const price = product.CURRENTPRICE && product.CURRENTPRICE > 0 ? product.CURRENTPRICE : product.PRICE;
  const outOfStock = product.STOCK === 0;

  function close() {
    setOpen(false);
    setTimeout(onClose, 220);
  }

  function handleBuy() {
    if (outOfStock) return;
    addItem(product);
    close();
  }

  return (
    <div
      className="pk-preview-backdrop"
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 10050,
        background: open ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        backdropFilter: open ? 'blur(6px)' : 'none',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.25s',
      }}
    >
      <div
        className="pk-preview-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 480, background: '#fff',
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          marginBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -12px 40px rgba(0,0,0,0.2)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: '#e5e7eb' }} />
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.95)', color: '#ec4899', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          }}
        >
          <X size={18} />
        </button>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: 'linear-gradient(135deg,#fef2f8,#fff)' }}>
          {product.IMAGEURL ? (
            <Image src={product.IMAGEURL} alt={product.NAME} fill style={{ objectFit: 'contain' }} sizes="100vw" priority />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 64 }}>📦</div>
          )}
        </div>
        <div style={{ padding: '16px 16px 20px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>{product.NAME}</p>
          <p style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 800, color: '#ec4899' }}>{formatPrice(price)}</p>
          <button
            type="button"
            onClick={handleBuy}
            disabled={outOfStock}
            style={{
              width: '100%', padding: 14, border: 'none', borderRadius: 14, marginBottom: 10,
              background: outOfStock ? '#f3f4f6' : 'linear-gradient(135deg,#ec4899,#f9a8d4)',
              color: outOfStock ? '#9ca3af' : '#fff', fontSize: 15, fontWeight: 800, cursor: outOfStock ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: outOfStock ? 'none' : '0 6px 20px rgba(236,72,153,0.35)',
            }}
          >
            <ShoppingCart size={18} /> {outOfStock ? 'Sin stock' : 'Comprar ahora'}
          </button>
          <Link
            href={`/productos/${product.$id}`}
            onClick={close}
            style={{
              display: 'block', width: '100%', padding: 13, borderRadius: 14, textAlign: 'center',
              border: '1.5px solid #fce7f3', background: '#fff', color: '#ec4899',
              fontSize: 14, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            Ir a producto
          </Link>
        </div>
      </div>
    </div>
  );
}
