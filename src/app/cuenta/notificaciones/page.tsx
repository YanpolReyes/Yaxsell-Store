'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Info, AlertTriangle, CheckCircle, Tag, ShoppingBag, Loader2 } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { Query } from 'appwrite';

const FF = '"Proxima Nova",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
const NOTIF_COLLECTION = 'notifications';

const TYPE_STYLE: Record<string, { icon: any; bg: string; color: string }> = {
  info:    { icon: Info,          bg: '#e3f2fd', color: '#1565c0' },
  success: { icon: CheckCircle,   bg: '#e8f5e9', color: '#2e7d32' },
  warning: { icon: AlertTriangle, bg: '#fff8e1', color: '#f57f17' },
  error:   { icon: AlertTriangle, bg: '#ffebee', color: '#c62828' },
  promo:   { icon: Tag,           bg: '#f3e5f5', color: '#7b1fa2' },
  order:   { icon: ShoppingBag,   bg: '#e8f5e9', color: '#1b5e20' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Justo ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export default function NotificacionesPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // No forzar login - mostrar prompt si no está logueado

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    (async () => {
      setLoading(true);
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, NOTIF_COLLECTION, [
          Query.or([
            Query.equal('userId', user.id),
            Query.equal('userId', 'all'),
            Query.equal('broadcast', true),
          ]),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ]);
        setNotifs(res.documents);
      } catch {
        // collection may not exist yet
        setNotifs([]);
      } finally { setLoading(false); }
    })();
  }, [isLoggedIn, user]);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: FF }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/cuenta" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <ArrowLeft size={22} color="#333" />
        </Link>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#333' }}>Notificaciones</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={28} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <Bell size={48} color="#ddd" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#999', fontSize: 15, fontWeight: 600 }}>Sin notificaciones</p>
            <p style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>Aquí aparecerán tus avisos y novedades</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifs.map(n => {
              const type = n.type || n.TYPE || 'info';
              const ts = TYPE_STYLE[type] || TYPE_STYLE.info;
              const Icon = ts.icon;
              const title = n.title || n.TITLE || 'Notificación';
              const body = n.body || n.message || n.MESSAGE || n.BODY || '';
              const read = n.read || n.READ || false;
              return (
                <div key={n.$id} style={{ display: 'flex', gap: 12, background: read ? '#fff' : '#f0f6ff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', borderLeft: read ? 'none' : '3px solid #3483fa' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={ts.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#333' }}>{title}</p>
                      <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{timeAgo(n.$createdAt)}</span>
                    </div>
                    {body && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4 }}>{body}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
