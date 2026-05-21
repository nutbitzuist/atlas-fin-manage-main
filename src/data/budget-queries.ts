import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type BudgetRow = Tables<"budgets">;
export type BudgetInsert = TablesInsert<"budgets">;
export type BudgetUpdate = TablesUpdate<"budgets">;

type CategoryRow = Pick<Tables<"categories">, "id" | "name" | "icon" | "color" | "type" | "user_id">;

export type BudgetQueryOptions = {
  month?: BudgetMonth;
};

export type BudgetMonth = string;

export async function getBudgetsByUserAndMonthRaw(
  userId: string,
  options: BudgetQueryOptions = {},
): Promise<BudgetRow[] | null> {
  let query = supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId);

  if (options.month) {
    query = query.eq("month", options.month);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as BudgetRow[]) || null;
}

export async function getUserExpenseCategoriesRaw(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, color, type")
    .eq("user_id", userId)
    .eq("type", "expense");

  if (error) throw error;
  return data as CategoryRow[] | null;
}

export async function createBudgetCategoryRaw(budget: BudgetInsert): Promise<BudgetRow> {
  const { data, error } = await supabase
    .from("budgets")
    .insert(budget)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create budget");

  return data as BudgetRow;
}

export async function createBudgetCategoriesRaw(userId: string, budgets: BudgetInsert[]): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from("budgets")
    .insert(budgets)
    .select();

  if (error) throw error;

  return (data as BudgetRow[]) || [];
}

export async function updateBudgetRaw(
  budgetId: string,
  userId: string,
  updates: BudgetUpdate,
) {
  const { error } = await supabase
    .from("budgets")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteBudgetByIdRaw(budgetId: string, userId: string) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteBudgetsByMonthRaw(userId: string, month: BudgetMonth) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", userId)
    .eq("month", month);

  if (error) throw error;
}
