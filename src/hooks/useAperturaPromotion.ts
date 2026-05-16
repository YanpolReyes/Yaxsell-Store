'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAperturaSettings, type AperturaSettings } from '@/lib/apertura-promo';
import { getServices } from '@/lib/appwrite';

/** Promoción global solo aplica precios visuales si el usuario ya reclamó el regalo en /cuenta/regalos */
export function useAperturaPromotion() {
  const { isLoggedIn } = useAuth();
  const [settings, setSettings] = useState<AperturaSettings | null>(null);
  const [hasClaimedGift, setHasClaimedGift] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const globalSettings = await fetchAperturaSettings();
        if (cancelled) return;

        let claimed = false;
        if (isLoggedIn) {
          try {
            const { account } = getServices();
            const acc = await account.get();
            const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};
            claimed = Boolean(prefs.welcomeGiftClaimed);
          } catch {
            claimed = false;
          }
        }

        if (!cancelled) {
          setSettings(globalSettings);
          setHasClaimedGift(claimed);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const onClaimed = () => {
      if (!isLoggedIn) return;
      (async () => {
        try {
          const { account } = getServices();
          const acc = await account.get();
          const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};
          setHasClaimedGift(Boolean(prefs.welcomeGiftClaimed));
        } catch { /* ignore */ }
      })();
    };

    window.addEventListener('apertura-gift-claimed', onClaimed);
    return () => {
      cancelled = true;
      window.removeEventListener('apertura-gift-claimed', onClaimed);
    };
  }, [isLoggedIn]);

  const canShowDiscount = Boolean(settings?.isActive && hasClaimedGift);
  const effectiveSettings: AperturaSettings | null = canShowDiscount ? settings : null;

  return {
    settings: effectiveSettings,
    isLoading,
    hasClaimedGift,
    isPromotionEnabled: settings?.isActive ?? false,
    isActive: canShowDiscount,
    discountPercent: canShowDiscount ? (settings?.discountPercent ?? 0) : 0,
    minPurchase: settings?.minPurchase ?? 0,
  };
}
