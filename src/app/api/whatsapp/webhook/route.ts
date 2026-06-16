import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, markAsRead, getHistory, addToHistory, clearHistory } from '@/lib/whatsapp';
import { serverListDocuments } from '@/lib/appwrite-server';
import {
  PRODUCTS_COLLECTION_ID,
  ORDERS_COLLECTION_ID,
} from '@/lib/appwrite-admin';

// ─── Config ────────────────────────────────────────────────────────────────────
const WA_TOKEN        = process.env.WHATSAPP_ACCESS_TOKEN || '';
const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN || 'yaxsel_webhook_2026';
const ENV_ADMINS = process.env.ADMIN_WHATSAPP_NUMBER || '';
const FALLBACK_ADMINS = '56936599658,56992139185,56935623858,56967115685';
const ADMIN_PHONES_RAW = ENV_ADMINS ? `${ENV_ADMINS},${FALLBACK_ADMINS}` : FALLBACK_ADMINS;
const ADMIN_PHONES     = ADMIN_PHONES_RAW.split(',').map(num => num.replace(/\D/g, '').trim());
const GEMINI_KEY      = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyBFSkLS9QYq66R7rD9Tyhz1sU3yuMSdaUo';
const GEMINI_MODELS   = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL || 'https://yaxsell.vercel.app';

// ─── Admin system prompt ───────────────────────────────────────────────────────
const ADMIN_PROMPT = `Eres Yexy IA, el asistente administrativo de Kevin&Coco por WhatsApp.
Estás hablando con el DUEÑO/ADMINISTRADOR de la tienda.

## Capacidades de Admin:
- Ver pedidos pendientes, en proceso, enviados
- Consultar stock de productos
- Ver resumen de ventas
- Responder preguntas sobre la tienda y productos
- Dar consejos de gestión

## Comandos reconocidos (interpreta variaciones naturales):
- "pedidos pendientes" → muestra los últimos pedidos con status pending
- "pedidos de hoy" → pedidos del día
- "stock de [producto]" → consulta stock
- "resumen del día / ventas" → resumen rápido
- "limpiar historial" → borra la conversación

## Formato de respuesta:
- Usa emojis con moderación para mayor claridad
- Sé conciso y directo
- Para listas de pedidos: muestra ID corto, cliente, total, estado
- Máx 3-4 pedidos por mensaje para no saturar

## IMPORTANTE:
- Siempre responde en español chileno, amigable y profesional
- Si no puedes ejecutar algo, explica qué puede hacerse desde el panel admin web
- No inventes datos. Solo muestra datos reales de la base de datos

Los datos de productos y pedidos te serán inyectados en el contexto.`;

// ─── Customer system prompt ────────────────────────────────────────────────────
const CUSTOMER_PROMPT = `Eres Yexy, la asistente virtual de Kevin&Coco, una tienda en línea chilena.
Eres amigable, empática y profesional. Hablas en español chileno.

## Puedes ayudar con:
- Información de productos (precios, disponibilidad, descripción)
- Buscar productos por categoría o nombre
- Estado de pedidos (si el cliente tiene número de pedido)
- Información de la tienda (horarios, envíos, pagos)
- Políticas de devolución y garantías
- Dudas generales sobre compras

## Información de la tienda:
- Tienda: Kevin&Coco
- Sitio web: ${SITE_URL}
- País: Chile
- Envíos: a todo Chile
- Pagos: efectivo, transferencia, tarjetas

## Reglas:
- NUNCA inventes precios ni stock. Solo di lo que está en los datos reales.
- Si no sabes algo, indica al cliente que visite ${SITE_URL} o espere para contactar al vendedor.
- Sé cálida pero eficiente. Evita respuestas muy largas.
- Máx 2-3 productos por respuesta cuando el cliente busca algo.
- Siempre termina con una pregunta o invitación para seguir ayudando.
- Si el cliente dice "gracias" o "listo", despídete amablemente.

Los datos de productos disponibles te serán inyectados como contexto.`;

// Helper to decide if user message needs Appwrite DB context to save reads
function needsDbContext(text: string): boolean {
  const cleaned = text.toLowerCase().trim();
  if (cleaned.length < 3) return false;

  const pureChitchat = /^(hola|buenos\s+dias|buenas\s+tardes|buenas\s+noches|gracias|muchas\s+gracias|adios|chao|ok|okay|listo|perfecto|super|genial|hola\s+yexy|yexy|como\s+estas|cómo\s+estás|que\s+tal|qué\s+tal)$/i;
  return !pureChitchat.test(cleaned);
}

