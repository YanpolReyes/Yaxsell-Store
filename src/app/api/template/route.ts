import { NextRequest, NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'sequences';
const TEMPLATE_KEY = 'store_template';
const API_KEY = 'standard_dea4a8654ed430bf3626a6cd6506a562cbfcebb7caeb417a1e83c8228ed1de0a84d60b11cc4776d023d0c5ac8d1dcb0ba59e43fef5fb8831a7252aaf5b2f13896769e2a5af222f9853d7f7abcada2d034e1d92e3b73d8de53d1c29adde00cd723aa5612189b2ee702e798acb0dffeb9ff154714a5f7af060c78567391d49923d';

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
    const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent(`equal("key", ["${TEMPLATE_KEY}"])`)}&queries[]=${encodeURIComponent('limit(1)')}`;

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
    const listUrl = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent(`equal("key", ["${TEMPLATE_KEY}"])`)}&queries[]=${encodeURIComponent('limit(1)')}`;
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
          body: JSON.stringify({ data: { value: String(template) } }),
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
          data: { key: TEMPLATE_KEY, value: String(template) },
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
