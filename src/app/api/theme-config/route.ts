import { NextRequest, NextResponse } from 'next/server';

// Force Vercel to never cache this API — theme config changes frequently
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'theme_config';
const DOC_ID = 'homepage_sections';
const API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

// GET - Obtener configuración
export async function GET() {
  try {
    const res = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${DOC_ID}`, {
      method: 'GET',
      headers,
    });
    
    if (res.ok) {
      const doc = await res.json();
      return NextResponse.json(
        { success: true, sections: doc.sections },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } },
      );
    }
    
    // Documento no existe, crear vacío
    const createRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        documentId: DOC_ID,
        data: { sections: '[]' },
      }),
    });
    
    if (createRes.ok) {
      return NextResponse.json(
        { success: true, sections: '[]' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } },
      );
    }
    
    const err = await createRes.json();
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Guardar configuración
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sections = typeof body.sections === 'string' ? body.sections : JSON.stringify(body.sections);
    
    // Intentar actualizar
    const updateRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${DOC_ID}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        data: { sections },
      }),
    });
    
    if (updateRes.ok) {
      return NextResponse.json(
        { success: true },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } },
      );
    }
    
    // Si no existe, crear
    const createRes = await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        documentId: DOC_ID,
        data: { sections },
      }),
    });
    
    if (createRes.ok) {
      return NextResponse.json(
        { success: true },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } },
      );
    }
    
    const err = await createRes.json();
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Resetear configuración
export async function DELETE() {
  try {
    await fetch(`${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${DOC_ID}`, {
      method: 'DELETE',
      headers,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
