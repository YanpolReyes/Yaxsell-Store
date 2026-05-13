'use client';

interface Props {
  stock: number;
  soldQuantity?: number;
}

export default function StockIndicator({ stock, soldQuantity = 0 }: Props) {
  if (stock <= 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935' }} />
        <span style={{ fontSize: 13, color: '#e53935', fontWeight: 600 }}>Sin stock</span>
      </div>
    );
  }

  const isLow = stock <= 5;
  const isUrgent = stock <= 3;
  const total = stock + soldQuantity;
  const pct = total > 0 ? Math.min(100, ((total - stock) / total) * 100) : 0;

  if (!isLow && soldQuantity < 10) return null;

  return (
    <div style={{ padding: '6px 0' }}>
      {isUrgent ? (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#e53935', fontWeight: 600 }}>
          ¡Solo quedan {stock}! — Últimas unidades
        </p>
      ) : isLow ? (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
          Quedan pocas unidades ({stock} disponibles)
        </p>
      ) : soldQuantity >= 10 ? (
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#00a650', fontWeight: 500 }}>
          {soldQuantity}+ vendidos
        </p>
      ) : null}

      {(isLow || soldQuantity >= 10) && (
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            width: `${pct}%`,
            background: isUrgent ? '#e53935' : isLow ? '#f59e0b' : '#00a650',
            transition: 'width .5s ease',
          }} />
        </div>
      )}
    </div>
  );
}
