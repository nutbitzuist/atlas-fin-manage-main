import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type LoanRow = Tables<"loans">;
export type LoanInsert = TablesInsert<"loans">;
export type LoanUpdate = TablesUpdate<"loans">;

export async function getLoansByUserRaw(userId: string): Promise<LoanRow[]> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as LoanRow[]) || [];
}

export async function createLoanRaw(loan: LoanInsert): Promise<LoanRow> {
  const { data, error } = await supabase
    .from("loans")
    .insert(loan)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create loan");
  return data as LoanRow;
}

export async function updateLoanRaw(loanId: string, userId: string, updates: LoanUpdate) {
  const { error } = await supabase
    .from("loans")
    .update(updates)
    .eq("id", loanId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteLoanByIdRaw(userId: string, loanId: string) {
  const { error } = await supabase
    .from("loans")
    .delete()
    .eq("id", loanId)
    .eq("user_id", userId);

  if (error) throw error;
}
