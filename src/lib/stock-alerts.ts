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
  productName?: string;
  productImage?: string;
  userName?: string;
  email?: string;
  status?: string;
}): Record<string, unknown> {
  return {
    PRODUCTID: input.productId,
    USERID: input.userId,
    CREATEDAT: Date.now(),
    PRODUCTNAME: input.productName ?? '',
    PRODUCTIMAGE: input.productImage ?? '',
    USERNAME: input.userName || input.email || '',
    STATUS: input.status ?? 'pending',
  };
}
