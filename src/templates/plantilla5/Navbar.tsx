'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingCart, User, Heart, Menu, X, MapPin, Bell, Receipt, LogOut, Package, Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { getServices, getAppwriteConfig, MEDIA_BUCKET_ID, MEDIA_PREFIXES, formatPrice } from '@/lib/appwrite';
import { resolveStorageImageUrl } from '@/lib/product-images';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { getSectionConfigAsync, getSectionConfig, type SectionConfig } from '@/lib/section-config';
import SearchOverlay from '@/components/SearchOverlay';
import NotificationsOverlay from '@/components/NotificationsOverlay';
import { usePrimaryAddress } from '@/hooks/usePrimaryAddress';
import { getWhatsAppUrl, openChatbot } from '@/lib/store-contact';
import NavAvatarWithBadge from '@/components/NavAvatarWithBadge';

const PRIMARY_COLOR = '#b46174'; // Agnes Pink

function getFilePreviewUrl(fileId: string): string {
  const { endpoint, projectId } = getAppwriteConfig();
  const path = MEDIA_PREFIXES.thumbnails + fileId;
  return `${endpoint}/storage/buckets/${MEDIA_BUCKET_ID}/files/${path}/view?project=${projectId}`;
}

export default function Navbar5() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const { user, isLoggedIn, logout } = useAuth();
  const { totalItems, items, subtotal, removeItem, updateQuantity } = useCart();
  const { settings: apertura } = useAperturaPromotion();
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
  const [navLogoUrl, setNavLogoUrl] = useState<string>('');
  const [navStoreName, setNavStoreName] = useState<string>('YESBELLA');

  // Load logo from theme config
  useEffect(() => {
    getSectionConfigAsync().then(cfg => {
      const heroSec = cfg.find((s: SectionConfig) => s.id === 'tpl5_hero' || s.id === 'tpl1_hero');
      if (heroSec?.settings) {
        const hs = heroSec.settings as Record<string, any>;
        if (hs.heroStoreLogoMode === 'image') {
          setNavLogoUrl(hs.heroStoreLogoScrollUrl || hs.heroStoreLogoUrl || '');
        }
      }
    }).catch(() => {
      const cfg = getSectionConfig();
      const heroSec = cfg.find((s: SectionConfig) => s.id === 'tpl5_hero' || s.id === 'tpl1_hero');
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
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Listen to open cart event
  useEffect(() => {
    const openCart = () => setCartOpen(true);
    window.addEventListener('yaxsel:open-navbar-cart', openCart);
    return () => window.removeEventListener('yaxsel:open-navbar-cart', openCart);
  }, []);

  // Load avatar and loyalty
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

  const handleLogout = async () => {
    await logout();
    setAccountOpen(false);
    router.push('/');
  };

  const NAV_LINKS = [
    { label: 'Inicio', href: '/' },
    { label: 'NEW ARRIVAL', href: '/productos?tag=new-arrival' },
    { label: 'MAQUILLAJE', href: '/productos?categoria=maquillaje' },
    { label: 'SKINCARE', href: '/productos?categoria=skincare' },
    { label: 'CORPORAL', href: '/productos?categoria=corporal' },
    { label: 'Mis Pedidos', href: '/cuenta/pedidos' },
  ];

  return (
    <>
      <style>{`
        .tpl5-header-group {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          z-index: 1000 !important;
          display: flex !important;
          flex-direction: column !important;
          height: auto !important;
          background: transparent !important;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tpl5-header-group.scrolled {
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08) !important;
          background: linear-gradient(209deg, rgba(255, 236, 231, 0.96) 3%, rgba(253, 230, 239, 0.96) 100%) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }

        /* Utility Bar styling */
        .tpl5-utility-bar {
          height: 40px;
          background: #fdfbf7;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 40px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: all 0.3s;
        }
        .tpl5-header-group.scrolled .tpl5-utility-bar {
          display: none;
        }

        /* Announcement bar */
        .tpl5-announcement-bar {
          height: 40px;
          background: #b46174;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          overflow: hidden;
          transition: all 0.3s;
        }
        .tpl5-header-group.scrolled .tpl5-announcement-bar {
          display: none;
        }

        /* Main custom-header */
        .tpl5-custom-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px 40px;
          transition: all 0.3s ease;
          width: 100%;
        }
        .tpl5-header-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
        }
        .tpl5-header-row-bottom {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 1400px;
          margin-top: 10px;
        }
        .tpl5-header-group.scrolled .tpl5-header-row-bottom {
          display: none; /* Compact mode on scroll */
        }
        .tpl5-header-group.scrolled .tpl5-custom-header {
          padding: 10px 40px;
        }

        .tpl5-logo {
          font-family: 'Nunito Sans', sans-serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: ${PRIMARY_COLOR};
          text-decoration: none;
          text-transform: uppercase;
        }
        .tpl5-header-group:not(.scrolled) .tpl5-logo {
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0,0,0,0.15);
        }
        .tpl5-header-group.scrolled .tpl5-logo {
          color: ${PRIMARY_COLOR};
        }

        .tpl5-nav-links {
          display: flex;
          gap: 24px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .tpl5-nav-links a {
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #2a2120;
          text-transform: uppercase;
          transition: color 0.3s;
        }
        .tpl5-header-group:not(.scrolled) .tpl5-nav-links a {
          color: #ffffff;
        }
        .tpl5-nav-links a:hover {
          color: ${PRIMARY_COLOR} !important;
        }

        .tpl5-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .tpl5-action-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #2a2120;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.3s;
          text-decoration: none;
        }
        .tpl5-header-group:not(.scrolled) .tpl5-action-btn {
          color: #ffffff;
        }
        .tpl5-action-btn:hover {
          color: ${PRIMARY_COLOR} !important;
        }

        /* Dropdown/Account panel */
        .tpl5-dropdown {
          position: absolute;
          top: 100%;
          right: 40px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          padding: 16px;
          min-width: 240px;
          z-index: 1002;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid #f3e8e8;
        }

        /* Mobile drawer */
        .tpl5-mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 300px;
          background: #ffffff;
          box-shadow: 5px 0 30px rgba(0,0,0,0.15);
          z-index: 9999;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 30px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .tpl5-mobile-drawer.open {
          transform: translateX(0);
        }
        .tpl5-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 9998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .tpl5-mobile-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

      {/* Mobile menu overlay and drawer */}
      <div className={`tpl5-mobile-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`tpl5-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="tpl5-logo" style={{ fontSize: '22px' }}>{navStoreName}</span>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#2a2120" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none', fontSize: '16px', fontWeight: '600', color: '#2a2120', textTransform: 'uppercase' }}
            >
              {link.label}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #f0e0e0', margin: '10px 0' }} />
          {isLoggedIn ? (
            <>
              <Link href="/cuenta" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#2a2120', fontWeight: '600' }}>
                Mi Cuenta ({user?.name || 'Usuario'})
              </Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', textAlign: 'left', color: '#dc2626', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none', color: '#2a2120', fontWeight: '600' }}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      <header className={`tpl5-header-group ${scrolled ? 'scrolled' : ''}`}>
        {/* Utility Bar */}
        <div className="tpl5-utility-bar">
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={accountDropdownRef}>
              <button className="tpl5-action-btn" onClick={() => setAccountOpen(!accountOpen)}>
                <User size={16} />
                <span>{user?.name || 'Mi Cuenta'}</span>
              </button>
              {accountOpen && (
                <div className="tpl5-dropdown">
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>¡Hola, {user?.name}!</span>
                  <Link href="/cuenta" className="tpl5-action-btn" style={{ color: '#2a2120' }} onClick={() => setAccountOpen(false)}>Mi perfil</Link>
                  <Link href="/cuenta/pedidos" className="tpl5-action-btn" style={{ color: '#2a2120' }} onClick={() => setAccountOpen(false)}>Mis pedidos</Link>
                  <button onClick={handleLogout} className="tpl5-action-btn" style={{ color: '#dc2626' }}>Cerrar sesión</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="tpl5-action-btn">
              <User size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Announcement Bar */}
        <div className="tpl5-announcement-bar">
          ✨ Envío gratis en órdenes superiores a $50 + Formulado en Seúl 🌸
        </div>

        {/* Main Header navigation */}
        <div className="tpl5-custom-header">
          <div className="tpl5-header-row-top">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: isMobile ? 'block' : 'none' }}
            >
              <Menu size={24} color={scrolled ? '#2a2120' : '#ffffff'} />
            </button>

            {/* Logo */}
            <Link href="/" className="tpl5-logo">
              {navLogoUrl ? <img src={navLogoUrl} alt={navStoreName} style={{ height: '36px' }} /> : navStoreName}
            </Link>

            {/* Nav links on desktop row top if scrolled to keep it compact */}
            {!isMobile && scrolled && (
              <ul className="tpl5-nav-links">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Search, Notifications, and Cart actions */}
            <div className="tpl5-actions">
              <button className="tpl5-action-btn" onClick={() => setSearchOpen(true)}>
                <Search size={20} />
                {!isMobile && <span>Buscar</span>}
              </button>
              <button className="tpl5-action-btn" onClick={() => setNotifOpen(true)} style={{ position: 'relative' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: PRIMARY_COLOR,
                    color: '#fff',
                    fontSize: '10px',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>{unreadCount}</span>
                )}
                {!isMobile && <span>Avisos</span>}
              </button>
              <button className="tpl5-action-btn" onClick={() => setCartOpen(true)}>
                <div style={{ position: 'relative' }}>
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: PRIMARY_COLOR,
                      color: '#fff',
                      fontSize: '10px',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>{totalItems}</span>
                  )}
                </div>
                {!isMobile && <span>Carrito</span>}
              </button>
            </div>
          </div>

          {/* Bottom navigation list (desktop static header mode) */}
          {!isMobile && !scrolled && (
            <div className="tpl5-header-row-bottom">
              <ul className="tpl5-nav-links">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Global Search and Cart overlays */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {notifOpen && <NotificationsOverlay onClose={() => setNotifOpen(false)} />}

      {/* Cart drawer overlay integration */}
      {cartOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.3s'
        }} onClick={() => setCartOpen(false)}>
          <div style={{
            width: '100%',
            maxWidth: '450px',
            background: '#fff',
            height: '100%',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '-5px 0 30px rgba(0,0,0,0.15)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2a2120' }}>Tu Carrito ({totalItems})</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#2a2120" />
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span>Tu carrito está vacío</span>
                <Link href="/productos" onClick={() => setCartOpen(false)} style={{
                  padding: '12px 24px',
                  background: PRIMARY_COLOR,
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '30px',
                  fontWeight: '600'
                }}>Ver productos</Link>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {items.map((item) => (
                    <div key={item.product.$id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #f5ebeb', paddingBottom: '12px' }}>
                      <img src={resolveStorageImageUrl(item.product.IMAGEURL)} alt={item.product.NAME} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#2a2120' }}>{item.product.NAME}</span>
                        <span style={{ fontSize: '13px', color: PRIMARY_COLOR, fontWeight: '700' }}>{formatPrice(resolveProductDisplayPrice(item.product, apertura).displayPrice)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                          <button onClick={() => updateQuantity(item.product.$id, item.quantity - 1)} style={{ background: '#f5f5f5', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.$id, item.quantity + 1)} style={{ background: '#f5f5f5', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.product.$id)} style={{ background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>
                        <Trash2 size={18} color="#999" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #f0e0e0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Link href="/checkout" className="tpl5-action-btn" style={{
                    background: PRIMARY_COLOR,
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '30px',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(180,97,116,0.3)',
                    textDecoration: 'none'
                  }} onClick={() => setCartOpen(false)}>
                    Proceder al Pago
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
