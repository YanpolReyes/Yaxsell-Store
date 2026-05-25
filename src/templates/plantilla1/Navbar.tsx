'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, MapPin, Bell, Receipt, LogOut, Package, Minus, Plus, Trash2, Home, ArrowLeft, Grid3x3, Sparkles, Ship, Container, Store, LayoutGrid, Truck, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { getServices, getAppwriteConfig, MEDIA_BUCKET_ID, MEDIA_PREFIXES, formatPrice } from '@/lib/appwrite';
import { getSectionConfigAsync, getSectionConfig, type SectionConfig } from '@/lib/section-config';
import SearchOverlay from '@/components/SearchOverlay';
import NotificationsOverlay from '@/components/NotificationsOverlay';
import { usePrimaryAddress } from '@/hooks/usePrimaryAddress';
import { getWhatsAppUrl, openChatbot } from '@/lib/store-contact';
import NavAvatarWithBadge from '@/components/NavAvatarWithBadge';
// lottie-web loaded dynamically to avoid SSR issues

const ORANGE_PRIMARY = '#e396bf';
const PINK_LIGHT = '#f5a8cf';
const LOGO_URL = '';

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  const path = MEDIA_PREFIXES.thumbnails + fileId;
  return `${endpoint}/storage/buckets/${MEDIA_BUCKET_ID}/files/${path}/view?project=${projectId}`;
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
  const [loyaltyLevelId, setLoyaltyLevelId] = useState<string | null>(null);
  const { primaryAddress } = usePrimaryAddress();
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const authPopupRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [navLogoUrl, setNavLogoUrl] = useState<string>('');
  const [navStoreName, setNavStoreName] = useState<string>('');
  const lottieRef = useRef<HTMLDivElement>(null);
  const lottieAnimRef = useRef<any>(null);

  // Close FAB on route change
  useEffect(() => { setFabOpen(false); }, [pathname]);

  // Load Lottie animation for FAB button (dynamic import to avoid SSR)
  useEffect(() => {
    if (!mounted || !lottieRef.current) return;
    let anim: any = null;
    let destroyed = false;
    Promise.all([
      import('lottie-web'),
      fetch(`/button.json?t=${Date.now()}`).then(r => r.json())
    ]).then(([lottieModule, data]) => {
      if (destroyed || !lottieRef.current) return;
      anim = lottieModule.default.loadAnimation({
        container: lottieRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: data
      });
      // Define a visible segment (skip empty start, stop before fade-out)
      const segStart = 50;
      const segEnd = 180;
      lottieAnimRef.current = anim;
      // Set initial frame after render
      requestAnimationFrame(() => {
        if (!lottieRef.current) return;
        anim.setSegment(segStart, segEnd);
        anim.goToAndStop(segStart, true);
      });
      // Freeze at end of play (forward -> stay at end, reverse -> stay at start)
      anim.addEventListener('complete', () => {
        if (lottieAnimRef.current !== anim) return;
        if (fabOpen) {
          anim.goToAndStop(segEnd, true);
        } else {
          anim.goToAndStop(segStart, true);
        }
      });
    }).catch(() => {});
    return () => {
      destroyed = true;
      if (anim) { anim.destroy(); }
      lottieAnimRef.current = null;
    };
  }, [mounted]);

  // Play forward on FAB open (freeze at end), reverse on close (freeze at start)
  useEffect(() => {
    const anim = lottieAnimRef.current;
    if (!anim) return;
    if (fabOpen) {
      anim.setDirection(1);
      anim.setSegment(50, 180);
      anim.goToAndStop(50, true);
      anim.play();
    } else {
      anim.setDirection(-1);
      anim.setSegment(50, 180);
      anim.goToAndStop(180, true);
      anim.play();
    }
  }, [fabOpen]);

  // Cargar logo del theme config (usar logo de scroll si existe)
  useEffect(() => {
    getSectionConfigAsync().then(cfg => {
      const heroSec = cfg.find((s: SectionConfig) => s.id === 'tpl1_hero');
      if (heroSec?.settings) {
        const hs = heroSec.settings as Record<string, any>;
        if (hs.heroStoreLogoMode === 'image') {
          // Priorizar logo de scroll (navbar), luego logo principal
          setNavLogoUrl(hs.heroStoreLogoScrollUrl || hs.heroStoreLogoUrl || '');
        }
      }
    }).catch(() => {
      const cfg = getSectionConfig();
      const heroSec = cfg.find((s: SectionConfig) => s.id === 'tpl1_hero');
      if (heroSec?.settings) {
        const hs = heroSec.settings as Record<string, any>;
        if (hs.heroStoreLogoMode === 'image') {
          setNavLogoUrl(hs.heroStoreLogoScrollUrl || hs.heroStoreLogoUrl || '');
        }
      }
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cargar avatar y nivel VIP del usuario
  useEffect(() => {
    if (!isLoggedIn) { setAvatarUrl(null); setLoyaltyLevelId(null); return; }
    (async () => {
      try {
        const { account } = getServices();
        const acc = await account.get();
        const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};
        if (prefs.avatarFileId) setAvatarUrl(getFilePreviewUrl(String(prefs.avatarFileId)));
        else setAvatarUrl(null);
        setLoyaltyLevelId(prefs.loyaltyLevel ? String(prefs.loyaltyLevel) : 'bronze');
      } catch {
        setAvatarUrl(null);
        setLoyaltyLevelId(null);
      }
    })();
  }, [isLoggedIn, user?.id]);

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
    if (authPopupOpen && !isMobile) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [authPopupOpen, isMobile]);

  useEffect(() => {
    if (!authPopupOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [authPopupOpen, isMobile]);

  // En desktop (no mobile) solo mostrar fuera de homepage
  if (!isMobile && isHome) return null;

  const NAV_LINKS = [
    { label: 'Inicio', href: '/' },
    { label: 'Tienda', href: '/productos' },
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'En Camino', href: '/llegan-pronto', icon: () => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginRight: 4 }}><Container size={14} style={{ verticalAlign: 'middle' }} /><Ship size={14} style={{ verticalAlign: 'middle' }} /></span> },
    { label: 'Mis Pedidos', href: '/cuenta/pedidos' },
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

  const authPopupPanel = (
    <div className={`tpl1-auth-popup${isMobile ? ' tpl1-auth-popup--sheet' : ''}`}>
      <button type="button" className="tpl1-auth-popup-close" onClick={() => setAuthPopupOpen(false)} aria-label="Cerrar"><X size={14} /></button>
      <div className="tpl1-auth-popup-icon" aria-hidden><User size={22} strokeWidth={2.2} /></div>
      <p className="tpl1-auth-popup-title">Inicia sesión o crea tu cuenta</p>
      <p className="tpl1-auth-popup-sub">Para realizar pedidos necesitas iniciar sesión o registrarte.</p>
      <Link href="/login" className="tpl1-auth-primary-btn" onClick={() => setAuthPopupOpen(false)}>Iniciar sesión</Link>
      <Link href="/login?tab=register" className="tpl1-auth-secondary-btn" onClick={() => setAuthPopupOpen(false)}>Crear cuenta</Link>
    </div>
  );

  const authPopupMobileLayer = authPopupOpen && mounted && isMobile ? (
    <>
      <div className="tpl1-auth-overlay" onClick={() => setAuthPopupOpen(false)} aria-hidden />
      {authPopupPanel}
    </>
  ) : null;

  return (
    <>
      <style>{`
        .tpl1-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 999999 !important; transition: transform 0.35s ease, opacity 0.35s ease; }
        /* Homepage: Navbar oculto arriba, aparece con slide-down al scrollear */
        .tpl1-nav--home:not(.scrolled) { transform: translateY(-100%); opacity: 0; pointer-events: none; }
        .tpl1-nav--home.scrolled { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .tpl1-nav.scrolled { box-shadow: 0 2px 12px rgba(227,150,191,0.04); backdrop-filter: blur(12px); }
        .tpl1-nav-inner { max-width: 1600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 76px; }
        .tpl1-nav-logo { display: flex; align-items: center; text-decoration: none; gap: 10px; }
        .tpl1-nav-logo img { height: 48px; max-width: 160px; width: auto; object-fit: contain; transition: transform 0.3s ease, opacity 0.4s ease; flex-shrink: 0; }
        .tpl1-nav-logo-img { height: 42px !important; max-width: 140px !important; width: auto !important; object-fit: contain !important; }
        @keyframes tpl1LogoFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .tpl1-nav-logo:hover img { transform: scale(1.05); }
        .tpl1-nav-links { display: flex; gap: 4px; align-items: center; }
        .tpl1-nav-links a { font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; font-weight: 600; color: #444; text-decoration: none; padding: 10px 20px; border-radius: 999px; transition: all 0.25s ease; position: relative; }
        .tpl1-nav-links a:hover { background: linear-gradient(135deg, rgba(227,150,191,0.08), rgba(249,168,212,0.12)); color: ${ORANGE_PRIMARY}; transform: translateY(-1px); }
        .tpl1-nav-links a.active { background: linear-gradient(135deg, rgba(227,150,191,0.12), rgba(249,168,212,0.18)); color: ${ORANGE_PRIMARY}; font-weight: 700; }
        .tpl1-nav-actions { display: flex; align-items: center; gap: 6px; }
        .tpl1-nav-mobile-tools { display: flex; align-items: center; gap: 4px; }
        .tpl1-nav-btn { width: 44px; height: 44px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; color: #666; position: relative; }
        .tpl1-nav-btn:hover { background: linear-gradient(135deg, rgba(227,150,191,0.1), rgba(249,168,212,0.15)); color: ${ORANGE_PRIMARY}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(227,150,191,0.15); }
        .tpl1-nav-search-wrap { display: flex; align-items: center; overflow: hidden; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); max-width: 0; opacity: 0; }
        .tpl1-nav-search-wrap.open { max-width: 260px; opacity: 1; margin-right: 4px; }
        .tpl1-nav-search-wrap form { display: flex; align-items: center; background: linear-gradient(135deg, #fdf2f8, #fdf2f8); border: 1.5px solid rgba(227,150,191,0.2); border-radius: 999px; padding: 0 16px; height: 40px; width: 240px; }
        .tpl1-nav-search-wrap input { border: none; background: transparent; outline: none; font-size: 14px; width: 100%; color: #333; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-nav-search-wrap input::placeholder { color: #c084a0; }
        .tpl1-nav-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 998; }
        .tpl1-nav-mobile-overlay.open { display: block; }
        .tpl1-nav-mobile-menu { display: none; position: fixed; top: 76px; right: 0; bottom: 0; width: 300px; background: #fff; z-index: 999; padding: 24px; flex-direction: column; gap: 4px; box-shadow: -8px 0 30px rgba(0,0,0,0.08); transform: translateX(100%); transition: transform 0.3s ease; }
        .tpl1-nav-mobile-menu.open { display: flex; transform: translateX(0); }
        .tpl1-nav-mobile-menu a { font-family: 'DM Sans', system-ui, sans-serif; font-size: 16px; font-weight: 600; color: #444; text-decoration: none; padding: 14px 18px; border-radius: 12px; transition: all 0.2s ease; display: flex; align-items: center; gap: 10px; }
        .tpl1-nav-mobile-menu a:hover { background: linear-gradient(135deg, rgba(227,150,191,0.08), rgba(249,168,212,0.12)); color: ${ORANGE_PRIMARY}; }
        .tpl1-nav-divider { height: 1px; background: #f3f4f6; margin: 8px 0; }

        /* Badge para cart/notif */
        .tpl1-nav-badge { position: absolute; top: 2px; right: 2px; background: linear-gradient(135deg, #e396bf, #f5a8cf); color: #fff; font-size: 9px; font-weight: 800; border-radius: 999px; min-width: 16px; height: 16px; padding: 0 4px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(227,150,191,0.4); }
        .tpl1-nav-notif-link { display: flex; align-items: center; text-decoration: none; background: none; border: none; padding: 0; cursor: pointer; font: inherit; }
        .tpl1-bottom-nav-item { cursor: pointer; }

        /* Dirección pill */
        .tpl1-nav-addr { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(135deg, #fdf2f8, #fdf2f8); border: 1px solid rgba(227,150,191,0.15); border-radius: 999px; font-size: 12px; font-weight: 600; color: #555; text-decoration: none; max-width: 180px; transition: all 0.2s ease; }
        .tpl1-nav-addr:hover { background: linear-gradient(135deg, #fce7f3, #fbcfe8); border-color: rgba(227,150,191,0.3); transform: translateY(-1px); }
        .tpl1-nav-addr span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Avatar */
        .tpl1-nav-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, ${ORANGE_PRIMARY}, ${PINK_LIGHT}); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; overflow: hidden; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(227,150,191,0.3); }
        .tpl1-nav-avatar.lg { width: 40px; height: 40px; font-size: 16px; }
        .tpl1-nav-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Account button */
        .tpl1-nav-account { position: relative; }
        .tpl1-nav-account-btn { display: flex; align-items: center; gap: 8px; padding: 2px 14px 2px 2px; border: none; background: transparent; cursor: pointer; border-radius: 999px; transition: all 0.2s ease; }
        .tpl1-nav-account-btn:hover { background: linear-gradient(135deg, rgba(227,150,191,0.08), rgba(249,168,212,0.12)); }
        .tpl1-nav-account-name { font-size: 13px; font-weight: 600; color: #444; font-family: 'DM Sans', system-ui, sans-serif; }

        /* Dropdown */
        .tpl1-nav-dropdown { position: absolute; top: calc(100% + 12px); right: 0; min-width: 260px; background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(227,150,191,0.15), 0 4px 12px rgba(0,0,0,0.06); padding: 8px; z-index: 1001; border: 1px solid #fce7f3; animation: dropdownIn 0.2s ease; }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cartDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .tpl1-nav-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f3f4f6; margin-bottom: 6px; }
        .tpl1-nav-dropdown-name { margin: 0; font-size: 14px; font-weight: 700; color: #222; }
        .tpl1-nav-dropdown-email { margin: 2px 0 0; font-size: 12px; color: #888; }
        .tpl1-nav-dropdown a, .tpl1-nav-dropdown button { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; font-weight: 500; color: #444; text-decoration: none; border-radius: 10px; transition: all 0.15s ease; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-nav-dropdown a:hover, .tpl1-nav-dropdown button:hover { background: linear-gradient(135deg, rgba(227,150,191,0.06), rgba(249,168,212,0.1)); color: ${ORANGE_PRIMARY}; }
        .tpl1-nav-logout { color: #dc2626 !important; }
        .tpl1-nav-logout:hover { background: rgba(220,38,38,0.06) !important; color: #dc2626 !important; }

        /* Auth popup */
        .tpl1-auth-popup { position: absolute; top: calc(100% + 14px); right: 0; width: 300px; background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(227,150,191,0.1); border: 1px solid #fce7f3; padding: 28px 22px 22px; z-index: 1002; animation: dropdownIn 0.22s ease; text-align: center; }
        .tpl1-auth-popup-icon { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%; background: linear-gradient(135deg, #fdf2f8, #fce7f3); display: flex; align-items: center; justify-content: center; color: ${ORANGE_PRIMARY}; box-shadow: 0 4px 14px rgba(227,150,191,0.15); }
        .tpl1-auth-popup-title { font-size: 17px; font-weight: 800; color: #111; font-family: 'DM Sans', system-ui, sans-serif; margin: 0 0 8px; padding-right: 0; line-height: 1.25; letter-spacing: -0.02em; }
        .tpl1-auth-popup-sub { font-size: 13px; font-weight: 500; color: #6b7280; font-family: 'DM Sans', system-ui, sans-serif; margin: 0 0 18px; line-height: 1.45; }
        .tpl1-auth-popup-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%; border: none; background: #f9fafb; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #666; }
        .tpl1-auth-popup-close:hover { background: #fce7f3; color: ${ORANGE_PRIMARY}; }
        .tpl1-auth-primary-btn { display: block; width: 100%; padding: 14px; background: linear-gradient(135deg, ${ORANGE_PRIMARY}, #c0547a); color: #fff; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 4px 16px rgba(227,150,191,0.3); transition: all 0.2s; margin-bottom: 10px; }
        .tpl1-auth-primary-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(227,150,191,0.4); }
        .tpl1-auth-secondary-btn { display: block; width: 100%; padding: 13px; background: #fff; color: ${ORANGE_PRIMARY}; border: 2px solid #fce7f3; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; font-family: 'DM Sans', system-ui, sans-serif; transition: all 0.2s; }
        .tpl1-auth-secondary-btn:hover { border-color: ${ORANGE_PRIMARY}; background: rgba(227,150,191,0.04); }
        /* Nav avatar circle on button */
        .tpl1-nav-user-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; margin-top: 0; }
        .tpl1-nav-user-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Mobile user header */
        .tpl1-nav-mobile-user { display: flex; align-items: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #fdf2f8, #fdf2f8); border-radius: 14px; margin-bottom: 8px; }

        /* Bottom mobile nav */
        @keyframes tpl1-nav-pop { 0% { transform: scale(0.92); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes tpl1-fab-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(135deg); } }
        @keyframes tpl1-fab-spin-back { 0% { transform: rotate(135deg); } 100% { transform: rotate(0deg); } }
        @keyframes tpl1-bbl-left   { 0% { opacity:0; transform: scale(0) translateY(30px); } 65% { opacity:1; transform: scale(1.1) translateY(-3px); } 100% { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes tpl1-bbl-top    { 0% { opacity:0; transform: translateY(30px) scale(0); } 65% { opacity:1; transform: translateY(-3px) scale(1.1); } 100% { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes tpl1-bbl-right  { 0% { opacity:0; transform: scale(0) translateY(30px); } 65% { opacity:1; transform: scale(1.1) translateY(-3px); } 100% { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes tpl1-bbl-left-out   { 0% { opacity:1; transform: scale(1) translateY(0); } 35% { opacity:1; transform: scale(1.1) translateY(-3px); } 100% { opacity:0; transform: scale(0) translateY(30px); } }
        @keyframes tpl1-bbl-top-out    { 0% { opacity:1; transform: translateY(0) scale(1); } 35% { opacity:1; transform: translateY(-3px) scale(1.1); } 100% { opacity:0; transform: translateY(30px) scale(0); } }
        @keyframes tpl1-bbl-right-out  { 0% { opacity:1; transform: scale(1) translateY(0); } 35% { opacity:1; transform: scale(1.1) translateY(-3px); } 100% { opacity:0; transform: scale(0) translateY(30px); } }
        .tpl1-bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 9998;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 8px));
          box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
        }
        .tpl1-bottom-nav-inner { display: flex; justify-content: space-around; align-items: center; max-width: 520px; margin: 0 auto; gap: 2px; }
        .tpl1-bottom-nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          text-decoration: none; padding: 5px 8px 3px; border-radius: 14px;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease;
          position: relative; background: transparent; border: none; cursor: pointer; min-width: 48px;
        }
        .tpl1-bottom-nav-item:active { transform: scale(0.88); }
        .tpl1-bottom-nav-item svg {
          width: 20px; height: 20px; color: #9ca3af;
          transition: color 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        .tpl1-bottom-nav-item span {
          font-size: 9px; font-weight: 700; color: #9ca3af; font-family: 'DM Sans', system-ui, sans-serif;
          transition: color 0.3s ease, transform 0.3s ease, font-weight 0.15s ease; letter-spacing: -0.01em;
        }
        .tpl1-bottom-nav-item.active {
          background: transparent;
        }
        .tpl1-bottom-nav-item.active svg {
          color: ${ORANGE_PRIMARY};
          animation: tpl1-nav-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }
        .tpl1-bottom-nav-item.active span {
          color: ${ORANGE_PRIMARY}; font-weight: 800;
          animation: tpl1-nav-label-pop 0.35s ease;
        }
        .tpl1-bottom-nav-item.active::after {
          display: none;
        }
        @keyframes tpl1-nav-bounce {
          0% { transform: scale(0.5) translateY(6px); opacity: 0; }
          50% { transform: scale(1.2) translateY(-4px); opacity: 1; }
          70% { transform: scale(0.9) translateY(1px); }
          100% { transform: scale(1) translateY(-2px); }
        }
        @keyframes tpl1-nav-label-pop {
          0% { transform: scale(0.8); opacity: 0.5; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes tpl1-nav-dot-in {
          0% { width: 0; opacity: 0; }
          100% { width: 16px; opacity: 1; }
        }
        .tpl1-bottom-nav-item .tpl1-bottom-badge {
          position: absolute; top: 2px; right: 4px;
          background: linear-gradient(135deg, ${ORANGE_PRIMARY}, #c0547a);
          color: #fff; font-size: 8px; font-weight: 800; border-radius: 999px;
          min-width: 16px; height: 16px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center; border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(227,150,191,0.4);
        }

        /* FAB central */
        .tpl1-fab-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
        .tpl1-fab-btn {
          width: 76px; height: 76px; border-radius: 50%; border: none; cursor: pointer;
          background: transparent; color: #fff; display: flex; align-items: center; justify-content: center;
          box-shadow: none;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          margin-top: -24px; position: relative; z-index: 2; overflow: visible;
        }
        .tpl1-fab-btn svg { background: transparent !important; }
        .tpl1-fab-btn svg > g > path:first-child { fill: transparent !important; }
        .tpl1-fab-btn:hover { box-shadow: none; }
        .tpl1-fab-btn:active { transform: scale(0.95); }
        .tpl1-fab-label { font-size: 10px; font-weight: 700; color: #9ca3af; margin-top: -2px; font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: -0.02em; transition: color 0.3s ease, font-weight 0.15s ease; }
        .tpl1-fab-wrap.active .tpl1-fab-label { color: #e396bf; font-weight: 800; }

        /* Bubble items — arc layout, label above circle */
        .tpl1-fab-bubbles {
          position: fixed;
          bottom: 80px;
          left: 0;
          right: 0;
          margin: 0 auto;
          width: 320px; height: 160px;
          pointer-events: none; z-index: 10;
        }
        .tpl1-fab-bubble {
          position: absolute;
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; white-space: nowrap;
          opacity: 0; pointer-events: none; cursor: pointer;
          transform: scale(0.7) translateY(40px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .tpl1-fab-bubbles.open .tpl1-fab-bubble { pointer-events: auto; opacity: 1; transform: none; }
        /* Tienda — left, lower */
        .tpl1-fab-bubble:nth-child(1) { left: 60px; bottom: 0; transition-delay: 0.05s; }
        .tpl1-fab-bubble:nth-child(1) .tpl1-bubble-label { padding: 4px 24px 4px 14px; }
        /* Catálogo — top center, highest */
        .tpl1-fab-bubble:nth-child(2) { left: 0; right: 0; margin: 0 auto; top: -20px; width: fit-content; transition-delay: 0.1s; }
        /* En Camino — right, lower */
        .tpl1-fab-bubble:nth-child(3) { right: 60px; bottom: 0; transition-delay: 0.15s; }
        .tpl1-fab-bubble:nth-child(3) .tpl1-bubble-label { padding: 4px 14px 4px 24px; }
        .tpl1-bubble-circle {
          width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: #fff; border: 1.5px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          flex-shrink: 0;
        }
        .tpl1-bubble-circle svg { width: 26px; height: 26px; color: #f72585; }
        .tpl1-en-camino-icon { width: 26px; height: 26px; }
        .tpl1-catalog-icon { width: 26px; height: 26px; }
        .tpl1-shop-icon { width: 26px; height: 26px; }
        .tpl1-bubble-label {
          font-size: 11px; font-weight: 800; color: #1a1a2e; font-family: 'DM Sans', system-ui, sans-serif;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(6px); padding: 4px 24px 4px 15px; border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06);
          min-width: 80px; text-align: left;
        }

        /* FAB overlay */
        .tpl1-fab-overlay {
          position: fixed; inset: 0; z-index: 9997;
          background: rgba(0,0,0,0); transition: background 0.3s ease;
        }
        .tpl1-fab-overlay.open { background: rgba(255,255,255,0.5); }
        /* Mobile search overlay */
        .tpl1-search-overlay { display: none; position: fixed; inset: 0; z-index: 99999; background: rgba(255,255,255,0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); flex-direction: column; padding: 0; animation: tpl1SearchSlideIn 0.25s ease-out; }
        .tpl1-search-overlay.open { display: flex; }
        .tpl1-search-overlay-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #fce7f3; }
        .tpl1-search-overlay-back { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; flex-shrink: 0; }
        .tpl1-search-overlay-form { flex: 1; display: flex; align-items: center; background: linear-gradient(135deg, #fdf2f8, #fdf2f8); border: 1.5px solid rgba(227,150,191,0.25); border-radius: 999px; padding: 0 14px; height: 40px; }
        .tpl1-search-overlay-form input { border: none; background: transparent; outline: none; font-size: 15px; width: 100%; color: #333; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-search-overlay-form input::placeholder { color: #f5a8cf; }
        .tpl1-search-overlay-suggestions { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
        .tpl1-search-overlay-suggestions p { font-size: 12px; font-weight: 600; color: #999; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .tpl1-search-overlay-tag { display: inline-block; padding: 8px 16px; background: #fdf2f8; border: 1px solid rgba(227,150,191,0.15); border-radius: 999px; font-size: 13px; color: #e396bf; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', system-ui, sans-serif; }
        .tpl1-search-overlay-tag:hover { background: rgba(227,150,191,0.1); }
        .tpl1-search-overlay-results { padding: 0 16px; flex: 1; overflow-y: auto; }
        .tpl1-search-overlay-result { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; text-decoration: none; color: #333; }
        .tpl1-search-overlay-result img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; background: #f9f9f9; }
        .tpl1-search-overlay-result-info { flex: 1; }
        .tpl1-search-overlay-result-name { font-size: 14px; font-weight: 500; color: #333; }
        .tpl1-search-overlay-result-price { font-size: 13px; color: #e396bf; font-weight: 600; }
        .tpl1-search-overlay-empty { text-align: center; padding: 40px 16px; color: #999; font-size: 14px; }
        @keyframes tpl1SearchSlideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        /* Mobile fabs (WhatsApp + ChatBot) in navbar */
        .tpl1-nav-mobile-fabs { display: none; align-items: center; gap: 6px; flex-shrink: 0; flex-grow: 0; }
        .tpl1-nav-mobile-fab { width: 20px !important; height: 20px !important; max-width: 20px !important; max-height: 20px !important; min-width: 20px !important; min-height: 20px !important; aspect-ratio: 1 !important; border-radius: 50% !important; border: none !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: transform 0.2s !important; overflow: hidden !important; flex-shrink: 0 !important; flex-grow: 0 !important; padding: 0 !important; line-height: 0 !important; font-size: 0 !important; text-decoration: none !important; align-self: center !important; box-sizing: border-box !important; }
        .tpl1-nav-mobile-fab:hover { transform: scale(1.05); }
        .tpl1-nav-mobile-fab svg { width: 12px !important; height: 12px !important; min-width: 12px !important; min-height: 12px !important; max-width: 12px !important; max-height: 12px !important; flex-shrink: 0 !important; display: block !important; }
        .tpl1-nav-mobile-fab--wa { background: #25D366 !important; }
        .tpl1-nav-mobile-fab--cb { background: linear-gradient(135deg, #3483fa, #6366f1) !important; }
        @media (max-width: 768px) {
          .tpl1-bottom-nav { display: block; }
          body { overflow-x: hidden; }
        }

        @keyframes tpl1AuthSheetIn { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .tpl1-nav-addr { display: none; }
          .tpl1-nav-account-name { display: none; }
        }
        @media (max-width: 768px) {
          .tpl1-auth-overlay { position: fixed; inset: 0; z-index: 10049; background: rgba(0,0,0,0.28); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: dropdownIn 0.2s ease; }
          .tpl1-nav-auth-wrap { position: relative !important; }
          .tpl1-auth-popup {
            position: fixed !important;
            top: 60px !important;
            right: 12px !important;
            left: 12px !important;
            width: auto !important;
            border-radius: 16px !important;
            z-index: 10050 !important;
            animation: dropdownIn 0.2s ease !important;
          }
          .tpl1-nav-dropdown {
            position: absolute !important;
            top: calc(100% + 10px) !important;
            right: -10px !important;
            width: 240px !important;
            border-radius: 16px !important;
            z-index: 10050 !important;
            animation: dropdownIn 0.2s ease !important;
          }
          .tpl1-nav { min-height: 48px !important; height: auto !important; background: rgba(255,255,255,0.98) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border-bottom: none !important; border-radius: 999px !important; box-shadow: 0 1px 8px rgba(0,0,0,0.06) !important; margin: 10px 80px 0 !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; z-index: 9999 !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
          .tpl1-nav.scrolled { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; margin: 0 !important; border-radius: 0 !important; min-height: 48px !important; box-shadow: 0 2px 16px rgba(0,0,0,0.08) !important; }
          .tpl1-nav.scrolled .tpl1-nav-inner { height: 48px !important; min-height: 48px !important; padding: 0 12px !important; }
          .tpl1-nav.scrolled .tpl1-nav-btn { width: 34px !important; height: 34px !important; }
          .tpl1-nav.scrolled .tpl1-nav-btn svg { width: 17px !important; height: 17px !important; }
          .tpl1-nav.scrolled .tpl1-nav-avatar { width: 24px !important; height: 24px !important; font-size: 10px !important; }
          .tpl1-nav.scrolled .tpl1-nav-user-avatar { width: 24px !important; height: 24px !important; }
          .tpl1-nav.scrolled .tpl1-nav-mobile-fab { width: 24px !important; height: 24px !important; }
          .tpl1-nav.scrolled .tpl1-nav-mobile-fab svg { width: 14px !important; height: 14px !important; }
          .tpl1-nav-links { display: none !important; }
          .tpl1-nav-logo { display: none !important; }
          .tpl1-nav-mobile-fabs { display: flex !important; }
          .tpl1-nav-hamburger { display: none !important; }
          .tpl1-nav-inner { padding: 0 10px !important; height: 48px !important; min-height: 48px !important; gap: 0 !important; justify-content: space-between !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; position: relative !important; }
          .tpl1-nav-mobile-center { position: absolute !important; left: 50% !important; top: 50% !important; transform: translate(-50%, -50%) !important; display: flex !important; align-items: center !important; gap: 4px !important; font-size: 10px !important; color: #be185d !important; white-space: nowrap !important; max-width: 140px !important; overflow: hidden !important; text-overflow: ellipsis !important; background: linear-gradient(135deg, #fdf2f8, #fdf2f8) !important; border: 1px solid rgba(227,150,191,0.25) !important; border-radius: 999px !important; padding: 4px 10px !important; font-weight: 500 !important; font-family: 'DM Sans', system-ui, sans-serif !important; pointer-events: none !important; animation: tpl1AddrIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both !important; z-index: 10 !important; }
          @keyframes tpl1AddrIn { from { opacity: 0; transform: translate(-50%, calc(-50% - 6px)); } to { opacity: 1; transform: translate(-50%, -50%); } }
          .tpl1-nav-mobile-center svg { flex-shrink: 0 !important; }
          .tpl1-nav-logo img { height: 22px !important; max-width: 58px !important; }
          .tpl1-nav-btn { width: 32px !important; height: 32px !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
          .tpl1-nav-btn svg { width: 16px !important; height: 16px !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
          .tpl1-nav-avatar { width: 24px !important; height: 24px !important; font-size: 9px !important; border-width: 1px !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
          .tpl1-nav-user-avatar { width: 24px !important; height: 24px !important; margin-top: 0 !important; transition: all 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
          .tpl1-nav-account-btn { gap: 2px !important; }
          .tpl1-nav-actions { gap: 1px !important; }

          /* Herramientas móvil: lupa + notificaciones juntas a la derecha */
          .tpl1-nav-mobile-tools {
            display: flex !important;
            align-items: center !important;
            gap: 2px !important;
            margin-left: auto !important;
          }
          .tpl1-nav-notif-link {
            display: flex !important;
          }

          /* Hide favorites and cart on mobile (están en bottom nav) */
          .tpl1-nav-actions a[href="/favoritos"],
          .tpl1-nav-actions button[title="Carrito"] {
            display: none !important;
          }

          /* Search on mobile - use overlay instead of inline */
          .tpl1-nav-search-wrap { display: none !important; }

          /* Remove hover animations on mobile */
          *:hover { transform: none !important; box-shadow: inherit !important; }
          .tpl1-nav-mobile-center,
          .tpl1-nav-mobile-center:hover { transform: translate(-50%, -50%) !important; }
          .tpl1-nav-logo:hover img { transform: none !important; }
          .tpl1-nav-links a:hover { background: transparent !important; color: #444 !important; transform: none !important; }
          .tpl1-nav-btn:hover { background: transparent !important; color: #666 !important; transform: none !important; box-shadow: none !important; }
          .tpl1-nav-mobile-menu a:hover { background: transparent !important; color: #444 !important; }
          .tpl1-auth-popup-close:hover { background: #f3f4f6 !important; color: #666 !important; }
          .tpl1-auth-primary-btn:hover { transform: none !important; box-shadow: 0 4px 16px rgba(227,150,191,0.3) !important; }
          .tpl1-nav-dropdown a:hover, .tpl1-nav-dropdown button:hover { background: transparent !important; color: #444 !important; transform: none !important; }
          .tpl1-auth-secondary-btn:hover { border-color: #fce7f3 !important; background: #fff !important; transform: none !important; }
          .tpl1-nav-addr:hover { background: transparent !important; border-color: rgba(227,150,191,0.15) !important; transform: none !important; }
        }
      `}</style>

      <div className={`tpl1-nav-mobile-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* Top navbar: on mobile only show on homepage */}
      {!(isMobile && !isHome) && (
      <nav className={`tpl1-nav ${scrolled ? 'scrolled' : ''} ${isHome ? 'tpl1-nav--home' : ''}`} style={{ background: isHome ? 'rgba(255,255,255,0.95)' : (scrolled ? 'rgba(255,255,255,0.95)' : '#fff'), borderBottom: `1px solid ${scrolled ? '#fce7f3' : '#f5f5f5'}` }}>
        <div className="tpl1-nav-inner">
          {/* Mobile center: address â€” solo visible con navbar expandida (scroll) */}
          {isMobile && scrolled && (
            <div className="tpl1-nav-mobile-center" aria-live="polite">
              <MapPin size={10} color={ORANGE_PRIMARY} />
              <span>{primaryAddress || (isLoggedIn ? 'Mi ubicación' : 'Ubicación')}</span>
            </div>
          )}
          <Link href="/" className="tpl1-nav-logo">
            {navLogoUrl ? <img src={navLogoUrl} alt="Inicio" style={{ opacity: 0, transition: 'opacity 0.4s ease', animation: 'tpl1LogoFadeIn 0.4s ease forwards' }} className="tpl1-nav-logo-img" /> : null}
          </Link>

          {/* Mobile fabs - WhatsApp + ChatBot (replaces logo on mobile) */}
          <div className="tpl1-nav-mobile-fabs">
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="tpl1-nav-mobile-fab tpl1-nav-mobile-fab--wa" title="WhatsApp">
              <svg viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <button type="button" className="tpl1-nav-mobile-fab tpl1-nav-mobile-fab--cb" title="ChatBot" onClick={() => openChatbot()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>
            </button>
          </div>

          <div className="tpl1-nav-links">
            {NAV_LINKS.map(link => {
              const IconComp = (link as any).icon;
              return (
                <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''}>
                  {IconComp && <IconComp />}{link.label}
                </Link>
              );
            })}
          </div>

          <div className="tpl1-nav-actions">
            <div className={`tpl1-nav-search-wrap ${searchOpen ? 'open' : ''}`}>
              <form onSubmit={handleSearch}>
                <Search size={16} color={ORANGE_PRIMARY} style={{ marginRight: 8, flexShrink: 0 }} />
                <input placeholder="Buscar productos..." autoFocus={searchOpen} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </form>
            </div>
            <div className="tpl1-nav-mobile-tools">
              <button className="tpl1-nav-btn" onClick={() => setSearchOpen(!searchOpen)} title="Buscar"><Search size={20} /></button>
              {isLoggedIn && (
                <button
                  type="button"
                  className="tpl1-nav-btn tpl1-nav-notif-link"
                  title="Notificaciones"
                  onClick={() => setNotifOpen(true)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="tpl1-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              )}
            </div>

            {/* Dirección primaria */}
            <Link href="/cuenta/direcciones" className="tpl1-nav-addr" title="Mis direcciones">
              <MapPin size={14} color={ORANGE_PRIMARY} />
              <span>{primaryAddress || (isLoggedIn ? 'Agregar ubicación' : 'Ingresa ubicación')}</span>
            </Link>

            <Link href="/favoritos" title="Favoritos">
              <button className="tpl1-nav-btn"><Heart size={20} /></button>
            </Link>

            {/* Carrito con badge */}
            <button className="tpl1-nav-btn" onClick={() => setCartOpen(true)} title="Carrito">
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="tpl1-nav-badge">{totalItems > 9 ? '9+' : totalItems}</span>}
            </button>

            {/* Cuenta - logueado vs no logueado */}
            {isLoggedIn && user ? (
              <div className="tpl1-nav-account" ref={accountDropdownRef} style={{ position: 'relative' }}>
                <button className="tpl1-nav-account-btn" onClick={() => setAccountOpen(!accountOpen)} title="Mi cuenta">
                  <NavAvatarWithBadge
                    avatarUrl={avatarUrl}
                    userName={user.name}
                    size={36}
                    loyaltyLevelId={loyaltyLevelId}
                  />
                  <span className="tpl1-nav-account-name">{user.name?.split(' ')[0]}</span>
                </button>
                {accountOpen && (
                  <div className="tpl1-nav-dropdown">
                    <div className="tpl1-nav-dropdown-header">
                      <NavAvatarWithBadge
                        avatarUrl={avatarUrl}
                        userName={user.name}
                        size={40}
                        loyaltyLevelId={loyaltyLevelId}
                      />
                      <div>
                        <p className="tpl1-nav-dropdown-name">{user.name}</p>
                        <p className="tpl1-nav-dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/cuenta" onClick={() => setAccountOpen(false)}><User size={16} /> Mi cuenta</Link>
                    <Link href="/cuenta/pedidos" onClick={() => setAccountOpen(false)}><Receipt size={16} /> Mis pedidos</Link>
                    <Link href="/cuenta/direcciones" onClick={() => setAccountOpen(false)}><MapPin size={16} /> Direcciones</Link>
                    <Link href="/favoritos" onClick={() => setAccountOpen(false)}><Heart size={16} /> Favoritos</Link>
                    <div className="tpl1-nav-divider" />
                    <button onClick={handleLogout} className="tpl1-nav-logout"><LogOut size={16} /> Cerrar sesión</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="tpl1-nav-auth-wrap" ref={authPopupRef} style={{ position: 'relative' }}>
                <button className="tpl1-nav-btn" onClick={() => setAuthPopupOpen(!authPopupOpen)} title="Iniciar sesión">
                  <User size={20} />
                </button>
                {authPopupOpen && !isMobile && authPopupPanel}
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
              <NavAvatarWithBadge
                avatarUrl={avatarUrl}
                userName={user.name}
                size={44}
                loyaltyLevelId={loyaltyLevelId}
              />
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
      )}

      {/* â”€â”€ Cart Drawer â”€â”€ */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
          <div style={{ position: 'relative', width: 420, maxWidth: '92vw', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', animation: 'cartDrawerIn 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #fdf2f8, #fff)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={20} color={ORANGE_PRIMARY} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#222', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Mi carrito</span>
                {totalItems > 0 && <span style={{ background: `linear-gradient(135deg, ${ORANGE_PRIMARY}, #c0547a)`, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>{totalItems}</span>}
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Items list */}
            {items.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, color: '#aaa' }}>
                <ShoppingCart size={56} strokeWidth={1} color="#f5a8cf" />
                <p style={{ margin: 0, fontSize: 15, color: '#888', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Tu carrito está vacío</p>
                <Link href="/productos" onClick={() => setCartOpen(false)} style={{ color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '9px 20px', background: 'linear-gradient(135deg, #e396bf, #f5a8cf)', borderRadius: 999, transition: 'all .2s', boxShadow: '0 4px 12px rgba(227,150,191,0.35)' }}>Ver productos →</Link>
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
                        <p style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: ORANGE_PRIMARY, fontFamily: 'DM Sans, system-ui, sans-serif' }}>{formatPrice(price)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid #fce7f3`, borderRadius: 8, overflow: 'hidden' }}>
                            <button onClick={() => updateQuantity(item.product.$id, item.quantity - 1)} style={{ width: 30, height: 30, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE_PRIMARY, transition: 'background .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fdf2f8')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <Minus size={12} />
                            </button>
                            <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#333', borderLeft: '1px solid #fce7f3', borderRight: '1px solid #fce7f3', lineHeight: '30px' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.$id, item.quantity + 1)} style={{ width: 30, height: 30, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE_PRIMARY, transition: 'background .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fdf2f8')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
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
              <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #fce7f3', background: 'linear-gradient(135deg, #fdf2f8, #fff)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: '#666', fontFamily: 'DM Sans, system-ui, sans-serif' }}>Subtotal</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#222', fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: -0.5 }}>{formatPrice(subtotal)}</span>
                </div>
                <Link href="/checkout" onClick={() => setCartOpen(false)} style={{ display: 'block', textAlign: 'center', background: `linear-gradient(135deg, ${ORANGE_PRIMARY}, #c0547a)`, color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 20px rgba(227,150,191,0.3)', marginBottom: 10, fontFamily: 'DM Sans, system-ui, sans-serif', transition: 'all .25s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(227,150,191,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(227,150,191,0.3)'; }}>
                  Ir al checkout →
                </Link>
                <Link href="/carrito" onClick={() => setCartOpen(false)} style={{ display: 'block', textAlign: 'center', color: ORANGE_PRIMARY, fontSize: 13, fontWeight: 600, padding: '8px', textDecoration: 'none', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Ver carrito completo
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB overlay */}
      {fabOpen && <div className="tpl1-fab-overlay open" onClick={() => setFabOpen(false)} />}

      {/* Bottom mobile nav — hidden on /inventario */}
      <nav className={`tpl1-bottom-nav${pathname?.startsWith('/inventario') ? ' !hidden' : ''}`}>
        <div className="tpl1-bottom-nav-inner">
          <Link href="/" className={`tpl1-bottom-nav-item ${!fabOpen && pathname === '/' ? 'active' : ''}`}>
            <Home />
            <span>Inicio</span>
          </Link>
          <Link href="/favoritos" className={`tpl1-bottom-nav-item ${!fabOpen && (pathname === '/favoritos' || pathname?.startsWith('/cuenta/favoritos')) ? 'active' : ''}`}>
            <Heart />
            <span>Favoritos</span>
          </Link>

          {/* FAB central — Tienda / Catálogo / En Camino */}
          <div className={`tpl1-fab-bubbles${fabOpen ? ' open' : ''}`}>
            <div className="tpl1-fab-bubble" onClick={() => { setFabOpen(false); router.push('/productos'); }}>
              <span className="tpl1-bubble-label">Tienda</span>
              <div className="tpl1-bubble-circle">
                <svg viewBox="0 0 256 253" className="tpl1-shop-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M146.142,143.991c0-4.774,3.903-8.677,8.677-8.677s8.677,3.903,8.677,8.677s-3.827,8.677-8.677,8.677 C150.007,152.668,146.142,148.766,146.142,143.991z M177,122v86l-98-0.038V122H177z M171,128H85v62.671l25.991-49.599l17.718,36.375 l18.604-11.632L171,188.36V128z M2,69c0,13.678,9.625,25.302,22,29.576V233H2v18h252v-18h-22V98.554 c12.89-3.945,21.699-15.396,22-29.554v-8H2V69z M65.29,68.346c0,6.477,6.755,31.47,31.727,31.47 c21.689,0,31.202-19.615,31.202-31.47c0,11.052,7.41,31.447,31.464,31.447c21.733,0,31.363-20.999,31.363-31.447 c0,14.425,9.726,26.416,22.954,30.154V233H42V98.594C55.402,94.966,65.29,82.895,65.29,68.346z M222.832,22H223V2H34v20L2,54h252 L222.832,22z" fill="#e396bf"/>
                </svg>
              </div>
            </div>
            <div className="tpl1-fab-bubble" onClick={() => { setFabOpen(false); router.push('/catalogo'); }}>
              <span className="tpl1-bubble-label">Catálogo</span>
              <div className="tpl1-bubble-circle">
                <svg viewBox="0 0 208 256" className="tpl1-catalog-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M105.52,76.24c-15.29,0-27.64,12.37-27.64,27.58c0,15.26,12.4,27.59,27.64,27.59c15.25,0,27.65-12.33,27.65-27.59 S120.77,76.24,105.52,76.24z M105.52,123.36c-10.76,0-19.52-8.75-19.52-19.49c0-10.73,8.76-19.48,19.52-19.48 c10.77,0,19.53,8.7,19.53,19.48C125.05,114.61,116.29,123.36,105.52,123.36z M154.6,72.71h-12.51c-1.94,0-3.54,1.54-3.54,3.53v5.32 c0,1.93,1.55,3.52,3.54,3.52h12.51c1.94,0,3.53-1.54,3.53-3.52v-5.32C158.13,74.3,156.59,72.71,154.6,72.71z M154.6,72.71h-12.51 c-1.94,0-3.54,1.54-3.54,3.53v5.32c0,1.93,1.55,3.52,3.54,3.52h12.51c1.94,0,3.53-1.54,3.53-3.52v-5.32 C158.13,74.3,156.59,72.71,154.6,72.71z M105.52,76.24c-15.29,0-27.64,12.37-27.64,27.58c0,15.26,12.4,27.59,27.64,27.59 c15.25,0,27.65-12.33,27.65-27.59S120.77,76.24,105.52,76.24z M105.52,123.36c-10.76,0-19.52-8.75-19.52-19.49 c0-10.73,8.76-19.48,19.52-19.48c10.77,0,19.53,8.7,19.53,19.48C125.05,114.61,116.29,123.36,105.52,123.36z M205.82,196.86V2H35.8 C17.53,2,2,16.72,2,35c0,0,0,184.49,0,186c0,17.87,14.42,32.19,32.08,32.9v0.1h171.74v-9.29c-13.23,0-23.93-10.7-23.93-23.93 C181.89,207.56,192.59,196.86,205.82,196.86z M44,76.19c0-6.86,5.58-12.43,12.45-12.43h2.59c0.25,0,0.45-0.05,0.65-0.1V57h18.24 v6.56c0.24,0.15,0.59,0.25,0.94,0.25h75.73c6.87,0,12.45,5.57,12.4,12.43v53.33c0,6.86-5.58,12.43-12.45,12.43h-98.1 C49.58,142,44,136.43,44,129.57V76.19z M172.6,220.68c0,9.39,4.04,17.87,10.3,23.93H35.4c-13.23,0.1-24.03-10.7-24.03-23.93 c0-12.52,9.79-22.81,22.11-23.72l149.72-0.31C176.74,202.71,172.6,211.19,172.6,220.68z M142.09,85.08h12.51 c1.94,0,3.53-1.54,3.53-3.52v-5.32c0-1.94-1.54-3.53-3.53-3.53h-12.51c-1.94,0-3.54,1.54-3.54,3.53v5.32 C138.55,83.49,140.1,85.08,142.09,85.08z M105.52,131.41c15.25,0,27.65-12.33,27.65-27.59s-12.4-27.58-27.65-27.58 c-15.29,0-27.64,12.37-27.64,27.58C77.88,119.08,90.28,131.41,105.52,131.41z M105.52,84.39c10.77,0,19.53,8.7,19.53,19.48 c0,10.74-8.76,19.49-19.53,19.49c-10.76,0-19.52-8.75-19.52-19.49C86,93.14,94.76,84.39,105.52,84.39z" fill="#e396bf"/>
                </svg>
              </div>
            </div>
            <div className="tpl1-fab-bubble" onClick={() => { setFabOpen(false); router.push('/llegan-pronto'); }}>
              <span className="tpl1-bubble-label">En Camino</span>
              <div className="tpl1-bubble-circle">
                <svg viewBox="0 0 461.941 461.941" className="tpl1-en-camino-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M226.496,190.563c2.862-0.638,5.832-0.639,8.695-0.001l113.612,25.286l-10.658-67.5c-1.112-7.041-7.171-12.233-14.3-12.252 l-31.675-0.085l-5.185-64.064c-0.609-7.523-6.882-13.325-14.43-13.345l-21.56-0.058l0.1-37.157 c0.03-11.045-8.9-20.024-19.946-20.054c-0.019,0-0.036,0-0.055,0c-11.02,0-19.969,8.919-19.999,19.946l-0.1,37.157l-20.988-0.056 c-7.548-0.021-13.852,5.747-14.501,13.268l-5.529,64.036l-31.26-0.084c-7.128-0.019-13.216,5.14-14.365,12.175l-11.116,68.028 L226.496,190.563z" fill="#e396bf"/>
                  <path d="M110.416,375.186c17.402-12.674,38.307-19.514,60.277-19.514c21.969,0,42.875,6.841,60.277,19.514 c17.402-12.674,38.307-19.514,60.277-19.514c21.969,0,42.872,6.84,60.275,19.512c7.392-5.388,15.418-9.711,23.883-12.916 l27.664-76.601c1.417-3.924,1.077-8.268-0.932-11.924c-2.01-3.656-5.495-6.27-9.567-7.177l-161.721-35.994L69.365,266.558 c-4.071,0.907-7.556,3.522-9.565,7.178c-2.009,3.656-2.348,7.999-0.931,11.922l27.675,76.632 C95.007,365.49,103.029,369.806,110.416,375.186z" fill="#e396bf"/>
                  <path d="M456.083,413.984c-11.828-11.828-27.554-18.342-44.281-18.342s-32.453,6.514-44.281,18.342 c-4.273,4.273-9.954,6.626-15.997,6.626c-6.043,0-11.724-2.353-15.996-6.626c-12.209-12.208-28.246-18.312-44.282-18.312 c-16.036,0-32.072,6.104-44.28,18.312c-4.273,4.273-9.954,6.626-15.997,6.626c-6.043,0-11.724-2.353-15.996-6.626 c-12.209-12.208-28.246-18.312-44.282-18.312c-16.036,0-32.072,6.104-44.28,18.312c-4.41,4.41-10.204,6.615-15.996,6.615 c-5.794,0-11.586-2.205-15.997-6.615c-12.208-12.208-28.245-18.312-44.281-18.312c-16.036,0-32.072,6.104-44.28,18.312 c-7.811,7.811-7.811,20.474,0,28.284c7.81,7.81,20.473,7.811,28.284,0c4.41-4.41,10.203-6.615,15.997-6.615 s11.586,2.205,15.997,6.616c12.208,12.208,28.244,18.312,44.28,18.312s32.073-6.104,44.281-18.312 c4.41-4.411,10.204-6.616,15.997-6.616s11.586,2.205,15.996,6.616c11.827,11.827,27.554,18.341,44.28,18.341c0,0,0,0,0,0h0 c16.727,0,32.453-6.514,44.281-18.342c4.41-4.41,10.204-6.615,15.997-6.615s11.586,2.205,15.996,6.616 c11.827,11.827,27.554,18.341,44.28,18.341h0h0c16.727,0,32.453-6.514,44.281-18.342c4.273-4.272,9.954-6.626,15.997-6.626 c6.043,0,11.724,2.354,15.997,6.626c7.811,7.81,20.473,7.811,28.284,0C463.894,434.458,463.894,421.794,456.083,413.984z" fill="#e396bf"/>
                </svg>
              </div>
            </div>
          </div>
          <div className={`tpl1-fab-wrap${fabOpen ? ' active' : ''}`}>
            <button className={`tpl1-fab-btn${fabOpen ? ' open' : ''}`} onClick={() => setFabOpen(v => !v)} aria-label="Explorar">
              <div ref={lottieRef} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
            </button>
            <span className="tpl1-fab-label">Explorar</span>
          </div>

          <Link href="/carrito" className={`tpl1-bottom-nav-item ${!fabOpen && pathname === '/carrito' ? 'active' : ''}`}>
            <ShoppingCart />
            {totalItems > 0 && <span className="tpl1-bottom-badge">{totalItems > 99 ? '99+' : totalItems}</span>}
            <span>Carrito</span>
          </Link>
          <Link href="/cuenta" className={`tpl1-bottom-nav-item ${!fabOpen && pathname?.startsWith('/cuenta') && !pathname?.startsWith('/cuenta/favoritos') ? 'active' : ''}`} style={{ position: 'relative' }}>
            {isLoggedIn && user ? (
              <NavAvatarWithBadge avatarUrl={avatarUrl} userName={user.name} size={26} loyaltyLevelId={loyaltyLevelId} />
            ) : (
              <User />
            )}
            <span>Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Mobile search overlay */}
      {authPopupMobileLayer && createPortal(authPopupMobileLayer, document.body)}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {notifOpen && <NotificationsOverlay onClose={() => setNotifOpen(false)} />}
    </>
  );
}
