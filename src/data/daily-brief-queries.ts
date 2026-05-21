import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DailyBriefRow = Tables<"daily_briefs">;
export type DailyBriefInsert = TablesInsert<"daily_briefs">;

export type DailyBriefStatus = "pending" | "completed";

export async function getDailyBriefByUserAndDateRaw(userId: string, briefDate: string) {
  const { data, error } = await supabase
    .from("daily_briefs")
    .select("*")
    .eq("user_id", userId)
    .eq("brief_date", briefDate)
    .maybeSingle();

  if (error) throw error;
  return data as DailyBriefRow | null;
}

export async function upsertDailyBriefStatusRaw(brief: DailyBriefInsert) {
  const { data, error } = await supabase
    .from("daily_briefs")
    .upsert(brief, { onConflict: "user_id,brief_date" })
    .select()
    .single();

  if (error) throw error;
  return data as DailyBriefRow;
}

export async function getDailyBriefsByUserAndDateRangeRaw(
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
  } = {},
) {
  let query = supabase
    .from("daily_briefs")
    .select("brief_date, status")
    .eq("user_id", userId);

  if (options.startDate) {
    query = query.gte("brief_date", options.startDate);
  }

  if (options.endDate) {
    query = query.lte("brief_date", options.endDate);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  query = query.order("brief_date", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return data as Array<Pick<DailyBriefRow, "brief_date" | "status">> | null;
}
