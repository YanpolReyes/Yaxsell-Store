import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'newest';

    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const queries: string[] = [Query.limit(2000), Query.greaterThan('STOCK', 0)];
    if (sortBy === 'newest') queries.push(Query.orderDesc('$createdAt'));
    else if (sortBy === 'price_asc') queries.push(Query.orderAsc('PRICE'));
    else if (sortBy === 'price_desc') queries.push(Query.orderDesc('PRICE'));

    const res = await databases.listDocuments(databaseId, PRODUCTS_COLLECTION, queries);

    return NextResponse.json({ products: res.documents });
  } catch (error: any) {
    console.error('[API public-data/products] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
