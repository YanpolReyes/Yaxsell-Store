import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAPU7MGRQWFHHA1NhWD0rTfcVGOCVGOQok';
const MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'prompt es requerido' }, { status: 400 });
    }

    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    let res;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (res.ok) break;
      if (res.status === 503) { console.warn(`Model ${model} unavailable (503), trying fallback...`); continue; }
      break;
    }

    if (!res || !res.ok) {
      const errText = res ? await res.text() : 'All models unavailable';
      console.error('Gemini API error:', res?.status, errText);
      return NextResponse.json({ error: `Error en la API de Gemini (${res?.status || 503})` }, { status: res?.status || 503 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('Gemini route error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
