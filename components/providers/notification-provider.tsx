'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './user-provider';
import { getMyNotifications, getUnreadNotificationsCount, markNotificationAsRead, deleteNotification, bulkDeleteNotifications } from '@/lib/actions';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: string;
  metadata?: {
    propertyId?: string;
    propertyAddress?: string;
    [key: string]: any;
  };
  status: string;
  title: string;
  message: string;
  isRead: boolean;
  isDeleted: boolean;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  page: number;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(false);
      return;
    }
    try {
      setLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        getMyNotifications(1, 10),
        getUnreadNotificationsCount(),
      ]);

      if (notifsRes.success) {
        // Adjust for possible nested structure "data"
        const list = notifsRes.data?.data || notifsRes.data || [];
        const isMore = notifsRes.data?.pagination?.hasMore ?? (list.length === 10);
        setNotifications(list);
        setPage(1);
        setHasMore(isMore);
      }
      if (countRes.success) {
        const count = countRes.data?.data?.count ?? countRes.data?.count ?? 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch initially and set up polling
  useEffect(() => {
    fetchNotifications(true);

    if (!user) return;

    // Poll every 30 seconds to keep unread count updated (only fetch count during polling to avoid resetting user's page)
    const interval = setInterval(async () => {
      try {
        const countRes = await getUnreadNotificationsCount();
        if (countRes.success) {
          const count = countRes.data?.data?.count ?? countRes.data?.count ?? 0;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Failed to poll unread count:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    try {
      setLoading(true);
      const notifsRes = await getMyNotifications(nextPage, 10);
      if (notifsRes.success) {
        const list = notifsRes.data?.data || notifsRes.data || [];
        const isMore = notifsRes.data?.pagination?.hasMore ?? (list.length === 10);
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifs = list.filter((n: any) => !existingIds.has(n.id));
          return [...prev, ...newNotifs];
        });
        setPage(nextPage);
        setHasMore(isMore);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const res = await markNotificationAsRead(id);
    if (!res.success) {
      // Revert on failure
      fetchNotifications();
      toast.error(res.message || 'Failed to mark notification as read');
    }
  };

  const deleteNotif = async (id: string) => {
    const isUnread = !notifications.find((n) => n.id === id)?.isRead;
    
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (isUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    const res = await deleteNotification(id);
    if (!res.success) {
      // Revert on failure
      fetchNotifications();
      toast.error(res.message || 'Failed to delete notification');
    } else {
      toast.success('Notification deleted');
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    
    const ids = notifications.map((n) => n.id);
    
    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);

    const res = await bulkDeleteNotifications(ids);
    if (!res.success) {
      // Revert on failure
      fetchNotifications();
      toast.error(res.message || 'Failed to clear notifications');
    } else {
      toast.success('All notifications cleared');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasMore,
        page,
        fetchNotifications,
        loadMore,
        markAsRead,
        deleteNotif,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
