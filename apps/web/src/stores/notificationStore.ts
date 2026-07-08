/* eslint-disable */
import { create } from 'zustand';
import { ReactNode } from 'react';

export type NotificationType =
  | 'build_update'
  | 'new_anime'
  | 'support_creator'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string | null;
  icon?: string | null;
  createdAt: Date;
  isDismissible: boolean;
  priority: number;
  read: boolean; // Computed field
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  
  // Computed
  unreadCount: () => number;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  
  // Optimistic
  optimisticMarkRead: (id: string) => void;
  
  // For polling
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

// Helper for local storage read state (anonymous users)
const LOCAL_READ_KEY = 'omo_read_notifications';
function getLocalReadIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_READ_KEY) || '[]');
  } catch {
    return [];
  }
}
function addLocalReadId(id: string) {
  if (typeof window === 'undefined') return;
  const ids = getLocalReadIds();
  if (!ids.includes(id)) {
    localStorage.setItem(LOCAL_READ_KEY, JSON.stringify([...ids, id]));
  }
}
function markAllLocalRead(ids: string[]) {
  if (typeof window === 'undefined') return;
  const existing = getLocalReadIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  localStorage.setItem(LOCAL_READ_KEY, JSON.stringify(merged));
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  unreadCount: () => get().notifications.filter(n => !n.read).length,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/notifications`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      
      const data = await res.json();
      const localReadIds = getLocalReadIds();
      
      // Transform DB dates to JS Dates and handle mapping
      const formatted: Notification[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        linkUrl: n.linkUrl,
        icon: n.icon,
        createdAt: new Date(n.createdAt),
        isDismissible: n.isDismissible,
        priority: n.priority,
        // Since we are pre-auth, read state is checked against localStorage
        read: localReadIds.includes(n.id),
      }));

      set({
        notifications: formatted,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  optimisticMarkRead: (id) => {
    addLocalReadId(id);
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },

  markRead: async (id) => {
    get().optimisticMarkRead(id);
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      // We don't revert on 401 because guests legitimately track locally
      if (!res.ok && res.status !== 401) {
        throw new Error('Failed');
      }
    } catch (err) {
      // Revert omitted for simplicity
    }
  },

  markAllRead: async () => {
    const unreadIds = get().notifications.filter(n => !n.read).map(n => n.id);
    markAllLocalRead(unreadIds);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
    
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!res.ok && res.status !== 401) {
        throw new Error('Failed');
      }
    } catch (err) {
      // Ignore
    }
  },
  
  startPolling: () => {
    if (pollingInterval) return;
    get().fetchNotifications();
    pollingInterval = setInterval(() => {
      get().fetchNotifications();
    }, 60000); // Poll every 60s
  },
  
  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}));
