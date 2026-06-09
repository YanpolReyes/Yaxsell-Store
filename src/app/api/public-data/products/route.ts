import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { unstable_cache } from 'next/cache';

const getCachedProducts = unstable_cache(
  async (sortBy: string) => {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const queries: string[] = [Query.limit(500), Query.greaterThan('STOCK', 0)];
    if (sortBy === 'newest') queries.push(Query.orderDesc('$createdAt'));
    else if (sortBy === 'price_asc') queries.push(Query.orderAsc('PRICE'));
    else if (sortBy === 'price_desc') queries.push(Query.orderDesc('PRICE'));

    const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, queries);
    return res.documents;
  },
  ['public-products-cache'],
  { revalidate: 60, tags: ['products'] }
);

function getLiveShoppingThreshold(): Date {
  const now = new Date();
  // Set today at 7:00 AM local time
  const today7Am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0);
  if (now.getTime() >= today7Am.getTime()) {
    return today7Am;
  } else {
    const yesterday7Am = new Date(today7Am);
    yesterday7Am.setDate(yesterday7Am.getDate() - 1);
    return yesterday7Am;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isLive = searchParams.get('live') === 'true';
    const sortBy = searchParams.get('sortBy') || 'newest';

    if (isLive) {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const threshold = getLiveShoppingThreshold();

      // Query directly by imported_at >= threshold to get ALL live products
      const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [
        Query.greaterThanEqual('imported_at', threshold.toISOString()),
        Query.greaterThan('STOCK', 0),
        Query.orderDesc('imported_at'),
        Query.limit(500),
      ]);

      const liveProducts = res.documents.filter((doc: any) => (doc.STOCK || 0) > 0);

      return NextResponse.json({ products: liveProducts });
    }

    const products = await getCachedProducts(sortBy);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('[API public-data/products] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
