'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Loader2, Camera,
  User, Lock, MapPin, CreditCard, Shield, MessageSquare,
  BadgeInfo, Users, Monitor, ShoppingBag, Heart, Bell, HelpCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getServices, getAppwriteConfig, USER_PHOTOS_BUCKET, ID } from '@/lib/appwrite';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#ec4899';

interface Item { icon: any; label: string; href: string; desc?: string; badge?: React.ReactNode; }

const ITEMS: Item[] = [
  { icon: BadgeInfo,     label: 'Información personal', href: '/cuenta/info',            desc: 'Tus datos personales y contacto' },
  { icon: User,          label: 'Datos de tu cuenta',   href: '/cuenta/datos',           desc: 'Email, RUT y configuración' },
  { icon: Lock,          label: 'Seguridad',            href: '/cuenta/seguridad',       desc: 'Contraseña y verificación', badge: (
    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>!</span>
  ) },
  { icon: CreditCard,    label: 'Tarjetas',             href: '/cuenta/tarjetas',        desc: 'Métodos de pago guardados' },
  { icon: MapPin,        label: 'Direcciones',          href: '/cuenta/direcciones',     desc: 'Direcciones de envío' },
  { icon: Shield,        label: 'Privacidad',           href: '/cuenta/privacidad',      desc: 'Control de tu información' },
  { icon: MessageSquare, label: 'Comunicaciones',       href: '/cuenta/comunicaciones',  desc: 'Notificaciones y emails' },
  { icon: Users,         label: 'Colaboradores',        href: '/cuenta/colaboradores',   desc: 'Personas con acceso' },
];

const SIDEBAR_NAV = [
  { icon: ShoppingBag, label: 'Compras',        href: '/cuenta/pedidos'        },
  { icon: Heart,       label: 'Favoritos',      href: '/favoritos'             },
  { icon: Bell,        label: 'Notificaciones', href: '/cuenta/notificaciones' },
  { icon: User,        label: 'Mi perfil',      href: '/cuenta/perfil'         },
  { icon: MapPin,      label: 'Direcciones',    href: '/cuenta/direcciones'    },
  { icon: HelpCircle,  label: 'Soporte',        href: '/cuenta/tickets'        },
];

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  return `${endpoint}/storage/buckets/${USER_PHOTOS_BUCKET}/files/${fileId}/view?project=${projectId}`;
}

