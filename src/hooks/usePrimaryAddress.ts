'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  syncAddressesForUser,
  getPrimaryAddressLabel,
  TPL1_ADDRESS_UPDATED,
} from '@/lib/addresses';

// ── Caché simple ──
let addrCacheLabel: string | null = null;
let addrCacheTimestamp = 0;
let addrCacheUserId: string | null = null;
const ADDR_CACHE_TTL = 60 * 1000; // 1 minuto

export function usePrimaryAddress() {
  const { user, isLoggedIn } = useAuth();
  const [primaryAddress, setPrimaryAddress] = useState<string | null>(
    addrCacheUserId === user?.id ? addrCacheLabel : null
  );
  // Guard to avoid self-triggering: refresh() dispatches TPL1_ADDRESS_UPDATED
  // which would cause the onCustom listener below to call refresh() again.
  const isRefreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn || !user?.id) {
      setPrimaryAddress(null);
      return;
    }
    // Usar caché si es reciente y mismo usuario
    const now = Date.now();
    if (addrCacheUserId === user.id && (now - addrCacheTimestamp) < ADDR_CACHE_TTL && addrCacheLabel) {
      setPrimaryAddress(addrCacheLabel);
      return;
    }
    isRefreshing.current = true;
    try {
      const list = await syncAddressesForUser(user.id);
      const label = getPrimaryAddressLabel(list);
      setPrimaryAddress(label);
      addrCacheLabel = label;
      addrCacheTimestamp = Date.now();
      addrCacheUserId = user.id;
      window.dispatchEvent(
        new CustomEvent(TPL1_ADDRESS_UPDATED, { detail: { label } })
      );
    } finally {
      isRefreshing.current = false;
    }
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === `addr_${user.id}`) { addrCacheTimestamp = 0; refresh(); }
    };
    // Skip if this hook itself dispatched the event (prevents recursive loop)
    const onCustom = () => { if (!isRefreshing.current) refresh(); };
    // Throttle focus: solo refrescar si pasaron más de 30s desde la última llamada
    const onFocus = () => {
      if (Date.now() - addrCacheTimestamp > 30 * 1000) { refresh(); }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(TPL1_ADDRESS_UPDATED, onCustom);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TPL1_ADDRESS_UPDATED, onCustom);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, refresh]);

  return { primaryAddress, refreshPrimaryAddress: refresh };
}
