'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import Link from 'next/link';
import { getServices, getAppwriteConfig, STOCK_ALERTS_COLLECTION_ID, INVENTORY_PRODUCTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID, PRODUCTS_COLLECTION_ID, USERS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { normalizeStockAlert, type StockAlert } from '@/lib/stock-alerts';
import { getSkuFromFeatures, getWarehouseLocationFromFeatures } from '@/lib/product-features';
import { Search, RefreshCw, Package, AlertTriangle, Users, Bell, CheckCircle, XCircle, User, ChevronRight, ArrowLeft, Clock, Eye, Sparkles, ExternalLink, Lock } from 'lucide-react';

interface StockAlertView extends StockAlert {
  sku?: string;
  section?: number | null;
  gondola?: string | null;
  currentStock?: number;
  inCatalog?: boolean;
}

interface GroupedUser {
  userId: string;
  userName: string;
  email: string;
  requests: StockAlertView[];
  pendingCount: number;
}

export default function CatalogProductsPage() {
  const [alerts, setAlerts] = useState<StockAlertView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<Record<string, string>>({});
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const allDocs: any[] = [];
      let offset = 0;
      while (true) {
        const r = await databases.listDocuments(databaseId, STOCK_ALERTS_COLLECTION_ID, [Query.limit(2000), Query.offset(offset)]);
        allDocs.push(...r.documents);
        if (r.documents.length < 2000) break;
        offset += 2000;
      }
      
      const rawAlerts = allDocs.map((d: any) => normalizeStockAlert(d));
      
      const uniqueProductIds = Array.from(new Set(rawAlerts.map(a => a.productId).filter(Boolean)));
      const uniqueUserIds = Array.from(new Set(rawAlerts.map(a => a.userId).filter(id => id && !id.includes('@'))));
      
      // 1. Fetch Products — try INVENTORY_PRODUCTS first, then PRODUCTS (catalog) as fallback
      const productMap: Record<string, { name: string; image: string; sku?: string; section?: number | null; gondola?: string; stock?: number; inCatalog?: boolean }> = {};
      const productChunks: string[][] = [];
      for (let i = 0; i < uniqueProductIds.length; i += 100) {
        productChunks.push(uniqueProductIds.slice(i, i + 100));
      }

      // Helper to extract image from a document
      const extractImage = (p: any): string => {
        if (p.IMAGES) {
          try {
            const parsed = JSON.parse(p.IMAGES);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
          } catch {
            if (typeof p.IMAGES === 'string' && p.IMAGES.startsWith('http')) return p.IMAGES;
          }
        }
        return p.IMAGEURL || p.IMAGEURL2 || p.IMAGE_URL || p.imageUrl || p.image || p.IMAGE || '';
      };

      // Pass 1: search in inventory_products
      for (const chunk of productChunks) {
        try {
          const res = await databases.listDocuments(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, [
            Query.equal('$id', chunk),
            Query.limit(100),
          ]);
          res.documents.forEach((p: any) => {
            const skuVal = getSkuFromFeatures(p.FEATURES, p.TAGS, p.jumpseller_id, p.sku);
            const locVal = getWarehouseLocationFromFeatures(p.FEATURES, p.section ?? null);
            productMap[p.$id] = {
              name: p.NAME || p.name || '',
              image: extractImage(p),
              sku: skuVal || '',
              section: locVal.section,
              gondola: locVal.gondola || '?',
              stock: p.STOCK ?? 0,
              inCatalog: false,
            };
          });
        } catch (e) {
          console.error('Error loading inventory_products chunk', e);
        }
      }

      // Pass 2: for IDs still missing a name, try PRODUCTS_COLLECTION_ID (catalog)
      const missingIds = uniqueProductIds.filter(id => !productMap[id] || !productMap[id].name);
      const missingChunks: string[][] = [];
      for (let i = 0; i < missingIds.length; i += 100) {
        missingChunks.push(missingIds.slice(i, i + 100));
      }
      for (const chunk of missingChunks) {
        try {
          const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION_ID, [
            Query.equal('$id', chunk),
            Query.limit(100),
          ]);
          res.documents.forEach((p: any) => {
            const existing = productMap[p.$id] || {};
            productMap[p.$id] = {
              name: p.name || p.NAME || p.title || p.TITLE || existing.name || '',
              image: existing.image || extractImage(p),
              sku: existing.sku || p.sku || p.SKU || '',
              section: existing.section ?? null,
              gondola: existing.gondola || '?',
              stock: existing.stock ?? p.stock ?? p.STOCK ?? 0,
              inCatalog: true, // This product exists in the published catalog
            };
          });
        } catch (e) {
          console.error('Error loading products (catalog) chunk', e);
        }
      }

      // 2. Fetch Users
      const userMap: Record<string, { name: string; email: string }> = {};
      const userChunks: string[][] = [];
      for (let i = 0; i < uniqueUserIds.length; i += 100) {
        userChunks.push(uniqueUserIds.slice(i, i + 100));
      }
      
      for (const chunk of userChunks) {
        try {
          const res = await databases.listDocuments(databaseId, USERS_COLLECTION_ID, [
            Query.equal('userId', chunk),
            Query.limit(100),
          ]);
          res.documents.forEach((u: any) => {
            userMap[u.userId] = {
              name: u.name || u.NAME || 'Usuario sin nombre',
              email: u.email || u.EMAIL || '',
            };
          });
        } catch (e) {
          console.error('Error loading users chunk', e);
        }
      }
      
      // 3. Map alerts with resolved info
      const resolvedAlerts = rawAlerts.map(a => {
        const pInfo = productMap[a.productId];
        const uInfo = userMap[a.userId];
        
        let email = a.email;
        let userName = a.userName;
        
        if (a.userId && a.userId.includes('@')) {
          email = a.userId;
          userName = a.userId.split('@')[0];
        } else if (uInfo) {
          email = uInfo.email;
          userName = uInfo.name;
        }
        
        return {
          ...a,
          // Use pInfo name if found, then fall back to what the alert itself stored, then placeholder
          productName: (pInfo?.name && pInfo.name.trim()) ? pInfo.name : (a.productName && a.productName !== 'Producto sin nombre' ? a.productName : (pInfo ? 'Producto en catálogo' : 'Producto sin nombre')),
          productImage: pInfo?.image || a.productImage || '',
          sku: pInfo?.sku || '',
          section: pInfo?.section,
          gondola: pInfo?.gondola,
          currentStock: pInfo?.stock ?? 0,
          inCatalog: pInfo?.inCatalog ?? false,
          email: email || 'Invitado',
          userName: userName || email?.split('@')[0] || 'Cliente sin nombre',
        };
      });
      
      setAlerts(resolvedAlerts);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group alerts by user
  const groupedUsers: GroupedUser[] = (() => {
    const map: Record<string, StockAlertView[]> = {};
    alerts.forEach(a => {
      const key = a.userId || a.email;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map).map(([userId, reqs]) => ({
      userId,
      userName: reqs[0].userName || reqs[0].email.split('@')[0],
      email: reqs[0].email,
      requests: reqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      pendingCount: reqs.filter(r => r.status === 'pending').length,
    })).sort((a, b) => b.pendingCount - a.pendingCount);
  })();

  const filteredUsers = groupedUsers.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.userName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalPending = alerts.filter(a => a.status === 'pending').length;
  const totalAvailable = alerts.filter(a => a.status === 'available').length;
  const totalUnavailable = alerts.filter(a => a.status === 'unavailable').length;

  const handleMarkAvailable = async (req: StockAlertView) => {
    if (!req.currentStock || req.currentStock <= 0) {
      window.alert('No hay stock registrado en el inventario para este producto. Agrégalo primero.');
      return;
    }
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      try {
        await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, { STATUS: 'available' });
      } catch (err: any) {
        if (err?.message?.includes('Unknown attribute') || err?.message?.includes('unknown attribute')) {
          await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, { status: 'available' });
        } else throw err;
      }

      // ── Rich notification con imagen, nombre y link al producto ──
      if (req.userId) {
        const notifData: any = {
          userId: req.userId,
          title: '🎉 ¡Tu producto ya tiene stock!',
          message: `¡Buenas noticias! "${req.productName}" que tenías en tu lista de espera ya está disponible. Hay ${req.currentStock} unidad(es) en stock. ¡No te quedes sin él!`,
          type: 'success',
          isRead: false,
          linkUrl: `/producto/${req.productId}`,
        };
        // Añadir imagen si está disponible
        if (req.productImage) {
          notifData.imageUrl = req.productImage;
        }
        await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), notifData);
      }

      setAlerts(prev => prev.map(a => a.$id === req.$id ? { ...a, status: 'available', notified: true } : a));
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkUnavailable = async (req: StockAlertView) => {
    if (!confirm(`¿Marcar "${req.productName}" como sin stock y notificar al cliente?`)) return;
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      try {
        await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, { STATUS: 'unavailable' });
      } catch (err: any) {
        if (err?.message?.includes('Unknown attribute') || err?.message?.includes('unknown attribute')) {
          await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, { status: 'unavailable' });
        } else throw err;
      }

      // ── Rich notification con imagen, nombre y link al producto ──
      if (req.userId) {
        const notifData: any = {
          userId: req.userId,
          title: '😔 Producto sin stock por ahora',
          message: `Lamentamos informarte que "${req.productName}" no tiene existencia actualmente. Lo vigilaremos de cerca y te avisaremos en cuanto vuelva a estar disponible. ¡Gracias por tu paciencia!`,
          type: 'warning',
          isRead: false,
          linkUrl: `/producto/${req.productId}`,
        };
        // Añadir imagen si está disponible
        if (req.productImage) {
          notifData.imageUrl = req.productImage;
        }
        await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), notifData);
      }

      setAlerts(prev => prev.map(a => a.$id === req.$id ? { ...a, status: 'unavailable', notified: true } : a));
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const timeAgo = (ts: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  };

  if (isLoading) return (
    <div className="admin-main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: '#6366f1' }} />
    </div>
  );

  if (error) return (
    <div className="admin-main-content" style={{ padding: 24 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertTriangle size={20} color="#ef4444" />
        <span style={{ color: '#991b1b', fontSize: 14 }}>{error}</span>
      </div>
    </div>
  );

  // ── En mobile, si hay un usuario seleccionado mostramos solo el panel de detalle ──
  const showUserList = !isMobile || !selectedUser;
  const showUserDetail = !isMobile || !!selectedUser;

  return (
    <div className="admin-main-content" style={{ padding: isMobile ? '16px 12px' : '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: '#111827', margin: 0 }}>Consultas de Disponibilidad</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            Clientes que consultaron productos del catálogo
          </p>
        </div>
        <button onClick={load} style={{ padding: '8px 12px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 14 : 20 }}>
        <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 10, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#c0547a', textTransform: 'uppercase', letterSpacing: '.5px' }}>Pendientes</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#be185d', marginTop: 2 }}>{totalPending}</div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.5px' }}>Con Stock</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#15803d', marginTop: 2 }}>{totalAvailable}</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.5px' }}>Sin Stock</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#b91c1c', marginTop: 2 }}>{totalUnavailable}</div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: isMobile ? 12 : 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.5px' }}>Clientes</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#1d4ed8', marginTop: 2 }}>{groupedUsers.length}</div>
        </div>
      </div>

      {/* Search — only show when on user list panel */}
      {showUserList && (
        <div style={{ position: 'relative', marginBottom: 12, maxWidth: isMobile ? '100%' : 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* Two-panel layout — stacked on mobile */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, minHeight: isMobile ? 'auto' : 500 }}>

        {/* Panel 1: User list */}
        {showUserList && (
          <div style={{
            flex: (!isMobile && selectedUser) ? '0 0 300px' : 1,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="#6366f1" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Clientes ({filteredUsers.length})</span>
            </div>
            <div style={{ maxHeight: isMobile ? 320 : 600, overflowY: 'auto' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Package size={32} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin consultas aún</p>
                </div>
              ) : filteredUsers.map(u => (
                <div key={u.userId} onClick={() => setSelectedUser(u)}
                  style={{
                    padding: '11px 14px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                    background: selectedUser?.userId === u.userId ? '#f0f0ff' : 'transparent',
                    transition: 'background .15s',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={e => { if (selectedUser?.userId !== u.userId) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (selectedUser?.userId !== u.userId) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={16} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.userName}</p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    {u.pendingCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fdf2f8', color: '#c0547a', padding: '2px 7px', borderRadius: 10, border: '1px solid #fbcfe8' }}>
                        {u.pendingCount} pend.
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{u.requests.length} total</span>
                  </div>
                  <ChevronRight size={14} color="#d1d5db" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel 2: User detail */}
        {showUserDetail && (
          <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            {selectedUser ? (
              <>
                {/* Detail header */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowLeft size={16} color="#6b7280" />
                  </button>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={15} color="#6366f1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.userName}</p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.email}</p>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '3px 9px', borderRadius: 10 }}>
                    {selectedUser.requests.length} consulta{selectedUser.requests.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Requests list */}
                <div style={{ maxHeight: isMobile ? 'none' : 600, overflowY: 'auto', padding: isMobile ? 10 : 12 }}>
                  {selectedUser.requests.map(a => (
                    <div key={a.$id} style={{
                      background: a.status === 'pending' ? '#fffbf5' : a.status === 'available' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${a.status === 'pending' ? '#fbcfe8' : a.status === 'available' ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: 10, padding: isMobile ? 11 : 14, marginBottom: 10,
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {/* Product image */}
                        {a.productImage ? (
                          <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => setZoomImageUrl(a.productImage)} title="Click para ampliar">
                            <img src={a.productImage} alt={a.productName} style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: 8, objectFit: 'cover' }} />
                            <div style={{
                              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
                            }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}>
                              <Eye size={14} color="#fff" />
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={20} color="#9ca3af" />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Name + status badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#111827', margin: 0, flex: 1, minWidth: 0 }}>
                              {a.productName}
                            </p>
                            {a.status === 'pending' && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#fdf2f8', color: '#c0547a', padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', border: '1px solid #fbcfe8', flexShrink: 0 }}>
                                Pendiente
                              </span>
                            )}
                            {a.status === 'available' && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                <CheckCircle size={10} /> Con Stock
                              </span>
                            )}
                            {a.status === 'unavailable' && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                <XCircle size={10} /> Sin Stock
                              </span>
                            )}
                          </div>

                          {/* SKU and Location */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                            {a.sku && (
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#4b5563', background: '#f3f4f6', padding: '2px 5px', borderRadius: 4 }}>
                                SKU: {a.sku}
                              </span>
                            )}
                            {a.section !== undefined && a.section !== null && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#0369a1', background: '#e0f2fe', padding: '2px 5px', borderRadius: 4 }}>
                                📍 Sec: {a.section} · Gónd: {a.gondola || '?'}
                              </span>
                            )}
                            {/* Badge: producto ya publicado en el catálogo */}
                            {a.inCatalog && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: '#065f46',
                                background: '#d1fae5', border: '1px solid #6ee7b7',
                                padding: '2px 7px', borderRadius: 10,
                                display: 'flex', alignItems: 'center', gap: 3,
                                whiteSpace: 'nowrap',
                              }}>
                                <CheckCircle size={10} /> Ya en catálogo
                              </span>
                            )}
                            {/* Link directo al producto en el catálogo */}
                            {a.inCatalog && a.productId && (
                              <Link
                                href={`/producto/${a.productId}`}
                                target="_blank"
                                style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}
                              >
                                <ExternalLink size={10} /> Ver producto
                              </Link>
                            )}
                          </div>

                          <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {timeAgo(a.createdAt)}
                          </div>

                          {/* Action buttons */}
                          {a.status === 'pending' && (
                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Ir a Inventario */}
                              <Link
                                href={`/inventario?search=${encodeURIComponent(a.sku || a.productName)}`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: isMobile ? '7px 10px' : '8px 12px',
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(139, 92, 246) 100%)',
                                  color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 600, textDecoration: 'none',
                                  boxShadow: 'rgba(99, 102, 241, 0.3) 0px 2px 8px',
                                }}
                              >
                                <ExternalLink size={15} /> {isMobile ? 'Inventario' : 'Ir a Inventario'}
                              </Link>

                              {/* Hay Stock */}
                              {a.currentStock && a.currentStock > 0 ? (
                                <button
                                  onClick={() => handleMarkAvailable(a)}
                                  disabled={processingId === a.$id}
                                  style={{
                                    padding: isMobile ? '7px 10px' : '7px 12px', border: 'none', borderRadius: 6,
                                    fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                    background: '#16a34a', color: '#fff', cursor: processingId === a.$id ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                  }}
                                >
                                  <CheckCircle size={12} /> {isMobile ? `Stock (${a.currentStock})` : `Notificar Stock (${a.currentStock} ud)`}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                  <button
                                    disabled
                                    style={{
                                      padding: isMobile ? '7px 10px' : '7px 12px', border: 'none', borderRadius: 6,
                                      fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                      background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed',
                                      display: 'flex', alignItems: 'center', gap: 5,
                                    }}
                                  >
                                    <Lock size={11} /> Bloqueado
                                  </button>
                                  {!isMobile && (
                                    <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>⚠️ Agrega stock</span>
                                  )}
                                </div>
                              )}

                              {/* No Hay Stock */}
                              <button
                                onClick={() => handleMarkUnavailable(a)}
                                disabled={processingId === a.$id}
                                style={{
                                  padding: isMobile ? '7px 10px' : '7px 12px', border: '1px solid #fecaca', borderRadius: 6,
                                  fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                  background: '#fff', color: '#dc2626', cursor: processingId === a.$id ? 'wait' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                <XCircle size={12} /> No Hay
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, padding: 32 }}>
                <Bell size={36} color="#d1d5db" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', margin: 0 }}>Selecciona un cliente</p>
                <p style={{ fontSize: 12, color: '#d1d5db', margin: '4px 0 0' }}>Para ver sus consultas de disponibilidad</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(4px)',
            zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <img
              src={zoomImageUrl}
              alt="Zoomed"
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
            <button
              onClick={() => setZoomImageUrl(null)}
              style={{
                position: 'absolute', top: -14, right: -14, background: '#fff', border: 'none', borderRadius: '50%',
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)', cursor: 'pointer', color: '#374151', fontWeight: 'bold', fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
