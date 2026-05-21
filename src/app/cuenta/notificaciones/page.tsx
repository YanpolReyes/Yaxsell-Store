'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Info, AlertTriangle, CheckCircle, Tag, ShoppingBag, Loader2, ArrowLeft, X, Gift, Package } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/context/NotificationContext';
import { markNotificationRead, isNotificationUnread, getNotificationLink } from '@/services/notificationService';
import { Query } from 'appwrite';
import { useCuentaBg } from '../CuentaBgContext';

const PINK = '#f18e04';
const NOTIF_COLLECTION = 'notifications';
const BG_NOTIFICACIONES = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRi67086jp_hDcg6WUM4q_dzl8r_BIs1TBwOg&s';

const TYPE_STYLE: Record<string, { icon: typeof Info; bg: string; color: string }> = {
  info:    { icon: Info,          bg: '#e3f2fd', color: '#1565c0' },
  success: { icon: CheckCircle,   bg: '#e8f5e9', color: '#2e7d32' },
  warning: { icon: AlertTriangle, bg: '#fff8e1', color: '#f57f17' },
  error:   { icon: AlertTriangle, bg: '#ffebee', color: '#c62828' },
  promo:   { icon: Tag,           bg: '#f3e5f5', color: '#7b1fa2' },
  order:   { icon: ShoppingBag,   bg: '#e8f5e9', color: '#1b5e20' },
  gift:    { icon: Gift,          bg: '#fff8ed', color: '#f18e04' },
  product: { icon: Package,       bg: '#e3f2fd', color: '#1565c0' },
  stock:   { icon: Package,       bg: '#e8f5e9', color: '#2e7d32' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Justo ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function NotificacionesPage() {
  const { user, isLoggedIn } = useAuth();
  const { refreshCount } = useNotifications();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  useCuentaBg(BG_NOTIFICACIONES);

  const loadNotifs = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, NOTIF_COLLECTION, [
        Query.or([
          Query.equal('userId', user.id),
          Query.equal('userId', 'all'),
        ]),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]);
      setNotifs(res.documents as unknown as Record<string, unknown>[]);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  const handleOpen = async (n: Record<string, unknown>) => {
    const id = n.$id as string;
    const link = getNotificationLink(n);
    if (id && isNotificationUnread(n)) {
      try {
        await markNotificationRead(id);
        setNotifs((prev) => prev.map((doc) => (doc.$id === id ? { ...doc, isRead: true, READ: true } : doc)));
        refreshCount();
      } catch { /* ignore */ }
    }
    if (link) router.push(link);
  };

  const unread = notifs.filter(isNotificationUnread).length;

  return (
    <>
      <style>{`
        .notif-mobile-header { display: none }
        @media (max-width: 899px) {
          .notif-mobile-header { display: flex !important }
          .notif-desktop-title { display: none !important }
        }
        .notif-card {
          background: #fff; border-radius: 14px; padding: 16px; border: 1px solid #f0f0f0;
          display: flex; gap: 14px; transition: all 0.2s; cursor: pointer;
        }
        .notif-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); border-color: rgba(241,142,4,0.2); }
        .notif-card.unread { background: linear-gradient(135deg,#fff8ed,#fff); border-left: 3px solid ${PINK}; }
        .notif-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        className="notif-mobile-header"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #ffedd5',
          padding: '14px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          margin: '0 -4px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/cuenta" style={{ display: 'flex', textDecoration: 'none' }}>
            <ArrowLeft size={22} color={PINK} />
          </Link>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Notificaciones</span>
          {unread > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: PINK, borderRadius: 999, padding: '2px 8px' }}>
              {unread}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push('/cuenta')}
          aria-label="Cerrar"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #ffedd5',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <X size={20} color="#6b7280" />
        </button>
      </div>

      <h1 className="notif-desktop-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bell size={22} color={PINK} fill={PINK} /> Notificaciones
        {notifs.length > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>({notifs.length})</span>}
      </h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={32} color={PINK} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 40 }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'linear-gradient(135deg,#fff8ed,#ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 24px rgba(241,142,4,0.15)' }}>
            <Bell size={64} color={PINK} fill={PINK} style={{ opacity: 0.7 }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px' }}>Sin notificaciones</h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Aquí aparecerán tus avisos, promociones y novedades. ¡Estate atento!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifs.map((n) => {
            const type = (n.type || n.TYPE || 'info') as string;
            const ts = TYPE_STYLE[type] || TYPE_STYLE.info;
            const Icon = ts.icon;
            const title = (n.title || n.TITLE || 'Notificación') as string;
            const body = (n.body || n.message || n.MESSAGE || n.BODY || '') as string;
            const read = !isNotificationUnread(n);
            return (
              <div
                key={n.$id as string}
                role="button"
                tabIndex={0}
                className={`notif-card ${!read ? 'unread' : ''}`}
                onClick={() => handleOpen(n)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpen(n)}
              >
                <div className="notif-icon" style={{ background: ts.bg }}>
                  <Icon size={20} color={ts.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{title}</p>
                    <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, fontWeight: 500 }}>
                      {timeAgo((n.$createdAt as string) || '')}
                    </span>
                  </div>
                  {body && <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{body}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

