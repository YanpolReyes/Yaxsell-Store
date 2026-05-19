'use client';

import { useEffect, useState, useCallback } from 'react';
import { Query, ID } from 'appwrite';
import { getServices, getAppwriteConfig, STOCK_ALERTS_COLLECTION_ID, INVENTORY_PRODUCTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Search, RefreshCw, Package, AlertTriangle, Users, Bell, CheckCircle, XCircle, User, ChevronRight, ArrowLeft, Clock } from 'lucide-react';

interface StockAlert {
  $id: string;
  PRODUCTID: string;
  PRODUCTNAME: string;
  PRODUCTIMAGE: string;
  USERID: string;
  USERNAME: string;
  EMAIL: string;
  STATUS: string;
  CREATEDAT: number;
  NOTIFIED: boolean;
}

interface GroupedUser {
  userId: string;
  userName: string;
  email: string;
  requests: StockAlert[];
  pendingCount: number;
}

export default function CatalogProductsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<GroupedUser | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<Record<string, string>>({});

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
      setAlerts(allDocs as unknown as StockAlert[]);
    } catch (e: any) { setError(e.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group alerts by user
  const groupedUsers: GroupedUser[] = (() => {
    const map: Record<string, StockAlert[]> = {};
    alerts.forEach(a => {
      const key = a.USERID || a.EMAIL;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map).map(([userId, reqs]) => ({
      userId,
      userName: reqs[0].USERNAME || reqs[0].EMAIL.split('@')[0],
      email: reqs[0].EMAIL,
      requests: reqs.sort((a, b) => (b.CREATEDAT || 0) - (a.CREATEDAT || 0)),
      pendingCount: reqs.filter(r => r.STATUS === 'pending').length,
    })).sort((a, b) => b.pendingCount - a.pendingCount);
  })();

  const filteredUsers = groupedUsers.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.userName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalPending = alerts.filter(a => a.STATUS === 'pending').length;
  const totalAvailable = alerts.filter(a => a.STATUS === 'available').length;
  const totalUnavailable = alerts.filter(a => a.STATUS === 'unavailable').length;

  const handleMarkAvailable = async (req: StockAlert) => {
    const stockVal = stockInput[req.$id];
    if (!stockVal || parseInt(stockVal) <= 0) {
      window.alert('Ingresa una cantidad de stock válida');
      return;
    }
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Update inventory product stock
      await databases.updateDocument(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, req.PRODUCTID, {
        STOCK: parseInt(stockVal),
        ISACTIVE: true,
      });

      // Update alert status
      await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, {
        STATUS: 'available',
        NOTIFIED: true,
      });

      // Send notification to user
      if (req.USERID) {
        await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
          userId: req.USERID,
          title: '¡Producto disponible!',
          message: `El producto "${req.PRODUCTNAME}" que consultaste ya está disponible con stock. ¡Apúrate a comprarlo!`,
          type: 'success',
          isRead: false,
          linkUrl: `/producto/${req.PRODUCTID}`,
        });
      }

      setAlerts(prev => prev.map(a => a.$id === req.$id ? { ...a, STATUS: 'available', NOTIFIED: true } : a));
    } catch (e: any) {
      window.alert('Error: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkUnavailable = async (req: StockAlert) => {
    if (!confirm(`¿Eliminar "${req.PRODUCTNAME}" del inventario y notificar al cliente que no hay stock?`)) return;
    setProcessingId(req.$id);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();

      // Delete the inventory product
      await databases.deleteDocument(databaseId, INVENTORY_PRODUCTS_COLLECTION_ID, req.PRODUCTID);

      // Update alert status
      await databases.updateDocument(databaseId, STOCK_ALERTS_COLLECTION_ID, req.$id, {
        STATUS: 'unavailable',
        NOTIFIED: true,
      });

      // Send notification to user (fake message: "te avisaremos cuando llegue")
      if (req.USERID) {
        await databases.createDocument(databaseId, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
          userId: req.USERID,
          title: 'Producto no disponible',
          message: `Lamentamos informarte que "${req.PRODUCTNAME}" no tiene existencia en stock. Te avisaremos cuando esté disponible nuevamente.`,
          type: 'warning',
          isRead: false,
        });
      }

      setAlerts(prev => prev.map(a => a.$id === req.$id ? { ...a, STATUS: 'unavailable', NOTIFIED: true } : a));
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

  return (
    <div className="admin-main-content" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Consultas de Disponibilidad</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Clientes que consultaron productos del catálogo
          </p>
        </div>
        <button onClick={load} style={{ padding: '8px 12px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '.5px' }}>Pendientes</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#c2410c', marginTop: 4 }}>{totalPending}</div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.5px' }}>Con Stock</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#15803d', marginTop: 4 }}>{totalAvailable}</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.5px' }}>Sin Stock</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#b91c1c', marginTop: 4 }}>{totalUnavailable}</div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.5px' }}>Clientes</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1d4ed8', marginTop: 4 }}>{groupedUsers.length}</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
          style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }} />
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', gap: 16, minHeight: 500 }}>
        {/* Panel 1: User list */}
        <div style={{ flex: selectedUser ? '0 0 320px' : 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="#6366f1" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Clientes ({filteredUsers.length})</span>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Package size={36} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin consultas aún</p>
              </div>
            ) : filteredUsers.map(u => (
              <div key={u.userId} onClick={() => setSelectedUser(u)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                  background: selectedUser?.userId === u.userId ? '#f0f0ff' : 'transparent',
                  transition: 'background .15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onMouseEnter={e => { if (selectedUser?.userId !== u.userId) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (selectedUser?.userId !== u.userId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} color="#6366f1" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.userName}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{u.email}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  {u.pendingCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                      {u.pendingCount} pend.
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{u.requests.length} total</span>
                </div>
                <ChevronRight size={16} color="#d1d5db" />
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: User detail */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <ArrowLeft size={16} color="#6b7280" />
                </button>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="#6366f1" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{selectedUser.userName}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{selectedUser.email}</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '4px 10px', borderRadius: 10 }}>
                  {selectedUser.requests.length} consulta{selectedUser.requests.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ maxHeight: 600, overflowY: 'auto', padding: 12 }}>
                {selectedUser.requests.map(a => (
                  <div key={a.$id} style={{
                    background: a.STATUS === 'pending' ? '#fffbf5' : a.STATUS === 'available' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${a.STATUS === 'pending' ? '#fed7aa' : a.STATUS === 'available' ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: 10, padding: 14, marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Product image */}
                      {a.PRODUCTIMAGE ? (
                        <img src={a.PRODUCTIMAGE} alt={a.PRODUCTNAME} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={22} color="#9ca3af" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {a.PRODUCTNAME}
                          </p>
                          {a.STATUS === 'pending' && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', border: '1px solid #fed7aa' }}>
                              Pendiente
                            </span>
                          )}
                          {a.STATUS === 'available' && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle size={10} /> Con Stock
                            </span>
                          )}
                          {a.STATUS === 'unavailable' && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <XCircle size={10} /> Sin Stock
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {timeAgo(a.CREATEDAT)}
                        </div>

                        {/* Action buttons for pending */}
                        {a.STATUS === 'pending' && (
                          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="number"
                              min="1"
                              placeholder="Stock"
                              value={stockInput[a.$id] || ''}
                              onChange={e => setStockInput(prev => ({ ...prev, [a.$id]: e.target.value }))}
                              style={{ width: 80, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' }}
                            />
                            <button
                              onClick={() => handleMarkAvailable(a)}
                              disabled={processingId === a.$id}
                              style={{
                                padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                background: '#16a34a', color: '#fff', cursor: processingId === a.$id ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <CheckCircle size={13} /> Hay Stock
                            </button>
                            <button
                              onClick={() => handleMarkUnavailable(a)}
                              disabled={processingId === a.$id}
                              style={{
                                padding: '6px 14px', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                background: '#fff', color: '#dc2626', cursor: processingId === a.$id ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <XCircle size={13} /> No Hay
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40 }}>
              <Bell size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#9ca3af', margin: 0 }}>Selecciona un cliente</p>
              <p style={{ fontSize: 12, color: '#d1d5db', margin: '4px 0 0' }}>Para ver sus consultas de disponibilidad</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
