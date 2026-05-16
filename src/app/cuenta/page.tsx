'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServices, getAppwriteConfig, USER_PHOTOS_BUCKET } from '@/lib/appwrite';
import {
  ShoppingBag, Bell, Heart, ShoppingCart, MessageCircle,
  User, MapPin, Receipt, HelpCircle, Phone,
  Loader2, ChevronRight, LogOut, Building2, Trophy, Tag, Star, Settings, Ticket, Gift, Pencil, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import LoyaltyLevel from '@/components/LoyaltyLevel';
import { useCuentaBg } from './CuentaBgContext';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

interface MenuItem { icon: any; label: string; href: string; desc?: string; badge?: number | string; badgeColor?: string; }

const MIS_COMPRAS_ITEMS: MenuItem[] = [
  { icon: Receipt,      label: 'Mis Pedidos',   href: '/cuenta/pedidos',    desc: 'Seguí el estado de tus pedidos' },
  { icon: Heart,        label: 'Mis Favoritos', href: '/cuenta/favoritos',  desc: 'Productos que guardaste' },
  { icon: ShoppingCart, label: 'Mi Carrito',    href: '/carrito',           desc: 'Productos en tu carrito' },
];

const CUENTA_ITEMS: MenuItem[] = [
  { icon: User,   label: 'Información Personal', href: '/cuenta',      desc: 'Nombre, foto de perfil y portada' },
  { icon: Phone,  label: 'Datos de Contacto',    href: '/cuenta/info',        desc: 'Teléfono y RUT guardados' },
  { icon: MapPin, label: 'Mis Direcciones',       href: '/cuenta/direcciones', desc: 'Direcciones de envío guardadas' },
];

const CONFIG_ITEMS: MenuItem[] = [
  { icon: Trophy,        label: 'Mis Niveles',       href: '/cuenta/niveles',         desc: 'Programa de lealtad y cupones' },
  { icon: Building2,     label: 'Cuenta Mayorista',  href: '/mayorista',             desc: 'Solicita precios especiales por volumen' },
  { icon: Bell,          label: 'Notificaciones',    href: '/cuenta/notificaciones', desc: 'Alertas y avisos de tu cuenta' },
  { icon: HelpCircle,    label: 'Soporte / Tickets', href: '/cuenta/tickets',        desc: 'Solicitudes de ayuda' },
  { icon: MessageCircle, label: 'Conversaciones',    href: '/cuenta/conversaciones', desc: 'Historial de chats' },
];

const ALL_CARDS: MenuItem[] = [...MIS_COMPRAS_ITEMS, ...CUENTA_ITEMS, ...CONFIG_ITEMS];

/* Quick shortcuts — these are the most important for the customer */
const QUICK_SHORTCUTS = [
  { icon: Receipt,      label: 'Pedidos',    href: '/cuenta/pedidos',     color: '#6366f1', bg: '#eef2ff' },
  { icon: Ticket,       label: 'Cupones',    href: '/cuenta/cupones',     color: '#ec4899', bg: '#fdf2f8' },
  { icon: Gift,         label: 'Regalos',    href: '/cuenta/regalos',   color: '#f59e0b', bg: '#fffbeb' },
  { icon: MapPin,       label: 'Direcciones', href: '/cuenta/direcciones', color: '#10b981', bg: '#ecfdf5' },
];

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  return `${endpoint}/storage/buckets/${USER_PHOTOS_BUCKET}/files/${fileId}/view?project=${projectId}`;
}

const BG_CUENTA = 'https://static.vecteezy.com/system/resources/thumbnails/031/691/675/small/white-abstract-background-in-the-style-of-light-white-and-light-gray-created-with-generative-ai-photo.jpg';

