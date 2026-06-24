import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a3c200f000d5437f6c4';
const DATABASE_ID = '6a3c237900227a52bcb2';
const COLLECTION_ID = 'shipping_agencies';
const API_KEY = 'standard_2d173f58f38634c70435e2aa17c03320dc959192545a2e6ec9834b09d80c4f459b4e92b139ee85efba504c423f5bcb1443448799dc7d3b06e811dc0d910d058e7f1093442a87e957beaaaa09569a448ec9e6e8eb178e648e6c48a6451fdffe8716722a1162d89f96e7b243109f537eca0ee1480ef0b639f24ea32e5fdd886f9d';

export const dynamic = 'force-dynamic';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// GET /api/agencies — fetch all active agencies for checkout
export async function GET() {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(100),
    ]);

    // Filter active agencies in JS — avoids relying on Appwrite index on 'active' field
    const agencies = res.documents
      .filter(doc => doc.active !== false) // include active:true and undefined (default true)
      .map(doc => ({
        id: doc.$id,
        name: doc.name,
        color: doc.color || '#3483fa',
        bg: doc.bg || '#e8f0fe',
        desc: doc.desc || '',
        logo: doc.logo || '',
        active: doc.active ?? true,
      }));

    return NextResponse.json({ agencies }, {
      headers: {
        // Cache for 5 minutes only — so new agencies appear quickly after admin saves
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (e: any) {
    // If collection doesn't exist yet, return empty
    if (e?.message?.includes('Collection not found') || e?.code === 404) {
      return NextResponse.json({ agencies: [] });
    }
    console.error('Error fetching agencies:', e?.message);
    return NextResponse.json({ agencies: [] });
  }
}

// POST /api/agencies — save full list of agencies (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencies } = body as { agencies: Array<{ id?: string; name: string; color: string; bg: string; desc: string; logo: string; active: boolean }> };

    if (!Array.isArray(agencies)) {
      return NextResponse.json({ error: 'agencies must be an array' }, { status: 400 });
    }

    // Fetch existing docs to know which to update vs create vs delete
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(100)]);
    const existingIds = new Set(existing.documents.map(d => d.$id));
    const incomingIds = new Set(agencies.filter(a => a.id).map(a => a.id));

    // Delete removed agencies
    for (const doc of existing.documents) {
      if (!incomingIds.has(doc.$id)) {
        try { await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id); } catch {}
      }
    }

    // Create or update
    const results: any[] = [];
    for (const agency of agencies) {
      const payload = {
        name: agency.name,
        color: agency.color || '#3483fa',
        bg: agency.bg || '#e8f0fe',
        desc: agency.desc || '',
        logo: agency.logo || '',
        active: agency.active ?? true,
      };

      try {
        if (agency.id && existingIds.has(agency.id)) {
          const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, agency.id, payload);
          results.push({ id: doc.$id, ...payload });
        } else {
          const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);
          results.push({ id: doc.$id, ...payload });
        }
      } catch (e: any) {
        console.error('Error upserting agency:', agency.name, e?.message);
      }
    }

    // Invalidate Vercel CDN + Next.js route cache so checkout sees the new agencies immediately
    try { revalidatePath('/api/agencies'); } catch {}

    return NextResponse.json({ success: true, agencies: results });
  } catch (e: any) {
    console.error('Error saving agencies:', e?.message);
    return NextResponse.json({ error: e?.message || 'Error saving agencies' }, { status: 500 });
  }
}
