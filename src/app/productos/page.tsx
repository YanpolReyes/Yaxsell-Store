'use client';

import { Suspense } from 'react';
import { ProductosInner } from './ProductosInner';

const FF = '"DM Sans","Proxima Nova",-apple-system,BlinkMacSystemFont,sans-serif';

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily: FF, background: 'linear-gradient(180deg,#fff5f8 0%,#fff 280px)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 20px 60px' }}>
          <div style={{ height: 36, width: 200, background: '#fce7f3', borderRadius: 10, marginBottom: 30 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 320, background: '#fff', borderRadius: 18, border: '1px solid #fce7f3' }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductosInner />
    </Suspense>
  );
}
