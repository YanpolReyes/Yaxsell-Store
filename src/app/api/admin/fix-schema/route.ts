import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6a3c200f000d5437f6c4';
const API_KEY = process.env.APPWRITE_API_KEY || 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '6a3c237900227a52bcb2';

interface AttrDef {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean';
  size?: number;
  required?: boolean;
  default?: string | number | boolean | null;
  array?: boolean;
}

const FIXES: Record<string, AttrDef[]> = {
  products: [
    { key: 'IMAGEURL4', type: 'string', size: 2048, required: false, default: null },
    { key: 'IMAGEURL5', type: 'string', size: 2048, required: false, default: null },
    { key: 'TAGS', type: 'string', size: 512, required: false, default: null, array: true },
    { key: 'FEATURES', type: 'string', size: 15000, required: false, default: null, array: true },
  ],
  points_store_items: [
    { key: 'SORTORDER', type: 'integer', required: false, default: 0 },
    { key: 'STOCK', type: 'integer', required: false, default: -1 },
  ],
  stock_alerts: [
    { key: 'USERID', type: 'string', size: 128, required: false },
    { key: 'PRODUCTNAME', type: 'string', size: 256, required: false },
    { key: 'STATUS', type: 'string', size: 32, required: false, default: 'pending' },
    { key: 'PRODUCTIMAGE', type: 'string', size: 2048, required: false },
    { key: 'USERNAME', type: 'string', size: 128, required: false },
    { key: 'EMAIL', type: 'string', size: 256, required: false },
    { key: 'NOTIFIED', type: 'boolean', required: false, default: false },
    { key: 'sku', type: 'string', size: 128, required: false },
    { key: 'jumpsellerId', type: 'string', size: 64, required: false },
  ],
  cart_snapshots: [
    { key: 'userId', type: 'string', size: 128, required: true },
    { key: 'userName', type: 'string', size: 256, required: false },
    { key: 'email', type: 'string', size: 256, required: false },
    { key: 'itemsJson', type: 'string', size: 15000, required: false },
    { key: 'updatedAt', type: 'integer', required: false },
  ]
};

async function createCollection(collectionId: string, name: string): Promise<{ created: boolean; error?: string }> {
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections`;
  const body = {
    collectionId,
    name,
    permissions: [
      'read("any")',
      'create("any")',
      'update("any")',
      'delete("any")'
    ],
    documentSecurity: false
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { created: true };
    const data = await res.json();
    if (data?.message?.includes('already exists') || data?.code === 409) {
      return { created: false, error: 'already exists' };
    }
    return { created: false, error: data?.message || `HTTP ${res.status}` };
  } catch (err: any) {
    return { created: false, error: err.message };
  }
}

async function createAttribute(collectionId: string, attr: AttrDef): Promise<{ created: boolean; error?: string }> {
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${attr.type === 'integer' ? 'integer' : attr.type === 'float' ? 'float' : attr.type === 'boolean' ? 'boolean' : 'string'}`;

  const body: Record<string, unknown> = { key: attr.key, required: attr.required ?? false };
  if (attr.type === 'string') body.size = attr.size ?? 256;
  if (attr.default !== undefined && attr.default !== null) body.default = attr.default;
  if (attr.array !== undefined) body.array = attr.array;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { created: true };
    const data = await res.json();
    // Attribute already exists is not an error
    if (data?.message?.includes('already exists') || data?.code === 409) {
      return { created: false, error: 'already exists' };
    }
    return { created: false, error: data?.message || `HTTP ${res.status}` };
  } catch (err: any) {
    return { created: false, error: err.message };
  }
}

export async function GET(req: NextRequest) {
  return handleFixSchema();
}

export async function POST(req: NextRequest) {
  return handleFixSchema();
}

async function handleFixSchema() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'APPWRITE_API_KEY not configured' }, { status: 500 });
  }

  const results: Record<string, any[]> = {};

  // First, ensure all required collections exist (like cart_snapshots)
  const collectionsToCreate = [
    { id: 'cart_snapshots', name: 'Cart Snapshots' }
  ];

  results._collections = [];
  for (const col of collectionsToCreate) {
    const res = await createCollection(col.id, col.name);
    results._collections.push({ collectionId: col.id, ...res });
  }

  // Then, create attributes for all collections
  for (const [collectionId, attrs] of Object.entries(FIXES)) {
    results[collectionId] = [];
    for (const attr of attrs) {
      const result = await createAttribute(collectionId, attr);
      results[collectionId].push({ attribute: attr.key, ...result });
    }
  }

  return NextResponse.json({ success: true, results });
}
