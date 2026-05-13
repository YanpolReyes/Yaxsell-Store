'use client';

import { useState, useEffect, useCallback } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite-admin';
import { Query } from 'appwrite';
import { Loader2, MessageCircle, Send, Search, Check } from 'lucide-react';

const QUESTIONS_COLLECTION = 'product_questions';

interface Question {
  $id: string;
  $createdAt: string;
  PRODUCTID: string;
  USERID: string;
  USERNAME?: string;
  QUESTION: string;
  ANSWER?: string;
  ANSWEREDBY?: string;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, QUESTIONS_COLLECTION, [
        Query.orderDesc('$createdAt'), Query.limit(100),
      ]);
      setQuestions(res.documents as unknown as Question[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitAnswer(qId: string) {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.updateDocument(databaseId, QUESTIONS_COLLECTION, qId, {
        ANSWER: answerText.trim(),
        ANSWEREDBY: 'Vendedor',
        ANSWEREDAT: Math.floor(Date.now() / 1000),
      });
      setAnswering(null);
      setAnswerText('');
      await load();
    } catch (e) { console.error(e); alert('Error al responder'); }
    finally { setSaving(false); }
  }

  async function deleteQuestion(id: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      await databases.deleteDocument(databaseId, QUESTIONS_COLLECTION, id);
      await load();
    } catch (e) { console.error(e); }
  }

  const filtered = questions.filter(q => {
    if (filter === 'pending' && q.ANSWER) return false;
    if (filter === 'answered' && !q.ANSWER) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return q.QUESTION.toLowerCase().includes(s) || (q.USERNAME || '').toLowerCase().includes(s) || q.PRODUCTID.toLowerCase().includes(s);
  });

  const pendingCount = questions.filter(q => !q.ANSWER).length;
  const answeredCount = questions.filter(q => !!q.ANSWER).length;

  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #333', borderRadius: 6, background: '#1a1a2e', color: '#e0e0e0', fontSize: 13, outline: 'none' };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900 }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Preguntas de productos</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Total</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{questions.length}</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Sin responder</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Respondidas</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{answeredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...input, paddingLeft: 32 }} />
        </div>
        {(['all', 'pending', 'answered'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', background: filter === f ? '#6366f1' : '#1a1a2e', color: filter === f ? '#fff' : '#888', border: '1px solid #333', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Sin respuesta' : 'Respondidas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <MessageCircle size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          <p>No hay preguntas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(q => (
            <div key={q.$id} style={{ background: '#1a1a2e', borderRadius: 8, padding: '14px 18px', border: `1px solid ${q.ANSWER ? '#333' : '#f59e0b40'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>{q.USERNAME || 'Usuario'}</span>
                  <span style={{ fontSize: 10, color: '#666' }}>{new Date(q.$createdAt).toLocaleDateString('es-CL')}</span>
                  {q.ANSWER ? (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', background: '#22c55e20', padding: '1px 6px', borderRadius: 8 }}>Respondida</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: '#f59e0b20', padding: '1px 6px', borderRadius: 8 }}>Pendiente</span>
                  )}
                </div>
                <button onClick={() => deleteQuestion(q.$id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11 }}>
                  Eliminar
                </button>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, color: '#e0e0e0', lineHeight: 1.4 }}>{q.QUESTION}</p>
              <p style={{ margin: '0 0 8px', fontSize: 10, color: '#666' }}>Producto: {q.PRODUCTID.slice(0, 12)}...</p>

              {q.ANSWER ? (
                <div style={{ padding: '8px 12px', background: '#22c55e10', borderRadius: 6, borderLeft: '3px solid #22c55e' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#ccc' }}>{q.ANSWER}</p>
                  <span style={{ fontSize: 10, color: '#22c55e' }}>{q.ANSWEREDBY || 'Vendedor'}</span>
                </div>
              ) : answering === q.$id ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Escribe tu respuesta..."
                    style={{ ...input, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') submitAnswer(q.$id); }} />
                  <button onClick={() => submitAnswer(q.$id)} disabled={saving || !answerText.trim()}
                    style={{ padding: '8px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
                    <Send size={12} /> {saving ? '...' : 'Enviar'}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAnswering(q.$id); setAnswerText(''); }}
                  style={{ padding: '5px 12px', background: '#6366f120', color: '#6366f1', border: '1px solid #6366f140', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
