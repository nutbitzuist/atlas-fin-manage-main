import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type FinancialHealthHistoryRow = Tables<"financial_health_history">;
export type FinancialHealthHistoryInsert = TablesInsert<"financial_health_history">;

export async function getHealthHistoryByUserRaw(
  userId: string,
  options: {
    orderBy?: "date";
    ascending?: boolean;
    limit?: number;
  } = {},
) {
  let query = supabase
    .from("financial_health_history")
    .select("date, overall_score")
    .eq("user_id", userId);

  if (options.orderBy === "date" || !options.orderBy) {
    query = query.order("date", { ascending: options.ascending ?? true });
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Pick<FinancialHealthHistoryRow, "date" | "overall_score">[] | null;
}

export async function getHealthHistoryByUserAndDateRaw(
  userId: string,
  date: string,
) {
  const { data, error } = await supabase
    .from("financial_health_history")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string } | null;
}

export async function createHealthHistoryEntryRaw(entry: FinancialHealthHistoryInsert) {
  const { error } = await supabase
    .from("financial_health_history")
    .insert(entry);

  if (error) throw error;
}
