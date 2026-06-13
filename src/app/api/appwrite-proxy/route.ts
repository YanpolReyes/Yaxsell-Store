import { NextResponse } from 'next/server';
import { serverListDocuments, serverGetDocument } from '@/lib/appwrite-server';

// Let the Edge network/CDN handle the caching instead of a Serverless ephemeral Node.js map.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const colId = url.searchParams.get('colId');
    const docId = url.searchParams.get('docId');
    const queriesStr = url.searchParams.get('queries') || '[]';

    if (!colId) {
      return NextResponse.json({ error: 'Missing colId' }, { status: 400 });
    }

    let data;

    if (docId) {
      // Support for getDocument proxying
      data = await serverGetDocument(colId, docId);
    } else {
      let parsedQueries: string[] = [];
      try {
        parsedQueries = JSON.parse(decodeURIComponent(queriesStr));
      } catch (e) {
        console.warn('[appwrite-proxy] Invalid queries format:', queriesStr);
      }
      data = await serverListDocuments(colId, parsedQueries);
    }

    // Return the response with strict Cache-Control headers so Vercel Edge caches it for 60 seconds
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('[appwrite-proxy] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
