import type { NotificationInsert, NotificationRow } from "@/data/notification-queries";
import {
  createNotificationRaw,
  deleteNotificationRaw,
  getNotificationsByDedupeKeysRaw,
  getNotificationsRaw,
  markAllNotificationsAsReadRaw,
  markNotificationAsReadRaw,
} from "@/data/notification-queries";

export type { NotificationInsert, NotificationRow } from "@/data/notification-queries";

export async function getNotifications(userId: string, limit = 10) {
  return getNotificationsRaw(userId, limit);
}

export async function getNotificationsByDedupeKeys(userId: string, dedupeKeys: string[]) {
  return getNotificationsByDedupeKeysRaw(userId, dedupeKeys);
}

export async function createNotification(payload: NotificationInsert) {
  return createNotificationRaw(payload);
}

export async function markNotificationAsRead(notificationId: string) {
  return markNotificationAsReadRaw(notificationId);
}

export async function markAllNotificationsAsRead(userId: string) {
  return markAllNotificationsAsReadRaw(userId);
}

export async function deleteNotification(notificationId: string) {
  return deleteNotificationRaw(notificationId);
}
