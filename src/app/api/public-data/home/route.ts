import { NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, PRODUCTS_COLLECTION, CATEGORIES_COLLECTION, BANNERS_COLLECTION, TIMED_OFFERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const revalidate = 300; // Cache for 5 minutes across all users

export async function GET() {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const [prodDocs, catDocs, banDocs, offDocs, packDocs] = await Promise.all([
      databases.listDocuments(databaseId, PRODUCTS_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(8)]),
      databases.listDocuments(databaseId, CATEGORIES_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(20)]),
      databases.listDocuments(databaseId, BANNERS_COLLECTION, [Query.orderDesc('$createdAt'), Query.limit(5)]),
      databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [Query.equal('isActive', true), Query.equal('status', 'active'), Query.limit(5)]),
      databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [Query.equal('offerType', 'pack_timer'), Query.equal('isActive', true), Query.limit(1)]).catch(() => ({ documents: [] })),
    ]);

    return NextResponse.json({
      products: prodDocs.documents,
      categories: catDocs.documents,
      banners: banDocs.documents,
      offers: offDocs.documents,
      packTimer: packDocs.documents[0] || null,
    });
  } catch (error: any) {
    console.error('[API public-data/home] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
