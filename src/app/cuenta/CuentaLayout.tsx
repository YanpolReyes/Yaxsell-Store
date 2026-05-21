'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User, ShoppingBag, Heart, MapPin, HelpCircle, Gift,
  LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getServices, getAppwriteConfig, MEDIA_BUCKET_ID, MEDIA_PREFIXES } from '@/lib/appwrite';
import { CuentaBgProvider, useCuentaBgUrl } from './CuentaBgContext';

const FF = '"DM Sans",system-ui,sans-serif';
const PINK = '#f18e04';

const SIDEBAR_NAV = [
  { icon: User,        label: 'Mi cuenta',      href: '/cuenta'               },
  { icon: Heart,       label: 'Favoritos',        href: '/cuenta/favoritos'      },
  { icon: HelpCircle,  label: 'Soporte',          href: '/cuenta/tickets'        },
];

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  const path = MEDIA_PREFIXES.thumbnails + fileId;
  return `${endpoint}/storage/buckets/${MEDIA_BUCKET_ID}/files/${path}/view?project=${projectId}`;
}

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CuentaBgProvider>
      <CuentaLayoutInner>{children}</CuentaLayoutInner>
    </CuentaBgProvider>
  );
}

function CuentaLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, logout } = useAuth();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasGifts, setHasGifts] = useState(false);
  const bgUrl = useCuentaBgUrl();

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(prefs.avatarFileId));
        setHasGifts(!prefs.welcomeGiftClaimed);
      } catch {}
    })();
  }, [isLoggedIn]);

  if (!isLoggedIn || !user) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: FF }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 12px 60px', boxSizing: 'border-box' }}>
          {children}
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: FF }}>
      {/* Background image with blur */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        {bgUrl && <img key={bgUrl} src={bgUrl} alt="" className="cl-bg-fade" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px) brightness(1.1)', transform: 'scale(1.15)', animation: 'bgFloat 20s ease-in-out infinite, bgCrossFade 0.5s ease-out' }} />}
        <div style={{ position: 'absolute', inset: 0, background: bgUrl ? 'linear-gradient(180deg,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0.85) 100%)' : 'linear-gradient(180deg,#ffffff 0%,#fff 100%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        .cl-sidebar { display: none }
        @media (min-width: 900px) {
          .cl-sidebar { display: flex !important }
          .cl-main { padding-top: 86px !important; }
        }
        .sb-link {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          padding: 13px 16px; border-radius: 12px;
          text-decoration: none; color: #4b5563; font-size: 15px; font-weight: 600;
          width: 100%; box-sizing: border-box; border: none; background: transparent; cursor: pointer;
          font-family: ${FF}; transition: all 0.18s;
        }
        .sb-link:hover { background: #f9fafb; color: #1a1a1a; }
        .sb-link.active { background: #fff8ed; color: ${PINK}; font-weight: 700; }
        .sb-link-content { display: flex; align-items: center; gap: 14px; }
        @keyframes bgFloat { 0%,100%{transform:scale(1.1) translate(0,0)} 25%{transform:scale(1.15) translate(1%,-1%)} 50%{transform:scale(1.1) translate(-1%,1%)} 75%{transform:scale(1.15) translate(1%,1%)} }
        @keyframes pageSlideIn {
          0% { opacity: 0; transform: translateX(24px) scale(0.98); filter: blur(4px); }
          40% { opacity: 0.6; filter: blur(2px); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes bgCrossFade {
          0% { opacity: 0; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1.15); }
        }
        .cl-content-fade { animation: pageSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        .cl-bg-fade { animation: bgCrossFade 0.5s ease-out; }
      `}</style>

      {/* ── Main content (flex layout on desktop) ── */}
      <div className="cl-main" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 12px 60px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* ── Sidebar (flex on desktop, hidden on mobile) ── */}
          <aside className="cl-sidebar" style={{ display: 'none', width: 280, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1.5px solid #d1d5db', boxShadow: 'inset 0 1px 2px 0 rgba(0,0,0,0.02), 0 1px 2px 0 rgba(0,0,0,0.03), 0 2px 8px 0 rgba(0,0,0,0.04), 0 4px 16px 0 rgba(0,0,0,0.02)', position: 'sticky', top: 92 }}>
              {/* Profile mini */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 8px 20px', borderBottom: '1px solid #f3f4f6', marginBottom: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: avatarUrl ? 'transparent' : '#fff8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, color: PINK, fontWeight: 700, fontSize: 17 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SIDEBAR_NAV.map(({ icon: Icon, label, href }) => {
                  const isActive = pathname === href || (href !== '/cuenta' && pathname.startsWith(href));
                  const isRegalos = label === 'Regalos';
                  return (
                    <Link key={label} href={href} className={`sb-link ${isActive ? 'active' : ''}`}>
                      <div className="sb-link-content" style={{ position: 'relative' }}>
                        <Icon size={20} strokeWidth={2} />
                        <span>{label}</span>
                        {isRegalos && hasGifts && (
                          <div className="gift-badge" style={{ 
                            position: 'absolute', 
                            top: '-4px', 
                            right: '-8px', 
                            width: 18, 
                            height: 18, 
                            background: '#f18e04', 
                            color: '#fff', 
                            borderRadius: '50%', 
                            fontSize: 11, 
                            fontWeight: 900, 
                            display: 'flex',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px solid #fff'
                          }}>
                            1
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} style={{ opacity: 0.3 }} />
                    </Link>
                  );
                })}

                <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }}></div>

                <button onClick={handleLogout} className="sb-link" style={{ color: '#dc2626', padding: '13px 16px' }}>
                  <div className="sb-link-content">
                    <LogOut size={20} strokeWidth={2} />
                    <span>Cerrar sesión</span>
                  </div>
                </button>
              </div>
            </div>
          </aside>

          {/* ── Content area ── */}
          <div key={pathname} style={{ flex: 1, minWidth: 0 }} className="cl-content-fade">
            {children}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
