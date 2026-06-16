import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '6a0a4e8d0032177f3f90';
const DATABASE_ID = '6a0a58ca001798410d86';
const COLLECTION_ID = 'shipping_agencies';
const API_KEY = 'standard_c476eaadc21bbecc3b6949ee4d0a932613b7a3d4ee52c80cf2c1406750ff75267becfad617da0acd444d0b903b8faea19661d48b2f8b6dc09b678e0db164ddd4b472417c3477a091188554bdd2adfad944778a2927090744ae991c9dcf48c7cebc60e437f5c8a841ffb0736da27daf197bf5716065c2ea5dda65070b07d74642';

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
      Query.equal('active', true),
      Query.orderAsc('name'),
      Query.limit(100),
    ]);

    const agencies = res.documents.map(doc => ({
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
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

    return NextResponse.json({ success: true, agencies: results });
  } catch (e: any) {
    console.error('Error saving agencies:', e?.message);
    return NextResponse.json({ error: e?.message || 'Error saving agencies' }, { status: 500 });
  }
}
