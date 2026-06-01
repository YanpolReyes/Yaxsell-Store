import { NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, CATEGORIES_COLLECTION, TIMED_OFFERS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const [catDocs, offDocs] = await Promise.all([
      databases.listDocuments(databaseId, CATEGORIES_COLLECTION, [Query.orderAsc('$createdAt'), Query.limit(30)]),
      databases.listDocuments(databaseId, TIMED_OFFERS_COLLECTION, [Query.equal('isActive', true), Query.equal('status', 'active'), Query.limit(100)])
    ]);

    return NextResponse.json({
      categories: catDocs.documents,
      offers: offDocs.documents
    });
  } catch (error: any) {
    console.error('[API public-data/catalog] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
