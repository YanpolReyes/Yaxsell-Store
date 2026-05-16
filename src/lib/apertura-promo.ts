import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, APERTURA_SETTINGS_COLLECTION } from '@/lib/appwrite';

export type AperturaSettings = {
  isActive: boolean;
  discountPercent: number;
  minPurchase: number;
};

export type ProductPriceLike = {
  PRICE: number;
  CURRENTPRICE?: number | null;
};

export type ResolvedProductPrice = {
  displayPrice: number;
  originalPrice: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  fromApertura: boolean;
};

const DEFAULT_SETTINGS: AperturaSettings = {
  isActive: false,
  discountPercent: 20,
  minPurchase: 62500,
};

export function getAperturaDiscountedPrice(price: number, discountPercent: number): number {
  if (!price || discountPercent <= 0) return price;
  return Math.round(price * (1 - discountPercent / 100));
}

/** Precio mostrado: oferta del producto (CURRENTPRICE) tiene prioridad sobre promoción apertura. */
export function resolveProductDisplayPrice(
  product: ProductPriceLike,
  apertura: AperturaSettings | null | undefined,
): ResolvedProductPrice {
  const base = product.PRICE || 0;
  const sale =
    product.CURRENTPRICE && product.CURRENTPRICE > 0 && product.CURRENTPRICE < base
      ? product.CURRENTPRICE
      : null;

  if (sale != null) {
    return {
      displayPrice: sale,
      originalPrice: base,
      hasDiscount: true,
      discountPercent: base > 0 ? Math.round(((base - sale) / base) * 100) : 0,
      fromApertura: false,
    };
  }

  if (apertura?.isActive && apertura.discountPercent > 0 && base > 0) {
    const displayPrice = getAperturaDiscountedPrice(base, apertura.discountPercent);
    if (displayPrice < base) {
      return {
        displayPrice,
        originalPrice: base,
        hasDiscount: true,
        discountPercent: apertura.discountPercent,
        fromApertura: true,
      };
    }
  }

  return {
    displayPrice: base,
    originalPrice: null,
    hasDiscount: false,
    discountPercent: 0,
    fromApertura: false,
  };
}

export async function fetchAperturaSettings(): Promise<AperturaSettings> {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    if (!databaseId) return DEFAULT_SETTINGS;
    const res = await databases.listDocuments(databaseId, APERTURA_SETTINGS_COLLECTION, [Query.limit(1)]);
    if (!res.documents.length) return DEFAULT_SETTINGS;
    const d = res.documents[0] as Record<string, unknown>;
    return {
      isActive: !!d.isActive,
      discountPercent: typeof d.discountPercent === 'number' ? d.discountPercent : 20,
      minPurchase: typeof d.minPurchase === 'number' ? d.minPurchase : 62500,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
