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
  };
}

export function buildStockAlertData(input: {
  productId: string;
  userId: string;
}): Record<string, unknown> {
  return {
    productId: input.productId,
    userId: input.userId,
    createdAt: Date.now(),
  };
}
