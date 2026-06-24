'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { isNotificationUnread } from '@/services/notificationService';

const NOTIF_COLLECTION = 'notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: (force?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshCount: () => {},
});

// ── Caché simple para evitar llamadas repetidas ──
let notifCacheCount = 0;
let notifCacheTimestamp = 0;
const NOTIF_CACHE_TTL = 60 * 1000; // 1 minuto

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(notifCacheCount);

  const refreshCount = useCallback(async (force = false) => {
    if (!isLoggedIn || !user) {
      setUnreadCount(0);
      return;
    }
    // Usar caché si es reciente (skip si force=true)
    const now = Date.now();
    if (!force && now - notifCacheTimestamp < NOTIF_CACHE_TTL) {
      setUnreadCount(notifCacheCount);
      return;
    }
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, NOTIF_COLLECTION, [
        Query.or([
          Query.equal('userId', user.id),
          Query.equal('userId', 'all'),
        ]),
        Query.limit(20),
      ]);

      // Filter out notifications dismissed locally
      let dismissedList: string[] = [];
      try {
        const stored = localStorage.getItem('dismissed_notifications');
        if (stored) dismissedList = JSON.parse(stored);
      } catch {}

      const activeDocs = res.documents.filter((d) => !dismissedList.includes(d.$id));
      const count = activeDocs.filter((d) =>
        isNotificationUnread(d as unknown as Record<string, unknown>)
      ).length;
      notifCacheCount = count;
      notifCacheTimestamp = Date.now();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [isLoggedIn, user]);

  const checkRewards = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-rewards',
          userId: user.id,
          email: user.email,
          // El backend debe comprobar prefs directamente o asumir defaults
          welcomeGiftClaimed: false, 
          welcomeCouponCode: null,
        }),
      });
      // Invalidar caché para forzar refresh
      notifCacheTimestamp = 0;
      await refreshCount();
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, user, refreshCount]);

  // Carga inicial cuando cambia el estado de login
  useEffect(() => {
    notifCacheTimestamp = 0; // Invalidar caché al cambiar de usuario
    refreshCount();
    checkRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  return React.createElement(
    NotificationContext.Provider,
    { value: { unreadCount, refreshCount } },
    children
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
