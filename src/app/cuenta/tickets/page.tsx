'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle, Plus, ChevronRight, Loader2, Send, X } from 'lucide-react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { useAuth } from '@/hooks/useAuth';
import { Query, ID } from 'appwrite';

const FF = '"Proxima Nova",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
const TICKETS_COLLECTION = 'support_tickets';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: 'Abierto',      bg: '#e3f2fd', color: '#1565c0' },
  in_progress: { label: 'En revisión', bg: '#fff8e1', color: '#f57f17' },
  closed:      { label: 'Cerrado',      bg: '#f5f5f5', color: '#777'    },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Justo ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function TicketsPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'Pedido' });

  const CATEGORIES = ['Pedido', 'Pago', 'Envío', 'Producto', 'Cuenta', 'Otro'];

  // No forzar login - mostrar prompt si no está logueado

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    fetchTickets();
  }, [isLoggedIn, user]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, TICKETS_COLLECTION, [
        Query.equal('userEmail', user!.email),
        Query.orderDesc('$createdAt'),
        Query.limit(30),
      ]);
      setTickets(res.documents);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.createDocument(databaseId, TICKETS_COLLECTION, ID.unique(), {
        subject: form.subject,
        message: form.message,
        category: form.category,
        userEmail: user!.email,
        userName: user!.name,
        userId: user!.id,
        status: 'open',
      });
      setForm({ subject: '', message: '', category: 'Pedido' });
      setShowForm(false);
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert('No se pudo crear el ticket. Intentá de nuevo.');
    } finally { setSubmitting(false); }
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const inp: React.CSSProperties = { width: '100%', padding: '11px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 5 };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: FF }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/cuenta" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ArrowLeft size={22} color="#333" />
          </Link>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#333' }}>Tickets de Soporte</span>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: showForm ? '#f5f5f5' : '#3483fa', color: showForm ? '#555' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {showForm ? <><X size={15} /> Cancelar</> : <><Plus size={15} /> Nuevo</>}
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 12px 40px' }}>
        {/* New ticket form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 10, padding: '20px 16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
            <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: '#333' }}>Nuevo ticket</p>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Categoría</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                    style={{ padding: '5px 12px', border: `1.5px solid ${form.category === c ? '#3483fa' : '#e0e0e0'}`, borderRadius: 20, background: form.category === c ? '#eef2ff' : '#fff', color: form.category === c ? '#3483fa' : '#666', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Asunto *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inp} placeholder="¿En qué podemos ayudarte?" required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Descripción *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={4} required
                style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Describí tu problema con el mayor detalle posible..." />
            </div>

            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '12px 0', background: submitting ? '#85b0f5' : '#3483fa', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {submitting ? 'Enviando...' : 'Enviar ticket'}
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={28} color="#3483fa" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <HelpCircle size={48} color="#ddd" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#999', fontSize: 15, fontWeight: 600 }}>Sin tickets aún</p>
            <p style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>¿Tenés algún problema? Creá un ticket y te ayudamos</p>
            <button onClick={() => setShowForm(true)} style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', background: '#3483fa', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Crear ticket
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickets.map(t => {
              const st = STATUS_STYLE[t.status] || STATUS_STYLE.open;
              return (
                <div key={t.$id} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>{t.subject}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color, textTransform: 'uppercase' }}>{st.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{timeAgo(t.$createdAt)}</span>
                  </div>
                  {t.category && <span style={{ display: 'inline-block', fontSize: 11, color: '#3483fa', background: '#eef2ff', borderRadius: 20, padding: '2px 8px', marginBottom: 6, fontWeight: 600 }}>{t.category}</span>}
                  <p style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.message}</p>
                  {t.adminNotes && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#e8f5e9', borderRadius: 6, borderLeft: '3px solid #2e7d32' }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>Respuesta del equipo:</p>
                      <p style={{ margin: '3px 0 0', fontSize: 13, color: '#555' }}>{t.adminNotes}</p>
                    </div>
                  )}
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
