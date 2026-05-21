import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type SavingsGoalRow = Tables<"savings_goals">;
export type SavingsGoalInsert = TablesInsert<"savings_goals">;
export type SavingsGoalUpdate = TablesUpdate<"savings_goals">;
export type SavingsGoalContributionCategory = "Savings" | "Investment";


export async function getSavingsGoalsByUserIdRaw(userId: string) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as SavingsGoalRow[] | null;
}

export async function getSavingsGoalByIdRaw(userId: string, goalId: string) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as SavingsGoalRow;
}

export async function getDefaultSavingsGoalRaw(userId: string) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw error;
  return data as SavingsGoalRow | null;
}

export async function createSavingsGoalRaw(userId: string, goal: Omit<SavingsGoalInsert, "user_id">) {
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      ...goal,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create savings goal");

  return data as SavingsGoalRow;
}

export async function updateSavingsGoalRaw(
  userId: string,
  goalId: string,
  updates: SavingsGoalUpdate,
) {
  const { error } = await supabase
    .from("savings_goals")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteSavingsGoalRaw(userId: string, goalId: string) {
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) throw error;
}