export default function CuentaPage() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  useCuentaBg(BG_CUENTA);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hasGifts, setHasGifts] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(prefs.avatarFileId));
        if (prefs.coverFileId) setCoverUrl(getFilePreviewUrl(prefs.coverFileId));
        // Check if user has available gifts (only if not claimed yet)
        setHasGifts(!prefs.welcomeGiftClaimed);
      } catch {}
    })();
  }, [isLoggedIn]);

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <Loader2 size={32} color={PINK} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '40px 28px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <User size={32} color={PINK} strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Iniciar sesión</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '8px 0 0' }}>Accedé a tu cuenta para continuar</p>
          </div>
          <div style={{ padding: '0 28px 28px' }}>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0', background: PINK, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 6px 20px rgba(236,72,153,0.25)', marginBottom: 10 }}>
              Iniciar sesión
            </Link>
            <Link href="/login?tab=register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 0', background: '#fff', color: '#1a1a1a', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15, border: '1.5px solid #e5e7eb' }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <style>{`
        .cuenta-desktop { display: none }
        .cuenta-mobile  { display: block }
        @media (min-width: 900px) {
          .cuenta-desktop { display: block !important }
          .cuenta-mobile  { display: none !important }
        }

        /* ── Elevation tokens ── */
        :root {
          --shadow-sm:   0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04);
          --shadow-md:   0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.05);
          --shadow-lg:   0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07);
          --shadow-pink: 0 4px 16px rgba(236,72,153,0.12), 0 2px 6px rgba(236,72,153,0.08);
          --border-soft: 1px solid rgba(0,0,0,0.07);
          --border-pink: 1px solid rgba(236,72,153,0.15);
          --inset-top:   inset 0 1px 0 rgba(255,255,255,0.9);
        }

        /* ── Desktop cards ── */
        .dcard {
          display: flex; flex-direction: row; align-items: center;
          background: #fff;
          border-radius: 20px;
          padding: 22px 24px;
          text-decoration: none;
          border: var(--border-soft);
          box-shadow: var(--shadow-md);
          min-height: 96px;
          box-sizing: border-box;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease, border-color 0.2s;
          position: relative;
          overflow: hidden;
        }
        .dcard::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: rgba(255,255,255,0.9);
          border-radius: 20px 20px 0 0;
        }
        .dcard:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: var(--shadow-lg);
          border-color: rgba(236,72,153,0.2);
        }
        .dcard:hover .dcard-icon-wrap {
          background: ${PINK};
          box-shadow: var(--shadow-pink);
        }
        .dcard:hover .dcard-icon-wrap svg { stroke: #fff; }
        .dcard-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          background: #fef2f8;
          border: 1px solid rgba(236,72,153,0.1);
          display: flex; align-items: center; justify-content: center;
          margin-right: 18px; flex-shrink: 0;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1);
        }
        .dcard-icon-wrap svg { transition: stroke 0.2s; }

        /* ── Quick shortcut pills ── */
        .qsc { transition: transform 0.18s cubic-bezier(.34,1.56,.64,1); }
        .qsc:hover { transform: translateY(-2px) scale(1.04); }
        .qsc-icon {
          box-shadow: 0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
          border: 1px solid rgba(0,0,0,0.06);
        }

        /* ── Mobile menu rows ── */
        .menu-row:last-child { border-bottom: none !important; }

        /* ── Section containers ── */
        .section-card {
          background: #fff;
          border-radius: 18px;
          border: var(--border-soft);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          position: relative;
        }
        .section-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: rgba(255,255,255,0.95);
          z-index: 1;
        }

        /* ── Hero card ── */
        .hero-card {
          background: #fff;
          border-radius: 22px;
          border: var(--border-soft);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          position: relative;
        }
        .hero-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: rgba(255,255,255,0.9);
          z-index: 10;
          border-radius: 22px 22px 0 0;
        }
      `}</style>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="cuenta-desktop" style={{ display: 'none' }}>
        {/* Hero header */}
        <div style={{ background: '#fff', borderRadius: 22, marginBottom: 24, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.07)', position: 'relative' }}>
          <div style={{
            height: 160,
            backgroundImage: coverUrl ? 'none' : `url(${BG_CUENTA})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {coverUrl && <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <Link href="/cuenta/perfil" style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Pencil size={15} color="#374151" style={{ opacity: 0.8 }} />
            </Link>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 28px 32px', marginTop: -55, position: 'relative', zIndex: 2 }}>
            <div style={{ width: 130, height: 130, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: PINK, flexShrink: 0, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 0 0 3px rgba(236,72,153,0.15), 0 4px 6px -1px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.15)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ paddingBottom: 6, flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>¡Hola, {firstName}!</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{user.email}</p>
            </div>
            <Link href="/cuenta/puntos" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: PINK, color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none', marginBottom: 6, position: 'relative', overflow: 'hidden', letterSpacing: '-0.01em' }}>
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Trophy size={15} /> Tienda de puntos</span>
              {/* shimmer */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)', backgroundSize: '200% 100%', animation: 'td_shimmer 2.5s ease-in-out infinite' }} />
              {/* float dots */}
              {[{l:8,t:20,s:1.5,d:0},{l:20,t:50,s:2.3,d:.15},{l:32,t:75,s:3.1,d:.3},{l:44,t:15,s:3.9,d:.45},{l:56,t:40,s:1.5,d:.6},{l:68,t:65,s:2.3,d:.75},{l:80,t:30,s:3.1,d:.9},{l:92,t:55,s:1.5,d:1.05}].map((p,i)=>(
                <div key={`f${i}`} style={{ position:'absolute', left:`${p.l}%`, top:`${p.t}%`, width:p.s, height:p.s, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.8),rgba(255,255,255,0.1))', boxShadow:'0 0 2px rgba(255,255,255,0.5)', animation:`td_float ${1.2+i*.4}s ease-in-out ${p.d}s infinite alternate` }} />
              ))}
              {/* bubbles */}
              {[{l:5,t:10,s:3,d:0},{l:22,t:35,s:5,d:.2},{l:40,t:60,s:4,d:.4},{l:58,t:20,s:5,d:.6},{l:76,t:45,s:3,d:.8},{l:90,t:70,s:4,d:1}].map((b,i)=>(
                <div key={`b${i}`} style={{ position:'absolute', left:`${b.l}%`, top:`${b.t}%`, width:b.s, height:b.s, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.3)', animation:`td_bubble ${1.5+i*.5}s ease-in-out ${b.d}s infinite` }} />
              ))}
              {/* drift bars */}
              <div style={{ position:'absolute', top:0, height:'100%', width:8, borderRadius:99, background:'rgba(255,255,255,0.12)', filter:'blur(2px)', left:'25%', animation:'td_drift 3s ease-in-out infinite' }} />
              <div style={{ position:'absolute', top:0, height:'100%', width:6, borderRadius:99, background:'rgba(255,255,255,0.08)', filter:'blur(2px)', left:'65%', animation:'td_drift 4s ease-in-out infinite reverse' }} />
            </Link>
          </div>
        </div>

        {/* Inauguración / Apertura Banner */}
        <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', borderRadius: '22px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(236,72,153,0.25)' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              <Sparkles size={32} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>¡GRAN INAUGURACIÓN!</h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Celebramos la apertura de nuestra tienda con ofertas exclusivas</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Icons (PC) */}
        <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { icon: Receipt,      label: 'Pedidos',    href: '/cuenta/pedidos',    g: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.35)', image: 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/IADESIGN/2026/05/1778902651562-pegada-1778902645915.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=OKWZOLTMN0DmNxF9i2zJvPKGsGgQbWbwKDU9L887E5hHYoSclN7CnFS8lcAEJid%2F5LgCmKwnOHozplzK7sG0iGALAcnAFpTVUFfp%2BDmN0iURUkPa%2BrFJHcxzEi8qvxfI7Kok8Ortf%2FV1SSEvPKkXcZgPGb41b3Sz6afLz2tK5JsLAUIHHCZ9V2nxi%2FO5lq7y1RDt0jT0q8RokkxREqSsAFF0IcKqwZ3Mlo2HZidVKzMr%2Br1iat82uZdAYv%2FYHCnf22%2BZYFtnyc4qG7ZiIfQ6w8p8VkEMeS6CYvYIcK%2FtZbliO9wzYCyvsATa4bdjzHLEaM6%2F3friX3cQtTkCkQz1Zg%3D%3D' },
            { icon: Ticket,       label: 'Cupones',    href: '/cuenta/cupones',  g: 'linear-gradient(135deg,#ec4899,#f472b6)', shadow: 'rgba(236,72,153,0.35)', image: 'https://cdn3d.iconscout.com/3d/premium/thumb/cupon-3d-icon-png-download-10660366.png' },
            { icon: Gift,         label: 'Regalos',    href: '/cuenta/regalos',   g: 'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow: 'rgba(245,158,11,0.35)', image: 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/IADESIGN/2026/05/1778909156669-pegada-1778909150770.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=fD%2Fi%2B6jEPBTW2nenPdkRcfsEbOJa60HYpbbu4i1Aexl10q7aclo9oDq7sQ6EJek6knoKaM9sp8mnOz5%2Fvgdk2ZjBHMrovT%2Bah08BiVFYAgb5kLEpQbxcYTHgX8dxk0ZruQnyx%2FGctf4bmqxWks1hxpLl3skIUFINOqFeU%2FDQ1%2FVoOdnJAMoRQ0L3%2BNtCmzLjkQBZV5JrzJTszeUSHSFl80uB3Os1qsXvgZhvnHkfsqq4mZ8ret4548aMV1TH0EDbO96mv8DWVFNqSuK9gyF2gWcM82KKG2nXP57Fj6B8JVvkjC3jevkIMaNrm8Hn4r4Nm2bsdK3mGk7QKHS53wHZ1Q%3D%3D' },
            { icon: MapPin,       label: 'Dirección',  href: '/cuenta/direcciones',g: 'linear-gradient(135deg,#10b981,#34d399)', shadow: 'rgba(16,185,129,0.35)', image: 'https://esmartyelevadores.com.br/assets/images/icon-endereo.webp' },
          ].map((sc, idx) => {
            const Icon = sc.icon;
            const shouldAnimate = sc.label === 'Regalos' && hasGifts;
            return (
              <motion.div
                key={sc.label}
                initial={{ opacity: 0, y: 30, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: idx * 0.12 }}
              >
                <Link href={sc.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', overflow: 'visible' }}>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.85 }}
                    animate={shouldAnimate ? { 
                      rotate: [0, 15, -15, 15, -15, 0],
                    } : {}}
                    transition={shouldAnimate ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                    style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: sc.image ? 'transparent' : sc.g,
                      boxShadow: sc.image ? 'none' : `0 6px 20px ${sc.shadow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: sc.image ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                    }}
                  >
                    {sc.image ? (
                      <img
                        src={sc.image}
                        alt={sc.label}
                        style={{ width: 140, height: 140, objectFit: 'contain' }}
                      />
                    ) : (
                      <Icon size={28} color="#fff" strokeWidth={2} />
                    )}
                    {sc.label === 'Regalos' && hasGifts && (
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        background: '#ec4899',
                        color: '#fff',
                        borderRadius: '50%',
                        fontSize: 12,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                      }}>
                        1
                      </div>
                    )}
                  </motion.div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{sc.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div style={{ marginBottom: 24 }}>
          <LoyaltyLevel />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {ALL_CARDS.map(item => <DesktopCard key={item.label} item={item} />)}
        </div>
      </div>

      {/* ════════ MOBILE HARDCORE PREMIUM ════════ */}
      <div className="cuenta-mobile" style={{ fontFamily: FF, background: 'transparent', minHeight: '100vh' }}>
        <style>{`
          .pm-pill:active { transform: scale(0.93); opacity: 0.85; }
          .pm-pill { transition: transform 0.18s cubic-bezier(.34,1.56,.64,1); }
          .pm-row { transition: background 0.12s; }
          .pm-row:active { background: rgba(236,72,153,0.04) !important; }
          .pm-logout:active { background: #fee2e2 !important; transform: scale(0.98); }
          .pm-logout { transition: all 0.15s; }
          @keyframes qa-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes qa-glow-pulse { 0%,100% { filter: drop-shadow(0 0 3px rgba(236,72,153,0.2)); } 50% { filter: drop-shadow(0 0 8px rgba(236,72,153,0.25)); } }
          @keyframes qa-wiggle { 0% { transform: rotate(0deg); } 15% { transform: rotate(-8deg); } 30% { transform: rotate(6deg); } 45% { transform: rotate(-4deg); } 60% { transform: rotate(2deg); } 75% { transform: rotate(-1deg); } 100% { transform: rotate(0deg); } }
          @keyframes td_shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes td_float { 0%,100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-2px); opacity: 1; } }
          @keyframes td_bubble { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.4); opacity: 0.6; } }
          @keyframes td_drift { 0%,100% { transform: translateX(0); opacity: 0.15; } 50% { transform: translateX(6px); opacity: 0.25; } }
          .qa-icon-float { animation: qa-float 3s ease-in-out infinite; }
          .qa-icon-float:nth-child(1) { animation-delay: 0s; }
          .qa-icon-float:nth-child(2) { animation-delay: 0.4s; }
          .qa-icon-float:nth-child(3) { animation-delay: 0.8s; }
          .qa-icon-float:nth-child(4) { animation-delay: 1.2s; }
          .qa-icon-glow { animation: qa-glow-pulse 2.5s ease-in-out infinite; }
          .qa-icon-wiggle:hover { animation: qa-wiggle 0.6s ease-in-out; }
          .pm-card-3d {
            background: #fff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07) !important;
            border: 1px solid rgba(0,0,0,0.07) !important;
            transform: none !important;
          }
          .pm-card-3d * {
            pointer-events: auto;
          }
          .pm-card-3d:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07) !important;
            border: 1px solid rgba(0,0,0,0.07) !important;
            transform: none !important;
          }
        `}</style>

        {/* ── HERO: card style like desktop ── */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.07)', position: 'relative' }}>
            {/* Cover image */}
            <div style={{
              height: 130,
              backgroundImage: coverUrl ? 'none' : `url(${BG_CUENTA})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {coverUrl && <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <Link href="/cuenta/perfil" style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Pencil size={13} color="#374151" style={{ opacity: 0.8 }} />
              </Link>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
            </div>
            {/* Avatar + info row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 18px 20px', marginTop: -40, position: 'relative', zIndex: 2 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: PINK, flexShrink: 0, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 0 0 2px rgba(236,72,153,0.15), 0 4px 6px -1px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.12)' }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ paddingBottom: 4, flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>¡Hola, {firstName}! 👋</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
              <Link href="/cuenta/puntos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: PINK, color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 12, textDecoration: 'none', marginBottom: 4, flexShrink: 0, position: 'relative', overflow: 'hidden', letterSpacing: '-0.01em' }}>
                <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trophy size={13} /> Tienda de puntos</span>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)', backgroundSize: '200% 100%', animation: 'td_shimmer 2.5s ease-in-out infinite' }} />
                {[{l:10,t:25,s:1.5,d:0},{l:30,t:55,s:2.3,d:.2},{l:50,t:20,s:1.5,d:.4},{l:70,t:60,s:2.3,d:.6},{l:90,t:35,s:1.5,d:.8}].map((p,i)=>(
                  <div key={`mf${i}`} style={{ position:'absolute', left:`${p.l}%`, top:`${p.t}%`, width:p.s, height:p.s, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.8),rgba(255,255,255,0.1))', boxShadow:'0 0 2px rgba(255,255,255,0.5)', animation:`td_float ${1.2+i*.4}s ease-in-out ${p.d}s infinite alternate` }} />
                ))}
                {[{l:8,t:15,s:3,d:0},{l:35,t:50,s:4,d:.3},{l:62,t:25,s:3,d:.6},{l:88,t:65,s:4,d:.9}].map((b,i)=>(
                  <div key={`mb${i}`} style={{ position:'absolute', left:`${b.l}%`, top:`${b.t}%`, width:b.s, height:b.s, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.3)', animation:`td_bubble ${1.5+i*.5}s ease-in-out ${b.d}s infinite` }} />
                ))}
                <div style={{ position:'absolute', top:0, height:'100%', width:6, borderRadius:99, background:'rgba(255,255,255,0.12)', filter:'blur(2px)', left:'30%', animation:'td_drift 3s ease-in-out infinite' }} />
                <div style={{ position:'absolute', top:0, height:'100%', width:4, borderRadius:99, background:'rgba(255,255,255,0.08)', filter:'blur(2px)', left:'70%', animation:'td_drift 4s ease-in-out infinite reverse' }} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS: gradient pill cards ── */}
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { icon: Receipt,      label: 'Pedidos',    href: '/cuenta/pedidos',    g: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: 'rgba(99,102,241,0.35)', image: 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/IADESIGN/2026/05/1778902651562-pegada-1778902645915.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=OKWZOLTMN0DmNxF9i2zJvPKGsGgQbWbwKDU9L887E5hHYoSclN7CnFS8lcAEJid%2F5LgCmKwnOHozplzK7sG0iGALAcnAFpTVUFfp%2BDmN0iURUkPa%2BrFJHcxzEi8qvxfI7Kok8Ortf%2FV1SSEvPKkXcZgPGb41b3Sz6afLz2tK5JsLAUIHHCZ9V2nxi%2FO5lq7y1RDt0jT0q8RokkxREqSsAFF0IcKqwZ3Mlo2HZidVKzMr%2Br1iat82uZdAYv%2FYHCnf22%2BZYFtnyc4qG7ZiIfQ6w8p8VkEMeS6CYvYIcK%2FtZbliO9wzYCyvsATa4bdjzHLEaM6%2F3friX3cQtTkCkQz1Zg%3D%3D' },
              { icon: Ticket,       label: 'Cupones',    href: '/cuenta/cupones',  g: 'linear-gradient(135deg,#ec4899,#f472b6)', shadow: 'rgba(236,72,153,0.35)', image: 'https://cdn3d.iconscout.com/3d/premium/thumb/cupon-3d-icon-png-download-10660366.png' },
              { icon: Gift,         label: 'Regalos',    href: '/cuenta/regalos',   g: 'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow: 'rgba(245,158,11,0.35)', image: 'https://storage.googleapis.com/geminai-449212.firebasestorage.app/IADESIGN/2026/05/1778909156669-pegada-1778909150770.png?GoogleAccessId=imagen%40geminai-449212.iam.gserviceaccount.com&Expires=16730334000&Signature=fD%2Fi%2B6jEPBTW2nenPdkRcfsEbOJa60HYpbbu4i1Aexl10q7aclo9oDq7sQ6EJek6knoKaM9sp8mnOz5%2Fvgdk2ZjBHMrovT%2Bah08BiVFYAgb5kLEpQbxcYTHgX8dxk0ZruQnyx%2FGctf4bmqxWks1hxpLl3skIUFINOqFeU%2FDQ1%2FVoOdnJAMoRQ0L3%2BNtCmzLjkQBZV5JrzJTszeUSHSFl80uB3Os1qsXvgZhvnHkfsqq4mZ8ret4548aMV1TH0EDbO96mv8DWVFNqSuK9gyF2gWcM82KKG2nXP57Fj6B8JVvkjC3jevkIMaNrm8Hn4r4Nm2bsdK3mGk7QKHS53wHZ1Q%3D%3D' },
              { icon: MapPin,       label: 'Dirección',  href: '/cuenta/direcciones',g: 'linear-gradient(135deg,#10b981,#34d399)', shadow: 'rgba(16,185,129,0.35)', image: 'https://esmartyelevadores.com.br/assets/images/icon-endereo.webp' },
            ].map((sc, idx) => {
              const Icon = sc.icon;
              const shouldAnimate = sc.label === 'Regalos' && hasGifts;
              return (
                <motion.div
                  key={sc.label}
                  initial={{ opacity: 0, y: 30, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: idx * 0.12 }}
                >
                  <Link href={sc.href} className="pm-pill" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', overflow: 'visible' }}>
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      animate={shouldAnimate ? { 
                        rotate: [0, 15, -15, 15, -15, 0],
                      } : {}}
                      transition={shouldAnimate ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                      style={{
                        width: 54, height: 54, borderRadius: 17,
                        background: sc.image ? 'transparent' : sc.g,
                        boxShadow: sc.image ? 'none' : `0 6px 18px ${sc.shadow}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: sc.image ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      {sc.image ? (
                        <img
                          src={sc.image}
                          alt={sc.label}
                          style={{ width: 128, height: 128, objectFit: 'contain' }}
                        />
                      ) : (
                        <Icon size={24} color="#fff" strokeWidth={2} />
                      )}
                      {sc.label === 'Regalos' && hasGifts && (
                        <div style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          background: '#ec4899',
                          color: '#fff',
                          borderRadius: '50%',
                          fontSize: 11,
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #fff',
                        }}>
                          1
                        </div>
                      )}
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + idx * 0.12 }}
                      style={{ fontSize: 10.5, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}
                    >{sc.label}</motion.span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Inauguración Banner ── */}
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)', borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 25px rgba(236,72,153,0.25)' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <Sparkles size={24} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>¡GRAN INAUGURACIÓN!</h2>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Celebramos la apertura con ofertas exclusivas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── LOYALTY compact card ── */}
        <div style={{ padding: '14px 14px 0' }}>
          <LoyaltyLevel />
        </div>

        {/* ── MENU GROUPS ── */}
        <div style={{ padding: '14px 14px 50px' }}>

          {/* Section: Mis compras */}
          <p style={{ margin: '0 0 7px 2px', fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>Mis compras</p>
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.07)', marginBottom: 16 }}>
            <PmRow icon={Receipt} label="Mis Pedidos" desc="Seguí tus compras" href="/cuenta/pedidos" g="linear-gradient(135deg,#6366f1,#8b5cf6)" />
            <PmRow icon={Ticket} label="Cupones" desc="Tus descuentos disponibles" href="/cuenta/cupones" g="linear-gradient(135deg,#ec4899,#f472b6)" />
            <PmRow icon={Gift} label="Regalos" desc="Tus regalos disponibles" href="/cuenta/regalos" g="linear-gradient(135deg,#f59e0b,#fbbf24)" last badge={hasGifts ? 1 : undefined} />
          </div>

          {/* Section: Mi cuenta */}
          <p style={{ margin: '0 0 7px 2px', fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>Mi cuenta</p>
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.07)', marginBottom: 16 }}>
            <PmRow icon={User} label="Datos personales" desc="Nombre, foto y perfil" href="/cuenta" g="linear-gradient(135deg,#3b82f6,#60a5fa)" />
            <PmRow icon={Phone} label="Contacto" desc="Teléfono y RUT" href="/cuenta/info" g="linear-gradient(135deg,#06b6d4,#22d3ee)" />
            <PmRow icon={MapPin} label="Direcciones" desc="Envíos guardados" href="/cuenta/direcciones" g="linear-gradient(135deg,#10b981,#34d399)" last />
          </div>

          {/* Section: Más */}
          <p style={{ margin: '0 0 7px 2px', fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em' }}>Más opciones</p>
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.07)', marginBottom: 20 }}>
            <PmRow icon={Trophy} label="Mis Niveles" desc="Programa de lealtad" href="/cuenta/niveles" g="linear-gradient(135deg,#f59e0b,#fbbf24)" />
            <PmRow icon={Building2} label="Cuenta Mayorista" desc="Precios por volumen" href="/mayorista" g="linear-gradient(135deg,#8b5cf6,#a78bfa)" />
            <PmRow icon={Bell} label="Notificaciones" desc="Alertas de tu cuenta" href="/cuenta/notificaciones" g="linear-gradient(135deg,#ec4899,#f472b6)" />
            <PmRow icon={HelpCircle} label="Soporte" desc="Ayuda y tickets" href="/cuenta/tickets" g="linear-gradient(135deg,#64748b,#94a3b8)" />
            <PmRow icon={MessageCircle} label="Conversaciones" desc="Historial de chats" href="/cuenta/conversaciones" g="linear-gradient(135deg,#0ea5e9,#38bdf8)" last />
          </div>

          {/* Logout */}
          <button className="pm-logout" onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '15px', background: '#fff', borderRadius: 18,
            border: '1px solid rgba(220,38,38,0.15)',
            boxShadow: '0 2px 12px rgba(220,38,38,0.08)',
            cursor: 'pointer', color: '#dc2626', fontSize: 14.5, fontWeight: 700,
            fontFamily: FF,
          }}>
            <LogOut size={17} />Cerrar sesión
          </button>

          <div style={{ marginTop: 20, display: 'flex', gap: 20, justifyContent: 'center' }}>
            {['Términos', 'Privacidad', 'Ayuda'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#c4c9d4', cursor: 'pointer', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════ Components ════════ */

function DesktopCard({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="dcard">
      <div className="dcard-icon-wrap">
        <Icon size={22} color={PINK} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.01em' }}>{item.label}</p>
        {item.desc && (
          <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', lineHeight: 1.4 }}>{item.desc}</p>
        )}
      </div>
    </Link>
  );
}

function PmRow({ icon: Icon, label, desc, href, g, last, badge }: { icon: any; label: string; desc: string; href: string; g: string; last?: boolean; badge?: number }) {
  return (
    <Link href={href} className="pm-row" style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px',
      textDecoration: 'none', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, background: g, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        position: 'relative',
      }}>
        <Icon size={18} color="#fff" strokeWidth={2.2} />
        {badge && (
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            background: '#ec4899',
            color: '#fff',
            borderRadius: '50%',
            fontSize: 11,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {badge}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14.5, color: '#111827', fontWeight: 700, lineHeight: 1.2 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#9ca3af', lineHeight: 1.3 }}>{desc}</p>
      </div>
      <ChevronRight size={16} color="#d1d5db" strokeWidth={2.5} />
    </Link>
  );
}

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{
        margin: '0 0 6px', padding: '0 4px', fontSize: 12, fontWeight: 800,
        color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        {title}
      </p>
      <div className="section-card">
        {children}
      </div>
    </div>
  );
}

function MobileMenuItem({ icon: Icon, label, href, desc }: { icon: any; label: string; href: string; desc?: string }) {
  return (
    <Link href={href}
      className="menu-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
        textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)',
        transition: 'background .12s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = '#fafafa';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = '';
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#fef2f8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={17} color={PINK} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, color: '#1a1a1a', fontWeight: 600, lineHeight: 1.2 }}>{label}</p>
        {desc && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af', lineHeight: 1.3 }}>{desc}</p>}
      </div>
      <ChevronRight size={15} color="#d1d5db" />
    </Link>
  );
}
