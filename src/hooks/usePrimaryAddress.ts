'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  syncAddressesForUser,
  getPrimaryAddressLabel,
  TPL1_ADDRESS_UPDATED,
} from '@/lib/addresses';

export function usePrimaryAddress() {
  const { user, isLoggedIn } = useAuth();
  const [primaryAddress, setPrimaryAddress] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLoggedIn || !user?.id) {
      setPrimaryAddress(null);
      return;
    }
    const list = await syncAddressesForUser(user.id);
    const label = getPrimaryAddressLabel(list);
    setPrimaryAddress(label);
    window.dispatchEvent(
      new CustomEvent(TPL1_ADDRESS_UPDATED, { detail: { label } })
    );
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === `addr_${user.id}`) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener(TPL1_ADDRESS_UPDATED, onCustom);
    window.addEventListener('focus', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TPL1_ADDRESS_UPDATED, onCustom);
      window.removeEventListener('focus', onCustom);
    };
  }, [user?.id, refresh]);

  return { primaryAddress, refreshPrimaryAddress: refresh };
}
