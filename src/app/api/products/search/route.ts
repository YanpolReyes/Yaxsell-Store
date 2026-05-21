import { NextRequest, NextResponse } from 'next/server';
import { serverListDocuments } from '@/lib/appwrite-server';
import { PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Parámetro "name" es requerido' },
        { status: 400 }
      );
    }

    // Try exact match first
    const res = await serverListDocuments(PRODUCTS_COLLECTION_ID, [
      `equal("NAME", ["${name}"])`,
    ]);
    let docs = (res as any).documents || [];

    // Fallback: search with contains if exact match fails
    if (docs.length === 0) {
      const res2 = await serverListDocuments(PRODUCTS_COLLECTION_ID);
      const allDocs = (res2 as any).documents || [];
      docs = allDocs.filter((d: any) =>
        (d.NAME || '').toLowerCase().includes(name.toLowerCase())
      ).slice(0, limit);
    }

    const products = docs.map((d: any) => ({
      $id: d.$id,
      NAME: d.NAME,
      PRICE: d.PRICE,
      CURRENTPRICE: d.CURRENTPRICE,
      STOCK: d.STOCK,
      CATEGORYID: d.CATEGORYID,
      DESCRIPTION: d.DESCRIPTION,
      IMAGEURL: d.IMAGEURL,
    }));

    return NextResponse.json({ success: true, products, total: products.length });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al buscar productos' },
      { status: 500 }
    );
  }
}
