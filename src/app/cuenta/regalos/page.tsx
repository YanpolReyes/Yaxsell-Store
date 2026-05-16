'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Sparkles, CheckCircle2, Copy, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getServices, getAppwriteConfig, COUPONS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { motion, AnimatePresence } from 'framer-motion';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

export default function RegalosPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [showWelcomeReward, setShowWelcomeReward] = useState(false);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    loadRewardData();
  }, [isLoggedIn, user]);

  async function loadRewardData() {
    if (!user || !user.id) return;
    try {
      const { account, databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const acc = await account.get();
      const prefs = (acc as any).prefs || {};
      
      if (prefs.welcomeCouponCode) {
        setClaimedCode(prefs.welcomeCouponCode);
        setShowWelcomeReward(true);
      } else if (!prefs.welcomeGiftClaimed) {
        // Check if KEVINCOCOCL coupon is active
        try {
          const couponRes = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
            Query.equal('CODE', 'KEVINCOCOCL'),
            Query.limit(1),
          ]);
          const coupon = couponRes.documents[0];
          if (coupon && coupon.ISACTIVE) {
            setShowWelcomeReward(true);
          }
        } catch(e) { console.error('Error checking coupon status:', e); }
      }
    } catch(e) { console.error(e); } finally {
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
      const prefs = (acc as any).prefs || {};
      await account.updatePrefs({
        ...prefs,
        welcomeGiftClaimed: true,
        welcomeCouponCode: 'KEVINCOCOCL',
        autoApplyCoupon: 'KEVINCOCOCL',
      });
    } catch (err) {
      console.error('Error claiming reward', err);
    } finally {
      setClaiming(false);
    }
  }

  function copyCouponCode() {
    if (claimedCode) {
      navigator.clipboard.writeText(claimedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: FF }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FF }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
        >
          <ArrowLeft size={20} color="#374151" strokeWidth={2} />
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Regalos</h1>
      </div>
      
      <AnimatePresence>
        {showWelcomeReward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '2px solid #fef2f8', boxShadow: '0 10px 40px rgba(236,72,153,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(244,63,94,0.05))', borderRadius: '50%', filter: 'blur(40px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gift size={32} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>¡Tu Regalo de Bienvenida!</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Elige tu beneficio exclusivo por tu primer registro.</p>
                  </div>
                </div>

                {!claimedCode ? (
                  <div>
                    <div style={{ padding: 20, borderRadius: 16, border: '2px solid #ec4899', background: 'rgba(236,72,153,0.05)', textAlign: 'left', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ padding: 12, borderRadius: 12, background: '#ec4899', color: '#fff' }}>
                          <Sparkles size={24} />
                        </div>
                        <CheckCircle2 size={20} color="#ec4899" />
                      </div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#111827' }}>20% de Descuento</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Por tiempo limitado</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={claimWelcomeReward}
                      disabled={claiming}
                      style={{ width: '100%', marginTop: 16, padding: 16, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 13, fontWeight: 900, cursor: 'pointer', opacity: claiming ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 25px rgba(236,72,153,0.3)', textTransform: 'uppercase', letterSpacing: '0.02em' }}
                    >
                      {claiming ? 'Generando Cupón...' : <>¡RECLAMAR MI REGALO! <ChevronRight size={18} /></>}
                    </motion.button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(236,72,153,0.03)', borderRadius: 16, border: '1px solid rgba(236,72,153,0.1)' }}>
                    <div style={{ width: 64, height: 64, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle2 size={32} color="#10b981" />
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 900, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em' }}>¡Tu Cupón ha sido Generado!</p>
                    <p style={{ margin: '0 0 16px', fontSize: 11, color: '#6b7280' }}>Copia el código y úsalo al finalizar tu compra.</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ background: '#fff', border: '2px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 20, fontFamily: 'monospace', fontWeight: 900, padding: '12px 24px', borderRadius: 16, letterSpacing: '0.15em', userSelect: 'all' }}>
                        {claimedCode}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyCouponCode}
                        style={{ padding: '12px', background: '#10b981', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWelcomeReward && !loading && (
        <div style={{ background: '#fff', borderRadius: 24, padding: 48, textAlign: 'center', border: '2px solid #f3f4f6' }}>
          <Gift size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#6b7280', marginBottom: 8 }}>No tienes regalos disponibles</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#9ca3af' }}>Vuelve pronto para ver nuevas promociones y regalos exclusivos.</p>
        </div>
      )}
    </div>
  );
}
