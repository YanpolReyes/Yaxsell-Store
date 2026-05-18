'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';
import { isNotificationUnread } from '@/services/notificationService';

const NOTIF_COLLECTION = 'notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshCount: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setUnreadCount(0);
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
      const count = res.documents.filter((d) =>
        isNotificationUnread(d as unknown as Record<string, unknown>)
      ).length;
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
      await refreshCount();
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, user, refreshCount]);

  // Carga inicial cuando cambia el estado de login
  // Usa user?.id como dep para evitar re-ejecuciones por cambios irrelevantes en user
  useEffect(() => {
    refreshCount();
    checkRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  // 🔥 Polling cada 5 minutos (antes 30s = 2,880 reads/día/usuario)
  // Ahora: 288 reads/día/usuario (10x menos)
  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(() => { refreshCount(); }, 5 * 60 * 1000); // 5 min
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Refresh al volver el foco a la pestaña (UX instantánea sin polling agresivo)
  useEffect(() => {
    if (!isLoggedIn) return;
    const onFocus = () => { refreshCount(); };
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
