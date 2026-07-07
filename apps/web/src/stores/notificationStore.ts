/* eslint-disable */
import { create } from 'zustand';
import { ReactNode } from 'react';

export type NotificationType =
  | 'episode'
  | 'recommendation'
  | 'system'
  | 'success'
  | 'error'
  | 'maintenance'
  | 'watchlist'
  | 'continueWatching';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  image?: string;
  icon?: ReactNode;
  href?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  
  // Computed
  unreadCount: () => number;
  
  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  addNotification: (notification: Notification) => void;
  
  // Optmistic
  optimisticMarkRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,

  unreadCount: () => get().notifications.filter(n => !n.read).length,

  fetchNotifications: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/notifications?page=${page}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      
      const data = await res.json();
      
      // Transform DB dates to JS Dates and handle mapping
      const formatted: Notification[] = data.map((n: any) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        read: n.isRead,
        createdAt: new Date(n.createdAt),
        image: n.metaData?.imageUrl,
        metadata: n.metaData,
      }));

      set(state => ({
        notifications: page === 1 ? formatted : [...state.notifications, ...formatted],
        hasMore: formatted.length === 50, // Assuming limit is 50
        page,
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  optimisticMarkRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },

  markRead: async (id) => {
    // Optimistic update
    get().optimisticMarkRead(id);
    
    try {
      // In a real app, this would be a PATCH to /api/notifications/:id
      // For now we assume a general mark read endpoint exists or we ignore it
      // await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      // Revert on failure (simplified)
      get().fetchNotifications(1);
    }
  },

  markAllRead: async () => {
    // Optimistic
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
    
    try {
      await fetch('/api/notifications', { method: 'POST' });
    } catch (err) {
      get().fetchNotifications(1);
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications]
    }));
  }
}));
