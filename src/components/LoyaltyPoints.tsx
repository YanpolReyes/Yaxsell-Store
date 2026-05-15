'use client';

import { useState, useEffect } from 'react';
import { Star, Gift, TrendingUp, Sparkles, Ticket, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { LoyaltyService } from '@/services/loyaltyService';

const POINTS_PER_1000 = 10;

interface Tier {
  name: string;
  min: number;
  color: string;
  icon: string;
  bg: string;
}

const TIERS: Tier[] = [
  { name: 'Bronce', min: 0, color: '#cd7f32', bg: '#fdf2f8', icon: '🥉' },
  { name: 'Plata', min: 500, color: '#94a3b8', bg: '#f8fafc', icon: '🥈' },
  { name: 'Oro', min: 2000, color: '#fbbf24', bg: '#fffbeb', icon: '🥇' },
  { name: 'Diamante', min: 5000, color: '#38bdf8', bg: '#f0f9ff', icon: '💎' },
];
const PINK = '#ec4899';

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

  // Welcome coupon states
  const [showWelcomeReward, setShowWelcomeReward] = useState(false);
  const [selectedReward, setSelectedReward] = useState<'order_2' | 'product_5' | null>(null);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user) { setLoading(false); return; }
    (async () => {
      try {
        const { databases, account } = getServices();
        const { databaseId } = getAppwriteConfig();
        
        // Fetch orders
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

        // Check if welcome reward was claimed
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (!prefs.welcomeGiftClaimed) {
          setShowWelcomeReward(true);
        }

      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [isLoggedIn, user]);

  async function claimWelcomeReward() {
    if (!selectedReward || !user?.id) return;
    setClaiming(true);
    try {
      const res = await LoyaltyService.generateWelcomeCoupon(user.id, selectedReward);
      if (res.success && res.couponCode) {
        setClaimedCode(res.couponCode);
        setTimeout(() => setShowWelcomeReward(false), 8000);
      }
    } catch (err) {
      console.error("Error claiming reward", err);
    } finally {
      setClaiming(false);
    }
  }

  if (!isLoggedIn || loading) return null;

  const tier = getTier(points);
  const next = getNextTier(points);
  const progress = next ? ((points - tier.min) / (next.min - tier.min)) * 100 : 100;

  if (compact) {
    return (
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-pink-100 shadow-[0_2px_10px_rgba(236,72,153,0.06)]"
      >
        <span className="text-xl transform hover:scale-110 transition-transform">{tier.icon}</span>
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900 leading-none">{points} <span className="text-[10px] text-pink-500 font-bold uppercase tracking-tight">pts</span></span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{tier.name}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── Welcome Reward (First Registration) ── */}
      <AnimatePresence>
        {showWelcomeReward && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden' }}
            className="bg-white rounded-3xl p-1 shadow-[0_20px_50px_rgba(236,72,153,0.1)] border border-pink-100 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-pink-100 rounded-full blur-[40px] opacity-40 z-0" />
            
            <div className="relative z-10 p-7 text-slate-900">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200 flex-shrink-0">
                  <Gift size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">¡Tu Regalo de Bienvenida!</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Elige un beneficio exclusivo por tu primer registro.</p>
                </div>
              </div>

              {!claimedCode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSelectedReward('order_2')}
                      className={`group p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${selectedReward === 'order_2' ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 bg-white hover:border-pink-200 hover:bg-pink-50/10'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-lg ${selectedReward === 'order_2' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Ticket size={20} />
                        </div>
                        {selectedReward === 'order_2' && <CheckCircle2 size={18} className="text-pink-500" />}
                      </div>
                      <p className="font-black text-base text-slate-900">2% de Descuento</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">Total del Pedido</p>
                    </button>

                    <button 
                      onClick={() => setSelectedReward('product_5')}
                      className={`group p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${selectedReward === 'product_5' ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 bg-white hover:border-pink-200 hover:bg-pink-50/10'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-lg ${selectedReward === 'product_5' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Sparkles size={20} />
                        </div>
                        {selectedReward === 'product_5' && <CheckCircle2 size={18} className="text-pink-500" />}
                      </div>
                      <p className="font-black text-base text-slate-900">5% de Descuento</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">En el Producto</p>
                    </button>
                  </div>
                  
                  <motion.button 
                    whileHover={selectedReward ? { scale: 1.01, translateY: -2 } : {}} 
                    whileTap={selectedReward ? { scale: 0.98 } : {}}
                    onClick={claimWelcomeReward}
                    disabled={!selectedReward || claiming}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(236,72,153,0.3)]"
                  >
                    {claiming ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generando Cupón...
                      </div>
                    ) : (
                      <>¡RECLAMAR MI REGALO AHORA! <ChevronRight size={20} /></>
                    )}
                  </motion.button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 bg-pink-50/50 rounded-2xl border border-pink-100">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-black text-slate-900 mb-2 uppercase tracking-wide">¡Tu Cupón ha sido Generado!</p>
                  <p className="text-xs text-slate-500 mb-4 px-4">Copia el código y úsalo al finalizar tu compra.</p>
                  <div className="bg-white border-2 border-emerald-500/20 text-emerald-600 text-2xl font-mono font-black py-4 px-8 rounded-2xl inline-block tracking-[0.2em] shadow-sm select-all">
                    {claimedCode}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Loyalty Points Card ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)]"
      >
        {/* Tier Header */}
        <div className="p-8 pb-6 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: tier.color, filter: 'blur(40px)' }} />
          
          <div className="flex items-center gap-6 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`${isMobile ? 'w-14 h-14 rounded-2xl text-2xl' : 'w-20 h-20 rounded-[28px] text-4xl'} flex items-center justify-center shadow-lg z-10 transition-shadow hover:shadow-xl`} 
              style={{ backgroundColor: tier.bg, border: `2px solid ${tier.color}20` }}
            >
              {tier.icon}
            </motion.div>
            <div>
              <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider" style={{ backgroundColor: `${tier.color}15`, color: tier.color }}>
                Nivel {tier.name}
              </div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-black text-slate-900 tracking-tight leading-none`}>
                {points.toLocaleString()} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">pts</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Progress System */}
        <div className="px-8 pb-8 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progreso Actual</span>
              <span className="text-xs font-bold text-slate-700">{tier.name}</span>
            </div>
            {next ? (
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Siguiente Nivel</span>
                <span className="text-xs font-bold" style={{ color: next.color }}>{next.name}</span>
              </div>
            ) : (
              <span className="text-xs font-black text-pink-500 uppercase tracking-widest">¡Nivel Máximo! 👑</span>
            )}
          </div>
          
          <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-50">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute top-0 left-0 bottom-0 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.2)]" 
              style={{ background: `linear-gradient(90deg, ${tier.color}, ${next?.color || tier.color})` }} 
            />
          </div>
          
          {next && (
            <p className="mt-4 text-xs font-bold text-slate-400 text-center uppercase tracking-wide">
              Faltan <span className="text-pink-500">{(next.min - points).toLocaleString()} pts</span> para el nivel <span style={{ color: next.color }}>{next.name}</span>
            </p>
          )}
        </div>

        {/* Experience Stats Row */}
        <div className="grid grid-cols-3 bg-slate-50/50 border-t border-slate-100 p-3 gap-2">
          {[
            { icon: TrendingUp, value: orderCount, label: 'Compras', color: 'text-pink-500', bg: 'bg-white' },
            { icon: Gift, value: '$' + totalSpent.toLocaleString(), label: 'Total', color: 'text-rose-500', bg: 'bg-white' },
            { icon: Sparkles, value: `${POINTS_PER_1000}x`, label: 'Pts/$1k', color: 'text-pink-400', bg: 'bg-white' },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }} 
              className={`flex flex-col items-center justify-center p-5 rounded-2xl transition-all border border-transparent hover:border-slate-100 ${stat.bg}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm ${stat.bg} border border-slate-50`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-base font-black text-slate-900 leading-none mb-2">{stat.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
