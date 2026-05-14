'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SYSTEM_PROMPT = `Eres un asistente de compras amigable y servicial de nuestra tienda online. Tu nombre es Yaxsel AI.
Respondes en español de forma concisa y clara (máximo 3-4 oraciones).
Puedes ayudar con:
- Información sobre productos, precios y disponibilidad
- Estado de pedidos
- Métodos de pago (transferencia bancaria)
- Envíos (Starken, BlueExpress, Varmontt, retiro en tienda)
- Política de devoluciones
- Uso de cupones de descuento

Si no sabes algo específico, sugiere contactar al soporte.
No inventes precios ni información que no tengas.
Sé empático y profesional.`;

function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

async function callGemini(messages: Message[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) return 'El chatbot no está configurado aún. Por favor contacta al soporte directamente.';

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Entendido, soy Yaxsel AI, el asistente de compras. ¿En qué puedo ayudarte?' }] },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini API error:', err);
    return 'Disculpa, tuve un problema. Intenta de nuevo en un momento.';
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // Ocultar en rutas admin e inventario
  if (pathname?.startsWith('/admin') || pathname === '/inventario') return null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const reply = await callGemini(updated);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3483fa, #6366f1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(52,131,250,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(52,131,250,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(52,131,250,0.4)'; }}
        >
          <MessageCircle size={24} color="#fff" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 370, maxWidth: 'calc(100vw - 32px)',
          height: 520, maxHeight: 'calc(100vh - 48px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.25s ease-out',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3483fa, #6366f1)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Yaxsel AI</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Asistente de compras</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Bot size={40} color="#e0e0e0" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#333' }}>¡Hola! Soy Yaxsel AI</p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#999' }}>¿En qué puedo ayudarte hoy?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {['¿Cómo hago un pedido?', '¿Qué métodos de envío tienen?', '¿Tienen cupones de descuento?'].map(q => (
                    <button key={q} onClick={() => { setInput(q); setTimeout(handleSend, 50); }}
                      style={{ padding: '8px 14px', background: '#f0f5ff', border: '1px solid #e0eaff', borderRadius: 8, fontSize: 12, color: '#3483fa', cursor: 'pointer', textAlign: 'left' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: m.role === 'user' ? '#e0e0e0' : 'linear-gradient(135deg, #3483fa, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'user' ? <UserIcon size={14} color="#666" /> : <Bot size={14} color="#fff" />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                  background: m.role === 'user' ? '#3483fa' : '#f5f5f5',
                  color: m.role === 'user' ? '#fff' : '#333',
                  fontSize: 13, lineHeight: 1.5,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3483fa, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', borderRadius: 14, borderBottomLeftRadius: 4 }}>
                  <Loader2 size={16} color="#999" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe tu mensaje..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 24, fontSize: 13, outline: 'none', color: '#333', background: '#fafafa' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() && !loading ? '#3483fa' : '#e0e0e0',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
