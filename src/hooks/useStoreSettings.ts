'use client';

import { useEffect, useState } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';

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
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos
let pendingPromise: Promise<StoreSettings> | null = null;

async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const { databases } = getServices();
    const { databaseId } = getAppwriteConfig();
    const response = await databases.listDocuments(databaseId, 'store_settings', [Query.limit(1)]);
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        $id: doc.$id,
        storeName: doc.STORENAME || '',
        phone: doc.PHONE || '',
        email: doc.EMAIL || '',
        address: doc.ADDRESS || '',
        website: doc.WEBSITE || '',
        description: doc.DESCRIPTION || '',
        showInAnnouncementBar: doc.SHOWINANNOUNCEMENTBAR ?? false,
        unlimitedStock: doc.UNLIMITEDSTOCK ?? false,
      };
    }
  } catch (error) {
    console.error('Failed to fetch store settings:', error);
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
