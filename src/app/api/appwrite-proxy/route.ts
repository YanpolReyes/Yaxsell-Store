import { NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';

// Global memory cache for the proxy
// Valid across the lifetime of the Node.js process / Serverless function instance
const cache = new Map<string, { expiresAt: number; data: any }>();

// TTL in milliseconds (60 seconds)
const CACHE_TTL = 60 * 1000;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const colId = url.searchParams.get('colId');
    const queriesStr = url.searchParams.get('queries') || '[]';

    if (!colId) {
      return NextResponse.json({ error: 'Missing colId' }, { status: 400 });
    }

    const cacheKey = `${colId}-${queriesStr}`;
    const now = Date.now();

    // Check memory cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (cached.expiresAt > now) {
        return NextResponse.json(cached.data);
      } else {
        // Clear expired
        cache.delete(cacheKey);
      }
    }

    // Parse queries
    let parsedQueries: string[] = [];
    try {
      parsedQueries = JSON.parse(decodeURIComponent(queriesStr));
    } catch (e) {
      console.warn('[appwrite-proxy] Invalid queries format:', queriesStr);
    }

    // Fetch from Appwrite using server SDK (bypasses permissions if necessary, 
    // but these are public collections anyway).
    const data = await serverListDocuments(colId, parsedQueries);

    // Save to cache
    cache.set(cacheKey, { expiresAt: now + CACHE_TTL, data });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[appwrite-proxy] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
