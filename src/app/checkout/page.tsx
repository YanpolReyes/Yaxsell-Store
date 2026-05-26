'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, MapPin, Package, ChevronDown, ChevronRight, Shield, Truck, RefreshCw, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID, WHOLESALE_REQUESTS_COLLECTION_ID, APERTURA_SETTINGS_COLLECTION_ID, COUPONS_COLLECTION_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { ADDRESSES_COLLECTION_ID } from '@/lib/appwrite-admin';
import { CHILE_REGIONES } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/appwrite';
import { resolveProductDisplayPrice } from '@/lib/apertura-promo';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';
import { Query, ID } from 'appwrite';
import Image from 'next/image';
import Link from 'next/link';
import { isBelowMinimumOrder, minimumOrderMessage } from '@/lib/order-rules';

interface AgencyOption { name: string; color: string; bg: string; desc: string; logo: string; active?: boolean; }
interface SavedAddress { id: string; alias: string; name: string; phone: string; fullAddress: string; commune: string; region: string; lat: number; lng: number; }

const AGENCY_PALETTE = [
  { color: '#1a7f37', bg: '#e6f4ea' },
  { color: '#1558b0', bg: '#e8f0fe' },
  { color: '#c62828', bg: '#fce8e6' },
  { color: '#e65c00', bg: '#fff3e0' },
  { color: '#7c3aed', bg: '#ede9fe' },
  { color: '#0891b2', bg: '#ecfeff' },
];

const CHECKOUT_AGENCY_NAMES = [
  'STARKEN', 'PULMAN CARGO', 'VARMONTT', 'MENA', 'TRAMAR', 'CGS', 'CYC',
  'VILLA PRATT', 'ATE', 'CARGO BARRIOS', 'TVP', 'FENIX', 'CHEVALIER',
  'CACEM', 'CINCO SUR', 'CRUZ DEL SUR',
] as const;

const CHECKOUT_AGENCIES: AgencyOption[] = CHECKOUT_AGENCY_NAMES.map((name, i) => {
  const p = AGENCY_PALETTE[i % AGENCY_PALETTE.length];
  return { name, color: p.color, bg: p.bg, desc: 'Envío a coordinar tras confirmar', logo: '', active: true };
});

