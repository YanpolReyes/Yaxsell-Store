import { NextResponse } from 'next/server';
import { serverListDocuments, serverGetDocument } from '@/lib/appwrite-server';
import { unstable_cache } from 'next/cache';

const getCachedList = unstable_cache(
  async (colId: string, parsedQueries: string[]) => {
    return await serverListDocuments(colId, parsedQueries);
  },
  ['appwrite-list-documents'],
  { revalidate: 60, tags: ['appwrite-proxy'] }
);

const getCachedDoc = unstable_cache(
  async (colId: string, docId: string) => {
    return await serverGetDocument(colId, docId);
  },
  ['appwrite-get-document'],
  { revalidate: 60, tags: ['appwrite-proxy'] }
);

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
      data = await getCachedDoc(colId, docId);
    } else {
      let parsedQueries: string[] = [];
      try {
        parsedQueries = JSON.parse(decodeURIComponent(queriesStr));
      } catch (e) {
        console.warn('[appwrite-proxy] Invalid queries format:', queriesStr);
      }
      data = await getCachedList(colId, parsedQueries);
    }

    // Still return Edge cache headers just in case
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

