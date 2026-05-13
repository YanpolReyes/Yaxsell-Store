'use client';

import { useState, useEffect, useRef } from 'react';
import { Ticket, Copy, Check, Sparkles, Zap, ChevronRight, Flame, Award } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';
import type { SectionSettings } from '@/lib/section-config';

const COUPONS_COLLECTION = 'discount_coupons';

interface Coupon {
  $id: string;
  CODE: string;
  DISCOUNTTYPE?: 'percent' | 'fixed';
  DISCOUNTVALUE?: number;
  TYPE?: string;
  VALUE?: number;
  ISACTIVE?: boolean;
  ACTIVE?: boolean;
  EXPIRESAT?: string;
  ENDAT?: number;
  STARTAT?: number;
  MINORDERAMOUNT?: number;
}

interface Props {
  settings?: SectionSettings;
}

export default function CouponBanner({ settings: s }: Props) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Section settings with defaults
  const bg = s?.bgColor || 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';
  const tx = s?.textColor || '#ffffff';
  const ac = s?.accentColor || '#fbbf24';
  const r = s?.borderRadius ?? 16;
  const pd = s?.padding ?? 20;
  const hSize = s?.headingSize ?? 22;
  const tSize = s?.textSize ?? 13;
  const sh = s?.shadow || 'none';
  const ht = s?.height ?? 0; // 0 = auto
  const titleText = s?.couponTitle || 'DESCUENTO';
  const subtitleWithCoupon = s?.couponSubtitle || 'Código exclusivo por tiempo limitado';
  const messageWithoutCoupon = s?.couponMessage || 'Oferta especial por tiempo limitado';
  const stampText = s?.couponStampText || 'EXCLUSIVO';
  const codeLabelText = s?.couponCodeLabel || 'Tu código';
  const copyText = s?.couponCopyText || 'Copiar';
  const copiedText = s?.couponCopiedText || '¡Copiado!';
  const copyButtonTextColor = ['#db2777', '#ec4899', '#be185d'].includes(ac.toLowerCase()) ? '#ffffff' : '#1a1a1a';

  const shadowMap: Record<string, string> = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.04)',
    md: '0 2px 6px rgba(0,0,0,0.06)',
    lg: '0 3px 10px rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
          Query.equal('ACTIVE', true),
          Query.limit(5),
        ]);
        const valid = (res.documents as unknown as Coupon[]).find(c => {
          const expiresAt = c.EXPIRESAT || (c.ENDAT ? new Date(c.ENDAT * 1000).toISOString() : null);
          if (expiresAt && new Date(expiresAt) < new Date()) return false;
          return true;
        });
        if (valid) setCoupon(valid);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Intersection observer for entrance animation
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Determine coupon data (real or demo)
  const code = coupon?.CODE || 'DESCUENTO10';
  const discountText = coupon
    ? ((coupon.DISCOUNTTYPE || coupon.TYPE) === 'percent' || (coupon.DISCOUNTTYPE || coupon.TYPE) === 'percentage'
      ? `${coupon.DISCOUNTVALUE ?? coupon.VALUE}%`
      : `$${(coupon.DISCOUNTVALUE ?? coupon.VALUE)?.toLocaleString() ?? ''}`)
    : '10%';
  const minAmount = coupon?.MINORDERAMOUNT;
  const isBgGradient = bg.includes('gradient') || bg.includes(',');
  const bgStyle = isBgGradient ? { background: bg } : { backgroundColor: bg };

  return (
    <>
      <style>{`
        @keyframes cb-shimmer {
          0% { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(240%) skewX(-20deg); opacity: 0; }
        }
        @keyframes cb-holo-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes cb-glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), inset 0 1px 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.3); }
        }
        @keyframes cb-mesh-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.15); }
          66% { transform: translate(-20px, 15px) scale(0.92); }
        }
        @keyframes cb-percent-glow {
          0%, 100% { filter: drop-shadow(0 2px 8px rgba(255,255,255,0.3)) drop-shadow(0 4px 16px rgba(255,255,255,0.15)); }
          50% { filter: drop-shadow(0 2px 12px rgba(255,255,255,0.5)) drop-shadow(0 6px 24px rgba(255,255,255,0.25)); }
        }
        @keyframes cb-stamp-bob {
          0%, 100% { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(-13deg) scale(1.04); }
        }
        @keyframes cb-confetti-1 { 0% { transform: translate(0,0) rotate(0); opacity:1; } 100% { transform: translate(40px,-60px) rotate(180deg); opacity:0; } }
        @keyframes cb-confetti-2 { 0% { transform: translate(0,0) rotate(0); opacity:1; } 100% { transform: translate(-30px,-50px) rotate(-120deg); opacity:0; } }
        @keyframes cb-confetti-3 { 0% { transform: translate(0,0) rotate(0); opacity:1; } 100% { transform: translate(25px,-45px) rotate(90deg); opacity:0; } }
        @keyframes cb-spark {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes cb-flame-flicker {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 6px #f97316aa); }
          50% { transform: translateY(-2px) scale(1.08); filter: drop-shadow(0 0 10px #ef4444); }
        }
        @keyframes cb-code-glow {
          0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(255,255,255,0.4); }
          50% { box-shadow: 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1), 0 0 0 2px rgba(255,255,255,0.6); }
        }
        @keyframes cb-dash-move {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
        .cb-banner { transition: transform 0.4s cubic-bezier(0.2,1,0.3,1), box-shadow 0.3s; transform-style: preserve-3d; will-change: transform; }
        .cb-holo-layer {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(115deg, rgba(255,0,128,0) 0%, rgba(0,255,255,0.08) 25%, rgba(255,255,0,0.12) 50%, rgba(255,0,255,0.08) 75%, rgba(0,255,128,0) 100%);
          background-size: 300% 100%;
          animation: cb-holo-shift 8s ease-in-out infinite;
          mix-blend-mode: overlay;
        }
        .cb-copy-btn { transition: all 0.25s cubic-bezier(0.2,1,0.3,1); position: relative; }
        .cb-copy-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
          transform: translateX(-120%) skewX(-20deg);
          transition: transform 0.6s cubic-bezier(0.2,1,0.3,1);
          pointer-events: none;
        }
        .cb-copy-btn:hover::before { transform: translateX(120%) skewX(-20deg); }
        .cb-copy-btn:hover { transform: translateY(-2px) scale(1.02); }
        .cb-copy-btn:active { transform: scale(0.96); }
        .cb-code-box { transition: all 0.3s cubic-bezier(0.2,1,0.3,1); animation: cb-code-glow 3s ease-in-out infinite; }
        .cb-code-box:hover { transform: scale(1.02) translateY(-1px); }
        .cb-ticket-icon { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .cb-banner:hover .cb-ticket-icon { transform: rotate(-12deg) scale(1.08); }
        .cb-stamp { animation: cb-stamp-bob 3s ease-in-out infinite; }
        .cb-hero-percent {
          background: linear-gradient(180deg, #fff 0%, #fff 55%, rgba(255,255,255,0.85) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: cb-percent-glow 2.5s ease-in-out infinite;
        }
        .cb-divider {
          background-image: radial-gradient(circle, rgba(255,255,255,0.4) 1.5px, transparent 1.5px);
          background-size: 6px 6px;
          background-position: center;
          animation: cb-dash-move 30s linear infinite;
        }
      `}</style>

      <div
        ref={bannerRef}
        className="cb-banner"
        onMouseMove={e => {
          const el = e.currentTarget as HTMLElement;
          const rect = el.getBoundingClientRect();
          const rx = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
          const ry = ((e.clientX - rect.left) / rect.width - 0.5) * -5;
          el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
        }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
        style={{
          ...bgStyle,
          borderRadius: r,
          padding: `${pd + 6}px ${pd + 20}px`,
          position: 'relative',
          boxShadow: shadowMap[sh] || '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
          color: tx,
          ...(ht > 0 ? { minHeight: ht, display: 'flex', alignItems: 'center' } : {}),
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'opacity 0.6s cubic-bezier(0.2,1,0.3,1), transform 0.6s cubic-bezier(0.2,1,0.3,1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          overflow: 'hidden',
        }}
      >
        {/* Mesh gradient orbs (depth background) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-40%', left: '-15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)', filter: 'blur(30px)', animation: 'cb-mesh-drift 14s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)', filter: 'blur(35px)', animation: 'cb-mesh-drift 17s ease-in-out infinite 3s' }} />
          <div style={{ position: 'absolute', top: '20%', left: '35%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${ac}55 0%, transparent 70%)`, filter: 'blur(40px)', animation: 'cb-mesh-drift 20s ease-in-out infinite 5s' }} />
        </div>

        {/* Holographic layer */}
        <div className="cb-holo-layer" />

        {/* Noise texture (subtle grain) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.03, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' /%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />

        {/* Shimmer sweep */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: r, pointerEvents: 'none', zIndex: 2 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', animation: 'cb-shimmer 5.5s ease-in-out infinite' }} />
        </div>

        {/* Sparkles */}
        <div style={{ position: 'absolute', top: 14, left: '15%', opacity: 0.7, animation: 'cb-spark 3s ease-in-out infinite', pointerEvents: 'none', zIndex: 2 }}>
          <Sparkles size={14} color={ac} fill={ac} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '25%', opacity: 0.55, animation: 'cb-spark 4s ease-in-out infinite 1.2s', pointerEvents: 'none', zIndex: 2 }}>
          <Sparkles size={10} color="#fff" fill="#fff" />
        </div>
        <div style={{ position: 'absolute', top: 18, right: '18%', opacity: 0.6, animation: 'cb-spark 3.5s ease-in-out infinite 2s', pointerEvents: 'none', zIndex: 2 }}>
          <Sparkles size={12} color={ac} fill={ac} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '8%', opacity: 0.45, animation: 'cb-spark 5s ease-in-out infinite 2.8s', pointerEvents: 'none', zIndex: 2 }}>
          <Sparkles size={8} color="#fff" fill="#fff" />
        </div>

        {/* Ticket notches */}
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', background: '#fff', zIndex: 3, pointerEvents: 'none', boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.12)' }} />
        <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translate(50%, -50%)', width: 28, height: 28, borderRadius: '50%', background: '#fff', zIndex: 3, pointerEvents: 'none', boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.12)' }} />

        {/* Main content */}
        <div style={{
          position: 'relative', zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
          flexWrap: 'wrap', width: '100%',
        }}>
          {/* ═══ Hero Percentage Block (LEFT) ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, position: 'relative' }}>
            {/* Ticket icon with glow ring */}
            <div style={{ position: 'relative', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 16,
                background: `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))`,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.15)',
                animation: 'cb-glow-ring 3s ease-in-out infinite',
              }} />
              <Ticket className="cb-ticket-icon" size={28} color={ac} strokeWidth={2.5} style={{ filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.25)) drop-shadow(0 0 8px ${ac}66)`, position: 'relative' }} />
              {/* Corner decorations */}
              <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: ac, boxShadow: `0 0 8px ${ac}` }} />
            </div>

            {/* Hero percentage */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span className="cb-hero-percent" style={{
                  fontSize: hSize * 2,
                  fontWeight: 900,
                  letterSpacing: '-0.06em',
                  lineHeight: 0.9,
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                }}>
                  {discountText}
                </span>
              </div>
              <div style={{ fontSize: hSize * 0.4, fontWeight: 800, letterSpacing: '0.35em', marginTop: 2, opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{titleText}</div>
              <div style={{ fontSize: tSize - 1, fontWeight: 500, opacity: 0.82, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Flame size={tSize} color="#fbbf24" fill="#f97316" style={{ animation: 'cb-flame-flicker 1.2s ease-in-out infinite', flexShrink: 0 }} />
                <span>{coupon ? subtitleWithCoupon : messageWithoutCoupon}</span>
              </div>
            </div>

            {/* VIP/EXCLUSIVE stamp */}
            <div className="cb-stamp" style={{
              position: 'absolute',
              top: -10, right: -30,
              padding: '3px 8px',
              border: '2px solid rgba(255,255,255,0.85)',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <Award size={10} />
              {stampText}
            </div>
          </div>

          {/* ═══ Dotted divider (vertical) ═══ */}
          <div style={{ width: 2, height: 60, background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 3px, transparent 3px, transparent 8px)', flexShrink: 0 }} />

          {/* ═══ Code + Copy button (RIGHT) ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', opacity: 0.75, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={10} color={ac} fill={ac} />
              <span>{codeLabelText}</span>
              {minAmount && minAmount > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                  MÍN. ${minAmount.toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)' }}>
              {/* Code box */}
              <div className="cb-code-box" style={{
                padding: '14px 24px', position: 'relative',
                background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
                display: 'flex', alignItems: 'center', gap: 10,
                borderRight: '2px dashed rgba(0,0,0,0.12)',
              }}>
                {/* Barcode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, marginRight: 2 }}>
                  {[3, 1, 2, 1, 3, 1, 2].map((w, i) => (
                    <div key={i} style={{ width: w, height: 22, background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)', borderRadius: 0.5 }} />
                  ))}
                </div>
                <span style={{
                  fontSize: 20, fontWeight: 900, letterSpacing: 2.5,
                  fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", "Consolas", monospace',
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #3a3a3a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.9))',
                }}>
                  {code}
                </span>
              </div>

              {/* Copy button */}
              <button
                className="cb-copy-btn"
                onClick={() => handleCopy(code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 22px',
                  background: copied
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : `linear-gradient(135deg, ${ac} 0%, ${ac}dd 50%, ${ac}cc 100%)`,
                  color: '#fff !important',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 900, letterSpacing: '0.05em',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.1), 0 2px 8px ${copied ? '#10b98166' : ac + '66'}`,
                  overflow: 'hidden',
                  textTransform: 'uppercase',
                  minWidth: 110,
                  justifyContent: 'center',
                }}
              >
                {copied ? <Check size={16} strokeWidth={3.5} style={{ color: '#fff' }} /> : <Copy size={14} strokeWidth={2.8} style={{ color: '#fff' }} />}
                <span style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{copied ? copiedText : copyText}</span>
                {!copied && <ChevronRight size={13} strokeWidth={3} style={{ marginLeft: -4, position: 'relative', zIndex: 1, color: '#fff' }} />}

                {/* Confetti on copy */}
                {copied && (
                  <>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, borderRadius: 1, background: '#fbbf24', animation: 'cb-confetti-1 0.6s ease-out both' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', width: 5, height: 5, borderRadius: '50%', background: '#ec4899', animation: 'cb-confetti-2 0.5s ease-out both 0.05s' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, borderRadius: 1, background: '#6366f1', animation: 'cb-confetti-3 0.55s ease-out both 0.1s' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '30%', width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'cb-confetti-1 0.5s ease-out both 0.08s' }} />
                    <span style={{ position: 'absolute', top: '50%', left: '70%', width: 4, height: 4, borderRadius: 1, background: '#f97316', animation: 'cb-confetti-2 0.6s ease-out both 0.03s' }} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
