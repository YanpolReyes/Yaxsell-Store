'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { AperturaSettings } from '@/lib/apertura-promo';

// ── Singleton cache: todos los hooks comparten la misma llamada ──
let cachedSettings: AperturaSettings | null = null;
let cachedClaimed: boolean = false;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos (antes era 2min con SDK directo, ahora más seguro)
let pendingPromise: Promise<{ settings: AperturaSettings; claimed: boolean }> | null = null;

async function loadApertura(isLoggedIn: boolean): Promise<{ settings: AperturaSettings; claimed: boolean }> {
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    // Si ya tenemos caché y no está logueado, o ya tenemos claimed, reusar
    if (!isLoggedIn || cachedClaimed !== undefined) {
      return { settings: cachedSettings, claimed: cachedClaimed };
    }
  }

  // Si ya hay una petición en vuelo, reusar la misma Promise
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      // ── Usa la API route cacheada en vez del SDK directo ──
      const res = await fetch('/api/public-data/apertura');
      const globalSettings: AperturaSettings = res.ok
        ? await res.json()
        : { isActive: false, discountPercent: 20, minPurchase: 62500 };

      let claimed = false;
      if (isLoggedIn) {
        // Leer si el regalo fue reclamado desde localStorage (ya cacheado por AuthService)
        try {
          const cachedUser = localStorage.getItem('yaxsel_auth_user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            claimed = Boolean(parsed.welcomeGiftClaimed);
          }
        } catch {
          claimed = false;
        }
      }
      cachedSettings = globalSettings;
      cachedClaimed = claimed;
      cacheTimestamp = Date.now();
      return { settings: globalSettings, claimed };
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

export function invalidateAperturaCache() {
  cachedSettings = null;
  cachedClaimed = false;
  cacheTimestamp = 0;
  pendingPromise = null;
}

/** Promoción global aplica precios visuales a toda la tienda si está activa en el admin */
export function useAperturaPromotion() {
  const { isLoggedIn } = useAuth();
  const [settings, setSettings] = useState<AperturaSettings | null>(cachedSettings);
  const [hasClaimedGift, setHasClaimedGift] = useState(cachedClaimed);
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    let cancelled = false;

    loadApertura(isLoggedIn).then(({ settings: s, claimed }) => {
      if (cancelled) return;
      setSettings(s);
      setHasClaimedGift(claimed);
      setIsLoading(false);
    });

    const onClaimed = () => {
      invalidateAperturaCache();
      loadApertura(isLoggedIn).then(({ settings: s, claimed }) => {
        if (cancelled) return;
        setSettings(s);
        setHasClaimedGift(claimed);
      });
    };

    window.addEventListener('apertura-gift-claimed', onClaimed);
    return () => {
      cancelled = true;
      window.removeEventListener('apertura-gift-claimed', onClaimed);
    };
  }, [isLoggedIn]);

  const canShowDiscount = Boolean(settings?.isActive);
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
