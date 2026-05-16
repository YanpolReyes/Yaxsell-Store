import { NextRequest, NextResponse } from 'next/server';
import { ID } from 'appwrite';
import { getAppwriteConfig, getServices, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function POST(req: NextRequest) {
  try {
    const { name, price, description, category, stock = 0, imageUrl = '' } = await req.json();

    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: name, price, category' },
        { status: 400 }
      );
    }

    const cfg = getAppwriteConfig();
    const { databases } = getServices();

    const productData: Record<string, unknown> = {
      NAME: name,
      DESCRIPTION: description || '',
      PRICE: parseFloat(price.toString()),
      CURRENTPRICE: parseFloat(price.toString()),
      CATEGORYID: category,
      SELLERID: 'admin',
      STOCK: parseInt(stock.toString()) || 0,
      IMAGEURL: imageUrl || 'https://placehold.co/400x400?text=Sin+Imagen',
      RATING: 0,
      NUMREVIEWS: 0,
      SOLDQUANTITY: 0,
    };

    const result = await databases.createDocument(
      cfg.databaseId,
      PRODUCTS_COLLECTION_ID,
      ID.unique(),
      productData
    );

    try {
      const { notifyNewProduct } = await import('@/services/notificationService');
      await notifyNewProduct({ $id: result.$id, NAME: name });
    } catch {
      /* notificación opcional */
    }

    return NextResponse.json({
      success: true,
      product: result,
      message: `Producto "${name}" creado exitosamente con ID: ${result.$id}`,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear el producto' },
      { status: 500 }
    );
  }
}
