function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key de Gemini no configurada. Ve a Configuración > AI.');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) throw new Error('Error en la API de Gemini');
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateProductTitle(description: string, category: string): Promise<string[]> {
  const prompt = `Eres un experto en e-commerce y marketing digital en Chile.
Genera 5 títulos de producto atractivos, concisos (máx 60 caracteres cada uno) y optimizados para SEO.

Categoría: ${category || 'General'}
Descripción actual: ${description || 'Sin descripción'}

Reglas:
- Cada título en una línea nueva
- Sin numeración ni viñetas
- En español chileno
- Incluye palabras clave relevantes
- No uses comillas

Responde SOLO con los 5 títulos, uno por línea.`;

  const response = await callGemini(prompt);
  return response.split('\n').map(t => t.trim()).filter(t => t.length > 3 && t.length < 100).slice(0, 5);
}

export async function generateProductDescription(name: string, category: string, currentDesc: string): Promise<string> {
  const prompt = `Eres un copywriter experto en e-commerce en Chile.
Genera una descripción de producto atractiva y persuasiva.

Producto: ${name}
Categoría: ${category || 'General'}
${currentDesc ? `Descripción actual: ${currentDesc}` : ''}

Reglas:
- Máximo 3 párrafos cortos (total ~100-150 palabras)
- Destaca beneficios, no solo características
- Usa español neutro/chileno
- No uses markdown, solo texto plano
- Incluye un llamado a la acción sutil al final

Responde SOLO con la descripción.`;

  return await callGemini(prompt);
}

export async function generateProductTags(name: string, description: string, category: string): Promise<string[]> {
  const prompt = `Genera 8 tags/etiquetas para este producto de e-commerce:
Nombre: ${name}
Categoría: ${category || 'General'}
Descripción: ${description || 'Sin descripción'}

Reglas:
- Una etiqueta por línea
- Máximo 2-3 palabras cada una
- En español
- Sin hashtags ni símbolos
- Relevantes para búsqueda

Responde SOLO con las etiquetas, una por línea.`;

  const response = await callGemini(prompt);
  return response.split('\n').map(t => t.trim()).filter(t => t.length > 1 && t.length < 40).slice(0, 8);
}
