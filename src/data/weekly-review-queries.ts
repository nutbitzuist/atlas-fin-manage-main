import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WeeklyReviewRow = Tables<"weekly_reviews">;
export type WeeklyReviewInsert = TablesInsert<"weekly_reviews">;

export async function getWeeklyReviewsByUserRaw(
  userId: string,
  options: {
    status?: string;
    startDate?: string;
    orderBy?: "week_start";
    ascending?: boolean;
  } = {},
) {
  let query = supabase
    .from("weekly_reviews")
    .select("week_start, status")
    .eq("user_id", userId);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.startDate) {
    query = query.gte("week_start", options.startDate);
  }

  if (options.orderBy === "week_start") {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  } else {
    query = query.order("week_start", { ascending: options.ascending ?? false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as Pick<WeeklyReviewRow, "week_start" | "status">[] | null;
}

export async function getWeeklyReviewByUserAndWeekStartRaw(
  userId: string,
  weekStart: string,
) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) throw error;

  return data as WeeklyReviewRow | null;
}

export async function upsertWeeklyReviewRaw(payload: WeeklyReviewInsert) {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(payload, { onConflict: "user_id,week_start" })
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyReviewRow | null;
}
