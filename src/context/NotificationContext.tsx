'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getServices, getAppwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/hooks/useAuth';

const NOTIF_COLLECTION = 'notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0, refreshCount: () => {} });

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!isLoggedIn || !user) { setUnreadCount(0); return; }
    try {
      const { databases } = getServices();
      const { databaseId } = getAppwriteConfig();
      const res = await databases.listDocuments(databaseId, NOTIF_COLLECTION, [
        Query.equal('userId', user.id),
        Query.equal('isRead', false),
        Query.limit(1),
      ]);
      setUnreadCount(res.total);
    } catch {
      setUnreadCount(0);
    }
  }, [isLoggedIn, user]);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  // Auto-refresh every 30 seconds
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
