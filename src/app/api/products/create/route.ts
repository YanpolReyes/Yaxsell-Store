import { NextRequest, NextResponse } from 'next/server';
import { serverCreateDocument } from '@/lib/appwrite-server';
import { PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function POST(req: NextRequest) {
  try {
    const { name, price, description, category, stock = 0, imageUrl = '', tags = '', sku = '', barcode = '' } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: name, price' },
        { status: 400 }
      );
    }

    // Build FEATURES string from sku and barcode
    let features = '';
    if (sku) features += `SKU: ${sku}\n`;
    if (barcode) features += `Barcode: ${barcode}\n`;

    const productData: Record<string, unknown> = {
      NAME: name,
      DESCRIPTION: description || '',
      PRICE: parseFloat(price.toString()),
      CURRENTPRICE: parseFloat(price.toString()),
      CATEGORYID: category || '',
      STOCK: parseInt(stock.toString()) || 0,
      IMAGEURL: imageUrl || 'https://placehold.co/400x400?text=Sin+Imagen',
      RATING: 0,
      NUMREVIEWS: 0,
      SOLDQUANTITY: 0,
    };
    // Optional fields that may not exist in schema
    if (tags) productData.TAGS = tags;
    if (features) productData.FEATURES = features;
    if (sku) productData.sku = sku;
    if (barcode) productData.barcode = barcode;

    const result = await serverCreateDocument(PRODUCTS_COLLECTION_ID, 'unique()', productData);

    try {
      const { notifyNewProduct } = await import('@/services/notificationService');
      await notifyNewProduct({ $id: (result as any).$id, NAME: name });
    } catch {
      /* notificación opcional */
    }

    return NextResponse.json({
      success: true,
      product: result,
      message: `Producto "${name}" creado exitosamente`,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear el producto' },
      { status: 500 }
    );
  }
}
