import { NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, HOTSPOT_PANELS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const res = await databases.listDocuments(databaseId, HOTSPOT_PANELS_COLLECTION, [
      Query.equal('ISACTIVE', true),
      Query.orderAsc('CELLINDEX'),
      Query.limit(50)
    ]);
    return NextResponse.json({ panels: res.documents }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err) {
    return NextResponse.json({ panels: [] });
  }
}

