import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type MonthlyUpdateRow = Tables<"monthly_updates">;
export type MonthlyUpdateInsert = TablesInsert<"monthly_updates">;
export type MonthlyUpdateUpdate = TablesUpdate<"monthly_updates">;
export type MonthlyUpdatePayload = Omit<MonthlyUpdateUpdate, "user_id" | "month"> & Pick<MonthlyUpdateInsert, "user_id" | "month">;

export async function getMonthlyUpdateByUserAndMonthRaw(
  userId: string,
  month: string,
): Promise<MonthlyUpdateRow | null> {
  const { data, error } = await supabase
    .from("monthly_updates")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  return data as MonthlyUpdateRow | null;
}

export async function getMonthlyUpdatesByUserRaw(
  userId: string,
  options: {
    status?: string;
    startDate?: string;
    order?: {
      ascending?: boolean;
      limit?: number;
    };
  } = {},
) {
  let query = supabase
    .from("monthly_updates")
    .select("month, status")
    .eq("user_id", userId);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.startDate) {
    query = query.gte("month", options.startDate);
  }

  query = query.order("month", { ascending: options.order?.ascending ?? false });

  if (typeof options.order?.limit === "number") {
    query = query.limit(options.order.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as Pick<MonthlyUpdateRow, "month" | "status">[] | null;
}

export async function upsertMonthlyUpdateRaw(update: MonthlyUpdatePayload): Promise<MonthlyUpdateRow | null> {
  const { data, error } = await supabase
    .from("monthly_updates")
    .upsert(update, { onConflict: "user_id,month" })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as MonthlyUpdateRow | null;
}
