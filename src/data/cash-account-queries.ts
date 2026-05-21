import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type CashAccountRow = Pick<
  Tables<"cash_accounts">,
  "id" | "bank_name" | "account_type" | "account_number"
>;
export type CashAccountFullRow = Tables<"cash_accounts">;
export type CashAccountBalanceRow = Pick<Tables<"cash_accounts">, "id" | "balance">;
export type CashAccountInsert = TablesInsert<"cash_accounts">;
export type CashAccountUpdate = TablesUpdate<"cash_accounts">;

export type CashAccountStatus = "active" | "all";

const applyStatusFilter = (query: ReturnType<typeof supabase.from>, status: CashAccountStatus) => {
  if (status === "active") {
    return query.eq("status", "active");
  }

  return query;
};

export async function getCashAccountsByUser(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountRow[]> {
  const { data, error } = await applyStatusFilter(
    supabase.from("cash_accounts").select("id, bank_name, account_type, account_number").eq("user_id", userId)
      .order("bank_name"),
    status,
  );

  if (error) {
    throw error;
  }

  return (data as CashAccountRow[]) || [];
}

export async function getCashAccountBalancesByUser(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountBalanceRow[]> {
  const { data, error } = await applyStatusFilter(
    supabase.from("cash_accounts").select("id,balance").eq("user_id", userId).order("bank_name"),
    status,
  );

  if (error) {
    throw error;
  }

  return (data as CashAccountBalanceRow[]) || [];
}

export async function getCashAccountsByUserFull(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountFullRow[]> {
  const { data, error } = await applyStatusFilter(
    supabase.from("cash_accounts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    status,
  );

  if (error) {
    throw error;
  }

  return (data as CashAccountFullRow[]) || [];
}

export async function createCashAccount(account: CashAccountInsert): Promise<CashAccountFullRow> {
  const { data, error } = await supabase
    .from("cash_accounts")
    .insert(account)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create cash account");
  }

  return data as CashAccountFullRow;
}

export async function updateCashAccount(
  accountId: string,
  userId: string,
  updates: CashAccountUpdate,
) {
  const { error } = await supabase
    .from("cash_accounts")
    .update(updates)
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteCashAccountById(userId: string, accountId: string) {
  const { error } = await supabase
    .from("cash_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw error;
}
