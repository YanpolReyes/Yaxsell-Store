import { NextRequest, NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const COLLECTION_ID = 'sequences';
const TEMPLATE_KEY = 'store_template';
const API_KEY = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

const noStoreHeaders = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};
// Permitir caché de 1 minuto para evitar 7 lecturas a la BD por cada vista de página
import { Client, Databases, Query } from 'node-appwrite';

// Fallback in-memory cache to guarantee database reads stay low even under high concurrent load
let memoryCacheAllTemplates: any = null;
let memoryCacheAllTemplatesTime = 0;
const TEMPLATE_CACHE_TTL = 300_000; // 5 minutes cache

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

/** Helper: read a single key from sequences collection */
async function readKey(key: string): Promise<number> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("key", key),
      Query.limit(1)
    ]);
    if (res.documents && res.documents.length > 0) {
      return Number(res.documents[0].value) || 0;
    }
  } catch (e) {
    console.error('readKey error:', e);
  }
  return 0;
}

/** Helper: write a single key to sequences collection (upsert) */
async function writeKey(key: string, value: number): Promise<boolean> {
  try {
    const listRes = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("key", key),
      Query.limit(1)
    ]);

    if (listRes.documents && listRes.documents.length > 0) {
      const docId = listRes.documents[0].$id;
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, { value });
      return true;
    }

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, 'unique()', { key, value });
    return true;
  } catch (e) {
    console.error('writeKey error:', e);
    return false;
  }
}

/**
 * GET /api/template
 * Returns all section templates.
 * Query param ?section=landing to get a specific section.
 */
export async function GET(req: NextRequest) {
  try {
    const section = req.nextUrl.searchParams.get('section');
    const now = Date.now();

    // Populate or refresh the cache if expired
    if (!memoryCacheAllTemplates || (now - memoryCacheAllTemplatesTime >= TEMPLATE_CACHE_TTL)) {
      const global = await readKey(TEMPLATE_KEY) || 1;
      const sections = ['landing', 'collections', 'catalog', 'productDetail', 'cart', 'checkout'] as const;
      const result: Record<string, number> = { landing: global, collections: global, catalog: global, productDetail: global, cart: global, checkout: global };

      for (const sec of sections) {
        const val = await readKey(`${TEMPLATE_KEY}_${sec}`);
        if (val) result[sec] = val;
      }

      memoryCacheAllTemplates = { template: global, sections: result };
      memoryCacheAllTemplatesTime = now;
    }

    if (section) {
      const global = memoryCacheAllTemplates.template;
      const val = memoryCacheAllTemplates.sections[section] || global;
      return NextResponse.json({ template: val, section });
    }

    return NextResponse.json(memoryCacheAllTemplates);
  } catch (error: any) {
    console.error('[API template] Exception:', error);
    return NextResponse.json({ template: 1, sections: { landing: 1, collections: 1, catalog: 1, productDetail: 1, cart: 1, checkout: 1 }, error: error.message }, { status: 200 });
  }
}

/**
 * POST /api/template
 * Sets a template for a specific section or globally.
 * Body: { template: number, section?: string }
 * If section is provided, sets template for that section only.
 * If section is omitted, sets the global/default template.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = Number(body.template);
    const section = body.section as string | undefined;

    if (!template || template < 1) {
      return NextResponse.json({ success: false, error: 'Invalid template id' }, { status: 400 });
    }

    const key = section ? `${TEMPLATE_KEY}_${section}` : TEMPLATE_KEY;
    const ok = await writeKey(key, template);

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to write template' }, { status: 500 });
    }

    // Invalidate in-memory cache on update so changes take effect immediately
    memoryCacheAllTemplates = null;
    memoryCacheAllTemplatesTime = 0;

    return NextResponse.json({ success: true, template, section: section || null }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error('[API template POST] Exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
