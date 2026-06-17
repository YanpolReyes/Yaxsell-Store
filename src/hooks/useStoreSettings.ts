'use client';

import { useEffect, useState } from 'react';

export interface StoreSettings {
  $id?: string;
  storeName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  description: string;
  showInAnnouncementBar: boolean;
  unlimitedStock: boolean;
}

let cachedSettings: StoreSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos (settings rara vez cambian)
let pendingPromise: Promise<StoreSettings> | null = null;

async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const response = await fetch(`/api/store-settings`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch store settings from API:', error);
  }
  return {
    storeName: '', phone: '', email: '', address: '', website: '', description: '',
    showInAnnouncementBar: false, unlimitedStock: false,
  };
}

async function loadStoreSettings(): Promise<StoreSettings> {
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings;
  }

  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      const settings = await fetchStoreSettings();
      cachedSettings = settings;
      cacheTimestamp = Date.now();
      return settings;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

export function invalidateStoreSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
  pendingPromise = null;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(cachedSettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    let cancelled = false;
    loadStoreSettings().then(s => {
      if (cancelled) return;
      setSettings(s);
      setIsLoading(false);
    });

    const onSettingsUpdate = () => {
      invalidateStoreSettingsCache();
      loadStoreSettings().then(s => {
        if (cancelled) return;
        setSettings(s);
      });
    };

    window.addEventListener('store-settings-updated', onSettingsUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('store-settings-updated', onSettingsUpdate);
    };
  }, []);

  return {
    settings,
    isLoading,
    unlimitedStock: settings?.unlimitedStock ?? false,
  };
}
