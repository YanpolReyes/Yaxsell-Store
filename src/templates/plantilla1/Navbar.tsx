'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, MapPin, Bell, Receipt, LogOut, Package, Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { getServices, getAppwriteConfig, USER_PHOTOS_BUCKET, formatPrice } from '@/lib/appwrite';

const PINK_PRIMARY = '#ec4899';
const PINK_LIGHT = '#f9a8d4';
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/geminai-449212.firebasestorage.app/o/KEVINCOCO%2FGemini_Generated_Image_v5vfu6v5vfu6v5vf.png?alt=media&token=a049b070-6653-435b-a978-9cb06a92f865';

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  return `${endpoint}/storage/buckets/${USER_PHOTOS_BUCKET}/files/${fileId}/view?project=${projectId}`;
}

export default function Navbar1() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const { user, isLoggedIn, logout } = useAuth();
  const { totalItems, items, subtotal, removeItem, updateQuantity } = useCart();
  const { unreadCount } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [primaryAddress, setPrimaryAddress] = useState<string | null>(null);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const authPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cargar avatar del usuario
  useEffect(() => {
    if (!isLoggedIn) { setAvatarUrl(null); return; }
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as any).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(prefs.avatarFileId));
      } catch {}
    })();
  }, [isLoggedIn, user?.id]);

  // Cargar dirección primaria desde localStorage
  useEffect(() => {
    if (!user?.id) { setPrimaryAddress(null); return; }
    try {
      const stored = localStorage.getItem(`addr_${user.id}`);
      if (stored) {
        const addresses = JSON.parse(stored);
        if (addresses.length > 0) {
          const primary = addresses[0];
          setPrimaryAddress(primary.commune || primary.fullAddress || null);
        }
      }
    } catch {}
  }, [user]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authPopupRef.current && !authPopupRef.current.contains(e.target as Node)) {
        setAuthPopupOpen(false);
      }
    };
    if (authPopupOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [authPopupOpen]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // En homepage el HomePage1 ya tiene su propio header (desktop)
  // En mobile mostramos este navbar en todas las páginas
  if (isHome && !isMobile) return null;

  const NAV_LINKS = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Ofertas', href: '/productos?sort=offers' },
    { label: 'Categorías', href: '/productos?view=categorias' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    router.push('/');
  };

  return (
    <>
      <style>{`
        .tpl1-nav { position: sticky; top: 0; z-index: 9999; transition: all 0.3s ease; }
        .tpl1-nav.scrolled { box-shadow: 0 2px 12px rgba(236,72,153,0.04); backdrop-filter: blur(12px); }
        .tpl1-nav-inner { max-width: 1600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 76px; }
        .tpl1-nav-logo { display: flex; align-items: center; text-decoration: none; gap: 10px; }
        .tpl1-nav-logo img { height: 48px; width: auto; object-fit: contain; transition: transform 0.3s ease; }
        .tpl1-nav-logo:hover img { transform: scale(1.05); }
        .tpl1-nav-links { display: flex; gap: 4px; align-items: center; }
        .tpl1-nav-links a { font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; font-weight: 600; color: #444; text-decoration: none; padding: 10px 20px; border-radius: 999px; transition: all 0.25s ease; position: relative; }
        .tpl1-nav-links a:hover { background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(249,168,212,0.12)); color: ${PINK_PRIMARY}; transform: translateY(-1px); }
        .tpl1-nav-links a.active { background: linear-gradient(135deg, rgba(236,72,153,0.12), rgba(249,168,212,0.18)); color: ${PINK_PRIMARY}; font-weight: 700; }
        .tpl1-nav-actions { display: flex; align-items: center; gap: 6px; }
        .tpl1-nav-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; color: #666; position: relative; }
        .tpl1-nav-btn:hover { background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(249,168,212,0.15)); color: ${PINK_PRIMARY}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(236,72,153,0.15); }
        .tpl1-nav-search-wrap { display: flex; align-items: center; overflow: hidden; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); max-width: 0; opacity: 0; }
        .tpl1-nav-search-wrap.open { max-width: 260px; opacity: 1; margin-right: 4px; }
        .tpl1-nav-search-wrap form { display: flex; align-items: center; background: linear-gradient(135deg, #fef2f8, #fdf2f8); border: 1.5px solid rgba(236,72,153,0.2); border-radius: 999px; padding: 0 16px; height: 40px; width: 240px; }
        .tpl1-nav-search-wrap input { border: none; background: transparent; outline: none; font-size: 14px; width: 100%; color: #333; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-nav-search-wrap input::placeholder { color: #c084a0; }
        .tpl1-nav-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 998; }
        .tpl1-nav-mobile-overlay.open { display: block; }
        .tpl1-nav-mobile-menu { display: none; position: fixed; top: 76px; right: 0; bottom: 0; width: 300px; background: #fff; z-index: 999; padding: 24px; flex-direction: column; gap: 4px; box-shadow: -8px 0 30px rgba(0,0,0,0.08); transform: translateX(100%); transition: transform 0.3s ease; }
        .tpl1-nav-mobile-menu.open { display: flex; transform: translateX(0); }
        .tpl1-nav-mobile-menu a { font-family: 'DM Sans', system-ui, sans-serif; font-size: 16px; font-weight: 600; color: #444; text-decoration: none; padding: 14px 18px; border-radius: 12px; transition: all 0.2s ease; display: flex; align-items: center; gap: 10px; }
        .tpl1-nav-mobile-menu a:hover { background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(249,168,212,0.12)); color: ${PINK_PRIMARY}; }
        .tpl1-nav-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }

        /* Badge para cart/notif */
        .tpl1-nav-badge { position: absolute; top: 2px; right: 2px; background: linear-gradient(135deg, ${PINK_PRIMARY}, #db2777); color: #fff; font-size: 9px; font-weight: 800; border-radius: 999px; min-width: 16px; height: 16px; padding: 0 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(236,72,153,0.4); }

        /* Dirección pill */
        .tpl1-nav-addr { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(135deg, #fef2f8, #fdf2f8); border: 1px solid rgba(236,72,153,0.15); border-radius: 999px; font-size: 12px; font-weight: 600; color: #555; text-decoration: none; max-width: 180px; transition: all 0.2s ease; }
        .tpl1-nav-addr:hover { background: linear-gradient(135deg, #fce7f3, #fbcfe8); border-color: rgba(236,72,153,0.3); transform: translateY(-1px); }
        .tpl1-nav-addr span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Avatar */
        .tpl1-nav-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${PINK_PRIMARY}, ${PINK_LIGHT}); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; overflow: hidden; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(236,72,153,0.3); }
        .tpl1-nav-avatar.lg { width: 48px; height: 48px; font-size: 18px; }
        .tpl1-nav-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Account button */
        .tpl1-nav-account { position: relative; }
        .tpl1-nav-account-btn { display: flex; align-items: center; gap: 8px; padding: 2px 14px 2px 2px; border: none; background: transparent; cursor: pointer; border-radius: 999px; transition: all 0.2s ease; }
        .tpl1-nav-account-btn:hover { background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(249,168,212,0.12)); }
        .tpl1-nav-account-name { font-size: 13px; font-weight: 600; color: #444; font-family: 'DM Sans', system-ui, sans-serif; }

        /* Dropdown */
        .tpl1-nav-dropdown { position: absolute; top: calc(100% + 12px); right: 0; min-width: 260px; background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(236,72,153,0.15), 0 4px 12px rgba(0,0,0,0.06); padding: 8px; z-index: 1001; border: 1px solid #fce7f3; animation: dropdownIn 0.2s ease; }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cartDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .tpl1-nav-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f3f4f6; margin-bottom: 6px; }
        .tpl1-nav-dropdown-name { margin: 0; font-size: 14px; font-weight: 700; color: #222; }
        .tpl1-nav-dropdown-email { margin: 2px 0 0; font-size: 12px; color: #888; }
        .tpl1-nav-dropdown a, .tpl1-nav-dropdown button { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; font-weight: 500; color: #444; text-decoration: none; border-radius: 10px; transition: all 0.15s ease; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-nav-dropdown a:hover, .tpl1-nav-dropdown button:hover { background: linear-gradient(135deg, rgba(236,72,153,0.06), rgba(249,168,212,0.1)); color: ${PINK_PRIMARY}; }
        .tpl1-nav-logout { color: #dc2626 !important; }
        .tpl1-nav-logout:hover { background: rgba(220,38,38,0.06) !important; color: #dc2626 !important; }

        /* Auth popup */
        .tpl1-auth-popup { position: absolute; top: calc(100% + 14px); right: 0; width: 320px; background: #fff; border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(236,72,153,0.08); border: 1px solid #fce7f3; padding: 20px; z-index: 1002; animation: dropdownIn 0.22s ease; }
        .tpl1-auth-popup-title { font-size: 16px; font-weight: 700; color: #111; font-family: 'DM Sans', system-ui, sans-serif; margin: 0 0 16px; padding-right: 32px; line-height: 1.3; }
        .tpl1-auth-popup-close { position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 50%; border: none; background: #f3f4f6; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #666; }
        .tpl1-auth-popup-close:hover { background: #fce7f3; color: ${PINK_PRIMARY}; }
        .tpl1-auth-primary-btn { display: block; width: 100%; padding: 13px; background: linear-gradient(135deg, ${PINK_PRIMARY}, #db2777); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 4px 16px rgba(236,72,153,0.3); transition: all 0.2s; margin-bottom: 14px; }
        .tpl1-auth-primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(236,72,153,0.4); }
        .tpl1-auth-divider { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; }
        .tpl1-auth-divider::before, .tpl1-auth-divider::after { content: ''; flex: 1; height: 1px; background: #f0f0f0; }
        .tpl1-auth-divider span { font-size: 12px; color: #aaa; }
        .tpl1-auth-email-wrap { display: flex; align-items: center; border: 1.5px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 12px; transition: border-color 0.2s; }
        .tpl1-auth-email-wrap:focus-within { border-color: ${PINK_PRIMARY}; }
        .tpl1-auth-email-wrap input { flex: 1; border: none; outline: none; padding: 12px 14px; font-size: 14px; color: #333; font-family: 'DM Sans', system-ui, sans-serif; background: transparent; }
        .tpl1-auth-email-wrap input::placeholder { color: #aaa; }
        .tpl1-auth-email-wrap button { width: 40px; height: 40px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #aaa; transition: color 0.2s; }
        .tpl1-auth-email-wrap button:hover { color: ${PINK_PRIMARY}; }
        .tpl1-auth-newsletter { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px; font-size: 12px; color: #555; font-family: 'DM Sans', system-ui, sans-serif; cursor: pointer; line-height: 1.4; }
        .tpl1-auth-newsletter input[type=checkbox] { margin-top: 2px; accent-color: ${PINK_PRIMARY}; flex-shrink: 0; }
        .tpl1-auth-popup-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tpl1-auth-popup-footer a { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-weight: 600; color: #444; text-decoration: none; font-family: 'DM Sans', system-ui, sans-serif; transition: all 0.2s; }
        .tpl1-auth-popup-footer a:hover { border-color: ${PINK_PRIMARY}; color: ${PINK_PRIMARY}; background: rgba(236,72,153,0.04); }
        /* Nav avatar circle on button */
        .tpl1-nav-user-avatar { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; margin-top: -8px; }
        .tpl1-nav-user-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Mobile user header */
        .tpl1-nav-mobile-user { display: flex; align-items: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #fef2f8, #fdf2f8); border-radius: 14px; margin-bottom: 8px; }

        @media (max-width: 1024px) {
          .tpl1-nav-addr { display: none; }
          .tpl1-nav-account-name { display: none; }
          .tpl1-auth-popup { right: -10px; }
        }
        @media (max-width: 768px) {
          .tpl1-nav-links { display: none; }
          .tpl1-nav-hamburger { display: flex !important; }
          .tpl1-nav-inner { padding: 0 12px; height: 60px; }
          .tpl1-nav-logo img { height: 38px; }
          .tpl1-nav-btn { width: 36px; height: 36px; }
          .tpl1-nav-btn svg { width: 18px; height: 18px; }
          .tpl1-nav-avatar { width: 26px; height: 26px; font-size: 11px; border-width: 1.5px; }
          .tpl1-nav-user-avatar { width: 26px; height: 26px; margin-top: 0; }
          .tpl1-nav-account-btn { gap: 4px; }
          .tpl1-nav-actions { gap: 2px; }

          /* Search overlay on mobile */
          .tpl1-nav-search-wrap { display: none !important; }
          .tpl1-nav-search-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(255,255,255,0.98); z-index: 10000; flex-direction: column; padding: 16px; }
          .tpl1-nav-search-mobile-overlay.open { display: flex; }
          .tpl1-nav-search-mobile-overlay form { display: flex; align-items: center; background: #fef2f8; border: 1.5px solid rgba(236,72,153,0.25); border-radius: 999px; padding: 0 16px; height: 48px; width: 100%; }
          .tpl1-nav-search-mobile-overlay input { border: none; background: transparent; outline: none; font-size: 16px; width: 100%; color: #333; font-family: 'DM Sans', system-ui, sans-serif; }
          .tpl1-nav-search-mobile-overlay input::placeholder { color: #c084a0; }
          .tpl1-nav-search-mobile-close { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; border: none; background: #f3f4f6; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; }

          /* Remove hover animations on mobile */
          *:hover { transform: none !important; box-shadow: inherit !important; }
          .tpl1-nav-logo:hover img { transform: none !important; }
          .tpl1-nav-links a:hover { background: transparent !important; color: #444 !important; transform: none !important; }
          .tpl1-nav-btn:hover { background: transparent !important; color: #666 !important; transform: none !important; box-shadow: none !important; }
          .tpl1-nav-mobile-menu a:hover { background: transparent !important; color: #444 !important; }
          .tpl1-auth-popup-close:hover { background: #f3f4f6 !important; color: #666 !important; }
          .tpl1-auth-primary-btn:hover { transform: none !important; box-shadow: 0 4px 16px rgba(236,72,153,0.3) !important; }
          .tpl1-nav-dropdown a:hover, .tpl1-nav-dropdown button:hover { background: transparent !important; color: #444 !important; transform: none !important; }
          .tpl1-auth-email-wrap button:hover { color: #aaa !important; }
          .tpl1-auth-popup-footer a:hover { border-color: #e5e7eb !important; color: #444 !important; transform: none !important; }
          .tpl1-nav-addr:hover { background: transparent !important; border-color: rgba(236,72,153,0.15) !important; transform: none !important; }
        }
      `}</style>

      <div className={`tpl1-nav-mobile-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* Mobile search overlay */}
      <div className={`tpl1-nav-search-mobile-overlay ${searchOpen ? 'open' : ''}`}>
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
        <form onSubmit={handleSearch} style={{ position: 'relative', marginTop: 8 }}>
          <Search size={18} color={PINK_PRIMARY} style={{ marginRight: 10, flexShrink: 0 }} />
          <input placeholder="Buscar productos..." autoFocus={searchOpen} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </form>
        <button className="tpl1-nav-search-mobile-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <X size={18} />
        </button>
        {searchQuery.trim() && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button onClick={handleSearch} style={{ padding: '12px 32px', background: `linear-gradient(135deg, ${PINK_PRIMARY}, #db2777)`, color: '#fff', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Buscar "{searchQuery.trim()}"
            </button>
          </div>
        )}
      </div>

      <nav className={`tpl1-nav ${scrolled ? 'scrolled' : ''}`} style={{ background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff', borderBottom: `1px solid ${scrolled ? '#fce7f3' : '#f5f5f5'}` }}>
        <div className="tpl1-nav-inner">
          <Link href="/" className="tpl1-nav-logo">
            <img src={LOGO_URL} alt="Yes Bella" />
          </Link>

          <div className="tpl1-nav-links">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="tpl1-nav-actions">
            <div className={`tpl1-nav-search-wrap ${searchOpen ? 'open' : ''}`}>
              <form onSubmit={handleSearch}>
                <Search size={16} color={PINK_PRIMARY} style={{ marginRight: 8, flexShrink: 0 }} />
                <input placeholder="Buscar productos..." autoFocus={searchOpen} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </form>
            </div>
            <button className="tpl1-nav-btn" onClick={() => setSearchOpen(!searchOpen)} title="Buscar">
              <Search size={20} />
            </button>

            {/* Dirección primaria */}
            <Link href="/cuenta/direcciones" className="tpl1-nav-addr" title="Mis direcciones">
              <MapPin size={14} color={PINK_PRIMARY} />
              <span>{primaryAddress || (isLoggedIn ? 'Agregar ubicación' : 'Ingresa ubicación')}</span>
            </Link>

            <Link href="/favoritos" title="Favoritos">
              <button className="tpl1-nav-btn"><Heart size={20} /></button>
            </Link>

            {/* Notificaciones (solo si logueado) */}
            {isLoggedIn && (
              <Link href="/cuenta/notificaciones" title="Notificaciones">
                <button className="tpl1-nav-btn">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="tpl1-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
              </Link>
            )}

            {/* Carrito con badge */}
            <button className="tpl1-nav-btn" onClick={() => setCartOpen(true)} title="Carrito">
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="tpl1-nav-badge">{totalItems > 9 ? '9+' : totalItems}</span>}
            </button>

            {/* Cuenta - logueado vs no logueado */}
            {isLoggedIn && user ? (
              <div className="tpl1-nav-account" ref={accountDropdownRef} style={{ position: 'relative' }}>
                <button className="tpl1-nav-account-btn" onClick={() => setAccountOpen(!accountOpen)} title="Mi cuenta">
                  {avatarUrl ? (
                    <div className="tpl1-nav-user-avatar"><img src={avatarUrl} alt="" /></div>
                  ) : (
                    <div className="tpl1-nav-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                  )}
                  <span className="tpl1-nav-account-name">{user.name?.split(' ')[0]}</span>
                </button>
                {accountOpen && (
                  <div className="tpl1-nav-dropdown">
                    <div className="tpl1-nav-dropdown-header">
                      <div className="tpl1-nav-avatar lg">
                        {avatarUrl ? <img src={avatarUrl} alt="" /> : (user.name?.charAt(0).toUpperCase() || 'U')}
                      </div>
                      <div>
                        <p className="tpl1-nav-dropdown-name">{user.name}</p>
                        <p className="tpl1-nav-dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/cuenta" onClick={() => setAccountOpen(false)}><User size={16} /> Mi cuenta</Link>
                    <Link href="/cuenta/pedidos" onClick={() => setAccountOpen(false)}><Receipt size={16} /> Mis pedidos</Link>
                    <Link href="/cuenta/direcciones" onClick={() => setAccountOpen(false)}><MapPin size={16} /> Direcciones</Link>
                    <Link href="/cuenta/notificaciones" onClick={() => setAccountOpen(false)}><Bell size={16} /> Notificaciones</Link>
                    <Link href="/favoritos" onClick={() => setAccountOpen(false)}><Heart size={16} /> Favoritos</Link>
                    <div className="tpl1-nav-divider" />
                    <button onClick={handleLogout} className="tpl1-nav-logout"><LogOut size={16} /> Cerrar sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <div ref={authPopupRef} style={{ position: 'relative' }}>
                <button className="tpl1-nav-btn" onClick={() => setAuthPopupOpen(!authPopupOpen)} title="Iniciar sesión">
                  <User size={20} />
                </button>
                {authPopupOpen && (
                  <div className="tpl1-auth-popup">
                    <p className="tpl1-auth-popup-title">Iniciar sesión o crear cuenta</p>
                    <button className="tpl1-auth-popup-close" onClick={() => setAuthPopupOpen(false)}><X size={14} /></button>
                    <Link href="/login" className="tpl1-auth-primary-btn" onClick={() => setAuthPopupOpen(false)}>Iniciar sesión</Link>
                    <div className="tpl1-auth-divider"><span>o</span></div>
                    <form onSubmit={e => { e.preventDefault(); if (authEmail.trim()) { router.push(`/login?email=${encodeURIComponent(authEmail)}`); setAuthPopupOpen(false); } }}>
                      <div className="tpl1-auth-email-wrap">
                        <input type="email" placeholder="Correo electrónico" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                        <button type="submit"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
                      </div>
                    </form>
                    <label className="tpl1-auth-newsletter">
                      <input type="checkbox" />
                      Enviarme novedades y ofertas por correo electrónico
                    </label>
                    <div className="tpl1-auth-popup-footer">
                      <Link href="/cuenta/pedidos" onClick={() => setAuthPopupOpen(false)}><Package size={15} /> Pedidos</Link>
                      <Link href="/login" onClick={() => setAuthPopupOpen(false)}><User size={15} /> Perfil</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="tpl1-nav-btn tpl1-nav-hamburger" style={{ display: 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <div className={`tpl1-nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
          {isLoggedIn && user && (
            <div className="tpl1-nav-mobile-user">
              <div className="tpl1-nav-avatar lg">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : (user.name?.charAt(0).toUpperCase() || 'U')}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{user.email}</p>
              </div>
            </div>
          )}
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="tpl1-nav-divider" />
          <Link href="/cuenta/direcciones" onClick={() => setMenuOpen(false)}><MapPin size={16} /> Direcciones</Link>
          <Link href="/favoritos" onClick={() => setMenuOpen(false)}><Heart size={16} /> Favoritos</Link>
          <Link href="/carrito" onClick={() => setMenuOpen(false)}><ShoppingCart size={16} /> Carrito {totalItems > 0 && `(${totalItems})`}</Link>
          {isLoggedIn ? (
            <>
              <Link href="/cuenta" onClick={() => setMenuOpen(false)}><User size={16} /> Mi cuenta</Link>
              <Link href="/cuenta/pedidos" onClick={() => setMenuOpen(false)}><Receipt size={16} /> Mis pedidos</Link>
              <button onClick={handleLogout} className="tpl1-nav-logout"><LogOut size={16} /> Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}><User size={16} /> Ingresar</Link>
              <Link href="/login?tab=register" onClick={() => setMenuOpen(false)}>Crear cuenta</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', width: 420, maxWidth: '92vw', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', animation: 'cartDrawerIn 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #fef2f8, #fff)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={20} color={PINK_PRIMARY} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#222', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Mi carrito</span>
                {totalItems > 0 && <span style={{ background: `linear-gradient(135deg, ${PINK_PRIMARY}, #db2777)`, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>{totalItems}</span>}
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Items list */}
            {items.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, color: '#aaa' }}>
                <ShoppingCart size={56} strokeWidth={1} color="#f9a8d4" />
                <p style={{ margin: 0, fontSize: 15, color: '#888', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Tu carrito está vacío</p>
                <Link href="/productos" onClick={() => setCartOpen(false)} style={{ color: PINK_PRIMARY, fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '9px 20px', border: `1.5px solid ${PINK_LIGHT}`, borderRadius: 999, transition: 'all .2s' }}>Ver productos →</Link>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {items.map(item => {
                  const now = Date.now();
                  const price = (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt)
                    ? item.timedOfferPrice
                    : (item.product.CURRENTPRICE && item.product.CURRENTPRICE > 0 ? item.product.CURRENTPRICE : item.product.PRICE);
                  return (
                    <div key={item.product.$id} style={{ display: 'flex', gap: 14, padding: '14px 24px', borderBottom: '1px solid #f9f9f9', alignItems: 'flex-start' }}>
                      <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: '#f9fafb', flexShrink: 0, border: '1px solid #f3f4f6' }}>
                        {item.product.IMAGEURL && <img src={item.product.IMAGEURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Sans, system-ui, sans-serif' }}>{item.product.NAME}</p>
                        <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: PINK_PRIMARY, fontFamily: 'DM Sans, system-ui, sans-serif' }}>{formatPrice(price)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid #fce7f3`, borderRadius: 8, overflow: 'hidden' }}>
                            <button onClick={() => updateQuantity(item.product.$id, item.quantity - 1)} style={{ width: 30, height: 30, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PINK_PRIMARY, transition: 'background .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f8')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <Minus size={12} />
                            </button>
                            <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#333', borderLeft: '1px solid #fce7f3', borderRight: '1px solid #fce7f3', lineHeight: '30px' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.$id, item.quantity + 1)} style={{ width: 30, height: 30, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PINK_PRIMARY, transition: 'background .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f8')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.product.$id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #fce7f3', background: 'linear-gradient(135deg, #fef2f8, #fff)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: '#666', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Subtotal</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#222', fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: -0.5 }}>{formatPrice(subtotal)}</span>
                </div>
                <Link href="/checkout" onClick={() => setCartOpen(false)} style={{ display: 'block', textAlign: 'center', background: `linear-gradient(135deg, ${PINK_PRIMARY}, #db2777)`, color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 20px rgba(236,72,153,0.3)', marginBottom: 10, fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'all .25s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(236,72,153,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(236,72,153,0.3)'; }}>
                  Ir al checkout →
                </Link>
                <Link href="/carrito" onClick={() => setCartOpen(false)} style={{ display: 'block', textAlign: 'center', color: PINK_PRIMARY, fontSize: 13, fontWeight: 600, padding: '8px', textDecoration: 'none', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Ver carrito completo
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
