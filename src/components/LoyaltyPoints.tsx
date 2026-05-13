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

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${tier.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {tier.icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#333' }}>{points.toLocaleString()} puntos</p>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Nivel {tier.name}</p>
        </div>
      </div>

      {/* Progress bar */}
      {next && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#888' }}>{tier.icon} {tier.name}</span>
            <span style={{ fontSize: 11, color: '#888' }}>{next.icon} {next.name}</span>
          </div>
          <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg, ${tier.color}, ${next.color})`, borderRadius: 4, width: `${Math.min(100, progress)}%`, transition: 'width .5s ease' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#999', textAlign: 'center' }}>
            Faltan {(next.min - points).toLocaleString()} pts para {next.name}
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <TrendingUp size={16} color="#3483fa" style={{ margin: '0 auto 4px' }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#333' }}>{orderCount}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Compras</p>
        </div>
        <div style={{ flex: 1, background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <Gift size={16} color="#e53935" style={{ margin: '0 auto 4px' }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#333' }}>${Math.round(totalSpent).toLocaleString()}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Total gastado</p>
        </div>
        <div style={{ flex: 1, background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <Star size={16} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#333' }}>{POINTS_PER_1000}x</p>
          <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Pts/$1.000</p>
        </div>
      </div>
    </div>
  );
}