const PINK = '#e396bf'; const PINK_LIGHT = '#f5a8cf'; const PINK_BG = '#fdf2f8'; const FF = '"DM Sans", system-ui, sans-serif';
const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #fce7f3', borderRadius: 12, fontSize: 14, outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box', transition: 'all .2s', fontFamily: FF };
const selectStyle: React.CSSProperties = { ...inp, appearance: 'none', paddingRight: 32, backgroundColor: '#fff', color: '#111' };
const optionStyle: React.CSSProperties = { backgroundColor: '#fff', color: '#111' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 6, fontFamily: FF };

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountParam = parseFloat(searchParams.get('discount') || '0');
  const { items, subtotal, clearCart, catalogSubtotal, aperturaSavings } = useCart();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { settings: apertura, isActive: aperturaActive, discountPercent: aperturaPct } = useAperturaPromotion();

  const [form, setForm] = useState({
    name: '', rut: '', phone: '', email: '',
    region: '', comuna: '', address: '', additionalInfo: '',
  });
  const [customerNote, setCustomerNote] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [agencies, setAgencies] = useState<AgencyOption[]>(CHECKOUT_AGENCIES);
  const [agency, setAgency] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showingNewAddress, setShowingNewAddress] = useState(false);
  const submittedRef = useRef(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponDocId, setCouponDocId] = useState('');

  const comunas = form.region ? CHILE_REGIONES[form.region] || [] : [];
  const totalDiscount = discountParam + couponDiscount;
  const total = Math.max(0, subtotal - totalDiscount);
  const belowMinimum = isBelowMinimumOrder(subtotal);

  useEffect(() => {
    if (items.length === 0 && !submittedRef.current) router.push('/carrito');
  }, [items, router]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    setAgencies(CHECKOUT_AGENCIES);
    setAgency(CHECKOUT_AGENCIES[0]?.name || '');
  }, []);

  useEffect(() => {
    // Load saved addresses from DB first, fallback to localStorage
    if (user?.id) {
      (async () => {
        try {
          const { databases } = getServices();
          const { databaseId } = getAppwriteConfig();
          const res = await databases.listDocuments(databaseId, ADDRESSES_COLLECTION_ID, [
            Query.equal('userId', user.id),
            Query.limit(100),
          ]);
          const dbAddrs: SavedAddress[] = res.documents.map((doc: any) => ({
            id: doc.$id,
            alias: doc.alias || 'Otro',
            name: doc.name || '',
            phone: doc.phone || '',
            fullAddress: doc.fullAddress || '',
            commune: doc.commune || '',
            region: doc.region || '',
            lat: doc.lat || 0,
            lng: doc.lng || 0,
          }));
          if (dbAddrs.length > 0) {
            setSavedAddresses(dbAddrs);
            setSelectedAddressId(dbAddrs[0].id);
            fillFormFromAddress(dbAddrs[0]);
            localStorage.setItem(`addr_${user.id}`, JSON.stringify(dbAddrs));
          } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(`addr_${user.id}`);
            if (stored) {
              const addresses: SavedAddress[] = JSON.parse(stored);
              setSavedAddresses(addresses);
              if (addresses.length > 0) {
                setSelectedAddressId(addresses[0].id);
                fillFormFromAddress(addresses[0]);
              }
            }
          }
        } catch {
          // Fallback to localStorage on error
          try {
            const stored = localStorage.getItem(`addr_${user.id}`);
            if (stored) {
              const addresses: SavedAddress[] = JSON.parse(stored);
              setSavedAddresses(addresses);
              if (addresses.length > 0) {
                setSelectedAddressId(addresses[0].id);
                fillFormFromAddress(addresses[0]);
              }
            }
          } catch {}
        }
      })();
    }
  }, [user]);

  useEffect(() => {
    // Load user data (name, email, phone, RUT) from user and prefs
    if (user) {
      (async () => {
        try {
          const { account } = getServices();
          const acc = await account.get();
          const prefs = (acc as any).prefs || {};
          setForm(f => ({
            ...f,
            name: f.name || user.name || '',
            email: f.email || user.email || '',
            phone: f.phone || prefs.phone || user.phone || '',
            rut: f.rut || prefs.rut || '',
            region: f.region || prefs.region || '',
            comuna: f.comuna || prefs.comuna || '',
            address: f.address || prefs.address || '',
          }));
        } catch {}
      })();
    }
  }, [user]);

  function fillFormFromAddress(addr: SavedAddress) {
    setForm(f => ({
      ...f,
      name: addr.name || f.name,
      phone: addr.phone || f.phone,
      region: addr.region || f.region,
      comuna: addr.commune || f.comuna,
      address: addr.fullAddress || f.address,
    }));
  }

  function selectAddress(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    fillFormFromAddress(addr);
  }

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  function formatRut(val: string) {
    const clean = val.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length <= 1) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, COUPONS_COLLECTION_ID, [
        Query.equal('CODE', code),
        Query.limit(1),
      ]);
      if (res.documents.length === 0) {
        setCouponError('Cupón no encontrado');
        setCouponLoading(false);
        return;
      }
      const coupon = res.documents[0] as any;

      // Validate active (ISACTIVE or ACTIVE for backwards compat)
      const isActive = coupon.ISACTIVE ?? coupon.ACTIVE ?? true;
      if (!isActive) {
        setCouponError('Este cupón ya no está vigente');
        setCouponLoading(false);
        return;
      }
      // Validate expiry (EXPIRESAT is ISO string, ENDAT is epoch seconds for backwards compat)
      const expiresAt = coupon.EXPIRESAT || (coupon.ENDAT ? new Date(coupon.ENDAT * 1000).toISOString() : null);
      if (expiresAt && new Date(expiresAt) < new Date()) {
        setCouponError('Este cupón ha expirado');
        setCouponLoading(false);
        return;
      }
      // Validate max uses
      if (coupon.MAXUSES && (coupon.USEDCOUNT || 0) >= coupon.MAXUSES) {
        setCouponError('Este cupón ha alcanzado su límite de usos');
        setCouponLoading(false);
        return;
      }
      // Validate min purchase
      if (coupon.MINORDERAMOUNT && subtotal < coupon.MINORDERAMOUNT) {
        setCouponError(`Compra mínima: ${formatPrice(coupon.MINORDERAMOUNT)}`);
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      const couponValue = coupon.DISCOUNTVALUE ?? (coupon.VALUE || 0);
      const couponType = coupon.DISCOUNTTYPE ?? (coupon.TYPE || 'percent');
      if (couponType === 'percent' || couponType === 'percentage') {
        discount = Math.round(subtotal * couponValue / 100);
        if (coupon.MAXDISCOUNT && discount > coupon.MAXDISCOUNT) discount = coupon.MAXDISCOUNT;
      } else {
        discount = couponValue;
      }
      discount = Math.min(discount, subtotal);

      setCouponDiscount(discount);
      setCouponApplied(code);
      setCouponDocId(coupon.$id);
    } catch (err: any) {
      setCouponError('Error al validar cupón');
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponDiscount(0);
    setCouponApplied('');
    setCouponDocId('');
    setCouponCode('');
    setCouponError('');
  }

  async function getNextOrderIndex(): Promise<number> {
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const { Query } = await import('appwrite');
      const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION_ID, [Query.limit(1)]);
      return (res.total || 0) + 1;
    } catch {
      return Math.floor(Date.now() / 1000) % 100000;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) { setError('Selecciona una agencia de envío'); return; }
    if (!form.region || !form.comuna) { setError('Selecciona región y comuna'); return; }
    if (!form.name || !form.rut || !form.phone) { setError('Completa todos los campos obligatorios'); return; }
    if (belowMinimum) {
      setError(minimumOrderMessage(subtotal, total));
      return;
    }
    setSubmitting(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const orderIndex = await getNextOrderIndex();
      const orderCode = `ORD-${String(orderIndex).padStart(5, '0')}`;
      const now = Date.now();
      const expiresAt = now + 3 * 60 * 60 * 1000;
      const itemsData = items.map(i => {
        const price = resolveProductDisplayPrice(i.product, apertura).displayPrice;
        return { id: i.product.$id, name: i.product.NAME, price, originalPrice: i.product.PRICE !== price ? i.product.PRICE : null, qty: i.quantity, img: i.product.IMAGEURL, total: price * i.quantity };
      });
      const docId = await databases.createDocument(databaseId, ORDERS_COLLECTION_ID, ID.unique(), {
        USERID: user?.id || 'guest', ITEMS: JSON.stringify(itemsData),
        CUSTOMERNAME: form.name, CUSTOMERRUT: form.rut, CUSTOMERPHONE: form.phone, CUSTOMEREMAIL: form.email,
        REGION: form.region, COMUNA: form.comuna, ADDRESS: form.address, ADDITIONALINFO: form.additionalInfo,
        PAYMENTMETHOD: 'Transferencia Bancaria', SHIPPINGAGENCY: agency,
        SUBTOTAL: subtotal, SHIPPINGCOST: 0, TOTAL: total,
        ORDERCODE: orderCode, ORDERINDEX: orderIndex,
        STATUS: 'pending', CREATEDAT: now,
        ...(customerNote.trim() ? { CUSTOMERNOTE: customerNote.trim() } : {}),
        ...(isGift ? { ISGIFT: true } : {}),
      });
      submittedRef.current = true;
      const orderId = (docId as unknown as { $id: string }).$id;

      // Decrement stock for each product in the order
      for (const item of items) {
        try {
          const productDoc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION_ID, item.product.$id);
          const currentStock = (productDoc as any).STOCK ?? 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION_ID, item.product.$id, { STOCK: newStock });
        } catch (stockErr) {
          console.error('Error updating stock for product', item.product.$id, stockErr);
        }
      }

      // Mark coupon as used (increment counter and deactivate)
      if (couponDocId) {
        try {
          const couponDoc = await databases.getDocument(databaseId, COUPONS_COLLECTION_ID, couponDocId);
          await databases.updateDocument(databaseId, COUPONS_COLLECTION_ID, couponDocId, {
            ACTIVE: false,
            USEDCOUNT: ((couponDoc as any).USEDCOUNT || 0) + 1,
          });
        } catch {}
      }
      
      // Save RUT and phone to user prefs for future purchases
      if (user && (form.rut || form.phone)) {
        try {
          const { account } = getServices();
          const acc = await account.get();
          const currentPrefs = (acc as any).prefs || {};
          const updatedPrefs: any = { ...currentPrefs };
          if (form.rut) updatedPrefs.rut = form.rut;
          if (form.phone) updatedPrefs.phone = form.phone;
          await account.updatePrefs(updatedPrefs);
        } catch (prefError) {
          console.log('Error saving user prefs:', prefError);
        }
      }
      
      clearCart();
      router.push(`/pedido-confirmado?id=${orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear pedido');
    } finally { setSubmitting(false); }
  }

  const totalItems = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <>
      <style>{`
        @keyframes ckBtnShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ckOrbFloat {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translateY(-22px) translateX(8px) scale(1.4); opacity: 1; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-44px) translateX(-4px) scale(0.6); opacity: 0; }
        }
        @keyframes ckSparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          20% { transform: scale(1.2) rotate(90deg); opacity: 1; }
          50% { transform: scale(0.8) rotate(180deg); opacity: 0.8; }
          80% { transform: scale(1.1) rotate(270deg); opacity: 0.5; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes ckTrail {
          0% { transform: translateX(0) scaleX(1); opacity: 0.8; }
          50% { transform: translateX(20px) scaleX(1.5); opacity: 0.4; }
          100% { transform: translateX(40px) scaleX(0); opacity: 0; }
        }
        @keyframes ckPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(227,150,191,0.3), inset 0 0 12px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 20px rgba(227,150,191,0.5), inset 0 0 20px rgba(255,255,255,0.2); }
        }
        @keyframes ckShimmer {
          0% { left: -40%; }
          100% { left: 110%; }
        }
        .ck-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.1));
          box-shadow: 0 0 6px rgba(255,255,255,0.5);
          animation: ckOrbFloat 2.8s ease-in-out infinite;
        }
        .ck-orb:nth-child(1) { width: 8px; height: 8px; left: 8%; bottom: 4px; animation-delay: 0s; }
        .ck-orb:nth-child(2) { width: 5px; height: 5px; left: 22%; bottom: 2px; animation-delay: 0.4s; }
        .ck-orb:nth-child(3) { width: 10px; height: 10px; left: 38%; bottom: 6px; animation-delay: 0.8s; }
        .ck-orb:nth-child(4) { width: 6px; height: 6px; left: 52%; bottom: 3px; animation-delay: 1.2s; }
        .ck-orb:nth-child(5) { width: 7px; height: 7px; left: 68%; bottom: 5px; animation-delay: 1.6s; }
        .ck-orb:nth-child(6) { width: 4px; height: 4px; left: 82%; bottom: 2px; animation-delay: 2s; }
        .ck-orb:nth-child(7) { width: 9px; height: 9px; left: 92%; bottom: 4px; animation-delay: 2.4s; }
        .ck-sparkle {
          position: absolute;
          width: 4px; height: 4px;
          background: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          animation: ckSparkle 2s ease-in-out infinite;
          filter: drop-shadow(0 0 3px rgba(255,255,255,0.8));
        }
        .ck-sparkle:nth-child(8) { left: 15%; top: 30%; animation-delay: 0s; }
        .ck-sparkle:nth-child(9) { left: 45%; top: 20%; animation-delay: 0.7s; width: 5px; height: 5px; }
        .ck-sparkle:nth-child(10) { left: 75%; top: 40%; animation-delay: 1.4s; }
        .ck-sparkle:nth-child(11) { left: 30%; top: 55%; animation-delay: 0.3s; width: 3px; height: 3px; }
        .ck-sparkle:nth-child(12) { left: 60%; top: 15%; animation-delay: 1s; }
        .ck-trail {
          position: absolute;
          height: 2px;
          width: 20px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: ckTrail 2.5s ease-in-out infinite;
        }
        .ck-trail:nth-child(13) { left: 5%; top: 45%; animation-delay: 0s; }
        .ck-trail:nth-child(14) { left: 35%; top: 35%; animation-delay: 0.8s; }
        .ck-trail:nth-child(15) { left: 65%; top: 50%; animation-delay: 1.6s; }
        .ck-confirm-btn {
          animation: ckBtnShift 3s ease infinite, ckPulse 2s ease-in-out infinite;
        }
        .ck-confirm-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 32px rgba(227,150,191,0.35), inset 0 0 20px rgba(255,255,255,0.15); }
        .ck-shimmer-line {
          position: absolute;
          top: 0; bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: ckShimmer 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        @media (max-width: 800px) {
          .ck-page { padding: 12px 12px calc(76px + env(safe-area-inset-bottom, 0px)) !important; }
          .ck-layout { flex-direction: column !important; gap: 12px !important; }
          .ck-main { min-width: 0 !important; width: 100% !important; }
          .ck-sidebar { width: 100% !important; position: static !important; order: -1; }
          .ck-card { padding: 16px 14px !important; border-radius: 16px !important; }
          .ck-card h2 { font-size: 15px !important; }
          .ck-agency-grid { grid-template-columns: 1fr !important; }
          .ck-form-grid { grid-template-columns: 1fr !important; }
          .ck-form-grid > div { grid-column: 1 / -1 !important; }
          .ck-summary-items { max-height: 180px !important; padding: 12px 14px !important; }
          .ck-breadcrumb { font-size: 12px !important; margin-bottom: 12px !important; flex-wrap: wrap; }
        }
        .ck-input-placeholder::placeholder { color: #6b7280; opacity: 1; }
        .ck-textarea-placeholder::placeholder { color: #6b7280; opacity: 1; }
      `}</style>
    <div className="ck-page" style={{ minHeight: '100vh', padding: '24px 4%', fontFamily: FF, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <img src="https://img.magnific.com/free-vector/monochrome-realistic-liquid-effect-background_474888-7306.jpg?semt=ais_hybrid&w=740&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(1.1) saturate(0.4)', transform: 'scale(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 10%,rgba(227,150,191,0.12),transparent 32%), linear-gradient(180deg,rgba(255,245,248,0.82) 0%,rgba(255,255,255,0.92) 100%)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div className="ck-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
          <Link href="/" style={{ color: PINK, textDecoration: 'none', fontWeight: 600 }}>Inicio</Link>
          <ChevronRight size={12} color={PINK_LIGHT} />
          <Link href="/carrito" style={{ color: PINK, textDecoration: 'none', fontWeight: 600 }}>Carrito</Link>
          <ChevronRight size={12} color={PINK_LIGHT} />
          <span style={{ color: '#9ca3af', fontWeight: 600 }}>Finalizar compra</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── LEFT ── */}
            <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Shipping agencies */}
              <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: '22px 24px', border: '1px solid #fce7f3', boxShadow: '0 8px 28px rgba(227,150,191,0.08)', backdropFilter: 'blur(10px)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FF }}>
                  <span style={{ width: 28, height: 28, borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>1</span>
                  Agencia de envío
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {agencies.map((ag: AgencyOption) => {
                    const sel = agency === ag.name;
                    return (
                      <button type="button" key={ag.name} onClick={() => setAgency(ag.name)}
                        style={{ padding: '14px 16px', border: `2px solid ${sel ? PINK : '#fce7f3'}`, borderRadius: 14, background: sel ? PINK_BG : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', position: 'relative', boxShadow: sel ? '0 4px 14px rgba(227,150,191,0.15)' : 'none' }}>
                        {sel && <span style={{ position: 'absolute', top: 8, right: 10, width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>}
                        <div style={{ width: 40, height: 40, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ag.bg, borderRadius: 10 }}>
                          <Truck size={18} color={ag.color} />
                        </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: sel ? ag.color : '#333' }}>{ag.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{ag.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#00a650', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> El costo de envío se coordina con el vendedor tras confirmar el pedido.
                </p>
              </div>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !showingNewAddress && (
                <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: '22px 24px', border: '1px solid #fce7f3', boxShadow: '0 8px 28px rgba(227,150,191,0.08)', backdropFilter: 'blur(10px)' }}>
                  <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FF }}>
                    <span style={{ width: 28, height: 28, borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>2</span>
                    Dirección de envío
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {savedAddresses.map((addr) => {
                      const sel = selectedAddressId === addr.id;
                      const aliasIcon = addr.alias === 'Casa' ? '🏠' : addr.alias === 'Trabajo' ? '💼' : '📍';
                      return (
                        <button type="button" key={addr.id} onClick={() => selectAddress(addr)}
                          style={{ padding: '14px 16px', border: `2px solid ${sel ? PINK : '#fce7f3'}`, borderRadius: 14, background: sel ? PINK_BG : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', position: 'relative', boxShadow: sel ? '0 4px 14px rgba(227,150,191,0.15)' : 'none' }}>
                          {sel && <span style={{ position: 'absolute', top: 8, right: 10, width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>{aliasIcon}</span>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: sel ? PINK : '#333' }}>{addr.alias}</p>
                          </div>
                          <p style={{ margin: '0 0 3px', fontSize: 12, color: '#555', lineHeight: 1.3 }}>{addr.fullAddress}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{addr.commune}{addr.region ? `, ${addr.region}` : ''}</p>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { setShowingNewAddress(true); setSelectedAddressId(null); setForm({ name: '', rut: '', phone: '', email: '', region: '', comuna: '', address: '', additionalInfo: '' }); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1.5px dashed #f5a8cf', borderRadius: 12, color: PINK, fontSize: 13, fontWeight: 600, background: PINK_BG, transition: 'all .15s', cursor: 'pointer', fontFamily: FF }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fce7f3'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = PINK_BG; }}>
                    <Plus size={14} /> Agregar nueva dirección
                  </button>
                </div>
              )}

              {/* Personal data */}
              <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: '22px 24px', border: '1px solid #fce7f3', boxShadow: '0 8px 28px rgba(227,150,191,0.08)', backdropFilter: 'blur(10px)' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FF }}>
                  <span style={{ width: 28, height: 28, borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>3</span>
                  Datos personales
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Nombre completo *</label>
                    <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan Pérez" style={inp}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={label}>RUT *</label>
                    <input required value={form.rut} onChange={e => set('rut', formatRut(e.target.value))} placeholder="12.345.678-9" maxLength={12} style={inp}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label style={label}>Teléfono *</label>
                    <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56 9 1234 5678" style={inp}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Email (para notificaciones)</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" style={inp}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
              </div>

              {/* Shipping address - only show if no saved addresses OR user is adding new */}
              {(savedAddresses.length === 0 || showingNewAddress) && (
                <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: '22px 24px', border: '1px solid #fce7f3', boxShadow: '0 8px 28px rgba(227,150,191,0.08)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FF }}>
                      <span style={{ width: 28, height: 28, borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>4</span>
                      Dirección de envío
                    </h2>
                    {showingNewAddress && savedAddresses.length > 0 && (
                      <button type="button" onClick={() => { setShowingNewAddress(false); if (savedAddresses.length > 0) { setSelectedAddressId(savedAddresses[0].id); fillFormFromAddress(savedAddresses[0]); } }}
                        style={{ padding: '6px 12px', border: '1.5px solid #fce7f3', borderRadius: 10, color: PINK, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: FF }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = PINK_BG; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}>
                        ← Usar dirección guardada
                      </button>
                    )}
                  </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <label style={label}>Región *</label>
                    <select required value={form.region} onChange={e => { set('region', e.target.value); set('comuna', ''); }}
                      style={selectStyle}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} >
                      <option value="" style={optionStyle}>Selecciona región</option>
                      {Object.keys(CHILE_REGIONES).map(r => <option key={r} value={r} style={optionStyle}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, bottom: 12, color: '#999', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={label}>Comuna *</label>
                    <select required value={form.comuna} onChange={e => set('comuna', e.target.value)} disabled={!form.region}
                      style={{ ...selectStyle, opacity: form.region ? 1 : 0.5 }}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }}>
                      <option value="" style={optionStyle}>Selecciona comuna</option>
                      {comunas.map(c => <option key={c} value={c} style={optionStyle}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, bottom: 12, color: '#999', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Dirección *</label>
                    <input required value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle, número, departamento" style={inp}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Información adicional (opcional)</label>
                    <textarea value={form.additionalInfo} onChange={e => set('additionalInfo', e.target.value)}
                      placeholder="Referencias, instrucciones para la entrega..." rows={2}
                      style={{ ...inp, resize: 'none', fontFamily: FF }}
                      onFocus={e => { e.target.style.borderColor = PINK; e.target.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#fce7f3'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
                </div>
              )}

            </div>

            {/* ── RIGHT: order summary ── */}
            <div className="ck-sidebar" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Summary card */}
              <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 22, border: '1px solid #fce7f3', boxShadow: '0 12px 40px rgba(227,150,191,0.1)', backdropFilter: 'blur(14px)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', padding: '18px 22px 14px', borderBottom: '1px solid #fce7f3' }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111', fontFamily: FF, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 10, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={14} color="#fff" />
                    </span>
                    Resumen de compra
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af', fontFamily: FF }}>{totalItems} producto{totalItems !== 1 ? 's' : ''} en tu pedido</p>
                </div>

                {/* Items */}
                <div style={{ padding: '14px 22px', maxHeight: 240, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map(item => {
                      const pricing = resolveProductDisplayPrice(item.product, apertura);
                      const price = pricing.displayPrice;
                      return (
                        <div key={item.product.$id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 12, background: '#fefcfe', border: '1px solid #fdf2f8', transition: 'all .15s' }}>
                          <div style={{ position: 'relative', width: 48, height: 48, background: 'linear-gradient(135deg, #fdf2f8, #fff)', borderRadius: 12, overflow: 'visible', flexShrink: 0, border: '1px solid #fce7f3' }}>
                            {item.product.IMAGEURL
                              ? <Image src={item.product.IMAGEURL} alt={item.product.NAME} fill style={{ objectFit: 'cover', padding: 2 }} />
                              : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</span>}
                            <span style={{ position: 'absolute', top: -3, right: -3, background: `linear-gradient(135deg, ${PINK}, #c0547a)`, color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(227,150,191,0.3)' }}>{item.quantity}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: FF, fontWeight: 500 }}>{item.product.NAME}</p>
                            {pricing.fromApertura && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#be185d', background: '#fdf2f8', padding: '2px 6px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>Promo apertura</span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {pricing.hasDiscount && pricing.originalPrice != null && (
                              <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9ca3af', textDecoration: 'line-through', fontFamily: FF }}>{formatPrice(pricing.originalPrice * item.quantity)}</p>
                            )}
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: pricing.fromApertura ? '#e396bf' : '#111', fontFamily: FF }}>{formatPrice(price * item.quantity)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ padding: '0 22px 14px' }}>
                  <div style={{ borderTop: '1px dashed #fce7f3', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280', fontFamily: FF }}>Subtotal</span>
                      <span style={{ color: '#374151', fontWeight: 600, fontFamily: FF }}>{formatPrice(subtotal)}</span>
                    </div>
                    {aperturaSavings > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#be185d', fontFamily: FF }}>Promoción de apertura (-{aperturaPct}%)</span>
                        <span style={{ color: '#be185d', fontWeight: 700, fontFamily: FF }}>-{formatPrice(aperturaSavings)}</span>
                      </div>
                    )}
                    {discountParam > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#00a650', fontFamily: FF }}>Descuento</span>
                        <span style={{ color: '#00a650', fontWeight: 700, fontFamily: FF }}>-{formatPrice(discountParam)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#00a650', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FF }}>
                          🎟 {couponApplied}
                          <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#f5a8cf', cursor: 'pointer', fontSize: 10, textDecoration: 'underline', padding: 0, fontFamily: FF }}>quitar</button>
                        </span>
                        <span style={{ color: '#00a650', fontWeight: 700, fontFamily: FF }}>-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9ca3af', fontFamily: FF }}>Envío</span>
                      <span style={{ color: '#00a650', fontWeight: 600, fontSize: 11, fontFamily: FF }}>A coordinar</span>
                    </div>
                  </div>
                </div>

                {/* Total highlight */}
                <div style={{ margin: '0 22px 16px', padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', border: `1px solid ${belowMinimum ? '#fca5a5' : '#fbcfe8'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: FF }}>Total a pagar</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: belowMinimum ? '#dc2626' : PINK, fontFamily: FF, letterSpacing: '-0.03em' }}>{formatPrice(total)}</span>
                </div>
                {belowMinimum && (
                  <p style={{ margin: '0 22px 12px', fontSize: 12, color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: 10, border: '1px solid #fecaca', fontFamily: FF, lineHeight: 1.45 }}>
                    ⚠ {minimumOrderMessage(subtotal, total)}
                  </p>
                )}

                {/* Coupon */}
                {!couponApplied && (
                  <div style={{ padding: '0 22px 16px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', fontFamily: FF, textTransform: 'uppercase', letterSpacing: '0.05em' }}>¿Tenés un cupón?</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                        className="ck-input-placeholder"
                        style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${couponError ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 10, fontSize: 13, outline: 'none', color: '#111', background: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: FF, fontWeight: 600 }}
                        onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.08)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = couponError ? '#fca5a5' : '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        style={{ padding: '10px 18px', background: couponCode.trim() ? `linear-gradient(135deg, ${PINK}, #c0547a)` : '#e5e7eb', color: couponCode.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: couponCode.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', opacity: couponLoading ? 0.6 : 1, fontFamily: FF, transition: 'all .2s', boxShadow: couponCode.trim() ? '0 4px 12px rgba(227,150,191,0.2)' : 'none' }}
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444', fontFamily: FF }}>⚠ {couponError}</p>}
                  </div>
                )}

                {/* Agency badge */}
                <div style={{ margin: '0 22px 14px', padding: '10px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(227,150,191,0.06), rgba(249,168,212,0.1))', border: '1px solid #fce7f3', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: PINK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fce7f3' }}>
                    <Truck size={13} color={PINK} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: FF }}>Envío por</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111', fontFamily: FF }}>{agency}</p>
                  </div>
                </div>

                {/* Note */}
                <div style={{ padding: '0 22px 16px' }}>
                  <textarea value={customerNote} onChange={e => setCustomerNote(e.target.value)} maxLength={500}
                    placeholder="💬 Notas para tu pedido (opcional)..."
                    className="ck-textarea-placeholder"
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #f3f4f6', borderRadius: 10, resize: 'none', minHeight: 44, maxHeight: 80, outline: 'none', color: '#374151', boxSizing: 'border-box', fontFamily: FF, background: '#f9fafb', transition: 'all .2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(227,150,191,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                {error && <p style={{ margin: '0 22px 12px', fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca', fontFamily: FF }}>⚠ {error}</p>}

                {/* Submit button */}
                <div style={{ padding: '0 22px 20px' }}>
                  <button type="submit" disabled={submitting || belowMinimum || !agency} className="ck-confirm-btn"
                    style={{ display: 'block', width: '100%', padding: '16px 0', backgroundImage: submitting ? 'none' : 'linear-gradient(135deg, #fbcfe8, #f5a8cf, #e396bf, #f5a8cf, #fbcfe8)', backgroundColor: submitting ? '#f5a8cf' : 'transparent', color: '#fff', textAlign: 'center', borderRadius: 16, fontSize: 16, fontWeight: 800, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all .3s', boxSizing: 'border-box', fontFamily: FF, position: 'relative', overflow: 'hidden', backgroundSize: '300% 300%', letterSpacing: '0.02em' }}>
                    {!submitting && <>
                      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                        <span className="ck-orb" /><span className="ck-orb" /><span className="ck-orb" /><span className="ck-orb" /><span className="ck-orb" /><span className="ck-orb" /><span className="ck-orb" />
                        <span className="ck-sparkle" /><span className="ck-sparkle" /><span className="ck-sparkle" /><span className="ck-sparkle" /><span className="ck-sparkle" />
                        <span className="ck-trail" /><span className="ck-trail" /><span className="ck-trail" />
                      </span>
                      <span className="ck-shimmer-line" />
                    </>}
                    <span style={{ position: 'relative', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {submitting ? 'Procesando...' : <><Shield size={16} /> Confirmar pedido</>}
                    </span>
                  </button>
                </div>
              </div>

              {/* Trust card */}
              <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 16, padding: '14px 18px', border: '1px solid #fce7f3', boxShadow: '0 6px 20px rgba(227,150,191,0.06)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={15} color="#16a34a" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#16a34a', fontFamily: FF }}>Compra Protegida</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: FF, lineHeight: 1.3 }}>Recibí el producto o te devolvemos tu dinero</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={15} color={PINK} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: PINK, fontFamily: FF }}>Envío a todo Chile</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: FF, lineHeight: 1.3 }}>Despacho rápido a tu dirección</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RefreshCw size={15} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#3b82f6', fontFamily: FF }}>Devolución fácil</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontFamily: FF, lineHeight: 1.3 }}>Cambios y devoluciones sin complicaciones</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
      </div>
    </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ background: 'linear-gradient(180deg, #fdf2f8 0%, #fff 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FF }}><p style={{ color: '#f5a8cf' }}>Cargando...</p></div>}>
      <CheckoutInner />
    </Suspense>
  );
}
