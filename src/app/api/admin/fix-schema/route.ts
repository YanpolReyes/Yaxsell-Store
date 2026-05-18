import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

interface AttrDef {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean';
  size?: number;
  required?: boolean;
  default?: string | number | boolean | null;
}

const FIXES: Record<string, AttrDef[]> = {
  products: [
    { key: 'IMAGEURL4', type: 'string', size: 2048, required: false, default: null },
    { key: 'IMAGEURL5', type: 'string', size: 2048, required: false, default: null },
  ],
  points_store_items: [
    { key: 'SORTORDER', type: 'integer', required: false, default: 0 },
    { key: 'STOCK', type: 'integer', required: false, default: -1 },
  ],
};

async function createAttribute(collectionId: string, attr: AttrDef): Promise<{ created: boolean; error?: string }> {
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${attr.type === 'integer' ? 'integer' : attr.type === 'float' ? 'float' : attr.type === 'boolean' ? 'boolean' : 'string'}`;

  const body: Record<string, unknown> = { key: attr.key, required: attr.required ?? false };
  if (attr.type === 'string') body.size = attr.size ?? 256;
  if (attr.default !== undefined && attr.default !== null) body.default = attr.default;

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

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'APPWRITE_API_KEY not configured' }, { status: 500 });
  }

  const results: Record<string, any[]> = {};

  for (const [collectionId, attrs] of Object.entries(FIXES)) {
    results[collectionId] = [];
    for (const attr of attrs) {
      const result = await createAttribute(collectionId, attr);
      results[collectionId].push({ attribute: attr.key, ...result });
    }
  }

  return NextResponse.json({ success: true, results });
}
