import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAPU7MGRQWFHHA1NhWD0rTfcVGOCVGOQok';

export async function POST(req: NextRequest) {
  try {
    const { prompt, referenceImageUrl, referenceImageBase64 } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'prompt es requerido' }, { status: 400 });
    }

    // Build parts array for Gemini
    const parts: any[] = [{ text: prompt }];

    // If we have a reference image URL, fetch it and include as inline data
    if (referenceImageUrl) {
      try {
        const imgRes = await fetch(referenceImageUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/png';
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          parts.push({
            inlineData: {
              mimeType: contentType,
              data: base64,
            },
          });
        }
      } catch (e) {
        console.warn('Could not fetch reference image:', e);
      }
    } else if (referenceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: referenceImageBase64,
        },
      });
    }

    // Use Gemini 2.0 Flash with image generation capability
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 1,
        maxOutputTokens: 8192,
      },
    };

    const models = ['gemini-2.0-flash-exp', 'gemini-2.0-flash-preview-image-generation'];
    let res;
    let lastErrText = '';

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) break;
      lastErrText = await res.text();
      console.warn(`Model ${model} failed (${res.status}):`, lastErrText.slice(0, 200));
      if (res.status === 404 || res.status === 400) continue;
      break;
    }

    if (!res || !res.ok) {
      console.error('Gemini image gen error:', res?.status, lastErrText);
      return NextResponse.json({ error: `Error generando imagen (${res?.status || 503})` }, { status: res?.status || 503 });
    }

    const data = await res.json();
    const candidates = data?.candidates || [];

    // Extract generated image from response
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const { mimeType, data: base64 } = part.inlineData;
          // Return as data URL
          const dataUrl = `data:${mimeType};base64,${base64}`;
          return NextResponse.json({ imageUrl: dataUrl, mimeType });
        }
      }
    }

    // If no image was generated, return the text response
    const text = candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
    return NextResponse.json({ error: 'No se pudo generar la imagen. La IA respondió con texto: ' + text.slice(0, 200) }, { status: 400 });
  } catch (err: any) {
    console.error('Generate image route error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
