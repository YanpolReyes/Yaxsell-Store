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

  useEffect(() => {
    refreshCount();
    checkRewards();
  }, [refreshCount, checkRewards]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const id = setInterval(refreshCount, 30000);
    return () => clearInterval(id);
  }, [isLoggedIn, refreshCount]);

  return React.createElement(
    NotificationContext.Provider,
    { value: { unreadCount, refreshCount } },
    children
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
