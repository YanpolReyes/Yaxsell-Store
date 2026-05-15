'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getServices, getAppwriteConfig, USER_PHOTOS_BUCKET } from '@/lib/appwrite';
import {
  ShoppingBag, Bell, Heart, ShoppingCart, MessageCircle,
  User, MapPin, Receipt, HelpCircle, Phone,
  Loader2, ChevronRight, LogOut, Building2, Trophy,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import LoyaltyPoints from '@/components/LoyaltyPoints';
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

const SIDEBAR_NAV = [
  { icon: ShoppingBag, label: 'Pedidos',       href: '/cuenta/pedidos'        },
  { icon: Heart,       label: 'Favoritos',      href: '/cuenta/favoritos'      },
  { icon: Bell,        label: 'Notificaciones', href: '/cuenta/notificaciones' },
  { icon: MapPin,      label: 'Direcciones',    href: '/cuenta/direcciones'    },
  { icon: HelpCircle,  label: 'Soporte',        href: '/cuenta/tickets'        },
];

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  return `${endpoint}/storage/buckets/${USER_PHOTOS_BUCKET}/files/${fileId}/view?project=${projectId}`;
}

const BG_CUENTA = 'https://t4.ftcdn.net/jpg/06/51/36/51/360_F_651365167_W04PhefXV6zXetrfI0KG9uwWBMjbaYX4.jpg';

export default function CuentaPage() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  useCuentaBg(BG_CUENTA);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(prefs.avatarFileId));
        if (prefs.coverFileId) setCoverUrl(getFilePreviewUrl(prefs.coverFileId));
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

  return (
    <>
      <style>{`
        .cuenta-desktop { display: none }
        .cuenta-mobile  { display: block }
        @media (min-width: 900px) {
          .cuenta-desktop { display: block !important }
          .cuenta-mobile  { display: none !important }
        }

        .dcard {
          display: flex; flex-direction: row; align-items: center;
          background: #fff; border-radius: 18px;
          padding: 24px; text-decoration: none;
          border: 1px solid #f0f0f0;
          min-height: 100px; box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .dcard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: rgba(236,72,153,0.2);
        }
        .dcard:hover .dcard-icon-wrap { background: ${PINK}; }
        .dcard:hover .dcard-icon-wrap svg { stroke: #fff; }
        .dcard-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          background: #fef2f8;
          display: flex; align-items: center; justify-content: center;
          margin-right: 18px; flex-shrink: 0;
          transition: background 0.2s;
        }
        .dcard-icon-wrap svg { transition: stroke 0.2s; }
      `}</style>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="cuenta-desktop" style={{ display: 'none' }}>
        {/* Hero header */}
        <div style={{ background: '#fff', borderRadius: 20, marginBottom: 24, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ height: 160, background: coverUrl ? 'none' : 'linear-gradient(135deg,#fef2f8,#fce7f3)', position: 'relative', overflow: 'hidden' }}>
            {coverUrl && <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 28px 32px', marginTop: -55, position: 'relative', zIndex: 2 }}>
            <div style={{ width: 130, height: 130, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: PINK, flexShrink: 0, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ paddingBottom: 6, flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>¡Hola, {user.name.split(' ')[0]}!</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{user.email}</p>
            </div>
            <Link href="/cuenta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: PINK, color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 10, textDecoration: 'none', marginBottom: 6 }}>
              Editar perfil <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <LoyaltyLevel />
        </div>
        <div style={{ marginBottom: 24 }}>
          <LoyaltyPoints />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {ALL_CARDS.map(item => <DesktopCard key={item.label} item={item} />)}
        </div>
      </div>

      {/* ════════════════ MOBILE ════════════════ */}
      <div className="cuenta-mobile">
        <div style={{ background: '#fff', position: 'relative', paddingBottom: 50 }}>
          {coverUrl ? (
            <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
              <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
            </div>
          ) : (
            <div style={{ height: 110, background: 'linear-gradient(135deg,#fef2f8,#fce7f3)' }} />
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 16, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: PINK, overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '16px 16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>¡Hola, {user.name.split(' ')[0]}!</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{user.email}</p>
          <Link href="/cuenta" style={{ display: 'inline-block', marginTop: 10, padding: '8px 14px', background: PINK, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', borderRadius: 8 }}>Editar perfil →</Link>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '12px 8px 40px' }}>
          <div style={{ marginBottom: 12 }}>
            <LoyaltyLevel />
          </div>
          <div style={{ marginBottom: 12 }}>
            <LoyaltyPoints />
          </div>

          <Section title="Mis Pedidos">{MIS_COMPRAS_ITEMS.map(item => <MenuRow key={item.label} item={item} />)}</Section>
          <Section title="Cuenta">{CUENTA_ITEMS.map(item => <MenuRow key={item.label} item={item} />)}</Section>
          <Section title="Configuración">{CONFIG_ITEMS.map(item => <MenuRow key={item.label} item={item} />)}</Section>

          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 16px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, cursor: 'pointer', color: '#dc2626', fontSize: 15, fontWeight: 700, fontFamily: FF, marginTop: 4 }}>
            <LogOut size={18} />Cerrar sesión
          </button>

          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center' }}>
            {['Términos y condiciones', 'Privacidad', 'Ayuda'].map(t => (
              <span key={t} style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════ Componentes ════════ */

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', marginBottom: 12, overflow: 'hidden' }}>
      <p style={{ margin: 0, padding: '16px 18px 6px', fontSize: 12, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.08em' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', textDecoration: 'none', borderTop: '1px solid #f9fafb', transition: 'background .15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} color={PINK} />
      </div>
      <span style={{ flex: 1, fontSize: 15, color: '#1a1a1a', fontWeight: 600 }}>{item.label}</span>
      {item.badge !== undefined && (
        <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: item.badgeColor || PINK, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.badge}
        </span>
      )}
      <ChevronRight size={16} color="#d1d5db" />
    </Link>
  );
}
