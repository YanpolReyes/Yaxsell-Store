import { NextRequest, NextResponse } from 'next/server';
import { getAppwriteConfig, getServices, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';
import { Query } from 'appwrite';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name query parameter is required' },
        { status: 400 }
      );
    }

    const cfg = getAppwriteConfig();
    const { databases } = getServices();

    // Try exact match first
    let resp = await databases.listDocuments(cfg.databaseId, PRODUCTS_COLLECTION_ID, [
      Query.equal('NAME', name),
      Query.limit(limit),
    ]);

    // Fallback to contains search
    if (resp.total === 0) {
      resp = await databases.listDocuments(cfg.databaseId, PRODUCTS_COLLECTION_ID, [
        Query.search('NAME', name),
        Query.limit(limit),
      ]);
    }

    return NextResponse.json({
      success: true,
      products: resp.documents,
      total: resp.total,
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al buscar productos' },
      { status: 500 }
    );
  }
}
