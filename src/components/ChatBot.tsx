'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import {
  CHATBOT_OPEN_EVENT,
  WHATSAPP_DISPLAY,
  WHATSAPP_E164,
  STORE_NAME,
  SUPPORT_HOURS,
  getWhatsAppUrl,
} from '@/lib/store-contact';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const WELCOME = `¡Hola! Soy Yaxsel AI, asistente de ${STORE_NAME}. Puedo ayudarte con pedidos, envíos, pagos y más.`;

const QUICK_QUESTIONS = [
  '¿Cómo hago un pedido?',
  '¿Qué métodos de envío tienen?',
  '¿Cómo los contacto por WhatsApp?',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getBasicReply(text: string): string {
  const q = normalize(text);

  if (/\b(hola|buenas|hey|saludos)\b/.test(q)) {
    return `${WELCOME}\n\n¿En qué te ayudo hoy?`;
  }
  if (/\b(pedido|comprar|como compro|hacer pedido)\b/.test(q)) {
    return `Para comprar:\n1. Entra al catálogo en /productos\n2. Agrega productos al carrito\n3. Completa el checkout con tus datos\n4. Paga por transferencia y envía el comprobante por WhatsApp (${WHATSAPP_DISPLAY}).`;
  }
  if (/\b(envio|envío|despacho|delivery|starken|blueexpress|varmontt)\b/.test(q)) {
    return `Enviamos a todo Chile por Starken, BlueExpress y Varmontt. El costo de envío se calcula al finalizar la compra. También puedes coordinar retiro si está disponible.`;
  }
  if (/\b(pago|transferencia|comprobante|pagar)\b/.test(q)) {
    return `Aceptamos pago por transferencia bancaria. Al confirmar tu pedido verás los datos de pago; envía el comprobante por WhatsApp al ${WHATSAPP_DISPLAY} para acelerar el procesamiento.`;
  }
  if (/\b(cupon|cupón|descuento|promo)\b/.test(q)) {
    return `Si tienes un cupón, ingrésalo en el carrito antes de pagar. El descuento se aplicará al total si el código es válido y está activo.`;
  }
  if (/\b(devolucion|devolución|cambio|garantia|garantía)\b/.test(q)) {
    return `Para devoluciones o cambios escríbenos por WhatsApp con tu número de pedido y fotos del producto. Revisamos cada caso según nuestra política de tienda.`;
  }
  if (/\b(horario|hora|atienden|disponible)\b/.test(q)) {
    return `Nuestro horario de atención es ${SUPPORT_HOURS}. Fuera de ese horario puedes dejarnos mensaje por WhatsApp y te respondemos lo antes posible.`;
  }
  if (/\b(whatsapp|wsp|wasap|contacto|telefono|teléfono|numero|número)\b/.test(q)) {
    return `Puedes escribirnos por WhatsApp al ${WHATSAPP_DISPLAY} (${WHATSAPP_E164}). Te atendemos en horario ${SUPPORT_HOURS}.`;
  }
  if (/\b(catalogo|catálogo|productos|tienda)\b/.test(q)) {
    return `Explora todos nuestros productos en la sección Catálogo (/productos). Usa el buscador del menú para encontrar algo específico.`;
  }
  if (/\b(cuenta|registro|login|sesion|sesión|perfil)\b/.test(q)) {
    return `Crea tu cuenta en /login para ver pedidos, favoritos y direcciones guardadas. Si ya tienes cuenta, inicia sesión desde el ícono de usuario.`;
  }
  if (/\b(gracias|chao|adios|adiós)\b/.test(q)) {
    return `¡Gracias por escribirnos! Si necesitas algo más, aquí estaré. También puedes contactarnos por WhatsApp: ${WHATSAPP_DISPLAY}.`;
  }

  return `Gracias por tu mensaje. Para ayuda personalizada escríbenos por WhatsApp al ${WHATSAPP_DISPLAY} o revisa el catálogo en /productos.\n\nPuedes preguntarme por envíos, pagos, cupones o cómo hacer un pedido.`;
}

const SYSTEM_PROMPT = `Eres un asistente de compras amigable de ${STORE_NAME}. Responde en español, máximo 3-4 oraciones.
WhatsApp de soporte: ${WHATSAPP_E164}. Horario: ${SUPPORT_HOURS}.
Envíos: Starken, BlueExpress, Varmontt. Pago: transferencia bancaria.`;

function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

async function callGemini(messages: Message[]): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Entendido.' }] },
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

  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function getReply(messages: Message[]): Promise<string> {
  const last = messages[messages.length - 1]?.content || '';
  const ai = await callGemini(messages);
  if (ai) return ai;
  return getBasicReply(last);
}

export default function ChatBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hideFab, setHideFab] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHiddenRoute = pathname.startsWith('/admin') || pathname.startsWith('/login');

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const reply = await getReply(updated);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getBasicReply(text), ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(CHATBOT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CHATBOT_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const check = () => setHideFab(!!document.getElementById('tpl1-chatbot-button'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [pathname]);

  if (isHiddenRoute) return null;

  return (
    <>
      {!open && !hideFab && (
        <button
          type="button"
          aria-label="Abrir chat"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 90, right: 20, zIndex: 9999,
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
          }}
        >
          <MessageCircle size={20} color="#fff" />
        </button>
      )}

      {open && (
        <div style={{
          position: 'fixed', bottom: 140, right: 20, zIndex: 9999,
          width: 370, maxWidth: 'calc(100vw - 40px)',
          height: 520, maxHeight: 'calc(100vh - 48px)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatSlideUp 0.25s ease-out',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ec4899, #f472b6)',
            padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>Yaxsel AI</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{STORE_NAME}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <Bot size={40} color="#f9a8d4" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#333' }}>¡Hola! Soy Yaxsel AI</p>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#999', lineHeight: 1.5 }}>{WELCOME}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} type="button" onClick={() => handleSend(q)}
                      style={{ padding: '8px 14px', background: '#fef2f8', border: '1px solid #fce7f3', borderRadius: 8, fontSize: 12, color: '#ec4899', cursor: 'pointer', textAlign: 'left' }}>
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
                  background: m.role === 'user' ? '#e5e7eb' : 'linear-gradient(135deg, #ec4899, #f472b6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'user' ? <UserIcon size={14} color="#666" /> : <Bot size={14} color="#fff" />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                  background: m.role === 'user' ? '#ec4899' : '#f5f5f5',
                  color: m.role === 'user' ? '#fff' : '#333',
                  fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', borderRadius: 14, borderBottomLeftRadius: 4 }}>
                  <Loader2 size={16} color="#999" style={{ animation: 'chatSpin 1s linear infinite' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#ec4899', textAlign: 'center', textDecoration: 'none', fontWeight: 600 }}>
              ¿Prefieres humano? WhatsApp {WHATSAPP_DISPLAY}
            </a>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Escribe tu mensaje..."
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 24, fontSize: 13, outline: 'none', color: '#333', background: '#fafafa' }}
              />
              <button type="button" onClick={() => handleSend()} disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: input.trim() && !loading ? '#ec4899' : '#e0e0e0',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                <Send size={16} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
