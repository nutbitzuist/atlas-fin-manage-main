import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TransactionInsert = TablesInsert<"transactions">;
export type TransactionRow = Tables<"transactions">;
export type TransactionUpdate = TablesUpdate<"transactions">;

export type TransactionType = "income" | "expense";

export type TransactionQueryOptions = {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  orderBy?: "transaction_date" | "created_at" | "updated_at";
  ascending?: boolean;
  isRecurring?: boolean;
};

export async function insertTransactionsRaw(transactions: TransactionInsert[]) {
  const { error } = await supabase.from("transactions").insert(transactions);
  if (error) throw error;
}

export async function getTransactionsRawByUserId(
  userId: string,
  options: TransactionQueryOptions = {},
  select = "*",
): Promise<TransactionRow[] | null> {
  let query = supabase.from("transactions").select(select).eq("user_id", userId);

  if (options.type) {
    query = query.eq("type", options.type);
  }

  if (options.startDate) {
    query = query.gte("transaction_date", options.startDate);
  }

  if (options.endDate) {
    query = query.lte("transaction_date", options.endDate);
  }

  if (typeof options.isRecurring === "boolean") {
    query = query.eq("is_recurring", options.isRecurring);
  }

  if (options.orderBy) {
    const ascending = options.ascending ?? false;
    query = query.order(options.orderBy, { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as TransactionRow[] | null) || null;
}

export async function createTransactionRaw(data: TransactionInsert): Promise<TransactionRow> {
  const { data: created, error } = await supabase
    .from("transactions")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  if (!created) throw new Error("Failed to create transaction");

  return created as TransactionRow;
}

export async function reassignTransactionCategoryRaw(
  userId: string,
  sourceCategory: string,
  targetCategory: string,
) {
  const { error } = await supabase
    .from("transactions")
    .update({ category: targetCategory })
    .eq("user_id", userId)
    .eq("category", sourceCategory);

  if (error) throw error;
}

export async function updateTransactionRaw(
  transactionId: string,
  userId: string,
  updates: TransactionUpdate,
) {
  const { error } = await supabase
    .from("transactions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateTransactionCategoryRaw(transactionId: string, userId: string, category: string) {
  const { error } = await supabase
    .from("transactions")
    .update({
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteTransactionRaw(transactionId: string, userId: string) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) throw error;
}