// ─── Webhook verification (GET) ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verificado ✅');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ─── Incoming messages handler (POST) ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends test pings with empty changes
    const entry    = body?.entry?.[0];
    const changes  = entry?.changes?.[0];
    const value    = changes?.value;
    const messages = value?.messages;

    if (!messages?.length) {
      return NextResponse.json({ status: 'no_messages' });
    }

    const msg       = messages[0];
    const fromPhone = msg.from as string; // sender's phone number
    const msgId     = msg.id as string;
    const msgType   = msg.type as string;

    // Only handle text messages for now
    if (msgType !== 'text') {
      await sendWhatsAppMessage(
        fromPhone,
        '¡Hola! 👋 Por ahora solo puedo procesar mensajes de texto. Escríbeme tu consulta y te ayudo enseguida.',
        WA_TOKEN
      );
      return NextResponse.json({ status: 'non_text_ignored' });
    }

    const userText = (msg.text?.body as string || '').trim();
    if (!userText) return NextResponse.json({ status: 'empty_text' });

    const cleanedFrom = fromPhone.replace(/\D/g, '').trim();
    const isAdmin = ADMIN_PHONES.includes(cleanedFrom);
    console.log(`[WhatsApp Webhook] Msg from: ${fromPhone} (cleaned: ${cleanedFrom}) | isAdmin: ${isAdmin} | Admin list:`, ADMIN_PHONES);

    // Mark as read
    await markAsRead(msgId, WA_TOKEN);

    // Handle "limpiar historial" command
    if (userText.toLowerCase().includes('limpiar historial')) {
      clearHistory(fromPhone);
      await sendWhatsAppMessage(fromPhone, '🗑️ Historial borrado. ¡Empezamos de cero!', WA_TOKEN);
      return NextResponse.json({ status: 'history_cleared' });
    }

    // ── Fetch context from DB ──────────────────────────────────────────────────
    let contextBlock = '';
    if (needsDbContext(userText)) {
      try {
        if (isAdmin) {
        // Admin: get pending orders + products
        const [ordersRes, productsRes] = await Promise.all([
          serverListDocuments(ORDERS_COLLECTION_ID, ['orderDesc("$createdAt")', 'limit(15)']),
          serverListDocuments(PRODUCTS_COLLECTION_ID, ['limit(30)']),
        ]);

        const orders = (ordersRes.documents || []).map((o: any) => {
          const id    = String(o.$id || '').slice(-6).toUpperCase();
          const name  = o.customerName || o.customer_name || o.NAME || 'Sin nombre';
          const total = o.total || o.TOTAL || 0;
          const status = o.status || o.STATUS || 'pendiente';
          const date  = o.$createdAt ? new Date(o.$createdAt).toLocaleDateString('es-CL') : '?';
          return `#${id} | ${name} | $${Number(total).toLocaleString('es-CL')} | ${status} | ${date}`;
        });

        const products = (productsRes.documents || []).slice(0, 20).map((p: any) =>
          `${p.NAME} | Stock: ${p.STOCK ?? '?'} | Precio: $${p.PRICE ?? '?'}`
        );

        contextBlock = `\n\n## 📦 ÚLTIMOS PEDIDOS (${ordersRes.total} total):\n${orders.join('\n') || 'Sin pedidos.'}\n\n## 🛍️ PRODUCTOS (${productsRes.total} total, top 20):\n${products.join('\n') || 'Sin productos.'}`;

      } else {
        // Customer: get products only (no sensitive order data)
        const lowerText = userText.toLowerCase();
        const keywords  = lowerText.split(/\s+/).filter(w => w.length > 2);

        const productsRes = await serverListDocuments(PRODUCTS_COLLECTION_ID, ['limit(50)']);
        const allProducts = productsRes.documents || [];

        // Try to find relevant products
        let relevant = allProducts;
        if (keywords.length > 0) {
          const matched = allProducts.filter((p: any) => {
            const name = (p.NAME || '').toLowerCase();
            const desc = (p.DESCRIPTION || '').toLowerCase();
            const tags = (p.TAGS || '').toLowerCase();
            return keywords.some(k => name.includes(k) || desc.includes(k) || tags.includes(k));
          });
          if (matched.length > 0) relevant = matched;
        }

        const productList = relevant.slice(0, 15).map((p: any) => {
          const price      = p.CURRENTPRICE || p.PRICE || 0;
          const stock      = p.STOCK ?? 0;
          const stockLabel = stock > 0 ? `✅ Disponible (${stock} uds)` : '❌ Sin stock';
          return `• *${p.NAME}* — $${Number(price).toLocaleString('es-CL')} | ${stockLabel}`;
        });

        contextBlock = `\n\n## 🛍️ CATÁLOGO DISPONIBLE (${relevant.length} productos):\n${productList.join('\n') || 'No encontré productos relacionados.'}\n\nSitio web: ${SITE_URL}`;
      }
    } catch (dbErr) {
      console.warn('[WhatsApp] DB context error:', dbErr);
    }
    }

    // ── Build conversation history for Gemini ─────────────────────────────────
    const history = getHistory(fromPhone);
    addToHistory(fromPhone, 'user', userText);

    const systemPrompt = (isAdmin ? ADMIN_PROMPT : CUSTOMER_PROMPT) + contextBlock;

    const contents = [
      ...history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: userText }] },
    ];

    const geminiBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    // ── Call Gemini ────────────────────────────────────────────────────────────
    let aiReply = '❌ Lo siento, no pude procesar tu mensaje en este momento. Intenta de nuevo.';
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          aiReply = text
            .replace(/\[ACTION:[^\]]+\][\s\S]*?\[\/ACTION\]/g, '') // strip any action blocks
            .replace(/\*\*(.*?)\*\*/g, '*$1*') // convert **bold** to WA *bold*
            .trim();
          break;
        }
      }
      if (res.status !== 503) break;
    }

    // Save assistant reply to history
    addToHistory(fromPhone, 'assistant', aiReply);

    // ── Send reply to WhatsApp ─────────────────────────────────────────────────
    await sendWhatsAppMessage(fromPhone, aiReply, WA_TOKEN);

    return NextResponse.json({ status: 'ok' });

  } catch (err: any) {
    console.error('[WhatsApp webhook] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
