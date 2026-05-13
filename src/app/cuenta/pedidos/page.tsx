'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, ArrowLeft, Loader2, Search, Receipt, RefreshCw, ShoppingCart } from 'lucide-react';
import { getServices, getAppwriteConfig, ORDERS_COLLECTION, formatPrice } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/context/CartContext';
import { Query } from 'appwrite';

const FF = '"Proxima Nova",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pendiente de pago', bg: '#fff8e1', color: '#f57f17' },
  processing: { label: 'En proceso',        bg: '#e3f2fd', color: '#1565c0' },
  paid:       { label: 'Pago confirmado',   bg: '#e8f5e9', color: '#2e7d32' },
  shipped:    { label: 'Despachado',         bg: '#f3e5f5', color: '#7b1fa2' },
  delivered:  { label: 'Entregado',          bg: '#e8f5e9', color: '#1b5e20' },
  cancelled:  { label: 'Cancelado',          bg: '#ffebee', color: '#c62828' },
};

export default function MisPedidosPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // No forzar login - mostrar prompt si no está logueado

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    (async () => {
      setLoading(true);
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, ORDERS_COLLECTION, [
          Query.equal('CUSTOMEREMAIL', user.email),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ]);
        setOrders(res.documents);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [isLoggedIn, user]);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isLoggedIn || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: FF }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
          <Link href="/cuenta" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ArrowLeft size={22} color="#333" />
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#333' }}>Mis Pedidos</span>
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 12px' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <Receipt size={48} color="#3483fa" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#333' }}>Iniciar sesión para ver tus pedidos</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#666' }}>Necesitás una cuenta para acceder a tu historial de compras</p>
            <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', background: '#3483fa', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function reorder(order: any) {
    try {
      const items: any[] = JSON.parse(order.ITEMS || '[]');
      items.forEach((item: any) => {
        if (item.productId && item.name && item.price) {
          addItem({ $id: item.productId, NAME: item.name, PRICE: item.price, IMAGEURL: item.imageUrl || '', STOCK: 99, CURRENTPRICE: 0, DESCRIPTION: '', CATEGORYID: '', SOLDQUANTITY: 0 } as any, item.qty || 1);
        }
      });
      router.push('/carrito');
    } catch { /* silent */ }
  }

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.STATUS !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return o.ORDERCODE?.toLowerCase().includes(q) || o.CUSTOMERNAME?.toLowerCase().includes(q);
  });

  const statusTabs = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'processing', label: 'En proceso' },
    { key: 'paid', label: 'Pagados' },
    { key: 'shipped', label: 'Enviados' },
    { key: 'delivered', label: 'Entregados' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/cuenta" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <ArrowLeft size={22} color="#333" />
        </Link>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#333' }}>Mis Pedidos</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px 40px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} color="#aaa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre..."
            style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {statusTabs.map(tab => {
            const count = tab.key === 'all' ? orders.length : orders.filter(o => o.STATUS === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: statusFilter === tab.key ? '#3483fa' : '#fff',
                  color: statusFilter === tab.key ? '#fff' : '#666',
                  border: `1px solid ${statusFilter === tab.key ? '#3483fa' : '#e0e0e0'}`,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {tab.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={28} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <Receipt size={48} color="#ddd" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#999', fontSize: 15, fontWeight: 600 }}>Sin pedidos aún</p>
            <p style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>
              {search ? 'No encontramos resultados' : 'Aquí aparecerán tus compras'}
            </p>
            {!search && (
              <Link href="/productos" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', background: '#3483fa', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                Ver productos
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(order => {
              const st = STATUS[order.STATUS] || { label: order.STATUS, bg: '#f5f5f5', color: '#666' };
              let items: any[] = [];
              try { items = JSON.parse(order.ITEMS || '[]'); } catch {}
              const qty = items.reduce((s: number, i: any) => s + (i.qty || 1), 0);
              const date = new Date(order.CREATEDAT || order.$createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
              return (
                <Link key={order.$id} href={`/pedido/${order.$id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 10, padding: '14px 16px', textDecoration: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.07)', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={22} color="#3483fa" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>{order.ORDERCODE}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{qty} artículo{qty !== 1 ? 's' : ''} · {formatPrice(order.TOTAL)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#bbb' }}>{date}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                    {(order.STATUS === 'delivered' || order.STATUS === 'cancelled') && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); reorder(order); }}
                        title="Volver a pedir"
                        style={{ padding: '4px 8px', background: '#f0f7ff', border: '1px solid #3483fa30', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3483fa', fontWeight: 600 }}>
                        <RefreshCw size={11} /> Recomprar
                      </button>
                    )}
                    <ChevronRight size={16} color="#ccc" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
