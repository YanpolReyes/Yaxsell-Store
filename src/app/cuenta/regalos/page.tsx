'use client';

import { useEffect, useState } from 'react';
import {
  Gift, Sparkles, CheckCircle2, Copy, ChevronRight,
  Star, Zap, Crown, PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import CuentaPageShell from '@/components/cuenta/CuentaPageShell';
import { useCuentaBg } from '../CuentaBgContext';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

function fireCelebration() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#ec4899', '#f43f5e', '#fbbf24', '#fff'] });
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ec4899', '#fff'] });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f43f5e', '#fff'] });
  }, 200);
}

export default function RegalosPage() {
  const { user, isLoggedIn } = useAuth();
  useCuentaBg('linear-gradient(135deg, #831843, #ec4899)');
  const [showWelcomeReward, setShowWelcomeReward] = useState(false);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadRewardData();
  }, [isLoggedIn, user]);

  async function loadRewardData() {
    if (!user?.id) return;
    try {
      const { account, databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const acc = await account.get();
      const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};

      if (prefs.welcomeCouponCode) {
        setClaimedCode(String(prefs.welcomeCouponCode));
        setShowWelcomeReward(true);
      } else if (!prefs.welcomeGiftClaimed) {
        try {
          const couponRes = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
            Query.equal('CODE', 'KEVINCOCOCL'),
            Query.limit(1),
          ]);
          const coupon = couponRes.documents[0];
          if (coupon?.ISACTIVE) setShowWelcomeReward(true);
        } catch (e) {
          console.error('Error checking coupon status:', e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function claimWelcomeReward() {
    if (!user?.id) return;
    setClaiming(true);
    try {
      setClaimedCode('KEVINCOCOCL');
      const { account } = getServices();
      const acc = await account.get();
      const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};
      await account.updatePrefs({
        ...prefs,
        welcomeGiftClaimed: true,
        welcomeCouponCode: 'KEVINCOCOCL',
        autoApplyCoupon: 'KEVINCOCOCL',
      });
      setJustClaimed(true);
      fireCelebration();
    } catch (err) {
      console.error('Error claiming reward', err);
    } finally {
      setClaiming(false);
    }
  }

  function copyCouponCode() {
    if (!claimedCode) return;
    navigator.clipboard.writeText(claimedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: FF }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #fce7f3', borderTopColor: PINK }}
        />
      </motion.div>
    );
  }

  return (
    <CuentaPageShell
      title="Regalos"
      subtitle="Premios por tu registro y la gran apertura"
      promos={[
        { id: 'cupons', title: 'Ver todos los cupones', desc: 'Descuentos activos en tu cuenta', href: '/cuenta/cupones', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
        { id: 'offers', title: 'Ofertas de inauguración', desc: 'Promos limitadas en la tienda', href: '/ofertas', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
      ]}
    >
      <div style={{ fontFamily: FF }}>
      <AnimatePresence>
        {showWelcomeReward && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ marginBottom: 28 }}
          >
            {/* Hero premio */}
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 28,
                padding: '32px 28px 28px',
                background: 'linear-gradient(145deg, #831843 0%, #be185d 35%, #ec4899 70%, #f43f5e 100%)',
                boxShadow: '0 24px 60px rgba(236,72,153,0.45)',
                marginBottom: 16,
              }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: [0.2, 0.8, 0.2],
                    y: [0, -20 - (i % 5) * 8, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15 }}
                  style={{
                    position: 'absolute',
                    left: `${(i * 17) % 100}%`,
                    top: `${(i * 23) % 100}%`,
                    width: 3 + (i % 3),
                    height: 3 + (i % 3),
                    borderRadius: '50%',
                    background: '#fff',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    width: 80, height: 80, margin: '0 auto 16px',
                    borderRadius: 24, background: 'rgba(255,255,255,0.15)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Crown size={40} color="#fff" strokeWidth={1.5} />
                </motion.div>

                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.14em',
                    marginBottom: 12,
                  }}
                >
                  <Star size={12} fill="#fff" /> Kevin & Coco Chile te premia
                </span>

                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  ¡Regalo de bienvenida por tu registro!
                </h2>
                <p style={{ margin: '10px auto 0', fontSize: 14, color: 'rgba(255,255,255,0.9)', maxWidth: 340, lineHeight: 1.5, fontWeight: 500 }}>
                  Por la gran apertura de nuestra tienda, desbloquea un cupón exclusivo solo para nuevos miembros.
                </p>
              </div>
            </div>

            {/* Tarjeta del regalo */}
            <motion.div
              layout
              style={{
                background: '#fff',
                borderRadius: 24,
                padding: 28,
                border: '1px solid #fce7f3',
                boxShadow: '0 16px 48px rgba(236,72,153,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: 0, right: 0, width: 180, height: 180,
                  background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <AnimatePresence mode="wait">
                {!claimedCode ? (
                  <motion.div
                    key="claim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div
                      style={{
                        display: 'flex', alignItems: 'stretch', gap: 0,
                        borderRadius: 20, overflow: 'hidden',
                        border: '2px solid #fce7f3',
                        marginBottom: 20,
                      }}
                    >
                      <motion.div
                        animate={{ background: ['#ec4899', '#f43f5e', '#ec4899'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{
                          width: 100, flexShrink: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: 16, color: '#fff',
                        }}
                      >
                        <Gift size={36} strokeWidth={1.5} />
                        <span style={{ fontSize: 28, fontWeight: 900, marginTop: 4, lineHeight: 1 }}>20%</span>
                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>OFF</span>
                      </motion.div>
                      <div style={{ flex: 1, padding: '20px 22px', background: 'linear-gradient(135deg, #fffbeb, #fff)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Zap size={14} color={PINK} fill={PINK} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: PINK, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Cupón de apertura
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827' }}>20% de descuento</p>
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.45 }}>
                          Válido en tu primera compra. Se aplica automáticamente al pagar.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                          {['Exclusivo', 'Por tiempo limitado', 'Nuevos usuarios'].map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                                background: '#fdf2f8', color: '#be185d', border: '1px solid #fce7f3',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={claimWelcomeReward}
                      disabled={claiming}
                      style={{
                        width: '100%', padding: 18,
                        background: claiming ? '#9ca3af' : 'linear-gradient(135deg, #ec4899, #f43f5e)',
                        color: '#fff', border: 'none', borderRadius: 18,
                        fontSize: 14, fontWeight: 900, cursor: claiming ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 12px 32px rgba(236,72,153,0.4)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}
                    >
                      {claiming ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }}
                          />
                          Generando tu premio...
                        </>
                      ) : (
                        <>
                          <PartyPopper size={20} /> Reclamar mi regalo <ChevronRight size={20} />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="claimed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '8px 0' }}
                  >
                    <motion.div
                      initial={justClaimed ? { scale: 0 } : false}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      style={{
                        width: 72, height: 72, margin: '0 auto 16px',
                        borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle2 size={36} color="#059669" />
                    </motion.div>

                    <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#111827' }}>
                      {justClaimed ? '¡Premio desbloqueado!' : 'Tu regalo está activo'}
                    </h3>
                    <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
                      Usa este código en el checkout o déjalo aplicarse automáticamente.
                    </p>

                    <motion.div
                      animate={justClaimed ? { boxShadow: ['0 0 0 0 rgba(236,72,153,0.4)', '0 0 0 12px rgba(236,72,153,0)', '0 0 0 0 rgba(236,72,153,0)'] } : {}}
                      transition={{ duration: 1.5, repeat: justClaimed ? 2 : 0 }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '14px 20px', borderRadius: 18,
                        background: 'linear-gradient(135deg, #fdf2f8, #fff)',
                        border: '2px dashed #ec4899',
                      }}
                    >
                      <Sparkles size={18} color={PINK} />
                      <span
                        style={{
                          fontSize: 22, fontWeight: 900, color: '#be185d',
                          fontFamily: 'ui-monospace, monospace', letterSpacing: '0.12em',
                        }}
                      >
                        {claimedCode}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyCouponCode}
                        style={{
                          padding: 10, background: copied ? '#059669' : PINK,
                          border: 'none', borderRadius: 12, cursor: 'pointer', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                      >
                        {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                      </motion.button>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{ margin: '16px 0 0', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}
                    >
                      Kevin & Coco Chile — gracias por unirte a nuestra comunidad
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWelcomeReward && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 24, padding: 56, textAlign: 'center',
            border: '1px solid #f3f4f6', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginBottom: 20 }}
          >
            <Gift size={56} color="#e5e7eb" strokeWidth={1.5} />
          </motion.div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#374151', marginBottom: 8 }}>
            No tienes regalos disponibles
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Vuelve pronto: nuevas promociones y sorpresas exclusivas te esperan.
          </p>
        </motion.div>
      )}
      </div>
    </CuentaPageShell>
  );
}
