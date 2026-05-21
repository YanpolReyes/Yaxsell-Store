import { NextRequest, NextResponse } from 'next/server';
import { serverUpdateDocument } from '@/lib/appwrite-server';
import { PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

export async function PATCH(req: NextRequest) {
  try {
    const { productId, name, price, description, category, stock, imageUrl, tags, sku, barcode } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId es requerido' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.NAME = name;
    if (price !== undefined) {
      updates.PRICE = parseFloat(price.toString());
      updates.CURRENTPRICE = parseFloat(price.toString());
    }
    if (description !== undefined) updates.DESCRIPTION = description;
    if (category !== undefined) updates.CATEGORYID = category;
    if (stock !== undefined) updates.STOCK = parseInt(stock.toString());
    if (imageUrl !== undefined) updates.IMAGEURL = imageUrl;
    if (tags !== undefined) updates.TAGS = tags;
    if (sku !== undefined) updates.sku = sku;
    if (barcode !== undefined) updates.barcode = barcode;
    // Build FEATURES from sku/barcode if provided
    if (sku || barcode) {
      let features = '';
      if (sku) features += `SKU: ${sku}\n`;
      if (barcode) features += `Barcode: ${barcode}\n`;
      updates.FEATURES = features;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se enviaron campos para actualizar' },
        { status: 400 }
      );
    }

    const result = await serverUpdateDocument(PRODUCTS_COLLECTION_ID, productId, updates);

    const fieldsUpdated = Object.keys(updates).join(', ');
    return NextResponse.json({
      success: true,
      product: result,
      message: `Producto actualizado: ${fieldsUpdated}`,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar el producto' },
      { status: 500 }
    );
  }
}
