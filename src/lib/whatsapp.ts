/**
 * WhatsApp Business Cloud API – helper utilities
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_API_BASE = `https://graph.facebook.com/v20.0`;

// ─── In-memory conversation history per WhatsApp number ───────────────────────
// Resets on redeploy – good enough for session context
export const conversationHistory = new Map<string, { role: 'user' | 'assistant'; content: string }[]>();

const MAX_HISTORY = 20; // máx turnos a mantener por usuario

export function getHistory(phone: string) {
  return conversationHistory.get(phone) || [];
}

export function addToHistory(
  phone: string,
  role: 'user' | 'assistant',
  content: string
) {
  const hist = conversationHistory.get(phone) || [];
  hist.push({ role, content });
  if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY);
  conversationHistory.set(phone, hist);
}

export function clearHistory(phone: string) {
  conversationHistory.delete(phone);
}

// ─── Send a plain text message ─────────────────────────────────────────────────
export async function sendWhatsAppMessage(to: string, text: string, token: string): Promise<void> {
  if (!token || !WA_PHONE_NUMBER_ID) {
    console.error('[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars');
    return;
  }

  const url = `${WA_API_BASE}/${WA_PHONE_NUMBER_ID}/messages`;

  // Split long messages (WA limit is 4096 chars per message)
  const chunks = splitText(text, 4000);
  for (const chunk of chunks) {
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: chunk },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[WhatsApp] sendMessage error:', err);
    }
  }
}

// ─── Mark message as read ──────────────────────────────────────────────────────
export async function markAsRead(messageId: string, token: string): Promise<void> {
  if (!token || !WA_PHONE_NUMBER_ID) return;
  const url = `${WA_API_BASE}/${WA_PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  }).catch(() => {});
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLen;
    if (end < text.length) {
      const nl = text.lastIndexOf('\n', end);
      if (nl > start) end = nl + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}
