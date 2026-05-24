'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [hideFab, setHideFab] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHiddenRoute = pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/inventario');

  const close = useCallback(() => setOpen(false), []);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
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

  const fullscreenChat = open && mounted ? (
    <div className="yaxsel-chat-fullscreen" role="dialog" aria-modal="true" aria-label="Chat de asistencia">
      <div className="yaxsel-chat-fullscreen__backdrop" onClick={close} aria-hidden />
      <div className="yaxsel-chat-fullscreen__panel">
        <header className="yaxsel-chat-fullscreen__header">
          <div className="yaxsel-chat-fullscreen__brand">
            <div className="yaxsel-chat-fullscreen__avatar">
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <p className="yaxsel-chat-fullscreen__title">Yaxsel AI</p>
              <p className="yaxsel-chat-fullscreen__subtitle">{STORE_NAME}</p>
            </div>
          </div>
          <button type="button" className="yaxsel-chat-fullscreen__close" onClick={close} aria-label="Cerrar chat">
            <X size={20} color="#fff" />
          </button>
        </header>

        <div ref={scrollRef} className="yaxsel-chat-fullscreen__messages">
          {messages.length === 0 && (
            <div className="yaxsel-chat-fullscreen__welcome">
              <Bot size={48} color="#f5a8cf" />
              <p className="yaxsel-chat-fullscreen__welcome-title">¡Hola! Soy Yaxsel AI</p>
              <p className="yaxsel-chat-fullscreen__welcome-text">{WELCOME}</p>
              <div className="yaxsel-chat-fullscreen__quick">
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} type="button" onClick={() => handleSend(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`yaxsel-chat-msg yaxsel-chat-msg--${m.role}`}>
              <div className="yaxsel-chat-msg__avatar">
                {m.role === 'user' ? <UserIcon size={14} color="#666" /> : <Bot size={14} color="#fff" />}
              </div>
              <div className="yaxsel-chat-msg__bubble">{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className="yaxsel-chat-msg yaxsel-chat-msg--assistant">
              <div className="yaxsel-chat-msg__avatar"><Bot size={14} color="#fff" /></div>
              <div className="yaxsel-chat-msg__bubble yaxsel-chat-msg__bubble--loading">
                <Loader2 size={18} color="#999" className="yaxsel-chat-spin" />
              </div>
            </div>
          )}
        </div>

        <footer className="yaxsel-chat-fullscreen__footer">
          <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="yaxsel-chat-fullscreen__wa">
            ¿Prefieres humano? WhatsApp {WHATSAPP_DISPLAY}
          </a>
          <div className="yaxsel-chat-fullscreen__input-row">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe tu mensaje..."
            />
            <button type="button" onClick={() => handleSend()} disabled={!input.trim() || loading} aria-label="Enviar">
              <Send size={18} color="#fff" />
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        .yaxsel-chat-fullscreen {
          position: fixed; inset: 0; z-index: 10060;
          display: flex; flex-direction: column;
          animation: yaxselChatIn .28s ease;
        }
        .yaxsel-chat-fullscreen__backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .yaxsel-chat-fullscreen__panel {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          width: 100%; height: 100%;
          max-width: 100%; max-height: 100%;
          background: #fff;
          overflow: hidden;
        }
        .yaxsel-chat-fullscreen__header {
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: max(14px, env(safe-area-inset-top, 0px)) 16px 14px;
          background: linear-gradient(135deg, #e396bf, #f472b6);
        }
        .yaxsel-chat-fullscreen__brand { display: flex; align-items: center; gap: 12px; }
        .yaxsel-chat-fullscreen__avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .yaxsel-chat-fullscreen__title {
          margin: 0; font-size: 17px; font-weight: 700; color: #fff;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__subtitle {
          margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.9);
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__close {
          width: 44px; height: 44px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .yaxsel-chat-fullscreen__close:hover {
          background: rgba(255,255,255,0.4);
          transform: scale(1.05);
        }
        .yaxsel-chat-fullscreen__messages {
          flex: 1; overflow-y: auto;
          padding: 16px 14px;
          display: flex; flex-direction: column; gap: 12px;
          background: #fafafa;
        }
        .yaxsel-chat-fullscreen__welcome {
          text-align: center; padding: 24px 12px 12px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .yaxsel-chat-fullscreen__welcome-title {
          margin: 0; font-size: 18px; font-weight: 700; color: #333;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__welcome-text {
          margin: 0 0 12px; font-size: 14px; color: #777; line-height: 1.5;
          max-width: 320px;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__quick {
          display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 340px;
        }
        .yaxsel-chat-fullscreen__quick button {
          padding: 12px 16px; background: #fdf2f8; border: 1px solid #fce7f3;
          border-radius: 12px; font-size: 13px; color: #e396bf; cursor: pointer;
          text-align: left; font-family: "DM Sans", system-ui, sans-serif; font-weight: 600;
        }
        .yaxsel-chat-msg { display: flex; gap: 10px; align-items: flex-end; }
        .yaxsel-chat-msg--user { flex-direction: row-reverse; }
        .yaxsel-chat-msg__avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #e396bf, #f472b6);
        }
        .yaxsel-chat-msg--user .yaxsel-chat-msg__avatar { background: #e5e7eb; }
        .yaxsel-chat-msg__bubble {
          max-width: min(82%, 520px); padding: 12px 16px; border-radius: 16px;
          font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-msg--assistant .yaxsel-chat-msg__bubble {
          background: #fff; color: #333; border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .yaxsel-chat-msg--user .yaxsel-chat-msg__bubble {
          background: #e396bf; color: #fff; border-bottom-right-radius: 4px;
        }
        .yaxsel-chat-msg__bubble--loading { padding: 14px 18px; }
        .yaxsel-chat-fullscreen__footer {
          flex-shrink: 0;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid #f0f0f0; background: #fff;
          display: flex; flex-direction: column; gap: 10px;
        }
        .yaxsel-chat-fullscreen__wa {
          font-size: 12px; color: #e396bf; text-align: center;
          text-decoration: none; font-weight: 600;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__input-row { display: flex; gap: 10px; align-items: center; }
        .yaxsel-chat-fullscreen__input-row input {
          flex: 1; padding: 14px 18px; border: 1.5px solid #e5e7eb;
          border-radius: 999px; font-size: 15px; outline: none;
          color: #333; background: #fafafa;
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .yaxsel-chat-fullscreen__input-row input:focus { border-color: #e396bf; background: #fff; }
        .yaxsel-chat-fullscreen__input-row button {
          width: 48px; height: 48px; border-radius: 50%; border: none;
          background: #e396bf; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(227,150,191,0.35);
        }
        .yaxsel-chat-fullscreen__input-row button:disabled {
          background: #e0e0e0; cursor: not-allowed; box-shadow: none;
        }
        .yaxsel-chat-spin { animation: yaxselChatSpin 1s linear infinite; }
        @keyframes yaxselChatIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes yaxselChatSpin { to { transform: rotate(360deg); } }
        @media (min-width: 769px) {
          .yaxsel-chat-fullscreen__panel {
            max-width: 480px; max-height: 92vh;
            margin: auto; border-radius: 20px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.22);
          }
          .yaxsel-chat-fullscreen {
            align-items: center; justify-content: center;
            padding: 24px;
          }
        }
      `}</style>
    </div>
  ) : null;

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
            background: 'linear-gradient(135deg, #e396bf, #f472b6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(227,150,191,0.35)',
          }}
        >
          <MessageCircle size={20} color="#fff" />
        </button>
      )}

      {fullscreenChat && createPortal(fullscreenChat, document.body)}
    </>
  );
}
