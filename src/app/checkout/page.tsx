'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, MapPin, Package, ChevronDown, ChevronRight, Shield, Truck, RefreshCw, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION, SEQUENCES_COLLECTION, COUPONS_COLLECTION, PRODUCTS_COLLECTION, formatPrice, ID } from '@/lib/appwrite';
import { ADDRESSES_COLLECTION_ID } from '@/lib/appwrite-admin';
import { CHILE_REGIONES } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Query } from 'appwrite';
import Image from 'next/image';
import Link from 'next/link';

interface AgencyOption { name: string; color: string; bg: string; desc: string; logo: string; active?: boolean; }
interface SavedAddress { id: string; alias: string; name: string; phone: string; fullAddress: string; commune: string; region: string; lat: number; lng: number; }

const DEFAULT_AGENCIES: AgencyOption[] = [
  { name: 'STARKEN',          color: '#1a7f37', bg: '#e6f4ea', desc: 'Entrega rápida y confiable',   logo: 'https://media.licdn.com/dms/image/v2/C510BAQGf7frAaAcogw/company-logo_200_200/company-logo_200_200/0/1631323622266?e=2147483647&v=beta&t=PQt6O5DgEP72brYnRu0ypoR_k9rrAIQ7XAHmQL0Q1uM', active: true },
  { name: 'BLUEXPRESS',       color: '#1558b0', bg: '#e8f0fe', desc: 'Servicio express premium',    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz2T8HSqmWqmSShlCx8iGNP2tkT_OGLK4cdg&s', active: true },
  { name: 'VARMONTT',         color: '#c62828', bg: '#fce8e6', desc: 'Cobertura nacional completa', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPQN4hjn8F2PQXVmphZVnstiaQTEs4ILyArmNbu1DjCaj2EfwPxnUnEWLEUivCr_95IE&usqp=CAU', active: true },
  { name: 'RETIRO EN TIENDA', color: '#e65c00', bg: '#fff3e0', desc: 'Retira en nuestra sucursal',  logo: '', active: true },
];

function loadAgencies(): AgencyOption[] {
  try {
    // Try admin agencies first (shippingAgencies from admin panel)
    const adminStored = localStorage.getItem('shippingAgencies');
    if (adminStored) {
      const parsed = JSON.parse(adminStored);
      // Convert admin format to checkout format
      const agencies: AgencyOption[] = parsed.map((a: any) => ({
        name: a.name || '',
        color: a.color || '#3483fa',
        bg: a.backgroundColor || '#e8f0fe',
        desc: a.description || '',
        logo: a.logoUrl || '',
        active: a.isActive !== false,
      })).filter((a: AgencyOption) => a.active && a.name);
      if (agencies.length > 0) return agencies;
    }
    
    // Fallback to old store_agencies key
    const stored = localStorage.getItem('store_agencies');
    if (stored) {
      const parsed: AgencyOption[] = JSON.parse(stored);
      const active = parsed.filter(a => a.active !== false);
      if (active.length > 0) return active;
    }
  } catch {}
  return DEFAULT_AGENCIES;
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, outline: 'none', color: '#333', background: '#fff', boxSizing: 'border-box', transition: 'border-color .15s' };
const selectStyle: React.CSSProperties = { ...inp, appearance: 'none', paddingRight: 32, backgroundColor: '#fff', color: '#333' };
const optionStyle: React.CSSProperties = { backgroundColor: '#fff', color: '#333' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 };

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountParam = parseFloat(searchParams.get('discount') || '0');
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '', rut: '', phone: '', email: '',
    region: '', comuna: '', address: '', additionalInfo: '',
  });
  const [customerNote, setCustomerNote] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [agencies, setAgencies] = useState<AgencyOption[]>(DEFAULT_AGENCIES);
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

  useEffect(() => {
    if (items.length === 0 && !submittedRef.current) router.push('/carrito');
  }, [items, router]);

  useEffect(() => {
    const loaded = loadAgencies();
    setAgencies(loaded);
    if (loaded.length > 0) setAgency(loaded[0].name);
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
      const res = await databases.listDocuments(databaseId, COUPONS_COLLECTION, [
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
      const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION, [Query.limit(1)]);
      return (res.total || 0) + 1;
    } catch {
      return Math.floor(Date.now() / 1000) % 100000;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.region || !form.comuna) { setError('Selecciona región y comuna'); return; }
    if (!form.name || !form.rut || !form.phone) { setError('Completa todos los campos obligatorios'); return; }
    setSubmitting(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const orderIndex = await getNextOrderIndex();
      const orderCode = `ORD-${String(orderIndex).padStart(5, '0')}`;
      const now = Date.now();
      const expiresAt = now + 3 * 60 * 60 * 1000;
      const itemsData = items.map(i => {
        const price = i.product.CURRENTPRICE && i.product.CURRENTPRICE > 0 ? i.product.CURRENTPRICE : i.product.PRICE;
        return { id: i.product.$id, name: i.product.NAME, price, originalPrice: i.product.PRICE !== price ? i.product.PRICE : null, qty: i.quantity, img: i.product.IMAGEURL, total: price * i.quantity };
      });
      const docId = await databases.createDocument(databaseId, ORDERS_COLLECTION, ID.unique(), {
        USERID: 'guest', ITEMS: JSON.stringify(itemsData),
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
          const productDoc = await databases.getDocument(databaseId, PRODUCTS_COLLECTION, item.product.$id);
          const currentStock = (productDoc as any).STOCK ?? 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await databases.updateDocument(databaseId, PRODUCTS_COLLECTION, item.product.$id, { STOCK: newStock });
        } catch (stockErr) {
          console.error('Error updating stock for product', item.product.$id, stockErr);
        }
      }

      // Mark coupon as used (increment counter and deactivate)
      if (couponDocId) {
        try {
          const couponDoc = await databases.getDocument(databaseId, COUPONS_COLLECTION, couponDocId);
          await databases.updateDocument(databaseId, COUPONS_COLLECTION, couponDocId, {
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
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '20px 4%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}>
          <Link href="/" style={{ color: '#3483fa', textDecoration: 'none' }}>Inicio</Link>
          <ChevronRight size={12} color="#999" />
          <Link href="/carrito" style={{ color: '#3483fa', textDecoration: 'none' }}>Carrito</Link>
          <ChevronRight size={12} color="#999" />
          <span style={{ color: '#666' }}>Finalizar compra</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── LEFT ── */}
            <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Shipping agencies */}
              <div style={{ background: '#fff', borderRadius: 4, padding: '20px 22px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={17} color="#3483fa" /> Selecciona agencia de envío
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {agencies.map((ag: AgencyOption) => {
                    const sel = agency === ag.name;
                    return (
                      <button type="button" key={ag.name} onClick={() => setAgency(ag.name)}
                        style={{ padding: '14px 16px', border: `2px solid ${sel ? ag.color : '#e0e0e0'}`, borderRadius: 8, background: sel ? ag.bg : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', position: 'relative' }}>
                        {sel && <span style={{ position: 'absolute', top: 8, right: 10, width: 16, height: 16, borderRadius: '50%', background: ag.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>}
                        {ag.logo ? (
                          <div style={{ width: 48, height: 28, position: 'relative', marginBottom: 8 }}>
                            <Image src={ag.logo} alt={ag.name} fill style={{ objectFit: 'contain', objectPosition: 'left' }} unoptimized />
                          </div>
                        ) : (
                          <div style={{ width: 48, height: 28, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ag.bg, borderRadius: 4 }}>
                            <Package size={16} color={ag.color} />
                          </div>
                        )}
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
                <div style={{ background: '#fff', borderRadius: 4, padding: '20px 22px' }}>
                  <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={17} color="#3483fa" /> Selecciona dirección de envío
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                    {savedAddresses.map((addr) => {
                      const sel = selectedAddressId === addr.id;
                      const aliasIcon = addr.alias === 'Casa' ? '🏠' : addr.alias === 'Trabajo' ? '💼' : '📍';
                      return (
                        <button type="button" key={addr.id} onClick={() => selectAddress(addr)}
                          style={{ padding: '14px 16px', border: `2px solid ${sel ? '#3483fa' : '#e0e0e0'}`, borderRadius: 8, background: sel ? '#f0f5ff' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', position: 'relative' }}>
                          {sel && <span style={{ position: 'absolute', top: 8, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#3483fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>{aliasIcon}</span>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: sel ? '#3483fa' : '#333' }}>{addr.alias}</p>
                          </div>
                          <p style={{ margin: '0 0 3px', fontSize: 12, color: '#555', lineHeight: 1.3 }}>{addr.fullAddress}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{addr.commune}{addr.region ? `, ${addr.region}` : ''}</p>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { setShowingNewAddress(true); setSelectedAddressId(null); setForm({ name: '', rut: '', phone: '', email: '', region: '', comuna: '', address: '', additionalInfo: '' }); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1px dashed #3483fa', borderRadius: 6, color: '#3483fa', fontSize: 13, fontWeight: 600, background: '#f0f5ff', transition: 'all .15s', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f0ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f5ff'; }}>
                    <Plus size={14} /> Agregar nueva dirección
                  </button>
                </div>
              )}

              {/* Personal data */}
              <div style={{ background: '#fff', borderRadius: 4, padding: '20px 22px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={17} color="#3483fa" /> Datos personales
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Nombre completo *</label>
                    <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan Pérez" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                  <div>
                    <label style={label}>RUT *</label>
                    <input required value={form.rut} onChange={e => set('rut', formatRut(e.target.value))} placeholder="12.345.678-9" maxLength={12} style={inp}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                  <div>
                    <label style={label}>Teléfono *</label>
                    <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56 9 1234 5678" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Email (para notificaciones)</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                </div>
              </div>

              {/* Shipping address - only show if no saved addresses OR user is adding new */}
              {(savedAddresses.length === 0 || showingNewAddress) && (
                <div style={{ background: '#fff', borderRadius: 4, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={17} color="#3483fa" /> Dirección de envío
                    </h2>
                    {showingNewAddress && savedAddresses.length > 0 && (
                      <button type="button" onClick={() => { setShowingNewAddress(false); if (savedAddresses.length > 0) { setSelectedAddressId(savedAddresses[0].id); fillFormFromAddress(savedAddresses[0]); } }}
                        style={{ padding: '6px 12px', border: '1px solid #3483fa', borderRadius: 6, color: '#3483fa', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f5ff'; }}
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
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')}>
                      <option value="" style={optionStyle}>Selecciona región</option>
                      {Object.keys(CHILE_REGIONES).map(r => <option key={r} value={r} style={optionStyle}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, bottom: 12, color: '#999', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <label style={label}>Comuna *</label>
                    <select required value={form.comuna} onChange={e => set('comuna', e.target.value)} disabled={!form.region}
                      style={{ ...selectStyle, opacity: form.region ? 1 : 0.5 }}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')}>
                      <option value="" style={optionStyle}>Selecciona comuna</option>
                      {comunas.map(c => <option key={c} value={c} style={optionStyle}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 10, bottom: 12, color: '#999', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Dirección *</label>
                    <input required value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle, número, departamento" style={inp}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={label}>Información adicional (opcional)</label>
                    <textarea value={form.additionalInfo} onChange={e => set('additionalInfo', e.target.value)}
                      placeholder="Referencias, instrucciones para la entrega..." rows={2}
                      style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
                      onFocus={e => (e.target.style.borderColor = '#3483fa')} onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  </div>
                </div>
                </div>
              )}

            </div>

            {/* ── RIGHT: order summary ── */}
            <div style={{ width: 296, flexShrink: 0, position: 'sticky', top: 20 }}>
              <div style={{ background: '#fff', borderRadius: 4, padding: '20px 18px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#333' }}>Resumen de compra</h2>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  {items.map(item => {
                    const price = item.product.CURRENTPRICE && item.product.CURRENTPRICE > 0 ? item.product.CURRENTPRICE : item.product.PRICE;
                    return (
                      <div key={item.product.$id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: 44, height: 44, background: '#f9f9f9', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                          {item.product.IMAGEURL
                            ? <Image src={item.product.IMAGEURL} alt={item.product.NAME} fill style={{ objectFit: 'contain', padding: 3 }} />
                            : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</span>}
                          <span style={{ position: 'absolute', top: -4, right: -4, background: '#666', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                        </div>
                        <p style={{ flex: 1, margin: 0, fontSize: 12, color: '#555', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.product.NAME}</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#333', flexShrink: 0 }}>{formatPrice(price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#666' }}>Productos ({totalItems})</span>
                    <span style={{ color: '#333' }}>{formatPrice(subtotal)}</span>
                  </div>
                  {discountParam > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#00a650' }}>Descuento</span>
                      <span style={{ color: '#00a650', fontWeight: 600 }}>-{formatPrice(discountParam)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#00a650', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Cupón {couponApplied}
                        <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>quitar</button>
                      </span>
                      <span style={{ color: '#00a650', fontWeight: 600 }}>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#999' }}>Envío</span>
                    <span style={{ color: '#00a650', fontSize: 12 }}>A coordinar</span>
                  </div>
                </div>

                {/* Coupon input */}
                {!couponApplied && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                        placeholder="Código de cupón"
                        style={{ flex: 1, padding: '8px 10px', border: `1px solid ${couponError ? '#e53935' : '#e0e0e0'}`, borderRadius: 4, fontSize: 13, outline: 'none', color: '#333', background: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        style={{ padding: '8px 14px', background: couponCode.trim() ? '#3483fa' : '#e0e0e0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: couponCode.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', opacity: couponLoading ? 0.6 : 1 }}
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#e53935' }}>{couponError}</p>}
                  </div>
                )}

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#333' }}>Total</span>
                  <span style={{ fontSize: 22, fontWeight: 300, color: '#333' }}>{formatPrice(total)}</span>
                </div>

                {/* Agencia seleccionada */}
                <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={14} color="#666" />
                  <span style={{ fontSize: 12, color: '#555' }}>Agencia: <strong style={{ color: '#333' }}>{agency}</strong></span>
                </div>

                {/* Customer note + gift */}
                <div style={{ marginBottom: 14 }}>
                  <textarea value={customerNote} onChange={e => setCustomerNote(e.target.value)} maxLength={500}
                    placeholder="Notas para tu pedido (opcional)..."
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e0e0e0', borderRadius: 6, resize: 'vertical', minHeight: 50, maxHeight: 120, outline: 'none', color: '#333', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = '#3483fa')}
                    onBlur={e => (e.target.style.borderColor = '#e0e0e0')} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: 13, color: '#555' }}>
                    <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#3483fa' }} />
                    <span>🎁 Es un regalo (envolver como obsequio)</span>
                  </label>
                </div>

                {error && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#e53935', background: '#fff5f5', padding: '8px 10px', borderRadius: 4, border: '1px solid #ffcdd2' }}>{error}</p>}

                <button type="submit" disabled={submitting}
                  style={{ display: 'block', width: '100%', padding: '14px 0', background: submitting ? '#7ab3f8' : '#3483fa', color: '#fff', textAlign: 'center', borderRadius: 6, fontSize: 16, fontWeight: 600, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background .15s', boxSizing: 'border-box' }}
                  onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#2968c8'; }}
                  onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#3483fa'; }}>
                  {submitting ? 'Procesando...' : 'Confirmar pedido'}
                </button>

                {/* Trust badges */}
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <Shield size={13} color="#00a650" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}><strong style={{ color: '#00a650' }}>Compra Protegida</strong> — recibe el producto o te devolvemos el dinero.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Truck size={13} color="#3483fa" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#666' }}>Envío a todo Chile</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ background: '#ebebeb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#999' }}>Cargando...</p></div>}>
      <CheckoutInner />
    </Suspense>
  );
}
