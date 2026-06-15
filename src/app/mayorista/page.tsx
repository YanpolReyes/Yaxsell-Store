'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle, Clock, XCircle, Send, Loader2, ShieldCheck } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { Query, ID } from 'appwrite';

const FF = '"Proxima Nova",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
const WHOLESALE_COLLECTION = 'wholesale_requests';

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:  { label: 'En revisión',  icon: Clock,       color: '#b45309', bg: '#fffbeb' },
  approved: { label: 'Aprobada',     icon: CheckCircle, color: '#166534', bg: '#f0fdf4' },
  rejected: { label: 'Rechazada',    icon: XCircle,     color: '#991b1b', bg: '#fef2f2' },
};

export default function MayoristaPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', rut: '', phone: '', businessName: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push('/login'); return; }
    (async () => {
      try {
        const { databases } = getServices();
        const { databaseId } = getAppwriteConfig();
        const res = await databases.listDocuments(databaseId, WHOLESALE_COLLECTION, [
          Query.equal('userId', user!.id),
          Query.orderDesc('$createdAt'),
          Query.limit(1),
        ]);
        if (res.documents.length > 0) setExisting(res.documents[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user, isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.createDocument(databaseId, WHOLESALE_COLLECTION, ID.unique(), {
        userId: user.id,
        companyName: form.businessName.trim() || 'Sin Nombre',
        rut: form.rut.trim() || 'Sin RUT',
        email: form.email.trim(),
        phone: form.phone.trim() || 'Sin Teléfono',
        status: 'pending',
        createdAt: Date.now()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const card: React.CSSProperties = { background: '#fff', borderRadius: 4, padding: '24px', marginBottom: 12, fontFamily: FF };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 14, outline: 'none', color: '#333', fontFamily: FF };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4, fontFamily: FF };

  if (authLoading || loading) return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} color="#999" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ background: '#ebebeb', minHeight: '100vh', padding: '20px 5%', fontFamily: FF }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link href="/cuenta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#3483fa', textDecoration: 'none', fontSize: 14, marginBottom: 16 }}>
          <ArrowLeft size={16} /> Mi cuenta
        </Link>

        <div style={{ ...card, textAlign: 'center', borderTop: '4px solid #3483fa', padding: '32px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={32} color="#3483fa" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#333' }}>Cuenta Mayorista</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Accede a precios especiales comprando en volumen</p>
        </div>

        {/* Benefits */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5 }}>Beneficios</p>
          {[
            { icon: '💰', text: 'Precios exclusivos por volumen' },
            { icon: '📦', text: 'Pedidos mínimos accesibles' },
            { icon: '🚚', text: 'Envío prioritario' },
            { icon: '👤', text: 'Atención personalizada' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none' }}>
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              <span style={{ fontSize: 14, color: '#333' }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Existing request status */}
        {existing && !submitted && (() => {
          const s = STATUS_MAP[existing.status] || STATUS_MAP.pending;
          const Icon = s.icon;
          return (
            <div style={{ ...card, background: s.bg, border: `1px solid ${s.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon size={22} color={s.color} />
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: s.color }}>Solicitud {s.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>
                    Enviada el {new Date(existing.$createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              {existing.status === 'pending' && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666' }}>Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada.</p>
              )}
              {existing.status === 'approved' && (
                <div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#166534' }}>
                    ¡Felicidades! Tu cuenta mayorista ha sido aprobada. Los precios mayoristas se aplican automáticamente al comprar en volumen.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 12px', background: 'rgba(22,101,52,0.1)', borderRadius: 6 }}>
                    <ShieldCheck size={16} color="#166534" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Mayorista verificado</span>
                  </div>
                </div>
              )}
              {existing.status === 'rejected' && (
                <div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#991b1b' }}>
                    Tu solicitud fue rechazada.
                    {existing.rejectionReason && <> Motivo: <strong>{existing.rejectionReason}</strong></>}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#999' }}>Puedes enviar una nueva solicitud si lo deseas.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Success message */}
        {submitted && (
          <div style={{ ...card, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
            <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#166534' }}>¡Solicitud enviada!</p>
            <p style={{ margin: 0, fontSize: 14, color: '#22c55e' }}>Revisaremos tu solicitud y te notificaremos pronto.</p>
          </div>
        )}

        {/* Form - show if no existing request, or if rejected */}
        {(!existing || existing.status === 'rejected') && !submitted && (
          <form onSubmit={handleSubmit} style={card}>
            <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#333' }}>Solicitar cuenta mayorista</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>RUT</label>
                  <input style={inputStyle} value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} placeholder="12.345.678-9" />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nombre del negocio</label>
                <input style={inputStyle} value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} placeholder="Mi Tienda SPA" />
              </div>
              <button type="submit" disabled={submitting || !form.name.trim() || !form.email.trim()}
                style={{
                  width: '100%', padding: '13px 0', background: '#3483fa', color: '#fff', border: 'none', borderRadius: 6,
                  fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: submitting ? 0.6 : 1,
                }}>
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                {submitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}

        <Link href="/productos" style={{ display: 'block', textAlign: 'center', padding: '13px 0', color: '#3483fa', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginTop: 8 }}>
          Ver productos
        </Link>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
