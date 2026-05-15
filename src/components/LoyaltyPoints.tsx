'use client';

import { useState, useEffect } from 'react';
import { Star, Gift, TrendingUp } from 'lucide-react';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';

const POINTS_PER_1000 = 10; // 10 puntos por cada $1000

interface Tier {
  name: string;
  min: number;
  color: string;
  icon: string;
}

const TIERS: Tier[] = [
  { name: 'Bronce', min: 0, color: '#cd7f32', icon: '🥉' },
  { name: 'Plata', min: 500, color: '#c0c0c0', icon: '🥈' },
  { name: 'Oro', min: 2000, color: '#ffd700', icon: '🥇' },
  { name: 'Diamante', min: 5000, color: '#b9f2ff', icon: '💎' },
];

function getTier(points: number): Tier {
  return [...TIERS].reverse().find(t => points >= t.min) || TIERS[0];
}

function getNextTier(points: number): Tier | null {
  const idx = TIERS.findIndex(t => points < t.min);
  return idx >= 0 ? TIERS[idx] : null;
}

export default function LoyaltyPoints({ compact = false }: { compact?: boolean }) {
  const { user, isLoggedIn } = useAuth();
  const [points, setPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) { setLoading(false); return; }
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION, [
          Query.equal('CUSTOMEREMAIL', user.email),
          Query.equal('STATUS', ['paid', 'shipped', 'delivered']),
          Query.limit(200),
        ]);
        const spent = res.documents.reduce((s: number, o: any) => s + (o.TOTAL || 0), 0);
        const pts = Math.floor((spent / 1000) * POINTS_PER_1000);
        setTotalSpent(spent);
        setPoints(pts);
        setOrderCount(res.total);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [isLoggedIn, user]);

  if (!isLoggedIn || loading) return null;

  const tier = getTier(points);
  const next = getNextTier(points);
  const progress = next ? ((points - tier.min) / (next.min - tier.min)) * 100 : 100;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
        <span>{tier.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{points} pts</span>
        <span style={{ fontSize: 11, color: '#b45309' }}>· {tier.name}</span>
      </div>
    );
  }

  const PINK = '#ec4899';

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #fce7f3' }}>
      {/* Header with tier */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tier.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {tier.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{points.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>puntos</span></p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: tier.color, fontWeight: 700 }}>Nivel {tier.name}</p>
        </div>
      </div>

      {/* Progress bar */}
      {next && (
        <div style={{ padding: '0 18px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{tier.icon} {tier.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: next.color }}>{next.icon} {next.name}</span>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${PINK})`, borderRadius: 3, width: `${Math.min(100, progress)}%`, transition: 'width .5s ease' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', textAlign: 'center', fontWeight: 500 }}>
            Faltan <strong style={{ color: PINK }}>{(next.min - points).toLocaleString()}</strong> pts para {next.name}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', borderTop: '1px solid #fce7f3' }}>
        <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #fce7f3' }}>
          <TrendingUp size={15} color={PINK} style={{ margin: '0 auto 3px' }} />
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>{orderCount}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Compras</p>
        </div>
        <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #fce7f3' }}>
          <Gift size={15} color={PINK} style={{ margin: '0 auto 3px' }} />
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>${Math.round(totalSpent).toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Total gastado</p>
        </div>
        <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
          <Star size={15} color={PINK} style={{ margin: '0 auto 3px' }} />
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>{POINTS_PER_1000}x</p>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Pts/$1.000</p>
        </div>
      </div>
    </div>
  );
}
