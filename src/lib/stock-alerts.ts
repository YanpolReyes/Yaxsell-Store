export interface StockAlert {
  $id: string;
  productId: string;
  productName: string;
  productImage: string;
  userId: string;
  userName: string;
  email: string;
  status: string;
  createdAt: number;
  notified: boolean;
  sku?: string;
  jumpsellerId?: string;
}

type RawStockAlert = Record<string, unknown>;

export function normalizeStockAlert(doc: RawStockAlert): StockAlert {
  return {
    $id: String(doc.$id ?? ''),
    productId: String(doc.productId ?? doc.PRODUCTID ?? ''),
    productName: String(doc.PRODUCTNAME ?? ''),
    productImage: String(doc.PRODUCTIMAGE ?? ''),
    userId: String(doc.userId ?? doc.USERID ?? ''),
    userName: String(doc.USERNAME ?? ''),
    email: String(doc.EMAIL ?? ''),
    status: String(doc.STATUS ?? 'pending'),
    createdAt: Number(doc.createdAt ?? doc.CREATEDAT ?? 0),
    notified: Boolean(doc.NOTIFIED ?? false),
    sku: String(doc.SKU ?? doc.sku ?? ''),
    jumpsellerId: String(doc.JUMPSELLERID ?? doc.jumpsellerId ?? ''),
  };
}

export function buildStockAlertData(input: {
  productId: string;
  userId: string;
  productName?: string;
  productImage?: string;
  sku?: string;
  jumpsellerId?: string;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    productId: input.productId,
    userId: input.userId,
    createdAt: Date.now(),
  };
  if (input.productName) data.PRODUCTNAME = input.productName;
  if (input.productImage) data.PRODUCTIMAGE = input.productImage;
  if (input.sku) data.SKU = input.sku;
  if (input.jumpsellerId) data.JUMPSELLERID = input.jumpsellerId;
  return data;
}
