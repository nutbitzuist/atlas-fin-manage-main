import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type InvestmentRow = Tables<"investments">;
export type InvestmentInsert = TablesInsert<"investments">;
export type InvestmentUpdate = TablesUpdate<"investments">;

export type InvestmentQueryOptions = {
  orderBy?: "created_at" | "updated_at" | "name";
  ascending?: boolean;
};

export async function getInvestmentsByUserRaw(
  userId: string,
  options: InvestmentQueryOptions = {},
) {
  let query = supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId);

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as InvestmentRow[] | null;
}

export async function deleteInvestmentByIdRaw(userId: string, investmentId: string) {
  const { error } = await supabase
    .from("investments")
    .delete()
    .eq("id", investmentId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function createInvestmentRaw(investment: InvestmentInsert): Promise<InvestmentRow> {
  const { data, error } = await supabase
    .from("investments")
    .insert(investment)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create investment");
  return data as InvestmentRow;
}

export async function updateInvestmentRaw(investmentId: string, userId: string, updates: InvestmentUpdate) {
  const { error } = await supabase
    .from("investments")
    .update(updates)
    .eq("id", investmentId)
    .eq("user_id", userId);

  if (error) throw error;
}
