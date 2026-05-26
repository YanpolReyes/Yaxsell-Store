'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Info, AlertTriangle, CheckCircle, Tag, ShoppingBag, Loader2, X, Gift, Package,
} from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/context/NotificationContext';
import {
  markNotificationRead,
  isNotificationUnread,
  getNotificationLink,
} from '@/services/notificationService';
import { Query } from 'appwrite';

const PINK = '#e396bf';
const NOTIF_COLLECTION = 'notifications';

const TYPE_STYLE: Record<string, { icon: typeof Info; bg: string; color: string }> = {
  info:    { icon: Info,          bg: '#e3f2fd', color: '#1565c0' },
  success: { icon: CheckCircle,   bg: '#e8f5e9', color: '#2e7d32' },
  warning: { icon: AlertTriangle, bg: '#fff8e1', color: '#f57f17' },
  error:   { icon: AlertTriangle, bg: '#ffebee', color: '#c62828' },
  promo:   { icon: Tag,           bg: '#f3e5f5', color: '#7b1fa2' },
  order:   { icon: ShoppingBag,   bg: '#e8f5e9', color: '#1b5e20' },
  gift:    { icon: Gift,          bg: '#fdf2f8', color: '#e396bf' },
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

interface Props {
  onClose: () => void;
}

export default function NotificationsOverlay({ onClose }: Props) {
  const { user, isLoggedIn } = useAuth();
  const { refreshCount } = useNotifications();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setNotifs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, NOTIF_COLLECTION, [
        Query.or([Query.equal('userId', user.id), Query.equal('userId', 'all')]),
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

  useEffect(() => {
    load();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [load, onClose]);

  const handleOpen = async (n: Record<string, unknown>) => {
    const id = n.$id as string;
    const link = getNotificationLink(n);
    if (id && isNotificationUnread(n)) {
      try {
        await markNotificationRead(id);
        setNotifs((prev) =>
          prev.map((doc) => (doc.$id === id ? { ...doc, isRead: true } : doc))
        );
        refreshCount();
      } catch { /* ignore */ }
    }
    onClose();
    if (link) router.push(link);
  };

  const panelStyle: CSSProperties = {
    background: '#fff',
    maxWidth: 560,
    margin: '0 auto',
    maxHeight: '85vh',
    overflow: 'hidden',
    borderRadius: 16,
    marginTop: 12,
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
  };

  if (!isLoggedIn) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
        <div style={{ ...panelStyle, padding: 32, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <Bell size={40} color={PINK} style={{ marginBottom: 12 }} />
          <p style={{ margin: '0 0 16px', color: '#6b7280' }}>Iniciá sesión para ver tus notificaciones</p>
          <button type="button" onClick={() => { onClose(); router.push('/login'); }} style={{ padding: '10px 24px', background: `linear-gradient(135deg,${PINK},#c0547a)`, color: '#fff', border: 'none', borderRadius: 999, fontWeight: 700, cursor: 'pointer' }}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const unread = notifs.filter(isNotificationUnread).length;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '1px solid #fce7f3', background: 'linear-gradient(135deg, #fdf2f8, #fdf2f8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={22} color={PINK} fill={PINK} />
            <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>Notificaciones</span>
            {unread > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: PINK, borderRadius: 999, padding: '2px 8px' }}>{unread}</span>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #fce7f3', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="#6b7280" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={32} color={PINK} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Bell size={48} color={PINK} style={{ opacity: 0.5, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#374151' }}>Sin notificaciones</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: '#9ca3af' }}>Tus avisos y promociones aparecerán aquí</p>
            </div>
          ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifs.map((n) => {
                const type = (n.type || n.TYPE || 'info') as string;
                const ts = TYPE_STYLE[type] || TYPE_STYLE.info;
                const Icon = ts.icon;
                const title = (n.title || n.TITLE || 'Notificación') as string;
                const body = (n.body || n.message || n.MESSAGE || n.BODY || '') as string;
                const read = !isNotificationUnread(n);
                return (
                  <button
                    key={n.$id as string}
                    type="button"
                    onClick={() => handleOpen(n)}
                    style={{
                      display: 'flex', gap: 12, padding: 14, borderRadius: 14, border: '1px solid #f0f0f0',
                      background: read ? '#fff' : 'linear-gradient(135deg,#fdf2f8,#fff)',
                      borderLeft: read ? '1px solid #f0f0f0' : `3px solid ${PINK}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={20} color={ts.color} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}><p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{title}</p><span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{timeAgo((n.$createdAt as string) || '')}</span></div>{body && <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{body}</p>}</div></button>
                );
              })}
            </div>

          )}
        </div>
      </div>
    </div>
    </>
  );
}
