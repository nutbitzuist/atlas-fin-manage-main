import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type NetWorthHistoryRow = Tables<"net_worth_history">;
export type NetWorthHistoryInsert = TablesInsert<"net_worth_history">;
export type NetWorthHistoryUpdate = TablesUpdate<"net_worth_history">;

export type NetWorthHistoryQueryOptions = {
  startDate?: string;
  endDate?: string;
  orderBy?: "date";
  ascending?: boolean;
  limit?: number;
};

export async function getNetWorthHistoryByUserRaw(
  userId: string,
  options: NetWorthHistoryQueryOptions = {},
) {
  let query = supabase
    .from("net_worth_history")
    .select("*")
    .eq("user_id", userId);

  if (options.startDate) {
    query = query.gte("date", options.startDate);
  }

  if (options.endDate) {
    query = query.lte("date", options.endDate);
  }

  if (options.orderBy === "date" || !options.orderBy) {
    query = query.order("date", { ascending: options.ascending ?? true });
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as NetWorthHistoryRow[] | null;
}

export async function getNetWorthSnapshotForMonthRaw(
  userId: string,
  monthStart: string,
) {
  const [yearStr, monthStr] = monthStart.split("-");
  const monthStartDate = new Date(`${yearStr}-${monthStr}-01T00:00:00.000Z`);
  const lastDay = new Date(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 0);
  const monthEndDate = `${lastDay.getUTCFullYear()}-${String(lastDay.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDay.getUTCDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("net_worth_history")
    .select("*")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", monthEndDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as NetWorthHistoryRow | null;
}

export async function updateNetWorthSnapshotRaw(
  snapshotId: string,
  userId: string,
  updates: Pick<NetWorthHistoryUpdate, "total_assets" | "total_liabilities" | "net_worth">,
) {
  const { error } = await supabase
    .from("net_worth_history")
    .update(updates)
    .eq("id", snapshotId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createNetWorthSnapshotRaw(snapshot: NetWorthHistoryInsert) {
  const { data, error } = await supabase
    .from("net_worth_history")
    .insert(snapshot)
    .select()
    .single();

  if (error) throw error;
  return data as NetWorthHistoryRow;
}