export default function PerfilPage() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl,  setCoverUrl]  = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(prefs.avatarFileId));
        if (prefs.coverFileId)  setCoverUrl(getFilePreviewUrl(prefs.coverFileId));
      } catch {}
    })();
  }, [isLoggedIn]);

  async function uploadPhoto(file: File, type: 'avatar' | 'cover') {
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    const setUrl       = type === 'avatar' ? setAvatarUrl       : setCoverUrl;
    const prefKey      = type === 'avatar' ? 'avatarFileId'     : 'coverFileId';
    setUploading(true);
    try {
      const { storage, account } = getServices();
      const uploaded = await storage.createFile(USER_PHOTOS_BUCKET, ID.unique(), file);
      const acc = await account.get();
      const currentPrefs = (acc as any).prefs || {};
      await account.updatePrefs({ ...currentPrefs, [prefKey]: uploaded.$id });
      setUrl(getFilePreviewUrl(uploaded.$id));
    } catch (err) {
      console.error('Error subiendo foto:', err);
      alert('No se pudo subir la foto. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() { await logout(); router.replace('/'); }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <Loader2 size={32} color={PINK} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isLoggedIn || !user) return null;

  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: FF }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .perf-desktop { display: none }
        .perf-mobile  { display: block }
        @media (min-width: 900px) {
          .perf-desktop { display: flex !important }
          .perf-mobile  { display: none !important }
        }
        .sb-link {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 11px 14px; border-radius: 10px;
          text-decoration: none; color: #4b5563; font-size: 14px; font-weight: 500;
          width: 100%; box-sizing: border-box; border: none; background: transparent; cursor: pointer;
          font-family: ${FF}; transition: all 0.18s;
        }
        .sb-link:hover { background: #f9fafb; color: #1a1a1a; }
        .sb-link.active { background: #fef2f8; color: ${PINK}; font-weight: 700; }
        .sb-link-content { display: flex; align-items: center; gap: 12px; }
        .pcard {
          display: flex; align-items: center; gap: 16px;
          padding: 18px 20px; background: #fff;
          border: 1px solid #f0f0f0; border-radius: 14px;
          text-decoration: none; transition: all 0.18s;
        }
        .pcard:hover { border-color: rgba(236,72,153,0.25); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.04); }
        .pcard-icon { width: 42px; height: 42px; border-radius: 11px; background: #fef2f8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s; }
        .pcard:hover .pcard-icon { background: ${PINK}; }
        .pcard:hover .pcard-icon svg { stroke: #fff; }
        .pcard-icon svg { transition: stroke 0.2s; }
      `}</style>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="perf-desktop" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px', gap: 28, boxSizing: 'border-box' }}>

        {/* Sidebar */}
        <aside style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px 16px', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarUrl ? 'transparent' : '#fef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, color: PINK, fontWeight: 700, fontSize: 15 }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => {
                const isActive = label === 'Mi perfil';
                return (
                  <Link key={label} href={href} className={`sb-link ${isActive ? 'active' : ''}`}>
                    <div className="sb-link-content">
                      <Icon size={18} strokeWidth={2} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight size={14} style={{ opacity: 0.3 }} />
                  </Link>
                );
              })}
              <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }} />
              <button onClick={handleLogout} className="sb-link" style={{ color: '#dc2626' }}>
                <div className="sb-link-content">
                  <LogOut size={18} strokeWidth={2} />
                  <span>Cerrar sesión</span>
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Breadcrumb */}
          <Link href="/cuenta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', textDecoration: 'none', fontSize: 14, marginBottom: 16, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Volver a Mi cuenta
          </Link>

          {/* Profile header card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f0f0f0', overflow: 'hidden', marginBottom: 24 }}>
            {/* Cover */}
            <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: coverUrl ? 'none' : 'linear-gradient(135deg,#fef2f8,#fce7f3)' }}>
              {coverUrl && <img src={coverUrl} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {/* Gradient fade to white at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
              <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 20, cursor: 'pointer', color: '#1a1a1a', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontFamily: FF }}>
                {uploadingCover ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={14} />}
                {coverUrl ? 'Cambiar portada' : 'Agregar portada'}
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'cover'); e.target.value = ''; }} />
            </div>

            {/* Avatar + info */}
            <div style={{ padding: '0 32px 28px', display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -60 }}>
              <div style={{ position: 'relative' }}>
                <div onClick={() => avatarInputRef.current?.click()} style={{ width: 140, height: 140, borderRadius: '50%', background: avatarUrl ? '#fff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: PINK, border: '5px solid #fff', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  style={{ position: 'absolute', bottom: 6, right: 6, width: 40, height: 40, borderRadius: '50%', background: PINK, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(236,72,153,0.3)', padding: 0 }}>
                  {uploadingAvatar ? <Loader2 size={15} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={15} color="#fff" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'avatar'); e.target.value = ''; }} />
              </div>
              <div style={{ paddingBottom: 6, flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>{user.name}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Section title */}
          <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.01em' }}>Configuración de la cuenta</h2>

          {/* Items grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="pcard">
                  <div className="pcard-icon">
                    <Icon size={20} color={PINK} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{item.label}</p>
                    {item.desc && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af' }}>{item.desc}</p>}
                  </div>
                  {item.badge}
                  <ChevronRight size={16} color="#d1d5db" />
                </Link>
              );
            })}
          </div>
        </main>
      </div>

      {/* ════════════════ MOBILE ════════════════ */}
      <div className="perf-mobile">
        <div style={{ position: 'relative', paddingBottom: 60 }}>
          {/* Cover */}
          <div style={{ height: 160, background: coverUrl ? 'none' : 'linear-gradient(135deg,#fef2f8,#fce7f3)', position: 'relative', overflow: 'hidden' }}>
            {coverUrl && <img src={coverUrl} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {/* Gradient fade to white at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom,transparent,#fff)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14 }}>
              <Link href="/cuenta" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '6px 14px 6px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <ArrowLeft size={16} color="#1a1a1a" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Mi perfil</span>
              </Link>
            </div>
            <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
              style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 20, cursor: 'pointer', color: '#1a1a1a', fontSize: 12, fontWeight: 700, fontFamily: FF }}>
              {uploadingCover ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} />}
              {coverUrl ? 'Cambiar' : 'Agregar'}
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'cover'); e.target.value = ''; }} />
          </div>

          {/* Avatar */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => avatarInputRef.current?.click()} style={{ width: 120, height: 120, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: PINK, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '4px solid #fff', overflow: 'hidden', cursor: 'pointer' }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                style={{ position: 'absolute', bottom: 6, right: 6, width: 36, height: 36, borderRadius: '50%', background: PINK, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(236,72,153,0.3)', padding: 0 }}>
                {uploadingAvatar ? <Loader2 size={12} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={12} color="#fff" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'avatar'); e.target.value = ''; }} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', textAlign: 'center', padding: '14px 16px 22px', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{user.name}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{user.email}</p>
        </div>

        <div style={{ padding: '12px', maxWidth: 700, margin: '0 auto' }}>
          {ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#fff', borderRadius: 12, textDecoration: 'none', marginBottom: 8, border: '1px solid #f0f0f0' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={PINK} strokeWidth={2} />
                </div>
                <span style={{ flex: 1, fontSize: 14, color: '#1a1a1a', fontWeight: 600 }}>{item.label}</span>
                {item.badge}
                <ChevronRight size={16} color="#d1d5db" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
