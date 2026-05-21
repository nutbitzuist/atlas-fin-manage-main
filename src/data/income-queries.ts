import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type IncomeRow = Tables<"income">;
export type IncomeInsert = TablesInsert<"income">;
export type IncomeUpdate = TablesUpdate<"income">;

export type IncomeQueryOptions = {
  activeOnly?: boolean;
  orderBy?: "created_at" | "updated_at" | "start_date";
  ascending?: boolean;
};

export async function getIncomeByUserIdRaw(
  userId: string,
  options: IncomeQueryOptions = {},
): Promise<IncomeRow[] | null> {
  let query = supabase
    .from("income")
    .select("*")
    .eq("user_id", userId);

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  if (options.orderBy) {
    const ascending = options.ascending ?? false;
    query = query.order(options.orderBy, { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as IncomeRow[] | null;
}

export async function getActiveIncomeSourcesRaw(userId: string) {
  return getIncomeByUserIdRaw(userId, {
    activeOnly: true,
    orderBy: "start_date",
    ascending: false,
  });
}

export async function createIncomeRaw(data: IncomeInsert): Promise<IncomeRow> {
  const { data: created, error } = await supabase
    .from("income")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  if (!created) throw new Error("Failed to create income entry");

  return created as IncomeRow;
}

export async function updateIncomeRaw(
  incomeId: string,
  userId: string,
  updates: IncomeUpdate,
) {
  const { error } = await supabase
    .from("income")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", incomeId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteIncomeRaw(incomeId: string, userId: string) {
  const { error } = await supabase
    .from("income")
    .delete()
    .eq("id", incomeId)
    .eq("user_id", userId);

  if (error) throw error;
}
