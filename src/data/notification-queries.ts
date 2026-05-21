import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";

export type NotificationRow = Tables<"notifications">;
export type NotificationInsert = TablesInsert<"notifications">;

export async function getNotificationsRaw(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as NotificationRow[] | null;
}

export async function getNotificationsByDedupeKeysRaw(userId: string, dedupeKeys: string[]) {
  if (dedupeKeys.length === 0) {
    return [] as Array<{ metadata: Json | null }>;
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("metadata")
    .eq("user_id", userId)
    .in("metadata->>dedupe_key", dedupeKeys);

  if (error) throw error;
  return data as Array<{ metadata: Json | null }>;
}

export async function createNotificationRaw(payload: NotificationInsert) {
  const { error } = await supabase
    .from("notifications")
    .insert(payload);

  if (error) throw error;
}

export async function markNotificationAsReadRaw(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsReadRaw(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function deleteNotificationRaw(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}
