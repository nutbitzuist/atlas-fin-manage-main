import { useState, useEffect, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useToast } from "./use-toast";
import {
  createNotification as createNotificationService,
  deleteNotification as deleteNotificationService,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification-service";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'bill' | 'budget' | 'goal' | 'insurance';
  is_read: boolean;
  link?: string;
  metadata?: Json;
  created_at: string;
  read_at?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getNotifications(user.id, 10);

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error: unknown) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationService(notificationId);

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  }, [notifications, toast]);

  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: Notification['type'],
    link?: string,
    metadata?: Json
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await createNotificationService({
          user_id: user.id,
          title,
          message,
          type,
          link,
          metadata,
      } as const);

      // Refresh notifications
      await fetchNotifications();
    } catch (error: unknown) {
      console.error("Error creating notification:", error);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription for new notifications
    let subscription: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            setNotifications(prev => [notification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);

            // Show toast for new notification
            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
};
