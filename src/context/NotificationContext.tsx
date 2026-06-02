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
        Query.limit(100),
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
      const acc = await getServices().account.get();
      const prefs = (acc as { prefs?: Record<string, unknown> }).prefs || {};
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-rewards',
          userId: user.id,
          email: user.email,
          welcomeGiftClaimed: !!prefs.welcomeGiftClaimed,
          welcomeCouponCode: prefs.welcomeCouponCode || null,
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

  // 🔥 Polling cada 10 minutos (antes 5 min = 288 reads/día)
  // Ahora: 144 reads/día/usuario (2x menos) - Solo corre si la pestaña está activa
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        notifCacheTimestamp = 0;
        refreshCount();
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Refresh al volver el foco — con throttle de 30s
  useEffect(() => {
    if (!isLoggedIn) return;
    const onFocus = () => {
      if (Date.now() - notifCacheTimestamp > 30 * 1000) {
        refreshCount();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return React.createElement(
    NotificationContext.Provider,
    { value: { unreadCount, refreshCount } },
    children
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
