import { Query } from 'appwrite';
import { getServices, getAppwriteConfig, APERTURA_SETTINGS_COLLECTION } from '@/lib/appwrite';
import type { LiveLogicConfig } from '@/lib/product-features';
import { isLiveLogicLimitedTimeActive } from '@/lib/product-features';

export type AperturaSettings = {
  isActive: boolean;
  discountPercent: number;
  minPurchase: number;
};

export type ProductPriceLike = {
  PRICE: number;
  CURRENTPRICE?: number | null;
  WHOLESALEPRICE?: number | null;
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
  liveLogic?: LiveLogicConfig | null,
): ResolvedProductPrice {
  const base = product.PRICE || 0;
  const wholesale = product.WHOLESALEPRICE && product.WHOLESALEPRICE > 0 ? product.WHOLESALEPRICE : null;
  // If PRICE is 0 but WHOLESALEPRICE exists, use wholesale as base
  const effectiveBase = base > 0 ? base : (wholesale ?? 0);
  const sale =
    product.CURRENTPRICE && product.CURRENTPRICE > 0 && product.CURRENTPRICE < effectiveBase
      ? product.CURRENTPRICE
      : null;

  if (sale != null) {
    return {
      displayPrice: sale,
      originalPrice: effectiveBase,
      hasDiscount: true,
      discountPercent: effectiveBase > 0 ? Math.round(((effectiveBase - sale) / effectiveBase) * 100) : 0,
      fromApertura: false,
    };
  }

  // If a live logic limited-time offer is active, show the live offer price
  if (liveLogic?.limitedTime && isLiveLogicLimitedTimeActive(liveLogic)) {
    const offerPrice = liveLogic.limitedTime.offerPrice;
    if (offerPrice > 0 && offerPrice < effectiveBase) {
      return {
        displayPrice: offerPrice,
        originalPrice: effectiveBase,
        hasDiscount: true,
        discountPercent: Math.round(((effectiveBase - offerPrice) / effectiveBase) * 100),
        fromApertura: false,
      };
    }
  }

  // Suppress apertura discount if live logic has disableApertura flag
  const suppressApertura = liveLogic?.disableApertura === true;

  if (!suppressApertura && apertura?.isActive && apertura.discountPercent > 0 && effectiveBase > 0 && base > 0) {
    const displayPrice = getAperturaDiscountedPrice(effectiveBase, apertura.discountPercent);
    if (displayPrice < effectiveBase) {
      return {
        displayPrice,
        originalPrice: effectiveBase,
        hasDiscount: true,
        discountPercent: apertura.discountPercent,
        fromApertura: true,
      };
    }
  }

  return {
    displayPrice: effectiveBase,
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
