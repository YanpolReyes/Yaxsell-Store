import { NextRequest, NextResponse } from 'next/server';
import { getServices, getAppwriteConfig, SUBCATEGORIES_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';


export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    if (!categoryId) return NextResponse.json({ subcategories: [] });

    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();

    const res = await databases.listDocuments(databaseId, SUBCATEGORIES_COLLECTION, [
      Query.equal('categoryId', categoryId),
      Query.orderAsc('$createdAt'),
      Query.limit(50),
    ]);

    return NextResponse.json({ subcategories: res.documents });
  } catch (error: any) {
    console.error('[API public-data/subcategories] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
