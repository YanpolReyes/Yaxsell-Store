'use client';

import { useMemo } from 'react';
import type { CartItem } from '@/types';
import { resolveProductDisplayPrice, type ResolvedProductPrice } from '@/lib/apertura-promo';
import { useAperturaPromotion } from '@/hooks/useAperturaPromotion';

export function useCartItemPrice(item: CartItem): {
  unitPrice: number;
  pricing: ResolvedProductPrice;
} {
  const { settings: apertura } = useAperturaPromotion();

  return useMemo(() => {
    const now = Date.now();
    if (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt) {
      return {
        unitPrice: item.timedOfferPrice,
        pricing: {
          displayPrice: item.timedOfferPrice,
          originalPrice: item.product.PRICE,
          hasDiscount: item.timedOfferPrice < item.product.PRICE,
          discountPercent: 0,
          fromApertura: false,
        },
      };
    }
    const effectiveWholesale = (item.product.WHOLESALEPRICE && item.product.WHOLESALEMINQUANTITY && item.quantity >= item.product.WHOLESALEMINQUANTITY) 
      ? item.product.WHOLESALEPRICE 
      : item.wholesalePrice;

    if (effectiveWholesale) {
      return {
        unitPrice: effectiveWholesale,
        pricing: {
          displayPrice: effectiveWholesale,
          originalPrice: item.product.PRICE,
          hasDiscount: effectiveWholesale < item.product.PRICE,
          discountPercent: 0,
          fromApertura: false,
        },
      };
    }
    const pricing = resolveProductDisplayPrice(item.product, apertura);
    return { unitPrice: pricing.displayPrice, pricing };
  }, [item, apertura]);
}

export function useCartPricing(items: CartItem[]) {
  const { settings: apertura, isActive: aperturaActive, discountPercent } = useAperturaPromotion();

  return useMemo(() => {
    let subtotal = 0;
    let catalogSubtotal = 0;

    for (const item of items) {
      const now = Date.now();
      let unit = item.product.PRICE;
      if (item.timedOfferPrice && item.timedOfferExpiresAt && now < item.timedOfferExpiresAt) {
        unit = item.timedOfferPrice;
      } else if (item.product.WHOLESALEPRICE && item.product.WHOLESALEMINQUANTITY && item.quantity >= item.product.WHOLESALEMINQUANTITY) {
        unit = item.product.WHOLESALEPRICE;
      } else if (item.wholesalePrice) {
        unit = item.wholesalePrice;
      } else {
        unit = resolveProductDisplayPrice(item.product, apertura).displayPrice;
      }
      subtotal += unit * item.quantity;
      catalogSubtotal += item.product.PRICE * item.quantity;
    }

    const aperturaSavings = aperturaActive ? Math.max(0, catalogSubtotal - subtotal) : 0;

    return { subtotal, catalogSubtotal, aperturaSavings, aperturaActive, discountPercent };
  }, [items, apertura, aperturaActive, discountPercent]);
}
