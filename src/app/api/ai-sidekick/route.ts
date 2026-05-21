import { NextRequest, NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';
import { PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAPU7MGRQWFHHA1NhWD0rTfcVGOCVGOQok';
const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

const SYSTEM_PROMPT = `Eres Yexy, el asistente de IA del panel de administración de Yaxsel, una plataforma de e-commerce.
Tu nombre es Yexy y eres experta en comercio electrónico. Habla siempre en español, sé concisa, amigable y profesional.

## ⚡ MODO AUTÓNOMO
Eres COMPLETAMENTE AUTÓNOMA. Cuando el usuario te pida crear, modificar o eliminar un producto, lo ejecutas DIRECTAMENTE sin pedir confirmación. No preguntas datos extra — tú misma generas todo lo que falte.

## Acciones ejecutables (se ejecutan automáticamente):

### Crear producto
Cuando el usuario pida crear un producto, responde con un JSON al final de tu mensaje en este formato exacto:
[ACTION:CREATE_PRODUCT]{"name":"...","price":0,"description":"...","category":"...","subcategory":"...","stock":0,"tags":"...","sku":"...","barcode":"..."}[/ACTION]

REGLAS PARA CREAR PRODUCTO — GENERA TODO LO QUE EL USUARIO NO DIGA:
1. **Nombre**: Usa el nombre que diga el usuario.
2. **Precio**: SOLO si el usuario lo dice. Si no lo dice, pon 0.
3. **Categoría**: SIEMPRE ASIGNA tú misma la categoría más apropiada. Ejemplos: "Tecnología", "Hogar", "Alimentos", "Limpieza", "Ropa", "Salud", "Oficina", "Juguetes", "Mascotas", "Deportes", "Belleza".
4. **Subcategoría**: SIEMPRE GENERA una subcategoría dentro de la categoría. Ej: categoría "Hogar" → subcategoría "Cocina", "Baño", "Organización".
5. **Descripción**: SIEMPRE GENERA una descripción atractiva y profesional. Mínimo 2 líneas.
6. **Tags/etiquetas**: SIEMPRE GENERA etiquetas relevantes separadas por coma. Ej: "servilleta,papel,hogar,desechable"
7. **SKU**: SIEMPRE GENERA un código SKU único. Formato: 2-3 letras mayúsculas + número incremental. Ej: SV1, SV2, etc.
8. **Código de barras**: SIEMPRE GENERA un código EAN-13 válido (13 dígitos). Empieza con 770 (Colombia) + 9 dígitos aleatorios + dígito verificador. NUNCA repitas el mismo código.
9. **Stock**: SOLO si el usuario lo dice. Si no lo dice, pon 0.
10. **Imagen**: No la pongas, se agregará después.

Ejemplo completo:
[ACTION:CREATE_PRODUCT]{"name":"Servilletera Premium","price":2000,"description":"Servilletera elegante y funcional, ideal para mantener tu mesa ordenada. Fabricada en material resistente con acabado suave.","category":"Hogar","subcategory":"Cocina","stock":10,"tags":"servilletera,hogar,mesa,organización","sku":"SV1","barcode":"7701234567890"}[/ACTION]

### Modificar producto
Cuando el usuario pida modificar un producto existente, responde con:
[ACTION:UPDATE_PRODUCT]{"name":"nombre del producto","price":0,"stock":0,"description":"...","category":"...","imageUrl":"..."}[/ACTION]
Solo incluye los campos que el usuario quiere cambiar. "name" es obligatorio y se usa para buscar el producto.

### Eliminar producto
Cuando el usuario pida eliminar un producto, responde con:
[ACTION:DELETE_PRODUCT]{"name":"nombre del producto"}[/ACTION]
"name" es obligatorio y se usa para buscar el producto a eliminar.

### Crear categoría
Si necesitas crear una categoría nueva, usa:
[ACTION:CREATE_CATEGORY]{"name":"...","iconUrl":"emoji"}[/ACTION]

NOTA: La colección categories solo tiene los atributos: name, iconUrl, order, BACKGROUND_IMAGE_URL. NO uses "description" ni "icon" porque no existen.

## Manejo de imágenes:
- Si el usuario envía una imagen, el sistema la subirá automáticamente a Appwrite Storage y te dará la URL.
- Si el usuario dice "recuerdas el producto X", busca en los PRODUCTOS EN LA BASE DE DATOS que se te proporcionan abajo y muestra los datos reales.
- Si el usuario dice "agrégale más fotos" o "pon esta foto", usa UPDATE_PRODUCT con el campo imageUrl (o imageUrl2, imageUrl3 para fotos adicionales).

## 📊 ACCESO A BASE DE DATOS:
- Tienes acceso a los productos reales de la tienda. Se te inyectan en el contexto al final de este prompt.
- NUNCA inventes datos de productos. Si el usuario pregunta por un producto, búscalo en la lista de PRODUCTOS EN LA BASE DE DATOS.
- Si no encuentras el producto, dile honestamente que no lo encontraste.
- Para eliminar o actualizar un producto, usa el nombre EXACTO de la base de datos.

## Reglas:
- Responde siempre en español
- Sé concisa pero completa
- EJECUTA directamente, NO pidas confirmación
- GENERA SIEMPRE: descripción, categoría, subcategoría, tags, SKU, código de barras
- SOLO OMITE: precio y stock (si el usuario no los menciona, pon 0)
- Los SKU deben ser ÚNICOS e incrementales
- Los códigos de barras deben ser ÚNICOS (formato EAN-13, prefijo 770)
- Usa emojis con moderación para hacer las respuestas más visuales`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // ── Fetch real product data from database ──
    let productContext = '';
    try {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      const userText = (lastUserMsg?.content || '').toLowerCase();

      // Always fetch all products for context (limited)
      const result = await serverListDocuments(PRODUCTS_COLLECTION_ID);
      const docs = (result as any).documents || [];

      if (docs.length > 0) {
        // If user mentions a specific product, find matching ones
        const keywords = userText.split(/\s+/).filter((w: string) => w.length > 2);
        let relevantProducts = docs;

        // If user seems to reference a product, filter to relevant ones
        if (keywords.length > 0) {
          const matched = docs.filter((d: any) => {
            const name = (d.NAME || '').toLowerCase();
            const sku = (d.sku || d.TAGS || '').toLowerCase();
            const desc = (d.DESCRIPTION || '').toLowerCase();
            return keywords.some((k: string) => name.includes(k) || sku.includes(k) || desc.includes(k));
          });
          if (matched.length > 0) relevantProducts = matched;
        }

        const productList = relevantProducts.slice(0, 20).map((d: any) => {
          const fields = [`ID: ${d.$id}`, `Nombre: ${d.NAME}`];
          if (d.PRICE !== undefined) fields.push(`Precio: $${d.PRICE}`);
          if (d.CURRENTPRICE !== undefined) fields.push(`Precio actual: $${d.CURRENTPRICE}`);
          if (d.STOCK !== undefined) fields.push(`Stock: ${d.STOCK}`);
          if (d.CATEGORYID) fields.push(`Categoría: ${d.CATEGORYID}`);
          if (d.DESCRIPTION) fields.push(`Descripción: ${d.DESCRIPTION}`);
          if (d.IMAGEURL) fields.push(`Imagen: ${d.IMAGEURL}`);
          if (d.IMAGEURL2) fields.push(`Imagen2: ${d.IMAGEURL2}`);
          if (d.IMAGEURL3) fields.push(`Imagen3: ${d.IMAGEURL3}`);
          if (d.TAGS) fields.push(`Tags: ${d.TAGS}`);
          if (d.sku) fields.push(`SKU: ${d.sku}`);
          if (d.barcode) fields.push(`Código barras: ${d.barcode}`);
          if (d.FEATURES) fields.push(`Características: ${d.FEATURES}`);
          return fields.join(' | ');
        });

        productContext = `\n\n## 📦 PRODUCTOS EN LA BASE DE DATOS (${docs.length} total, mostrando ${Math.min(relevantProducts.length, 20)} relevantes):\n${productList.join('\n')}\n\nIMPORTANTE: Usa ESTOS datos reales cuando el usuario pregunte por productos. NUNCA inventes datos de productos. Si el producto no está en esta lista, dile que no lo encontraste.`;
      } else {
        productContext = '\n\n## 📦 BASE DE DATOS VACÍA: No hay productos registrados aún.';
      }
    } catch (dbErr) {
      console.warn('Could not fetch product context:', dbErr);
    }

    const fullSystemPrompt = SYSTEM_PROMPT + productContext;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: fullSystemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    let res;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) break;
      if (res.status === 503) { console.warn(`Model ${model} unavailable (503), trying fallback...`); continue; }
      break;
    }

    if (!res || !res.ok) {
      const err = res ? await res.text() : 'All models unavailable';
      return NextResponse.json({ error: err }, { status: res?.status || 503 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sin respuesta.';
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
