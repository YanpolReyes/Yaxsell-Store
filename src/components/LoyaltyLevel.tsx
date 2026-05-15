'use client';

import { useEffect, useState } from 'react';
import { Crown, Star, Gem, Award, Gift, Truck, Headphones, Sparkles, TrendingUp, Coins, Calendar, Trophy, Zap, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { LoyaltyService } from '@/services/loyaltyService';
import { motion, AnimatePresence } from 'framer-motion';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

interface LevelConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  requiredOrders: number;
  couponPercent: number;
  minOrderValue: number;
  benefits: string[];
}

const LEVELS: LevelConfig[] = [
  {
    id: 'bronze',
    name: 'Bronce',
    icon: Award,
    color: '#cd7f32',
    bgColor: 'linear-gradient(135deg, #eaddcf, #d4a373)',
    requiredOrders: 0,
    couponPercent: 0,
    minOrderValue: 0,
    benefits: ['Acceso a catálogo completo', 'Seguimiento de pedidos', 'Soporte estándar', '1 punto por cada $1000 gastado'],
  },
  {
    id: 'silver',
    name: 'Plata',
    icon: Star,
    color: '#9ca3af',
    bgColor: 'linear-gradient(135deg, #f3f4f6, #9ca3af)',
    requiredOrders: 5,
    couponPercent: 2,
    minOrderValue: 50000,
    benefits: ['Todo lo de Bronce', 'Cupón 2% (pedidos > $50k)', 'Envío prioritario', 'Acceso anticipado a ofertas', '1.5 puntos por cada $1000'],
  },
  {
    id: 'gold',
    name: 'Oro',
    icon: Crown,
    color: '#fbbf24',
    bgColor: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
    requiredOrders: 10,
    couponPercent: 3,
    minOrderValue: 100000,
    benefits: ['Todo lo de Plata', 'Cupón 3% (pedidos > $100k)', 'Soporte prioritario 24/7', '2 puntos por cada $1000', 'Envío gratis en > $80k'],
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: Gem,
    color: '#38bdf8',
    bgColor: 'linear-gradient(135deg, #e0f2fe, #38bdf8)',
    requiredOrders: 20,
    couponPercent: 5,
    minOrderValue: 200000,
    benefits: ['Todo lo de Oro', 'Cupón 5% (pedidos > $200k)', 'Envío gratis ilimitado', '3 puntos por cada $1000', 'Gerente de cuenta'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    icon: Sparkles,
    color: '#f43f5e',
    bgColor: 'linear-gradient(135deg, #ffe4e6, #f43f5e)',
    requiredOrders: 30,
    couponPercent: 10,
    minOrderValue: 210000,
    benefits: ['Todo lo de Diamante', 'Cupón 10% (pedidos > $210k)', 'Envío gratis express', '5 puntos por cada $1000', 'Personal shopper'],
  },
];

export default function LoyaltyLevel() {
  const { user, isLoggedIn } = useAuth();
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [paidOrdersCount, setPaidOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [points, setPoints] = useState(0);
  const [nextLevel, setNextLevel] = useState<LevelConfig | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [couponGenerated, setCouponGenerated] = useState(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [levelHistory, setLevelHistory] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadUserData();
  }, [isLoggedIn, user]);

  async function loadUserData() {
    if (!user || !user.id) return;
    try {
      const loyaltyData = await LoyaltyService.getLoyaltyData(user.id);
      
      setPaidOrdersCount(loyaltyData.paidOrdersCount);
      setTotalSpent(loyaltyData.totalSpent);
      setPoints(loyaltyData.points);
      setLevelHistory(loyaltyData.levelHistory);

      const levelIndex = LEVELS.findIndex(l => l.id === loyaltyData.currentLevel);
      const level = LEVELS[levelIndex];
      setCurrentLevel(level);

      if (levelIndex < LEVELS.length - 1) {
        const next = LEVELS[levelIndex + 1];
        setNextLevel(next);
        const progress = ((loyaltyData.paidOrdersCount - level.requiredOrders) / (next.requiredOrders - level.requiredOrders)) * 100;
        setProgressPercent(Math.min(Math.max(progress, 0), 100));
      } else {
        setNextLevel(null);
        setProgressPercent(100);
      }

      const lastHistory = loyaltyData.levelHistory[loyaltyData.levelHistory.length - 1];
      if (lastHistory && lastHistory.level === loyaltyData.currentLevel) {
        setCouponGenerated(lastHistory.couponGenerated);
        setCouponCode(lastHistory.couponCode || '');
      }

    } catch (err) {
      console.error('Error loading loyalty data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateCoupon() {
    if (!user || !nextLevel || !user.id) return;

    const result = await LoyaltyService.generateLevelUpCoupon(user.id, nextLevel.id);
    
    if (result.success && result.couponCode) {
      setCouponGenerated(true);
      setCouponCode(result.couponCode);
      setCurrentLevel(nextLevel);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      loadUserData();
    } else {
      alert('Error al generar cupón: ' + (result.error || 'Intenta nuevamente.'));
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.4)', padding: 40, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: '3px solid #f3f4f6', borderTop: `3px solid ${PINK}`, borderRadius: '50%', margin: '0 auto' }} 
        />
      </div>
    );
  }

  const CurrentIcon = currentLevel.icon;
  const NextIcon = nextLevel?.icon;
  const ordersNeeded = nextLevel ? nextLevel.requiredOrders - paidOrdersCount : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ 
        background: '#ffffff', 
        borderRadius: 32, 
        border: `1px solid ${PINK}10`, 
        padding: 40, 
        fontFamily: FF,
        boxShadow: '0 20px 60px rgba(236,72,153,0.05), 0 4px 12px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Premium Background Elements */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: `radial-gradient(circle, ${PINK}08 0%, transparent 70%)`, borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: `radial-gradient(circle, ${PINK}05 0%, transparent 70%)`, borderRadius: '50%', zIndex: 0 }} />

      {showConfetti && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
        >
          <div style={{ textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2, rotate: [0, 15, -15, 0] }} transition={{ type: 'spring', damping: 12 }}>
              <CurrentIcon size={80} color={PINK} />
            </motion.div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginTop: 24, color: '#111827' }}>¡NUEVO NIVEL ALCANZADO!</h2>
            <p style={{ color: PINK, fontWeight: 800, fontSize: 18 }}>Bienvenido a {currentLevel.name}</p>
          </div>
        </motion.div>
      )}

      {/* Header Profile Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            style={{ 
              width: 90, height: 90, borderRadius: 28, 
              background: `linear-gradient(135deg, #fff, ${PINK}05)`, 
              border: `2px solid ${PINK}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 12px 30px ${PINK}15, inset 0 2px 4px rgba(255,255,255,1)`,
              position: 'relative'
            }}
          >
            <CurrentIcon size={44} color={currentLevel.color} strokeWidth={2.5} />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: 'absolute', bottom: -8, right: -8, background: '#fff', borderRadius: '50%', padding: 6, boxShadow: '0 4px 15px rgba(236,72,153,0.2)' }}
            >
              <Zap size={16} color={PINK} fill={PINK} />
            </motion.div>
          </motion.div>
          <div>
            <motion.span 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: 'inline-block', padding: '6px 14px', background: `${PINK}08`, color: PINK, borderRadius: 999, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6, border: `1px solid ${PINK}10` }}
            >
              MI STATUS ACTUAL
            </motion.span>
            <h2 style={{ margin: 0, fontSize: 42, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1 }}>{currentLevel.name}</h2>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40, position: 'relative', zIndex: 1 }}>
        {[
          { icon: Trophy, label: 'Pedidos Pagados', value: paidOrdersCount, color: '#3b82f6', bg: '#eff6ff' },
          { icon: Coins, label: 'Puntos Bella', value: points.toLocaleString(), color: PINK, bg: `${PINK}08` },
          { icon: TrendingUp, label: 'Total Invertido', value: formatPrice(totalSpent), color: '#10b981', bg: '#ecfdf5' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(236,72,153,0.06)', borderColor: `${PINK}20` }}
            style={{ padding: 24, background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 14, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: `1px solid ${stat.color}10` }}>
              <stat.icon size={22} color={stat.color} />
            </div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>{stat.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress & Motivation Section */}
      {nextLevel && (
        <div style={{ marginBottom: 40, position: 'relative', zIndex: 1, padding: 32, background: `linear-gradient(135deg, ${PINK}04, #fff)`, borderRadius: 28, border: `1px solid ${PINK}08` }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827', letterSpacing: '-0.01em' }}>
                {ordersNeeded > 0 ? (
                  <>Estás a <span style={{ color: PINK }}>{ordersNeeded} pedidos</span> de <span style={{ color: nextLevel.color }}>{nextLevel.name}</span></>
                ) : (
                  <span style={{ color: '#10b981' }}>🎉 ¡Ya puedes reclamar tu nuevo nivel!</span>
                )}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                {ordersNeeded > 0 ? 'Desbloquea beneficios exclusivos con tu próxima compra.' : 'Haz clic abajo para generar tu cupón de recompensa.'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>{paidOrdersCount}</span>
              <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 700 }}> / {nextLevel.requiredOrders}</span>
            </div>
          </div>

          <div style={{ height: 16, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ 
                position: 'absolute', top: 0, left: 0, bottom: 0, 
                background: `linear-gradient(90deg, ${PINK}, #f472b6)`,
                borderRadius: 999,
                boxShadow: `0 0 20px ${PINK}33`
              }} 
            />
            {/* Shimmer effect */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', zIndex: 1 }}
            />
          </div>
        </div>
      )}

      {/* Coupon Action */}
      {nextLevel && nextLevel.couponPercent > 0 && (
        <AnimatePresence>
          {(!couponGenerated && paidOrdersCount >= nextLevel.requiredOrders) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: 32, background: `linear-gradient(135deg, ${PINK}, #db2777)`, borderRadius: 28, marginBottom: 40, boxShadow: `0 20px 40px ${PINK}30`, position: 'relative', overflow: 'hidden' }}
            >
              {/* Decorative sparkles */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.2, pointerEvents: 'none' }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                  <Gift size={32} color={PINK} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>¡Tu Recompensa del {nextLevel.couponPercent}%!</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Felicidades por subir a {nextLevel.name}. Úsalo en tu próxima compra.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, translateY: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={generateCoupon}
                  style={{ padding: '18px 36px', background: '#fff', color: PINK, border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.02em' }}
                >
                  <Sparkles size={18} /> Reclamar Cupón
                </motion.button>
              </div>
            </motion.div>
          ) : couponGenerated && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: 24, background: '#f0fdf4', borderRadius: 24, border: '2px solid #34d399', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(16,185,129,0.05)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }}>
                  <Award size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#065f46' }}>Cupón Activo</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#047857', fontWeight: 500 }}>Añadido a tu cuenta para tu próxima compra</p>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '12px 24px', borderRadius: 16, border: '2px dashed #a7f3d0', fontSize: 22, fontWeight: 900, color: '#065f46', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                {couponCode}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Benefits Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, position: 'relative', zIndex: 1 }}>
        {/* Current Benefits */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>
            TUS PRIVILEGIOS {currentLevel.name.toUpperCase()}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentLevel.benefits.map((benefit, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fff', padding: '16px 20px', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}
              >
                <div style={{ marginTop: 2, color: currentLevel.color }}>
                  <CheckCircle2 size={18} />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#4b5563', fontWeight: 600, lineHeight: 1.5 }}>{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Level Teaser */}
        {nextLevel && (
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: nextLevel.color, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={14} /> DESBLOQUEA EN {nextLevel.name.toUpperCase()}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {nextLevel.benefits.filter(b => !currentLevel.benefits.includes(b)).slice(0, 4).map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fff', border: '1px dashed #e2e8f0', padding: '16px 20px', borderRadius: 16, opacity: 0.6 }}>
                  <div style={{ marginTop: 2, color: '#cbd5e1' }}>
                    <Sparkles size={18} />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </motion.div>
  );
}
