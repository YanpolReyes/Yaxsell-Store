import { NextRequest, NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'sequences';
const TEMPLATE_KEY = 'store_template';
const API_KEY = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

/**
 * GET /api/template
 * Returns the currently active store template id.
 * Reads from sequences collection using server API key (bypasses public read permission).
 */
export async function GET() {
  try {
    const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?query=${encodeURIComponent(`equal("key", "${TEMPLATE_KEY}")`)}&query=${encodeURIComponent('limit(1)')}`;

    const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API template] Appwrite GET failed:', res.status, errorText);
      return NextResponse.json({ template: 1, error: errorText }, { status: 200, headers: noStoreHeaders });
    }

    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const template = Number(data.documents[0].value) || 1;
      return NextResponse.json({ template }, { headers: noStoreHeaders });
    }

    return NextResponse.json({ template: 1 }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error('[API template] Exception:', error);
    return NextResponse.json({ template: 1, error: error.message }, { status: 200, headers: noStoreHeaders });
  }
}

/**
 * POST /api/template
 * Sets the active store template id.
 * Body: { template: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = Number(body.template);
    if (!template || template < 1) {
      return NextResponse.json({ success: false, error: 'Invalid template id' }, { status: 400 });
    }

    // Buscar documento existente
    const listUrl = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?query=${encodeURIComponent(`equal("key", "${TEMPLATE_KEY}")`)}&query=${encodeURIComponent('limit(1)')}`;
    const listRes = await fetch(listUrl, { method: 'GET', headers, cache: 'no-store' });

    if (!listRes.ok) {
      const errorText = await listRes.text();
      console.error('[API template POST] list failed:', listRes.status, errorText);
      return NextResponse.json({ success: false, error: errorText }, { status: 500 });
    }

    const listData = await listRes.json();

    if (listData.documents && listData.documents.length > 0) {
      // Update existing
      const docId = listData.documents[0].$id;
      const updateRes = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${docId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ data: { value: template } }),
        }
      );
      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error('[API template POST] update failed:', updateRes.status, errorText);
        return NextResponse.json({ success: false, error: errorText }, { status: 500 });
      }
      return NextResponse.json({ success: true, template }, { headers: noStoreHeaders });
    }

    // Create new
    const createRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentId: 'unique()',
          data: { key: TEMPLATE_KEY, value: template },
        }),
      }
    );

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error('[API template POST] create failed:', createRes.status, errorText);
      return NextResponse.json({ success: false, error: errorText }, { status: 500 });
    }

    return NextResponse.json({ success: true, template }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error('[API template POST] Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
