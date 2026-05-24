'use client';

import { Sparkles, Gift } from 'lucide-react';

type Props = {
  percent: number;
  compact?: boolean;
};

export default function AperturaPromoBanner({ percent, compact = false }: Props) {
  if (!percent) return null;

  return (
    <div
      className="apertura-promo-banner"
      style={{
        marginBottom: compact ? 12 : 18,
        borderRadius: compact ? 16 : 20,
        padding: compact ? '12px 14px' : '16px 18px',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 40%, #fbcfe8 100%)',
        border: '1.5px solid rgba(227,150,191,0.25)',
        boxShadow: '0 8px 28px rgba(227,150,191,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="apertura-promo-shine"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: compact ? 44 : 52,
            height: compact ? 44 : 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f5a8cf, #e396bf)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(227,150,191,0.35)',
          }}
        >
          <Gift size={compact ? 22 : 26} color="#fff" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sparkles size={14} color="#c0547a" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Promoción de apertura
            </span>
          </div>
          <p style={{ margin: 0, fontSize: compact ? 14 : 16, fontWeight: 900, color: '#831843', lineHeight: 1.25 }}>
            Tu {percent}% de descuento está activo
          </p>
          <p style={{ margin: '4px 0 0', fontSize: compact ? 11 : 12, color: '#9d174d', fontWeight: 500 }}>
            Se aplica al pagar con tu cupón de bienvenida
          </p>
        </div>
        <span
          className="apertura-disc-badge"
          style={{
            flexShrink: 0,
            padding: '8px 12px',
            borderRadius: 12,
            fontSize: compact ? 16 : 20,
            fontWeight: 900,
            color: '#fff',
            background: 'linear-gradient(135deg, #f472b6, #e396bf, #c0547a)',
            boxShadow: '0 4px 12px rgba(234,88,12,0.35)',
          }}
        >
          -{percent}%
        </span>
      </div>
    </div>
  );
}
