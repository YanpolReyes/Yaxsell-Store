import { NextRequest, NextResponse } from 'next/server';
import { serverCreateDocument } from '@/lib/appwrite-server';
import { PRODUCTS_COLLECTION_ID } from '@/lib/appwrite-admin';

// Attributes that may not exist in all Appwrite schemas
const OPTIONAL_ATTRS = ['TAGS', 'FEATURES', 'sku', 'barcode', 'IMAGEURL2', 'IMAGEURL3', 'WHOLESALEPRICE', 'WHOLESALEMINQUANTITY', 'PACKQTY', 'INTERNALCODE', 'section'];

export async function POST(req: NextRequest) {
  try {
    const { name, price, description, category, stock = 0, imageUrl = '', imageUrl2 = '', imageUrl3 = '', tags = '', sku = '', barcode = '', wholesalePrice = 0, wholesaleMinQuantity = 0, packQty = 0, internalCode = '', section = 0, features = '' } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: name, price' },
        { status: 400 }
      );
    }

    // Build FEATURES string from sku, barcode and AI features
    let featuresStr = features || '';
    if (sku) featuresStr += `${featuresStr ? '\n' : ''}SKU: ${sku}`;
    if (barcode) featuresStr += `${featuresStr ? '\n' : ''}Barcode: ${barcode}`;

    const productData: Record<string, unknown> = {
      NAME: name,
      DESCRIPTION: description || '',
      PRICE: parseFloat(price.toString()),
      CURRENTPRICE: parseFloat(price.toString()),
      CATEGORYID: category || '',
      STOCK: parseInt(stock.toString()) || 0,
      IMAGEURL: imageUrl || 'https://placehold.co/400x400?text=Sin+Imagen',
      IMAGEURL2: imageUrl2 || '',
      IMAGEURL3: imageUrl3 || '',
      RATING: 0,
      NUMREVIEWS: 0,
      SOLDQUANTITY: 0,
    };
    // Optional fields
    if (tags) productData.TAGS = tags;
    if (featuresStr) productData.FEATURES = featuresStr;
    if (sku) productData.sku = sku;
    if (barcode) productData.barcode = barcode;
    if (wholesalePrice) productData.WHOLESALEPRICE = wholesalePrice;
    if (wholesaleMinQuantity) productData.WHOLESALEMINQUANTITY = wholesaleMinQuantity;
    if (packQty) productData.PACKQTY = packQty;
    if (internalCode) productData.INTERNALCODE = internalCode;
    if (section) productData.section = section;

    let result;
    try {
      result = await serverCreateDocument(PRODUCTS_COLLECTION_ID, 'unique()', productData);
    } catch (attrErr: any) {
      // If unknown attribute error, retry without optional fields
      if (attrErr?.message?.includes('Unknown attribute')) {
        console.warn('Retrying without optional attrs:', attrErr.message);
        const safeData = { ...productData };
        for (const attr of OPTIONAL_ATTRS) delete safeData[attr];
        result = await serverCreateDocument(PRODUCTS_COLLECTION_ID, 'unique()', safeData);
      } else {
        throw attrErr;
      }
    }

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
